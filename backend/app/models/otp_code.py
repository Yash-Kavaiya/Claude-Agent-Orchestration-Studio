"""
OTP Code Model
Stores one-time password codes for email verification
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import BaseModel


class OTPCode(BaseModel):
    """
    OTP Code model for email verification
    """

    __tablename__ = "otp_codes"

    # OTP Information
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    code: Mapped[str] = mapped_column(String(6), nullable=False)
    purpose: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # 'login', 'signup', 'reset'

    # Expiration
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), index=True, nullable=False
    )

    # Usage Tracking
    used_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Audit Fields
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Indexes for performance
    __table_args__ = (
        Index("idx_otp_email_purpose", "email", "purpose"),
        Index("idx_otp_expires", "expires_at"),
    )

    def __repr__(self) -> str:
        return f"<OTPCode {self.email} {self.purpose}>"

    def is_expired(self) -> bool:
        """Check if OTP code is expired"""
        return datetime.utcnow() > self.expires_at

    def is_used(self) -> bool:
        """Check if OTP code has been used"""
        return self.used_at is not None
