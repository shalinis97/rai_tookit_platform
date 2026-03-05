"""add source_handle to edges

Revision ID: 002
Revises: 001
Create Date: 2026-03-05
"""
from alembic import op
import sqlalchemy as sa

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add source_handle column with default "out"
    op.add_column('edges', sa.Column('source_handle', sa.String(32), nullable=False, server_default='out'))

    # Drop old unique constraint and add new one that includes source_handle
    op.drop_constraint('uq_edges_from_to', 'edges', type_='unique')
    op.create_unique_constraint('uq_edges_from_to_handle', 'edges', ['from_node_id', 'to_node_id', 'source_handle'])


def downgrade() -> None:
    op.drop_constraint('uq_edges_from_to_handle', 'edges', type_='unique')
    op.create_unique_constraint('uq_edges_from_to', 'edges', ['from_node_id', 'to_node_id'])
    op.drop_column('edges', 'source_handle')
