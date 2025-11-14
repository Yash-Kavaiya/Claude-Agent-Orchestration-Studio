"""
Workflow Execution Model
Tracks workflow execution instances
"""
import uuid
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy import String, Integer, Text, DECIMAL, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.db.base import BaseModel


class WorkflowExecution(BaseModel):
    """
    Workflow Execution Model

    Tracks individual workflow execution instances with status,
    timing, inputs/outputs, and execution logs.
    """
    __tablename__ = "workflow_executions"

    # Foreign Keys
    workflow_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workflows.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Execution Status
    status: Mapped[str] = mapped_column(
        String(50),
        default="pending",
        nullable=False,
        index=True,
    )  # pending, running, completed, failed, cancelled

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
    context: Mapped[Dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default="{}"
    )  # Shared context across nodes

    # Progress Tracking
    total_nodes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completed_nodes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    failed_nodes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Error Handling
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    error_details: Mapped[Dict[str, Any]] = mapped_column(
        JSONB, nullable=False, server_default="{}"
    )

    # Execution Log
    execution_log: Mapped[List[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=False, server_default="[]"
    )

    # Retry Information
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_retries: Mapped[int] = mapped_column(Integer, default=3, nullable=False)

    # Priority and Scheduling
    priority: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)

    # Celery Task Information
    celery_task_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, index=True
    )

    # Relationships
    workflow: Mapped["Workflow"] = relationship(
        "Workflow", back_populates="executions", lazy="joined"
    )
    user: Mapped["User"] = relationship("User", back_populates="workflow_executions")
    node_executions: Mapped[List["NodeExecution"]] = relationship(
        "NodeExecution",
        back_populates="workflow_execution",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<WorkflowExecution(id={self.id}, workflow_id={self.workflow_id}, status={self.status})>"

    def is_running(self) -> bool:
        """Check if execution is currently running"""
        return self.status == "running"

    def is_completed(self) -> bool:
        """Check if execution is completed"""
        return self.status == "completed"

    def is_failed(self) -> bool:
        """Check if execution has failed"""
        return self.status == "failed"

    def can_retry(self) -> bool:
        """Check if execution can be retried"""
        return self.is_failed() and self.retry_count < self.max_retries

    def get_progress_percentage(self) -> float:
        """Calculate execution progress percentage"""
        if self.total_nodes == 0:
            return 0.0
        return (self.completed_nodes / self.total_nodes) * 100

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

    def to_dict(self) -> Dict[str, Any]:
        """Convert execution to dictionary"""
        return {
            "id": str(self.id),
            "workflow_id": str(self.workflow_id),
            "user_id": str(self.user_id),
            "status": self.status,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "duration_seconds": float(self.duration_seconds) if self.duration_seconds else None,
            "input_data": self.input_data,
            "output_data": self.output_data,
            "context": self.context,
            "total_nodes": self.total_nodes,
            "completed_nodes": self.completed_nodes,
            "failed_nodes": self.failed_nodes,
            "progress_percentage": self.get_progress_percentage(),
            "error_message": self.error_message,
            "error_details": self.error_details,
            "retry_count": self.retry_count,
            "max_retries": self.max_retries,
            "priority": self.priority,
            "celery_task_id": self.celery_task_id,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
