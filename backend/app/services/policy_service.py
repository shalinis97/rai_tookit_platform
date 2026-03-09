"""
Policy service — DB CRUD + OPA compile/test via CLI subprocess.
Compile and test use the `opa` CLI (production sidecar approach still used
for runtime evaluation; CLI used only for pre-save validation).
"""
import json
import logging
import os
import subprocess
import tempfile
import uuid
from datetime import datetime, timezone

from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.policy import Policy, PolicyWorkflowAssignment, PolicyAuditLog
from app.models.workflow import Workflow
from app.schemas.policy import PolicyCreate, PolicyUpdate
from app.core.exceptions import NotFoundError

logger = logging.getLogger(__name__)


# ── Helpers ───────────────────────────────────────────────────

def _validate_rego_syntax(code: str) -> tuple[bool, str]:
    """Run `opa check` on the Rego code. Returns (is_valid, error_msg)."""
    with tempfile.NamedTemporaryFile(suffix=".rego", delete=False, mode="w") as f:
        f.write(code)
        tmp = f.name
    try:
        result = subprocess.run(
            ["opa", "check", "--strict", tmp],
            capture_output=True, text=True, timeout=10
        )
        return (result.returncode == 0, result.stderr)
    except FileNotFoundError:
        # OPA CLI not installed — skip syntax check, trust the code
        logger.warning("[POLICY] `opa` CLI not found — skipping syntax validation")
        return (True, "")
    except subprocess.TimeoutExpired:
        return (False, "OPA check timed out")
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)


