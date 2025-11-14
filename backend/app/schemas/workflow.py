"""
Workflow Pydantic Schemas
Request/response models for workflow-related operations
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, UUID4, validator


class NodeSchema(BaseModel):
    """Schema for workflow node"""

    id: str
    type: str
    title: Optional[str] = None
    position: Dict[str, float]
    data: Dict[str, Any] = Field(default_factory=dict)


class ConnectionSchema(BaseModel):
    """Schema for workflow connection"""

    id: Optional[str] = None
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None


class WorkflowBase(BaseModel):
    """Base workflow schema"""

    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class WorkflowCreate(WorkflowBase):
    """Schema for creating a new workflow"""

    nodes: List[NodeSchema] = Field(default_factory=list)
    connections: List[ConnectionSchema] = Field(default_factory=list)
    settings: Dict[str, Any] = Field(default_factory=dict)
    is_public: bool = False

    @validator("tags")
    def validate_tags(cls, v):
        """Validate tags"""
        if len(v) > 20:
            raise ValueError("Maximum 20 tags allowed")
        return [tag.strip().lower() for tag in v if tag.strip()]


class WorkflowUpdate(BaseModel):
    """Schema for updating workflow"""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    nodes: Optional[List[NodeSchema]] = None
    connections: Optional[List[ConnectionSchema]] = None
    settings: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None

    @validator("tags")
    def validate_tags(cls, v):
        """Validate tags"""
        if v is not None and len(v) > 20:
            raise ValueError("Maximum 20 tags allowed")
        return [tag.strip().lower() for tag in v if tag.strip()] if v else None


class WorkflowStatusUpdate(BaseModel):
    """Schema for updating workflow status"""

    status: str = Field(pattern="^(draft|published|archived)$")


class WorkflowInDB(WorkflowBase):
    """Schema for workflow in database"""

    id: UUID4
    user_id: UUID4
    status: str
    nodes: List[Dict[str, Any]]
    connections: List[Dict[str, Any]]
    settings: Dict[str, Any]
    is_public: bool
    version: int
    parent_workflow_id: Optional[UUID4]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WorkflowResponse(BaseModel):
    """Schema for workflow response"""

    id: UUID4
    user_id: UUID4
    name: str
    description: Optional[str]
    status: str
    nodes: List[Dict[str, Any]]
    connections: List[Dict[str, Any]]
    settings: Dict[str, Any]
    tags: List[str]
    is_public: bool
    version: int
    parent_workflow_id: Optional[UUID4]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WorkflowListResponse(BaseModel):
    """Schema for paginated workflow list"""

    items: List[WorkflowResponse]
    total: int
    limit: int
    offset: int


class WorkflowSummary(BaseModel):
    """Schema for workflow summary (list view)"""

    id: UUID4
    name: str
    description: Optional[str]
    status: str
    tags: List[str]
    node_count: int
    created_at: datetime
    updated_at: datetime


class WorkflowDuplicate(BaseModel):
    """Schema for duplicating workflow"""

    name: Optional[str] = None
    copy_agents: bool = True


class WorkflowValidationResult(BaseModel):
    """Schema for workflow validation result"""

    is_valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class WorkflowSearchParams(BaseModel):
    """Schema for workflow search parameters"""

    query: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(draft|published|archived)$")
    tags: Optional[List[str]] = None
    is_public: Optional[bool] = None
    limit: int = Field(default=10, ge=1, le=100)
    offset: int = Field(default=0, ge=0)
