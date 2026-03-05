import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, field_validator
from app.schemas.node import NodeRead
from app.schemas.edge import EdgeRead

class WorkflowBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "draft"

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        allowed = {"draft", "active", "archived"}
        if v not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return v


class WorkflowCreate(WorkflowBase):
    pass


class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        allowed = {"draft", "active", "archived"}
        if v not in allowed:
            raise ValueError(f"status must be one of {allowed}")
        return v


class WorkflowRead(WorkflowBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    @property
    def node_count(self) -> int:
        return 0  # overridden in WorkflowReadFull


class WorkflowReadFull(WorkflowRead):


    nodes: list["NodeRead"] = []
    edges: list["EdgeRead"] = []

    @property
    def node_count(self) -> int:
        return len(self.nodes)


# Resolve forward references
from app.schemas.node import NodeRead  # noqa: E402
from app.schemas.edge import EdgeRead  # noqa: E402
WorkflowReadFull.model_rebuild()