def _run_opa_eval(rego_code: str, input_data: dict) -> dict:
    """Run `opa eval` and return parsed result dict."""
    with tempfile.NamedTemporaryFile(suffix=".rego", delete=False, mode="w") as pf:
        pf.write(rego_code)
        policy_path = pf.name

    with tempfile.NamedTemporaryFile(suffix=".json", delete=False, mode="w") as inf:
        json.dump(input_data, inf)
        input_path = inf.name

    try:
        result = subprocess.run(
            ["opa", "eval", "-d", policy_path, "-i", input_path,
             "data.ai.policies", "--format", "json"],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode != 0:
            return {"error": result.stderr}
        output = json.loads(result.stdout)
        decisions = (
            output.get("result", [{}])[0]
                  .get("expressions", [{}])[0]
                  .get("value", {})
        )
        return decisions
    except FileNotFoundError:
        return {"error": "`opa` CLI not found on PATH"}
    except subprocess.TimeoutExpired:
        return {"error": "OPA eval timed out"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        for p in [policy_path, input_path]:
            if os.path.exists(p):
                os.remove(p)


# ── Policy CRUD ───────────────────────────────────────────────

async def list_policies(db: AsyncSession) -> list[Policy]:
    result = await db.execute(
        select(Policy)
        .options(selectinload(Policy.assignments))
        .order_by(Policy.created_at.desc())
    )
    return list(result.scalars().all())


async def get_policy(db: AsyncSession, policy_id: uuid.UUID) -> Policy:
    result = await db.execute(
        select(Policy)
        .options(selectinload(Policy.assignments))
        .where(Policy.id == policy_id)
    )
    p = result.scalar_one_or_none()
    if not p:
        raise NotFoundError("Policy", str(policy_id))
    return p


async def create_policy(db: AsyncSession, data: PolicyCreate) -> Policy:
    policy = Policy(
        name        = data.name,
        description = data.description,
        scope       = data.scope,
        rego_code   = data.rego_code,
        enabled     = data.enabled,
        version     = 1,
    )
    db.add(policy)
    await db.flush()
    await db.refresh(policy)
    logger.info(f"[POLICY] Created policy '{policy.name}' scope={policy.scope}")
    return policy


async def update_policy(db: AsyncSession, policy_id: uuid.UUID, data: PolicyUpdate) -> Policy:
    policy = await get_policy(db, policy_id)
    if data.name        is not None: policy.name        = data.name
    if data.description is not None: policy.description = data.description
    if data.scope       is not None: policy.scope       = data.scope
    if data.rego_code   is not None:
        policy.rego_code = data.rego_code
        policy.version  += 1          # bump version on code change
    if data.enabled     is not None: policy.enabled     = data.enabled
    await db.flush()
    await db.refresh(policy)
    logger.info(f"[POLICY] Updated policy '{policy.name}' v{policy.version}")
    return policy


async def delete_policy(db: AsyncSession, policy_id: uuid.UUID) -> None:
    policy = await get_policy(db, policy_id)
    await db.delete(policy)
    await db.flush()


async def toggle_policy(db: AsyncSession, policy_id: uuid.UUID) -> Policy:
    policy = await get_policy(db, policy_id)
    policy.enabled = not policy.enabled
    await db.flush()
    await db.refresh(policy)
    logger.info(f"[POLICY] {'Enabled' if policy.enabled else 'Disabled'} policy '{policy.name}'")
    return policy


# ── Compile / Test ────────────────────────────────────────────

def compile_policy(code: str) -> tuple[bool, str]:
    """Validate Rego syntax. Returns (is_valid, error_message)."""
    return _validate_rego_syntax(code)


def test_policy(code: str, input_data: dict) -> dict:
    """
    Run OPA eval against given code and input.
    Returns dict with allow, violated, violations, raw.
    """
    decisions = _run_opa_eval(code, input_data)
    if "error" in decisions:
        return {"status": "error", "error": decisions["error"]}

    deny_raw   = decisions.get("deny", [])
    violations = list(deny_raw) if isinstance(deny_raw, (list, set)) else []
    allow      = decisions.get("allow", len(violations) == 0)

    return {
        "status":     "success",
        "allow":      allow,
        "violated":   len(violations) > 0,
        "violations": violations,
        "raw":        decisions,
    }


# ── Assignment CRUD ───────────────────────────────────────────

async def assign_to_workflow(
    db: AsyncSession, policy_id: uuid.UUID, workflow_id: uuid.UUID
) -> PolicyWorkflowAssignment:
    # Check not already assigned
    existing = await db.execute(
        select(PolicyWorkflowAssignment)
        .where(
            PolicyWorkflowAssignment.policy_id  == policy_id,
            PolicyWorkflowAssignment.workflow_id == workflow_id,
        )
    )
    if existing.scalar_one_or_none():
        raise ValueError("Policy already assigned to this workflow")

    assignment = PolicyWorkflowAssignment(
        policy_id=policy_id, workflow_id=workflow_id
    )
    db.add(assignment)
    await db.flush()
    return assignment


async def unassign_from_workflow(
    db: AsyncSession, policy_id: uuid.UUID, workflow_id: uuid.UUID
) -> None:
    result = await db.execute(
        select(PolicyWorkflowAssignment)
        .where(
            PolicyWorkflowAssignment.policy_id  == policy_id,
            PolicyWorkflowAssignment.workflow_id == workflow_id,
        )
    )
    assignment = result.scalar_one_or_none()
    if assignment:
        await db.delete(assignment)
        await db.flush()


# ── Audit Logs ────────────────────────────────────────────────

async def get_audit_logs(
    db: AsyncSession,
    workflow_id: uuid.UUID | None = None,
    execution_id: uuid.UUID | None = None,
    limit: int = 100,
) -> list[PolicyAuditLog]:
    q = select(PolicyAuditLog).order_by(desc(PolicyAuditLog.created_at)).limit(limit)
    if workflow_id:
        q = q.where(PolicyAuditLog.workflow_id == workflow_id)
    if execution_id:
        q = q.where(PolicyAuditLog.execution_id == execution_id)
    result = await db.execute(q)
    return list(result.scalars().all())


# ── Quarantine ────────────────────────────────────────────────

async def get_quarantined_workflows(db: AsyncSession) -> list[dict]:
    """Return quarantined workflows with their latest violation info."""
    wf_result = await db.execute(
        select(Workflow)
        .where(Workflow.status == "quarantined")
        .order_by(Workflow.updated_at.desc())
    )
    workflows = list(wf_result.scalars().all())

    output = []
    for wf in workflows:
        # Find latest audit log deny entry for this workflow
        log_result = await db.execute(
            select(PolicyAuditLog)
            .options(selectinload(PolicyAuditLog.policy))
            .where(
                PolicyAuditLog.workflow_id == wf.id,
                PolicyAuditLog.decision    == "deny",
            )
            .order_by(desc(PolicyAuditLog.created_at))
            .limit(1)
        )
        latest_log = log_result.scalar_one_or_none()

        output.append({
            "id":              str(wf.id),
            "name":            wf.name,
            "description":     wf.description,
            "status":          wf.status,
            "created_at":      wf.created_at,
            "updated_at":      wf.updated_at,
            "last_violated_at": latest_log.created_at if latest_log else None,
            "last_violations":  latest_log.violations  if latest_log else [],
            "last_policy_name": latest_log.policy.name if (latest_log and latest_log.policy) else None,
        })

    return output


async def unquarantine_workflow(db: AsyncSession, workflow_id: uuid.UUID) -> Workflow:
    """Called after user saves edited workflow — moves back to draft."""
    result = await db.execute(select(Workflow).where(Workflow.id == workflow_id))
    wf = result.scalar_one_or_none()
    if not wf:
        raise NotFoundError("Workflow", str(workflow_id))
    wf.status = "active"
    await db.flush()
    logger.info(f"[POLICY] Unquarantined workflow '{wf.name}' → active")
    return wf


# ── Load policies for execution ───────────────────────────────

async def load_policies_for_workflow(
    db: AsyncSession, workflow_id: uuid.UUID
) -> list[Policy]:
    """
    Load all enabled policies that apply to this workflow:
    all global ones + any local ones assigned to this workflow.
    """
    result = await db.execute(
        select(Policy)
        .options(selectinload(Policy.assignments))
        .where(Policy.enabled == True)  # noqa: E712
    )
    all_policies = list(result.scalars().all())

    applicable = []
    for p in all_policies:
        if p.scope == "global":
            applicable.append(p)
        elif p.scope == "local":
            assigned_ids = {str(a.workflow_id) for a in p.assignments}
            if str(workflow_id) in assigned_ids:
                applicable.append(p)

    return applicable
