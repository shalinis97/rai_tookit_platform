import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.node import Node
from app.models.edge import Edge
from app.schemas.node import NodeCreate, NodeUpdate, NodeBatchSave
from app.core.exceptions import NotFoundError


async def get_for_workflow(db: AsyncSession, workflow_id: uuid.UUID) -> list[Node]:
    result = await db.execute(
        select(Node).where(Node.workflow_id == workflow_id)
    )
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, node_id: uuid.UUID) -> Node:
    result = await db.execute(select(Node).where(Node.id == node_id))
    node = result.scalar_one_or_none()
    if not node:
        raise NotFoundError("Node", str(node_id))
    return node


async def create(db: AsyncSession, workflow_id: uuid.UUID, data: NodeCreate) -> Node:
    node = Node(
        workflow_id=workflow_id,
        type=data.type,
        title=data.title,
        position_x=data.position_x,
        position_y=data.position_y,
        config=data.config,
    )
    db.add(node)
    await db.flush()
    await db.refresh(node)
    return node


async def update(db: AsyncSession, node_id: uuid.UUID, data: NodeUpdate) -> Node:
    node = await get_by_id(db, node_id)
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(node, field, value)
    await db.flush()
    await db.refresh(node)
    return node


async def delete_node(db: AsyncSession, node_id: uuid.UUID) -> None:
    node = await get_by_id(db, node_id)
    # Edges cascade via FK, but let's be explicit
    await db.execute(
        delete(Edge).where(
            (Edge.from_node_id == node_id) | (Edge.to_node_id == node_id)
        )
    )
    await db.delete(node)
    await db.flush()


async def batch_save(
    db: AsyncSession,
    workflow_id: uuid.UUID,
    data: NodeBatchSave,
) -> tuple[list[Node], list[Edge]]:
    """
    Replace all nodes and edges for a workflow with the provided set.
    Used to persist the full canvas state in one shot.
    Returns (nodes, edges).
    """
    # Delete existing nodes (edges cascade)
    await db.execute(delete(Node).where(Node.workflow_id == workflow_id))
    await db.flush()

    # Map frontend string IDs -> new DB UUIDs
    id_map: dict[str, uuid.UUID] = {}
    new_nodes: list[Node] = []

    for item in data.nodes:
        node = Node(
            workflow_id=workflow_id,
            type=item.type,
            title=item.title,
            position_x=item.position_x,
            position_y=item.position_y,
            config=item.config,
        )
        db.add(node)
        await db.flush()
        if item.id:
            id_map[item.id] = node.id
        new_nodes.append(node)

    new_edges: list[Edge] = []
    for item in data.edges:
        from_id = id_map.get(item.from_node_id)
        to_id = id_map.get(item.to_node_id)
        if from_id and to_id:
            edge = Edge(
                workflow_id=workflow_id,
                from_node_id=from_id,
                to_node_id=to_id,
                source_handle=item.source_handle or 'out',
            )
            db.add(edge)
            await db.flush()
            new_edges.append(edge)

    return new_nodes, new_edges
