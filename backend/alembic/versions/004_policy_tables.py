"""add policy tables and workflow quarantine status

Revision ID: 004
Revises: 003
Create Date: 2026-03-06
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── policies ──────────────────────────────────────────────
    op.create_table(
        'policies',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(255), nullable=False, unique=True),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('scope', sa.String(20), nullable=False, server_default='global'),
        sa.Column('enabled', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('rego_code', sa.Text, nullable=False),
        sa.Column('version', sa.Integer, nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_policies_scope', 'policies', ['scope'])
    op.create_index('ix_policies_enabled', 'policies', ['enabled'])

    # ── policy_workflow_assignments ───────────────────────────
    op.create_table(
        'policy_workflow_assignments',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('policy_id', UUID(as_uuid=True), sa.ForeignKey('policies.id', ondelete='CASCADE'), nullable=False),
        sa.Column('workflow_id', UUID(as_uuid=True), sa.ForeignKey('workflows.id', ondelete='CASCADE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_policy_assignments_policy', 'policy_workflow_assignments', ['policy_id'])
    op.create_index('ix_policy_assignments_workflow', 'policy_workflow_assignments', ['workflow_id'])
    op.create_unique_constraint('uq_policy_workflow', 'policy_workflow_assignments', ['policy_id', 'workflow_id'])

    # ── policy_audit_logs ─────────────────────────────────────
    op.create_table(
        'policy_audit_logs',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('execution_id', UUID(as_uuid=True), sa.ForeignKey('executions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('workflow_id', UUID(as_uuid=True), nullable=False),
        sa.Column('node_id', sa.String(100), nullable=True),
        sa.Column('policy_id', UUID(as_uuid=True), sa.ForeignKey('policies.id', ondelete='SET NULL'), nullable=True),
        sa.Column('check_point', sa.String(50), nullable=False),
        sa.Column('decision', sa.String(10), nullable=False),
        sa.Column('violations', JSONB, nullable=False, server_default='[]'),
        sa.Column('input_snapshot', JSONB, nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index('ix_audit_logs_execution', 'policy_audit_logs', ['execution_id'])
    op.create_index('ix_audit_logs_workflow', 'policy_audit_logs', ['workflow_id'])
    op.create_index('ix_audit_logs_decision', 'policy_audit_logs', ['decision'])
    op.create_index('ix_audit_logs_created_at', 'policy_audit_logs', ['created_at'])


def downgrade() -> None:
    op.drop_table('policy_audit_logs')
    op.drop_table('policy_workflow_assignments')
    op.drop_table('policies')
