import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict


class EdgeBase(BaseModel):
    from_node_id: uuid.UUID
    to_node_id:   uuid.UUID


class EdgeCreate(EdgeBase):
    workflow_id: Optional[uuid.UUID] = None


class EdgeRead(EdgeBase):
    model_config = ConfigDict(from_attributes=True)

    id:          uuid.UUID
    workflow_id: uuid.UUID
