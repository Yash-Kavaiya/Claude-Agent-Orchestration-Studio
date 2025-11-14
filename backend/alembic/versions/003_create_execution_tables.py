"""Create execution tables

Revision ID: 003
Revises: 002
Create Date: 2025-11-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

# revision identifiers, used by Alembic.
revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create workflow_executions table
    op.create_table(
        'workflow_executions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('workflow_id', UUID(as_uuid=True), sa.ForeignKey('workflows.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('status', sa.String(50), default='pending', nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration_seconds', sa.DECIMAL(10, 3), nullable=True),
        sa.Column('input_data', JSONB, nullable=False, server_default='{}'),
        sa.Column('output_data', JSONB, nullable=False, server_default='{}'),
        sa.Column('context', JSONB, nullable=False, server_default='{}'),
        sa.Column('total_nodes', sa.Integer(), default=0, nullable=False),
        sa.Column('completed_nodes', sa.Integer(), default=0, nullable=False),
        sa.Column('failed_nodes', sa.Integer(), default=0, nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('error_details', JSONB, nullable=False, server_default='{}'),
        sa.Column('execution_log', JSONB, nullable=False, server_default='[]'),
        sa.Column('retry_count', sa.Integer(), default=0, nullable=False),
        sa.Column('max_retries', sa.Integer(), default=3, nullable=False),
        sa.Column('priority', sa.Integer(), default=0, nullable=False),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('celery_task_id', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # Create indexes for workflow_executions
    op.create_index('idx_workflow_execution_workflow', 'workflow_executions', ['workflow_id'])
    op.create_index('idx_workflow_execution_user', 'workflow_executions', ['user_id'])
    op.create_index('idx_workflow_execution_status', 'workflow_executions', ['status'])
    op.create_index('idx_workflow_execution_celery_task', 'workflow_executions', ['celery_task_id'])
    op.create_index('idx_workflow_execution_created', 'workflow_executions', ['created_at'])

    # Create node_executions table
    op.create_table(
        'node_executions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column('workflow_execution_id', UUID(as_uuid=True), sa.ForeignKey('workflow_executions.id', ondelete='CASCADE'), nullable=False),
        sa.Column('agent_id', UUID(as_uuid=True), sa.ForeignKey('agents.id', ondelete='SET NULL'), nullable=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('node_id', sa.String(255), nullable=False),
        sa.Column('node_name', sa.String(255), nullable=False),
        sa.Column('node_type', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), default='pending', nullable=False),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration_seconds', sa.DECIMAL(10, 3), nullable=True),
        sa.Column('input_data', JSONB, nullable=False, server_default='{}'),
        sa.Column('output_data', JSONB, nullable=False, server_default='{}'),
        sa.Column('agent_response', sa.Text(), nullable=True),
        sa.Column('tokens_used', sa.Integer(), nullable=True),
        sa.Column('model_used', sa.String(100), nullable=True),
        sa.Column('temperature', sa.DECIMAL(3, 2), nullable=True),
        sa.Column('tools_called', JSONB, nullable=False, server_default='[]'),
        sa.Column('tool_results', JSONB, nullable=False, server_default='{}'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('error_details', JSONB, nullable=False, server_default='{}'),
        sa.Column('error_stack', sa.Text(), nullable=True),
        sa.Column('retry_count', sa.Integer(), default=0, nullable=False),
        sa.Column('max_retries', sa.Integer(), default=3, nullable=False),
        sa.Column('execution_order', sa.Integer(), nullable=False),
        sa.Column('parent_node_ids', JSONB, nullable=False, server_default='[]'),
        sa.Column('child_node_ids', JSONB, nullable=False, server_default='[]'),
        sa.Column('execution_log', JSONB, nullable=False, server_default='[]'),
        sa.Column('celery_task_id', sa.String(255), nullable=True),
        sa.Column('metadata', JSONB, nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
    )

    # Create indexes for node_executions
    op.create_index('idx_node_execution_workflow_execution', 'node_executions', ['workflow_execution_id'])
    op.create_index('idx_node_execution_agent', 'node_executions', ['agent_id'])
    op.create_index('idx_node_execution_user', 'node_executions', ['user_id'])
    op.create_index('idx_node_execution_node_id', 'node_executions', ['node_id'])
    op.create_index('idx_node_execution_node_type', 'node_executions', ['node_type'])
    op.create_index('idx_node_execution_status', 'node_executions', ['status'])
    op.create_index('idx_node_execution_order', 'node_executions', ['execution_order'])
    op.create_index('idx_node_execution_celery_task', 'node_executions', ['celery_task_id'])

    # Create composite indexes for common queries
    op.create_index(
        'idx_workflow_execution_user_status',
        'workflow_executions',
        ['user_id', 'status']
    )
    op.create_index(
        'idx_workflow_execution_workflow_status',
        'workflow_executions',
        ['workflow_id', 'status']
    )
    op.create_index(
        'idx_node_execution_workflow_order',
        'node_executions',
        ['workflow_execution_id', 'execution_order']
    )


def downgrade() -> None:
    # Drop tables in reverse order
    op.drop_table('node_executions')
    op.drop_table('workflow_executions')
