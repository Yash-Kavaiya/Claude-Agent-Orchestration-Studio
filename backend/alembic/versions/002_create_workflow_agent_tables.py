"""Create workflow and agent tables

Revision ID: 002
Revises: 001
Create Date: 2025-11-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY


# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create workflows table
    op.create_table(
        'workflows',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(50), default='draft', nullable=False),
        sa.Column('nodes', JSONB, nullable=False, server_default='[]'),
        sa.Column('connections', JSONB, nullable=False, server_default='[]'),
        sa.Column('settings', JSONB, nullable=False, server_default='{}'),
        sa.Column('tags', ARRAY(sa.String), nullable=False, server_default='{}'),
        sa.Column('is_public', sa.Boolean(), default=False, nullable=False),
        sa.Column('version', sa.Integer(), default=1, nullable=False),
        sa.Column('parent_workflow_id', UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # Create indexes for workflows
    op.create_index('idx_workflow_user', 'workflows', ['user_id'])
    op.create_index('idx_workflow_status', 'workflows', ['status'])
    op.create_index('idx_workflow_tags', 'workflows', ['tags'], postgresql_using='gin')
    op.create_index('idx_workflow_nodes', 'workflows', ['nodes'], postgresql_using='gin')

    # Create agents table
    op.create_table(
        'agents',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('workflow_id', UUID(as_uuid=True), sa.ForeignKey('workflows.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('node_id', sa.String(255), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('system_prompt', sa.Text(), nullable=True),
        sa.Column('model', sa.String(100), nullable=True),
        sa.Column('temperature', sa.DECIMAL(3, 2), nullable=True),
        sa.Column('max_tokens', sa.Integer(), nullable=True),
        sa.Column('tools', ARRAY(sa.String), nullable=False, server_default='{}'),
        sa.Column('permissions', JSONB, nullable=False, server_default='{}'),
        sa.Column('memory_config', JSONB, nullable=False, server_default='{}'),
        sa.Column('sub_agents', ARRAY(UUID(as_uuid=True)), nullable=False, server_default='{}'),
        sa.Column('metadata', JSONB, nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # Create indexes for agents
    op.create_index('idx_agent_workflow', 'agents', ['workflow_id'])
    op.create_index('idx_agent_user', 'agents', ['user_id'])
    op.create_index('idx_agent_node', 'agents', ['node_id'])
    op.create_index('idx_agent_type', 'agents', ['type'])


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('agents')
    op.drop_table('workflows')
