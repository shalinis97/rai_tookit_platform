import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING
from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.node import NodeRead
from app.schemas.edge import EdgeRead


class WorkflowBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "draft"


class WorkflowCreate(WorkflowBase):
    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = {"draft", "active", "archived"}
        if v not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return v


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        # quarantined is set internally only — never via a client update
        allowed = {"draft", "active", "archived"}
        if v not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return v


# Read schemas have NO status validator —
# the DB can return any status including 'quarantined'
class WorkflowRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime


class WorkflowReadFull(WorkflowRead):
    nodes: list[NodeRead] = []
    edges: list[EdgeRead] = []
