import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


# ── Policy ────────────────────────────────────────────────────

class PolicyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    scope: str = "global"          # "global" | "local"
    rego_code: str
    enabled: bool = True


class PolicyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    scope: Optional[str] = None
    rego_code: Optional[str] = None
    enabled: Optional[bool] = None


class PolicyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:          uuid.UUID
    name:        str
    description: Optional[str]
    scope:       str
    enabled:     bool
    version:     int
    created_at:  datetime
    updated_at:  datetime


class PolicyReadFull(PolicyRead):
    rego_code:   str
    assignments: list["AssignmentRead"] = []


# ── Assignment ────────────────────────────────────────────────

class AssignmentCreate(BaseModel):
    workflow_id: uuid.UUID


class AssignmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:          uuid.UUID
    policy_id:   uuid.UUID
    workflow_id: uuid.UUID
    created_at:  datetime


# ── Compile / Test ────────────────────────────────────────────

class CompileRequest(BaseModel):
    code: str


class CompileResult(BaseModel):
    status: str           # "success" | "error"
    message: str
    error: Optional[str] = None


class TestRequest(BaseModel):
    code: str
    input_data: dict      # parsed JSON object


class TestResult(BaseModel):
    status:    str        # "success" | "error"
    allow:     bool = False
    violated:  bool = False
    violations: list[str] = []
    raw:       dict = {}
    error:     Optional[str] = None


# ── Audit Log ─────────────────────────────────────────────────

class AuditLogRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:             uuid.UUID
    execution_id:   uuid.UUID
    workflow_id:    uuid.UUID
    node_id:        Optional[str]
    policy_id:      Optional[uuid.UUID]
    check_point:    str
    decision:       str
    violations:     list
    created_at:     datetime


# ── Quarantine ────────────────────────────────────────────────

class QuarantineRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id:           uuid.UUID
    name:         str
    description:  Optional[str]
    status:       str
    created_at:   datetime
    updated_at:   datetime
    # Latest violation info (joined from audit log)
    last_violated_at:  Optional[datetime] = None
    last_violations:   list[str] = []
    last_policy_name:  Optional[str] = None
