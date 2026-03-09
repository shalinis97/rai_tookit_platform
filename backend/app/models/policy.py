import uuid
from datetime import datetime
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY

from app.database import Base


class Policy(Base):
    __tablename__ = "policies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # "global" applies to all workflows; "local" requires assignment
    scope: Mapped[str] = mapped_column(String(20), nullable=False, default="global")

    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    rego_code: Mapped[str] = mapped_column(Text, nullable=False)
    version: Mapped[int] = mapped_column(nullable=False, default=1)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
        onupdate=func.now(), nullable=False
    )

    # Relationships
    assignments: Mapped[list["PolicyWorkflowAssignment"]] = relationship(
        "PolicyWorkflowAssignment",
        back_populates="policy",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    audit_logs: Mapped[list["PolicyAuditLog"]] = relationship(
        "PolicyAuditLog",
        back_populates="policy",
        cascade="all, delete-orphan",
        lazy="noload",
    )

    def __repr__(self):
        return f"<Policy id={self.id} name={self.name!r} scope={self.scope}>"


class PolicyWorkflowAssignment(Base):
    """Links a local-scoped policy to specific workflows."""
    __tablename__ = "policy_workflow_assignments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    policy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("policies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    workflow_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workflows.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    policy: Mapped["Policy"] = relationship("Policy", back_populates="assignments")


class PolicyAuditLog(Base):
    """Immutable record of every policy decision made during execution."""
    __tablename__ = "policy_audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    execution_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("executions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    workflow_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )
    node_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    policy_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("policies.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    check_point: Mapped[str] = mapped_column(String(50), nullable=False)
    decision: Mapped[str] = mapped_column(String(10), nullable=False)  # allow | deny
    violations: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    input_snapshot: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    policy: Mapped["Policy"] = relationship("Policy", back_populates="audit_logs")
