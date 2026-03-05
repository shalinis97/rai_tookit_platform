import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.node import NodeCreate, NodeUpdate, NodeRead, NodeBatchSave
from app.schemas.edge import EdgeRead
from app.services import node_service
from app.core.exceptions import NotFoundError

router = APIRouter(prefix="/workflows/{workflow_id}/nodes", tags=["Nodes"])


@router.get("/", response_model=list[NodeRead])
async def list_nodes(workflow_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await node_service.get_for_workflow(db, workflow_id)


@router.post("/", response_model=NodeRead, status_code=status.HTTP_201_CREATED)
async def create_node(
    workflow_id: uuid.UUID,
    data: NodeCreate,
    db: AsyncSession = Depends(get_db),
):
    return await node_service.create(db, workflow_id, data)


@router.patch("/{node_id}", response_model=NodeRead)
async def update_node(
    workflow_id: uuid.UUID,
    node_id: uuid.UUID,
    data: NodeUpdate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await node_service.update(db, node_id, data)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_node(
    workflow_id: uuid.UUID,
    node_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    try:
        await node_service.delete_node(db, node_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))


class BatchSaveResponse(NodeBatchSave):
    pass


@router.post("/batch", status_code=status.HTTP_200_OK)
async def batch_save_canvas(
    workflow_id: uuid.UUID,
    data: NodeBatchSave,
    db: AsyncSession = Depends(get_db),
):
    """
    Save the entire canvas state (nodes + edges) at once.
    Replaces all existing nodes and edges for this workflow.
    """
    nodes, edges = await node_service.batch_save(db, workflow_id, data)
    return {
        "nodes": [NodeRead.model_validate(n) for n in nodes],
        "edges": [EdgeRead.model_validate(e) for e in edges],
    }
