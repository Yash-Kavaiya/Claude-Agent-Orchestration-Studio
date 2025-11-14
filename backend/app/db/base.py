"""
SQLAlchemy Base Model
Provides common fields and utilities for all models
"""
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy models
    Provides type annotations and common utilities
    """

    pass


class TimestampMixin:
    """
    Mixin that adds created_at and updated_at timestamp fields
    """

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class UUIDMixin:
    """
    Mixin that adds UUID primary key
    """

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        nullable=False,
    )


class BaseModel(Base, UUIDMixin, TimestampMixin):
    """
    Base model with UUID primary key and timestamps
    Most models should inherit from this
    """

    __abstract__ = True

    def dict(self) -> dict[str, Any]:
        """
        Convert model to dictionary
        """
        return {
            column.name: getattr(self, column.name)
            for column in self.__table__.columns
        }

    def __repr__(self) -> str:
        """
        String representation of model
        """
        attrs = ", ".join(
            f"{k}={v!r}"
            for k, v in self.dict().items()
            if not k.startswith("_")
        )
        return f"{self.__class__.__name__}({attrs})"
