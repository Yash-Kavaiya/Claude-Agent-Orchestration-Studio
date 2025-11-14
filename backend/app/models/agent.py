"""
Agent Model
Represents AI agents within workflows
"""
from typing import Optional, List, Dict, Any
import uuid
from sqlalchemy import String, Integer, Text, ForeignKey, DECIMAL, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY

from app.db.base import BaseModel


class Agent(BaseModel):
    """
    Agent model for storing AI agent configurations
    """

    __tablename__ = "agents"

    # Relationships
    workflow_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("workflows.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    # Node reference (from workflow canvas)
    node_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)

    # Basic Information
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )  # agent, trigger, action, logic, integration

    # Agent Configuration
    system_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    model: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    temperature: Mapped[Optional[float]] = mapped_column(
        DECIMAL(3, 2), nullable=True
    )  # 0.00 to 2.00
    max_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Tools & Permissions
    tools: Mapped[List[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list
    )
    permissions: Mapped[Dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict
    )

    # Memory Configuration
    memory_config: Mapped[Dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict
    )

    # Sub-agents
    sub_agents: Mapped[List[uuid.UUID]] = mapped_column(
        ARRAY(UUID(as_uuid=True)), nullable=False, default=list
    )

    # Additional metadata
    metadata: Mapped[Dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict
    )

    # Indexes for performance
    __table_args__ = (
        Index("idx_agent_workflow", "workflow_id"),
        Index("idx_agent_user", "user_id"),
        Index("idx_agent_node", "node_id"),
        Index("idx_agent_type", "type"),
    )

    def __repr__(self) -> str:
        return f"<Agent {self.name} ({self.type})>"

    def to_dict(self) -> dict:
        """Convert agent to dictionary"""
        return {
            "id": str(self.id),
            "workflow_id": str(self.workflow_id),
            "user_id": str(self.user_id),
            "node_id": self.node_id,
            "name": self.name,
            "type": self.type,
            "system_prompt": self.system_prompt,
            "model": self.model,
            "temperature": float(self.temperature) if self.temperature else None,
            "max_tokens": self.max_tokens,
            "tools": self.tools,
            "permissions": self.permissions,
            "memory_config": self.memory_config,
            "sub_agents": [str(sa) for sa in self.sub_agents] if self.sub_agents else [],
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def validate_configuration(self) -> tuple[bool, Optional[str]]:
        """
        Validate agent configuration
        Returns: (is_valid, error_message)
        """
        # Validate temperature range
        if self.temperature is not None:
            if not (0.0 <= float(self.temperature) <= 2.0):
                return False, "Temperature must be between 0.0 and 2.0"

        # Validate max_tokens
        if self.max_tokens is not None:
            if self.max_tokens <= 0:
                return False, "max_tokens must be positive"
            if self.max_tokens > 200000:
                return False, "max_tokens exceeds maximum (200000)"

        # Validate tools is a list
        if not isinstance(self.tools, list):
            return False, "Tools must be a list"

        # Validate permissions is a dict
        if not isinstance(self.permissions, dict):
            return False, "Permissions must be a dictionary"

        # Validate memory_config is a dict
        if not isinstance(self.memory_config, dict):
            return False, "Memory config must be a dictionary"

        return True, None

    def has_tool(self, tool_name: str) -> bool:
        """Check if agent has a specific tool"""
        return tool_name in (self.tools or [])

    def has_permission(self, permission: str) -> bool:
        """Check if agent has a specific permission"""
        if not self.permissions:
            return False

        mode = self.permissions.get("mode", "whitelist")
        allowed = self.permissions.get("allowedTools", [])
        disallowed = self.permissions.get("disallowedTools", [])

        if mode == "whitelist":
            return permission in allowed
        else:  # blacklist
            return permission not in disallowed

    def get_memory_setting(self, key: str, default=None):
        """Get memory configuration setting"""
        if not self.memory_config:
            return default
        return self.memory_config.get(key, default)
