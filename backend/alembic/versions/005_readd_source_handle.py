"""re-add source_handle for condition node branching

Revision ID: 005
Revises: 004
Create Date: 2026-03-09
"""
from alembic import op
import sqlalchemy as sa

revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop old unique constraint first
    try:
        op.drop_constraint('uq_edges_from_to', 'edges', type_='unique')
    except Exception:
        pass
    # Add source_handle column
    try:
        op.add_column('edges', sa.Column('source_handle', sa.String(50), nullable=False, server_default='out'))
    except Exception:
        pass
    # New unique constraint allows same from/to with different handles (true/false)
    try:
        op.create_unique_constraint('uq_edges_from_to_handle', 'edges', ['from_node_id', 'to_node_id', 'source_handle'])
    except Exception:
        pass


def downgrade() -> None:
    try:
        op.drop_constraint('uq_edges_from_to_handle', 'edges', type_='unique')
    except Exception:
        pass
    try:
        op.drop_column('edges', 'source_handle')
    except Exception:
        pass
    try:
        op.create_unique_constraint('uq_edges_from_to', 'edges', ['from_node_id', 'to_node_id'])
    except Exception:
        pass
