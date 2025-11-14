"""
Authentication API Endpoints
Handles user authentication, OTP verification, and token management
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_user
from app.services.auth_service import AuthService
from app.schemas.auth import (
    OTPRequest,
    OTPVerify,
    OTPResponse,
    TokenResponse,
    RefreshTokenRequest,
)
from app.schemas.user import UserResponse, UserUpdate
from app.core.rate_limit import otp_rate_limit, auth_rate_limit, limiter
from app.models.user import User
from app.config import settings

router = APIRouter()


def get_client_info(request: Request) -> tuple:
    """Extract client IP and user agent from request"""
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    return ip_address, user_agent


@router.post("/request-otp", response_model=OTPResponse, status_code=status.HTTP_200_OK)
@limiter.limit("5/15minutes")
async def request_otp(
    request: Request,
    otp_request: OTPRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Request an OTP code for authentication

    Rate limit: 5 requests per 15 minutes per IP/user

    Args:
        otp_request: OTP request with email and purpose

    Returns:
        OTPResponse with success status and expiry time
    """
    auth_service = AuthService(db)
    ip_address, user_agent = get_client_info(request)

    success, message = await auth_service.request_otp(
        email=otp_request.email,
        purpose=otp_request.purpose,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS
            if "too many" in message.lower()
            else status.HTTP_400_BAD_REQUEST,
            detail=message,
        )

    return OTPResponse(
        success=True,
        message=message,
        expires_in=settings.OTP_EXPIRY_MINUTES * 60,
    )


@router.post("/verify-otp", response_model=TokenResponse, status_code=status.HTTP_200_OK)
@limiter.limit("10/15minutes")
async def verify_otp(
    request: Request,
    otp_verify: OTPVerify,
    db: AsyncSession = Depends(get_db),
):
    """
    Verify OTP code and authenticate user

    Rate limit: 10 requests per 15 minutes per IP/user

    Args:
        otp_verify: OTP verification with email and code

    Returns:
        TokenResponse with access token, refresh token, and user info
    """
    auth_service = AuthService(db)
    ip_address, user_agent = get_client_info(request)

    success, tokens, error = await auth_service.verify_otp(
        email=otp_verify.email,
        code=otp_verify.code,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error or "Invalid OTP code",
        )

    return TokenResponse(**tokens)


@router.post("/refresh", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def refresh_token(
    request: Request,
    refresh_request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Refresh access token using refresh token

    Args:
        refresh_request: Refresh token request

    Returns:
        TokenResponse with new access token and refresh token
    """
    auth_service = AuthService(db)
    ip_address, user_agent = get_client_info(request)

    success, tokens, error = await auth_service.refresh_access_token(
        refresh_token=refresh_request.refresh_token,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=error or "Invalid refresh token",
        )

    return TokenResponse(**tokens)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Logout user by invalidating session

    Requires authentication

    Returns:
        204 No Content on success
    """
    # Extract token from Authorization header
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header",
        )

    token = auth_header.replace("Bearer ", "")

    auth_service = AuthService(db)
    success = await auth_service.logout(token)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Logout failed",
        )

    return None


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    """
    Get current authenticated user information

    Requires authentication

    Returns:
        UserResponse with user details
    """
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update current authenticated user information

    Requires authentication

    Args:
        user_update: User update data

    Returns:
        UserResponse with updated user details
    """
    # Update user fields
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.avatar_url is not None:
        current_user.avatar_url = user_update.avatar_url

    await db.commit()
    await db.refresh(current_user)

    return UserResponse.model_validate(current_user)
