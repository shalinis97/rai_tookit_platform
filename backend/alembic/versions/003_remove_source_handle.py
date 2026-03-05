"""remove source_handle from edges

Revision ID: 003
Revises: 002
Create Date: 2026-03-05
"""
from alembic import op
import sqlalchemy as sa

revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop handle-based constraint if it exists, restore simple one
    try:
        op.drop_constraint('uq_edges_from_to_handle', 'edges', type_='unique')
    except Exception:
        pass  # didn't exist — that's fine
    try:
        op.drop_column('edges', 'source_handle')
    except Exception:
        pass  # didn't exist — that's fine
    try:
        op.create_unique_constraint('uq_edges_from_to', 'edges', ['from_node_id', 'to_node_id'])
    except Exception:
        pass  # already exists


def downgrade() -> None:
    pass
