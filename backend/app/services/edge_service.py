import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.edge import Edge
from app.schemas.edge import EdgeCreate
from app.core.exceptions import NotFoundError, DuplicateError


async def get_for_workflow(db: AsyncSession, workflow_id: uuid.UUID) -> list[Edge]:
    result = await db.execute(
        select(Edge).where(Edge.workflow_id == workflow_id)
    )
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, edge_id: uuid.UUID) -> Edge:
    result = await db.execute(select(Edge).where(Edge.id == edge_id))
    edge = result.scalar_one_or_none()
    if not edge:
        raise NotFoundError("Edge", str(edge_id))
    return edge


async def create(db: AsyncSession, workflow_id: uuid.UUID, data: EdgeCreate) -> Edge:
    # Check for duplicate
    existing = await db.execute(
        select(Edge).where(
            Edge.from_node_id == data.from_node_id,
            Edge.to_node_id == data.to_node_id,
        )
    )
    if existing.scalar_one_or_none():
        raise DuplicateError(
            f"Edge from {data.from_node_id} to {data.to_node_id} already exists"
        )

    edge = Edge(
        workflow_id=workflow_id,
        from_node_id=data.from_node_id,
        to_node_id=data.to_node_id,
    )
    db.add(edge)
    await db.flush()
    await db.refresh(edge)
    return edge


async def delete_edge(db: AsyncSession, edge_id: uuid.UUID) -> None:
    edge = await get_by_id(db, edge_id)
    await db.delete(edge)
    await db.flush()
