import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.workflow import WorkflowCreate, WorkflowUpdate, WorkflowRead, WorkflowReadFull
from app.services import workflow_service
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/workflows", tags=["Workflows"])


@router.get("/", response_model=list[WorkflowRead])
async def list_workflows(db: AsyncSession = Depends(get_db)):
    return await workflow_service.get_all(db)


@router.post("/", response_model=WorkflowReadFull, status_code=status.HTTP_201_CREATED)
async def create_workflow(data: WorkflowCreate, db: AsyncSession = Depends(get_db)):
    return await workflow_service.create(db, data)


@router.get("/{workflow_id}", response_model=WorkflowReadFull)
async def get_workflow(workflow_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    try:
        return await workflow_service.get_by_id(db, workflow_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.patch("/{workflow_id}", response_model=WorkflowRead)
async def update_workflow(
    workflow_id: uuid.UUID,
    data: WorkflowUpdate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await workflow_service.update(db, workflow_id, data)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(workflow_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    try:
        await workflow_service.delete(db, workflow_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{workflow_id}/duplicate", response_model=WorkflowReadFull, status_code=status.HTTP_201_CREATED)
async def duplicate_workflow(workflow_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    try:
        return await workflow_service.duplicate(db, workflow_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
