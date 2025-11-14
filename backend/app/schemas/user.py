"""
User Pydantic Schemas
Request/response models for user-related operations
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, UUID4


class UserBase(BaseModel):
    """Base user schema"""

    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    """Schema for creating a new user"""

    password: Optional[str] = None  # Optional for OTP-only auth


class UserUpdate(BaseModel):
    """Schema for updating user information"""

    full_name: Optional[str] = None
    avatar_url: Optional[str] = None


class UserInDB(UserBase):
    """Schema for user in database (includes all fields)"""

    id: UUID4
    avatar_url: Optional[str] = None
    is_active: bool
    is_verified: bool
    email_verified_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    """Schema for user response (public-facing)"""

    id: UUID4
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    is_verified: bool
    email_verified_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
