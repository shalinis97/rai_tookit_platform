import uuid
import json
import traceback
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.execution import Execution
from app.schemas.execution import ExecutionCreate
from app.core.exceptions import NotFoundError
from app.core.websocket_manager import WebSocketManager
import logging

logger = logging.getLogger(__name__)


async def create_execution(db: AsyncSession, data: ExecutionCreate) -> Execution:
    execution = Execution(
        workflow_id=data.workflow_id,
        triggered_by=data.triggered_by,
        input_data=data.input_data,
        status="pending",
    )
    db.add(execution)
    await db.flush()
    await db.refresh(execution)

    logger.info(f"[EXEC CREATE] id={execution.id} workflow={data.workflow_id}")
    logger.info(f"[EXEC INPUT ] {json.dumps(data.input_data, default=str)[:400]}")

    return execution


async def get_execution(db: AsyncSession, execution_id: uuid.UUID) -> Execution:
    result = await db.execute(
        select(Execution)
        .options(selectinload(Execution.node_logs))
        .where(Execution.id == execution_id)
    )
    execution = result.scalar_one_or_none()
    if not execution:
        raise NotFoundError("Execution", str(execution_id))
    return execution


async def get_for_workflow(
    db: AsyncSession, workflow_id: uuid.UUID, limit: int = 50
) -> list[Execution]:
    result = await db.execute(
        select(Execution)
        .where(Execution.workflow_id == workflow_id)
        .order_by(Execution.started_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def run_workflow(
    execution_id: uuid.UUID,
    ws_manager: WebSocketManager,
) -> None:
    """
    Background task: load workflow, run engine, persist result.
    This runs outside the HTTP request lifecycle with its own DB session.
    """
    from app.database import AsyncSessionLocal
    from app.services.executor.engine import WorkflowEngine
    from app.models.workflow import Workflow

    logger.info(f"[RUN_WORKFLOW] Starting background task for execution={execution_id}")

    async with AsyncSessionLocal() as db:
        try:
            # ── Load execution ────────────────────────────────
            exec_result = await db.execute(
                select(Execution).where(Execution.id == execution_id)
            )
            execution = exec_result.scalar_one_or_none()
            if not execution:
                logger.error(f"[RUN_WORKFLOW] Execution {execution_id} not found in DB")
                return

            # ── Load workflow with nodes + edges ──────────────
            wf_result = await db.execute(
                select(Workflow)
                .options(selectinload(Workflow.nodes), selectinload(Workflow.edges))
                .where(Workflow.id == execution.workflow_id)
            )
            workflow = wf_result.scalar_one_or_none()
            if not workflow:
                execution.status = "failed"
                execution.error  = f"Workflow {execution.workflow_id} not found"
                await db.commit()
                logger.error(f"[RUN_WORKFLOW] Workflow {execution.workflow_id} not found")
                return

            logger.info(f"[RUN_WORKFLOW] Loaded workflow='{workflow.name}' nodes={len(workflow.nodes)} edges={len(workflow.edges)}")

            # ── Mark running ──────────────────────────────────
            execution.status = "running"
            await db.commit()

            await ws_manager.broadcast(
                str(execution_id),
                {"type": "execution_update", "status": "running", "execution_id": str(execution_id)},
            )

            # ── Run engine ────────────────────────────────────
            engine = WorkflowEngine(workflow, execution, db, ws_manager)
            output = await engine.execute(execution.input_data)

            # ── Persist result ────────────────────────────────
            execution.status       = "completed"
            execution.output_data  = output
            execution.completed_at = datetime.now(timezone.utc)
            await db.commit()

            logger.info(f"[RUN_WORKFLOW] Completed execution={execution_id}")
            logger.info(f"[RUN_WORKFLOW] Final output: {json.dumps(output, default=str)[:500]}")

            await ws_manager.broadcast(
                str(execution_id),
                {
                    "type":         "execution_update",
                    "status":       "completed",
                    "execution_id": str(execution_id),
                    "output":       output,
                },
            )

        except Exception as exc:
            tb = traceback.format_exc()
            logger.error(f"[RUN_WORKFLOW] EXCEPTION for execution={execution_id}: {exc}")
            logger.error(f"[RUN_WORKFLOW] Traceback:\n{tb}")

            # Write failure to DB in a fresh session
            try:
                async with AsyncSessionLocal() as err_db:
                    err_exec = (await err_db.execute(
                        select(Execution).where(Execution.id == execution_id)
                    )).scalar_one_or_none()
                    if err_exec:
                        err_exec.status       = "failed"
                        err_exec.error        = str(exc)
                        err_exec.completed_at = datetime.now(timezone.utc)
                        await err_db.commit()
            except Exception as db_exc:
                logger.error(f"[RUN_WORKFLOW] Could not write failure to DB: {db_exc}")

            await ws_manager.broadcast(
                str(execution_id),
                {
                    "type":         "execution_update",
                    "status":       "failed",
                    "execution_id": str(execution_id),
                    "error":        str(exc),
                },
            )
