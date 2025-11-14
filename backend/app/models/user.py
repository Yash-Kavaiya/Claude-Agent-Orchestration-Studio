"""
User Model
Represents authenticated users in the system
"""
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import BaseModel


class User(BaseModel):
    """
    User model for authentication and user management
    """

    __tablename__ = "users"

    # Basic Information
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    password_hash: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )  # NULL for OTP-only auth
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Status Fields
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    email_verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    workflow_executions: Mapped[List["WorkflowExecution"]] = relationship(
        "WorkflowExecution",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )
    node_executions: Mapped[List["NodeExecution"]] = relationship(
        "NodeExecution",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="dynamic",
    )

    def __repr__(self) -> str:
        return f"<User {self.email}>"

    def to_dict(self) -> dict:
        """Convert user to dictionary (exclude sensitive fields)"""
        return {
            "id": str(self.id),
            "email": self.email,
            "full_name": self.full_name,
            "avatar_url": self.avatar_url,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "email_verified_at": self.email_verified_at.isoformat() if self.email_verified_at else None,
            "last_login_at": self.last_login_at.isoformat() if self.last_login_at else None,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
