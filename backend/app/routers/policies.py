import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.policy import (
    PolicyCreate, PolicyUpdate, PolicyRead, PolicyReadFull,
    AssignmentCreate, AssignmentRead,
    CompileRequest, CompileResult,
    TestRequest, TestResult,
    AuditLogRead, QuarantineRead,
)
from app.services import policy_service
from app.core.exceptions import NotFoundError
from app.policy.opa_client import get_opa_client

router = APIRouter(prefix="/policies", tags=["Policies"])


# ── OPA Health ────────────────────────────────────────────────

@router.get("/opa/health")
async def opa_health():
    opa = get_opa_client()
    alive = await opa.health()
    return {"opa_running": alive}


# ── Policy CRUD ───────────────────────────────────────────────

@router.get("/", response_model=list[PolicyRead])
async def list_policies(db: AsyncSession = Depends(get_db)):
    return await policy_service.list_policies(db)


@router.post("/", response_model=PolicyReadFull, status_code=status.HTTP_201_CREATED)
async def create_policy(data: PolicyCreate, db: AsyncSession = Depends(get_db)):
    # Validate syntax before saving
    is_valid, err = policy_service.compile_policy(data.rego_code)
    if not is_valid and err:
        raise HTTPException(status_code=400, detail=f"Invalid Rego syntax: {err}")
    policy = await policy_service.create_policy(db, data)
    await db.commit()
    # Push to OPA sidecar immediately
    opa = get_opa_client()
    await opa.upload_policy(policy.rego_code, policy_name=policy.name)
    return policy


@router.get("/{policy_id}", response_model=PolicyReadFull)
async def get_policy(policy_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    try:
        return await policy_service.get_policy(db, policy_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{policy_id}", response_model=PolicyReadFull)
async def update_policy(
    policy_id: uuid.UUID, data: PolicyUpdate, db: AsyncSession = Depends(get_db)
):
    if data.rego_code is not None:
        is_valid, err = policy_service.compile_policy(data.rego_code)
        if not is_valid and err:
            raise HTTPException(status_code=400, detail=f"Invalid Rego syntax: {err}")
    try:
        policy = await policy_service.update_policy(db, policy_id, data)
        await db.commit()
        if data.rego_code is not None:
            opa = get_opa_client()
            opa.invalidate(policy.name)
            await opa.upload_policy(policy.rego_code, policy_name=policy.name)
        return policy
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_policy(policy_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    try:
        await policy_service.delete_policy(db, policy_id)
        await db.commit()
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{policy_id}/toggle", response_model=PolicyRead)
async def toggle_policy(policy_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    try:
        policy = await policy_service.toggle_policy(db, policy_id)
        await db.commit()
        return policy
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ── Assignments ───────────────────────────────────────────────

@router.post("/{policy_id}/assign", response_model=AssignmentRead, status_code=201)
async def assign_policy(
    policy_id: uuid.UUID,
    data: AssignmentCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        assignment = await policy_service.assign_to_workflow(db, policy_id, data.workflow_id)
        await db.commit()
        return assignment
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.delete("/{policy_id}/assign/{workflow_id}", status_code=204)
async def unassign_policy(
    policy_id: uuid.UUID,
    workflow_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    await policy_service.unassign_from_workflow(db, policy_id, workflow_id)
    await db.commit()


# ── Compile / Test ────────────────────────────────────────────

@router.post("/compile", response_model=CompileResult)
async def compile_policy(req: CompileRequest):
    is_valid, err = policy_service.compile_policy(req.code)
    if is_valid:
        return CompileResult(status="success", message="Syntax valid")
    return CompileResult(status="error", message="Syntax error", error=err)


@router.post("/test", response_model=TestResult)
async def test_policy(req: TestRequest):
    result = policy_service.test_policy(req.code, req.input_data)
    return TestResult(**result)


# ── Audit Logs ────────────────────────────────────────────────

@router.get("/audit/logs", response_model=list[AuditLogRead])
async def get_audit_logs(
    workflow_id: uuid.UUID | None = None,
    execution_id: uuid.UUID | None = None,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    return await policy_service.get_audit_logs(db, workflow_id, execution_id, limit)


# ── Quarantine ────────────────────────────────────────────────

@router.get("/quarantine/list")
async def list_quarantined(db: AsyncSession = Depends(get_db)):
    return await policy_service.get_quarantined_workflows(db)


@router.post("/quarantine/{workflow_id}/release", status_code=200)
async def release_quarantine(workflow_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """
    Called after user saves a repaired workflow.
    Moves status from quarantined → draft.
    """
    try:
        wf = await policy_service.unquarantine_workflow(db, workflow_id)
        await db.commit()
        return {"id": str(wf.id), "name": wf.name, "status": wf.status}
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
