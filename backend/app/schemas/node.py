import uuid
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, field_validator


NODE_TYPES = {"trigger", "agent", "function", "output"}


class NodeBase(BaseModel):
    type: str
    title: str
    position_x: float = 0.0
    position_y: float = 0.0
    config: dict[str, Any] = {}

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in NODE_TYPES:
            raise ValueError(f"type must be one of {NODE_TYPES}")
        return v


class NodeCreate(NodeBase):
    workflow_id: Optional[uuid.UUID] = None  # can be set by router from path param


class NodeUpdate(BaseModel):
    title: Optional[str] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    config: Optional[dict[str, Any]] = None


class NodeRead(NodeBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workflow_id: uuid.UUID
    created_at: datetime


class NodeBatchSave(BaseModel):
    """Used to save the full canvas state at once."""
    nodes: list["NodeBatchItem"]
    edges: list["EdgeBatchItem"]


class NodeBatchItem(BaseModel):
    id: Optional[str] = None   # frontend string ID — may be new
    type: str
    title: str
    position_x: float
    position_y: float
    config: dict[str, Any] = {}


class EdgeBatchItem(BaseModel):
    id: Optional[str] = None
    from_node_id: str   # frontend string ID
    to_node_id: str


NodeBatchSave.model_rebuild()
