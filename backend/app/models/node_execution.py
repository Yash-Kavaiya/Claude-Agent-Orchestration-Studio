"""
Node Execution Model
Tracks individual node execution within workflows
"""
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy import String, Integer, Text, DECIMAL, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.db.base import BaseModel


class NodeExecution(BaseModel):
    """
    Node Execution Model

    Tracks individual node execution within a workflow execution.
    Each node execution represents one step in the workflow.
    """
    __tablename__ = "node_executions"

    # Foreign Keys
    workflow_execution_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workflow_executions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    agent_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("agents.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Node Information
    node_id: Mapped[str] = mapped_column(
        String(255), nullable=False, index=True
    )  # The node ID from workflow definition
    node_name: Mapped[str] = mapped_column(String(255), nullable=False)
    node_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )  # agent, trigger, action, logic, integration

    # Execution Status
    status: Mapped[str] = mapped_column(
        String(50),
        default="pending",
        nullable=False,
        index=True,
    )  # pending, running, completed, failed, skipped, cancelled

    # Timing Information
    started_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    duration_seconds: Mapped[Optional[float]] = mapped_column(
        DECIMAL(10, 3), nullable=True
    )

    # Execution Data
    input_data: Mapped[Dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default="{}"
    )
    output_data: Mapped[Dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default="{}"
    )

    # Agent Execution Details (for agent nodes)
    agent_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tokens_used: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    model_used: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    temperature: Mapped[Optional[float]] = mapped_column(DECIMAL(3, 2), nullable=True)

    # Tool Usage (for agent nodes)
    tools_called: Mapped[List[str]] = mapped_column(
        JSONB, nullable=False, server_default="[]"
    )
    tool_results: Mapped[Dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default="{}"
    )

    # Error Handling
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    error_details: Mapped[Dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default="{}"
    )
    error_stack: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Retry Information
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_retries: Mapped[int] = mapped_column(Integer, default=3, nullable=False)

    # Execution Order
    execution_order: Mapped[int] = mapped_column(
        Integer, nullable=False, index=True
    )  # Order in which node was executed

    # Dependency Tracking
    parent_node_ids: Mapped[List[str]] = mapped_column(
        JSONB, nullable=False, server_default="[]"
    )  # Node IDs this node depends on
    child_node_ids: Mapped[List[str]] = mapped_column(
        JSONB, nullable=False, server_default="[]"
    )  # Node IDs that depend on this node

    # Execution Log
    execution_log: Mapped[List[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=False, server_default="[]"
    )

    # Celery Task Information
    celery_task_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, index=True
    )

    # Metadata
    metadata: Mapped[Dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default="{}"
    )

    # Relationships
    workflow_execution: Mapped["WorkflowExecution"] = relationship(
        "WorkflowExecution", back_populates="node_executions"
    )
    agent: Mapped[Optional["Agent"]] = relationship("Agent", lazy="joined")
    user: Mapped["User"] = relationship("User", back_populates="node_executions")

    def __repr__(self) -> str:
        return f"<NodeExecution(id={self.id}, node_id={self.node_id}, status={self.status})>"

    def is_running(self) -> bool:
        """Check if node execution is currently running"""
        return self.status == "running"

    def is_completed(self) -> bool:
        """Check if node execution is completed"""
        return self.status == "completed"

    def is_failed(self) -> bool:
        """Check if node execution has failed"""
        return self.status == "failed"

    def is_skipped(self) -> bool:
        """Check if node execution was skipped"""
        return self.status == "skipped"

    def can_retry(self) -> bool:
        """Check if node execution can be retried"""
        return self.is_failed() and self.retry_count < self.max_retries

    def add_log_entry(self, level: str, message: str, **kwargs) -> None:
        """Add an entry to the execution log"""
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": level,
            "message": message,
            **kwargs,
        }
        if not isinstance(self.execution_log, list):
            self.execution_log = []
        self.execution_log.append(log_entry)

    def calculate_duration(self) -> None:
        """Calculate and set execution duration"""
        if self.started_at and self.completed_at:
            duration = (self.completed_at - self.started_at).total_seconds()
            self.duration_seconds = duration

    def record_tool_call(self, tool_name: str, result: Any) -> None:
        """Record a tool call and its result"""
        if not isinstance(self.tools_called, list):
            self.tools_called = []
        if not isinstance(self.tool_results, dict):
            self.tool_results = {}

        self.tools_called.append(tool_name)
        self.tool_results[tool_name] = result

    def to_dict(self) -> Dict[str, Any]:
        """Convert node execution to dictionary"""
        return {
            "id": str(self.id),
            "workflow_execution_id": str(self.workflow_execution_id),
            "agent_id": str(self.agent_id) if self.agent_id else None,
            "user_id": str(self.user_id),
            "node_id": self.node_id,
            "node_name": self.node_name,
            "node_type": self.node_type,
            "status": self.status,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "duration_seconds": float(self.duration_seconds) if self.duration_seconds else None,
            "input_data": self.input_data,
            "output_data": self.output_data,
            "agent_response": self.agent_response,
            "tokens_used": self.tokens_used,
            "model_used": self.model_used,
            "tools_called": self.tools_called,
            "error_message": self.error_message,
            "retry_count": self.retry_count,
            "execution_order": self.execution_order,
            "celery_task_id": self.celery_task_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
