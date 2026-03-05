import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.edge import EdgeCreate, EdgeRead
from app.services import edge_service
from app.core.exceptions import NotFoundError, DuplicateError

router = APIRouter(prefix="/workflows/{workflow_id}/edges", tags=["Edges"])


@router.get("/", response_model=list[EdgeRead])
async def list_edges(workflow_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    return await edge_service.get_for_workflow(db, workflow_id)


@router.post("/", response_model=EdgeRead, status_code=status.HTTP_201_CREATED)
async def create_edge(
    workflow_id: uuid.UUID,
    data: EdgeCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await edge_service.create(db, workflow_id, data)
    except DuplicateError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.delete("/{edge_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_edge(
    workflow_id: uuid.UUID,
    edge_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    try:
        await edge_service.delete_edge(db, edge_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
