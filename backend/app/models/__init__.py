"""
Database Models
Import all models here for Alembic to detect
"""
from app.models.user import User
from app.models.otp_code import OTPCode
from app.models.session import Session

__all__ = ["User", "OTPCode", "Session"]
