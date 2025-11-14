"""
Workflow Model
Represents AI agent workflows and their definitions
"""
from typing import Optional, List, Dict, Any
import uuid
from sqlalchemy import String, Boolean, Integer, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY

from app.db.base import BaseModel


class Workflow(BaseModel):
    """
    Workflow model for storing agent workflows
    """

    __tablename__ = "workflows"

    # User relationship
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        nullable=False,
        index=True,
    )

    # Basic Information
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Status
    status: Mapped[str] = mapped_column(
        String(50), default="draft", nullable=False, index=True
    )  # draft, published, archived

    # Workflow Definition (stored as JSON)
    nodes: Mapped[List[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=False, default=list
    )
    connections: Mapped[List[Dict[str, Any]]] = mapped_column(
        JSONB, nullable=False, default=list
    )
    settings: Mapped[Dict[str, Any]] = mapped_column(
        JSONB, nullable=False, default=dict
    )

    # Organization
    tags: Mapped[List[str]] = mapped_column(
        ARRAY(String), nullable=False, default=list
    )

    # Visibility
    is_public: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Versioning
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    parent_workflow_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    # Indexes for performance
    __table_args__ = (
        Index("idx_workflow_user", "user_id"),
        Index("idx_workflow_status", "status"),
        Index("idx_workflow_tags", "tags", postgresql_using="gin"),
        Index("idx_workflow_nodes", "nodes", postgresql_using="gin"),
    )

    def __repr__(self) -> str:
        return f"<Workflow {self.name} ({self.status})>"

    def to_dict(self) -> dict:
        """Convert workflow to dictionary"""
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "name": self.name,
            "description": self.description,
            "status": self.status,
            "nodes": self.nodes,
            "connections": self.connections,
            "settings": self.settings,
            "tags": self.tags,
            "is_public": self.is_public,
            "version": self.version,
            "parent_workflow_id": str(self.parent_workflow_id) if self.parent_workflow_id else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

    def validate_structure(self) -> tuple[bool, Optional[str]]:
        """
        Validate workflow structure
        Returns: (is_valid, error_message)
        """
        # Check nodes
        if not isinstance(self.nodes, list):
            return False, "Nodes must be a list"

        # Check connections
        if not isinstance(self.connections, list):
            return False, "Connections must be a list"

        # Validate node IDs are unique
        node_ids = [node.get("id") for node in self.nodes if isinstance(node, dict)]
        if len(node_ids) != len(set(node_ids)):
            return False, "Duplicate node IDs found"

        # Validate connections reference existing nodes
        for conn in self.connections:
            if not isinstance(conn, dict):
                continue

            source = conn.get("source")
            target = conn.get("target")

            if source not in node_ids:
                return False, f"Connection source '{source}' not found in nodes"
            if target not in node_ids:
                return False, f"Connection target '{target}' not found in nodes"

        return True, None

    def count_nodes(self) -> int:
        """Count nodes in workflow"""
        return len(self.nodes) if self.nodes else 0

    def count_connections(self) -> int:
        """Count connections in workflow"""
        return len(self.connections) if self.connections else 0

    def get_node_by_id(self, node_id: str) -> Optional[dict]:
        """Get node by ID"""
        if not self.nodes:
            return None

        for node in self.nodes:
            if isinstance(node, dict) and node.get("id") == node_id:
                return node

        return None
