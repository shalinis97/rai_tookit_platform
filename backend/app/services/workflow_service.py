import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from app.models.workflow import Workflow
from app.models.node import Node
from app.models.edge import Edge
from app.schemas.workflow import WorkflowCreate, WorkflowUpdate
from app.core.exceptions import NotFoundError


async def get_all(db: AsyncSession) -> list[Workflow]:
    result = await db.execute(
        select(Workflow).order_by(desc(Workflow.updated_at))
    )
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, workflow_id: uuid.UUID) -> Workflow:
    result = await db.execute(
        select(Workflow)
        .options(selectinload(Workflow.nodes), selectinload(Workflow.edges))
        .where(Workflow.id == workflow_id)
    )
    workflow = result.scalar_one_or_none()
    if not workflow:
        raise NotFoundError("Workflow", str(workflow_id))
    return workflow


async def create(db: AsyncSession, data: WorkflowCreate) -> Workflow:
    workflow = Workflow(
        name=data.name,
        description=data.description,
        status=data.status,
    )
    db.add(workflow)
    await db.flush()
    await db.refresh(workflow)
    return workflow


async def update(db: AsyncSession, workflow_id: uuid.UUID, data: WorkflowUpdate) -> Workflow:
    workflow = await get_by_id(db, workflow_id)
    update_data = data.model_dump(exclude_unset=True)

    # Never allow a plain PATCH to overwrite quarantined status.
    # Quarantine is lifted only via policy_service.unquarantine_workflow
    # which sets it to 'active' before this update is called.
    if workflow.status == "quarantined":
        update_data.pop("status", None)

    for field, value in update_data.items():
        setattr(workflow, field, value)

    await db.flush()
    await db.refresh(workflow)
    return workflow


async def delete(db: AsyncSession, workflow_id: uuid.UUID) -> None:
    workflow = await get_by_id(db, workflow_id)
    await db.delete(workflow)
    await db.flush()


async def duplicate(db: AsyncSession, workflow_id: uuid.UUID) -> Workflow:
    original = await get_by_id(db, workflow_id)

    # Create new workflow
    new_workflow = Workflow(
        name=f"Copy of {original.name}",
        description=original.description,
        status="draft",
    )
    db.add(new_workflow)
    await db.flush()

    # Map old node IDs -> new node IDs
    node_id_map: dict[uuid.UUID, uuid.UUID] = {}

    for node in original.nodes:
        new_node = Node(
            workflow_id=new_workflow.id,
            type=node.type,
            title=node.title,
            position_x=node.position_x + 40,
            position_y=node.position_y + 40,
            config=dict(node.config),
        )
        db.add(new_node)
        await db.flush()
        node_id_map[node.id] = new_node.id

    # Recreate edges with new node IDs
    for edge in original.edges:
        new_from = node_id_map.get(edge.from_node_id)
        new_to = node_id_map.get(edge.to_node_id)
        if new_from and new_to:
            new_edge = Edge(
                workflow_id=new_workflow.id,
                from_node_id=new_from,
                to_node_id=new_to,
            )
            db.add(new_edge)

    await db.flush()
    await db.refresh(new_workflow)
    return new_workflow
