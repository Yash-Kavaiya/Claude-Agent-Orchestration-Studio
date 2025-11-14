"""
Authentication Pydantic Schemas
Request/response models for authentication operations
"""
from pydantic import BaseModel, EmailStr, Field, validator


class OTPRequest(BaseModel):
    """Schema for requesting an OTP code"""

    email: EmailStr
    purpose: str = Field(default="login", pattern="^(login|signup|reset)$")

    @validator("email")
    def normalize_email(cls, v):
        """Normalize email to lowercase"""
        return v.lower().strip()


class OTPVerify(BaseModel):
    """Schema for verifying an OTP code"""

    email: EmailStr
    code: str = Field(min_length=6, max_length=6, pattern="^[0-9]{6}$")

    @validator("email")
    def normalize_email(cls, v):
        """Normalize email to lowercase"""
        return v.lower().strip()

    @validator("code")
    def validate_code(cls, v):
        """Validate code is 6 digits"""
        if not v.isdigit():
            raise ValueError("Code must contain only digits")
        return v


class TokenResponse(BaseModel):
    """Schema for token response"""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: dict


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request"""

    refresh_token: str


class OTPResponse(BaseModel):
    """Schema for OTP request response"""

    success: bool
    message: str
    expires_in: int  # seconds


class LogoutRequest(BaseModel):
    """Schema for logout request"""

    # Can be extended with additional fields if needed
    pass


class PasswordChange(BaseModel):
    """Schema for password change request"""

    current_password: str
    new_password: str = Field(min_length=8)


class PasswordReset(BaseModel):
    """Schema for password reset request"""

    email: EmailStr
    code: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=8)
