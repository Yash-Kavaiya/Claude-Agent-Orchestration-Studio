"""
Agent Pydantic Schemas
Request/response models for agent-related operations
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, UUID4, validator
from decimal import Decimal


class AgentBase(BaseModel):
    """Base agent schema"""

    name: str = Field(min_length=1, max_length=255)
    type: str = Field(pattern="^(agent|trigger|action|logic|integration)$")


class AgentCreate(AgentBase):
    """Schema for creating a new agent"""

    node_id: str
    system_prompt: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[Decimal] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, gt=0, le=200000)
    tools: List[str] = Field(default_factory=list)
    permissions: Dict[str, Any] = Field(default_factory=dict)
    memory_config: Dict[str, Any] = Field(default_factory=dict)
    sub_agents: List[UUID4] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @validator("temperature")
    def validate_temperature(cls, v):
        """Ensure temperature is in valid range"""
        if v is not None and not (0.0 <= float(v) <= 2.0):
            raise ValueError("Temperature must be between 0.0 and 2.0")
        return v

    @validator("tools")
    def validate_tools(cls, v):
        """Validate tools list"""
        if len(v) > 50:
            raise ValueError("Maximum 50 tools allowed")
        return v


class AgentUpdate(BaseModel):
    """Schema for updating agent"""

    name: Optional[str] = Field(None, min_length=1, max_length=255)
    type: Optional[str] = Field(None, pattern="^(agent|trigger|action|logic|integration)$")
    system_prompt: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[Decimal] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, gt=0, le=200000)
    tools: Optional[List[str]] = None
    permissions: Optional[Dict[str, Any]] = None
    memory_config: Optional[Dict[str, Any]] = None
    sub_agents: Optional[List[UUID4]] = None
    metadata: Optional[Dict[str, Any]] = None

    @validator("temperature")
    def validate_temperature(cls, v):
        """Ensure temperature is in valid range"""
        if v is not None and not (0.0 <= float(v) <= 2.0):
            raise ValueError("Temperature must be between 0.0 and 2.0")
        return v


class AgentInDB(AgentBase):
    """Schema for agent in database"""

    id: UUID4
    workflow_id: UUID4
    user_id: UUID4
    node_id: str
    system_prompt: Optional[str]
    model: Optional[str]
    temperature: Optional[Decimal]
    max_tokens: Optional[int]
    tools: List[str]
    permissions: Dict[str, Any]
    memory_config: Dict[str, Any]
    sub_agents: List[UUID4]
    metadata: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AgentResponse(BaseModel):
    """Schema for agent response"""

    id: UUID4
    workflow_id: UUID4
    user_id: UUID4
    node_id: str
    name: str
    type: str
    system_prompt: Optional[str]
    model: Optional[str]
    temperature: Optional[float]
    max_tokens: Optional[int]
    tools: List[str]
    permissions: Dict[str, Any]
    memory_config: Dict[str, Any]
    sub_agents: List[str]
    metadata: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AgentListResponse(BaseModel):
    """Schema for paginated agent list"""

    items: List[AgentResponse]
    total: int
    limit: int
    offset: int


class AgentSummary(BaseModel):
    """Schema for agent summary (list view)"""

    id: UUID4
    name: str
    type: str
    model: Optional[str]
    tool_count: int
    created_at: datetime


class AgentTestRequest(BaseModel):
    """Schema for testing agent"""

    input_data: Dict[str, Any] = Field(default_factory=dict)
    context: Optional[Dict[str, Any]] = None


class AgentTestResponse(BaseModel):
    """Schema for agent test response"""

    success: bool
    output: Optional[Dict[str, Any]]
    error: Optional[str]
    execution_time_ms: int


class AgentPermissions(BaseModel):
    """Schema for agent permissions"""

    mode: str = Field(pattern="^(whitelist|blacklist)$")
    allowedTools: List[str] = Field(default_factory=list)
    disallowedTools: List[str] = Field(default_factory=list)


class AgentMemoryConfig(BaseModel):
    """Schema for agent memory configuration"""

    enabled: bool = True
    contextWindow: int = Field(default=10, ge=1, le=100)
    persistentMemory: bool = False
