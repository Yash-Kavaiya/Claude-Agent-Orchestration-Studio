"""
Execution Schemas
Pydantic models for workflow and node execution
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict
import uuid


# ===========================
# Workflow Execution Schemas
# ===========================


class ExecutionCreate(BaseModel):
    """Schema for creating a workflow execution"""

    input_data: Optional[Dict[str, Any]] = Field(default_factory=dict)
    context: Optional[Dict[str, Any]] = Field(default_factory=dict)
    priority: Optional[int] = Field(default=0, ge=0, le=10)
    scheduled_at: Optional[datetime] = None
    max_retries: Optional[int] = Field(default=3, ge=0, le=10)


class ExecutionUpdate(BaseModel):
    """Schema for updating a workflow execution"""

    status: Optional[str] = None
    priority: Optional[int] = Field(None, ge=0, le=10)


class WorkflowExecutionResponse(BaseModel):
    """Schema for workflow execution response"""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workflow_id: uuid.UUID
    user_id: uuid.UUID
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    input_data: Dict[str, Any]
    output_data: Dict[str, Any]
    context: Dict[str, Any]
    total_nodes: int
    completed_nodes: int
    failed_nodes: int
    progress_percentage: float = 0.0
    error_message: Optional[str] = None
    error_details: Dict[str, Any]
    retry_count: int
    max_retries: int
    priority: int
    celery_task_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class WorkflowExecutionDetailResponse(WorkflowExecutionResponse):
    """Schema for detailed workflow execution response with node executions"""

    node_executions: List["NodeExecutionResponse"] = []
    execution_log: List[Dict[str, Any]] = []


class WorkflowExecutionListResponse(BaseModel):
    """Schema for paginated workflow execution list"""

    items: List[WorkflowExecutionResponse]
    total: int
    limit: int
    offset: int


# ===========================
# Node Execution Schemas
# ===========================


class NodeExecutionResponse(BaseModel):
    """Schema for node execution response"""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    workflow_execution_id: uuid.UUID
    agent_id: Optional[uuid.UUID] = None
    user_id: uuid.UUID
    node_id: str
    node_name: str
    node_type: str
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None
    input_data: Dict[str, Any]
    output_data: Dict[str, Any]
    agent_response: Optional[str] = None
    tokens_used: Optional[int] = None
    model_used: Optional[str] = None
    tools_called: List[str] = []
    error_message: Optional[str] = None
    retry_count: int
    execution_order: int
    celery_task_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class NodeExecutionDetailResponse(NodeExecutionResponse):
    """Schema for detailed node execution response"""

    execution_log: List[Dict[str, Any]] = []
    parent_node_ids: List[str] = []
    child_node_ids: List[str] = []
    tool_results: Dict[str, Any] = {}


# ===========================
# Execution Statistics
# ===========================


class ExecutionStatistics(BaseModel):
    """Schema for execution statistics"""

    total_executions: int
    completed_executions: int
    failed_executions: int
    running_executions: int
    pending_executions: int
    cancelled_executions: int
    average_duration: Optional[float] = None
    success_rate: float = 0.0


class WorkflowStatistics(BaseModel):
    """Schema for workflow-specific statistics"""

    workflow_id: uuid.UUID
    workflow_name: str
    execution_count: int
    success_count: int
    failure_count: int
    average_duration: Optional[float] = None
    success_rate: float = 0.0
    last_execution_at: Optional[datetime] = None


# ===========================
# Real-time Execution Updates
# ===========================


class ExecutionStatusUpdate(BaseModel):
    """Schema for real-time execution status updates (WebSocket)"""

    execution_id: uuid.UUID
    status: str
    progress_percentage: float
    completed_nodes: int
    total_nodes: int
    current_node: Optional[str] = None
    timestamp: datetime


class NodeExecutionUpdate(BaseModel):
    """Schema for real-time node execution updates (WebSocket)"""

    node_execution_id: uuid.UUID
    workflow_execution_id: uuid.UUID
    node_id: str
    node_name: str
    status: str
    message: Optional[str] = None
    timestamp: datetime


# ===========================
# Execution Actions
# ===========================


class ExecutionActionResponse(BaseModel):
    """Schema for execution action responses (start, stop, retry)"""

    success: bool
    message: str
    execution_id: uuid.UUID
    status: str


class BulkExecutionRequest(BaseModel):
    """Schema for bulk execution creation"""

    workflow_id: uuid.UUID
    executions: List[ExecutionCreate]


class BulkExecutionResponse(BaseModel):
    """Schema for bulk execution creation response"""

    created: int
    failed: int
    execution_ids: List[uuid.UUID]
    errors: List[str] = []
