import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.execution import ExecutionCreate, ExecutionRead
from app.services import execution_service
from app.core.exceptions import NotFoundError
from app.core.websocket_manager import ws_manager
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/executions", tags=["Executions"])


@router.post("/", response_model=ExecutionRead, status_code=201)
async def trigger_execution(
    data: ExecutionCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Trigger a workflow execution.
    Returns immediately with status=pending.
    Actual execution runs in the background.

    IMPORTANT: we commit BEFORE adding the background task so the
    execution row is visible in the DB when the background task opens
    its own session. Without this explicit commit the background task
    races against the still-open request transaction and cannot find
    the row it was just given.
    """
    execution = await execution_service.create_execution(db, data)

    # Commit now so the row is durable before the background task reads it
    await db.commit()
    logger.info(f"[ROUTER] Execution {execution.id} committed — launching background task")

    background_tasks.add_task(
        execution_service.run_workflow,
        execution.id,
        ws_manager,
    )

    return execution


@router.get("/workflow/{workflow_id}", response_model=list[ExecutionRead])
async def list_executions(
    workflow_id: uuid.UUID,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    return await execution_service.get_for_workflow(db, workflow_id, limit)


@router.get("/{execution_id}", response_model=ExecutionRead)
async def get_execution(
    execution_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await execution_service.get_execution(db, execution_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
