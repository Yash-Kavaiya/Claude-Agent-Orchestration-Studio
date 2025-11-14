"""
Dependency Injection
FastAPI dependencies for authentication, database sessions, etc.
"""
from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db.session import async_session_maker
from app.services.auth_service import AuthService


# Security scheme
security = HTTPBearer()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Database session dependency
    Provides a database session for each request
    """
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current authenticated user from JWT token
    """
    try:
        token = credentials.credentials
        auth_service = AuthService(db)

        user = await auth_service.get_user_from_token(token)

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is inactive",
            )

        return user

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_active_user(
    current_user = Depends(get_current_user),
):
    """
    Get current active user
    Ensures user is active
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )
    return current_user


async def get_optional_user(
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Get current user if authenticated, otherwise None
    Useful for endpoints that work with or without authentication
    """
    if not authorization:
        return None

    try:
        token = authorization.replace("Bearer ", "")
        auth_service = AuthService(db)
        user = await auth_service.get_user_from_token(token)
        return user if user and user.is_active else None
    except Exception:
        return None


# Rate limiting dependency
class RateLimiter:
    """
    Simple rate limiter dependency
    """

    def __init__(self, times: int = 10, seconds: int = 60):
        self.times = times
        self.seconds = seconds

    async def __call__(self, request):
        # TODO: Implement using Redis
        # For now, just pass through
        pass


# Permission checkers
def require_role(required_role: str):
    """
    Dependency to check if user has required role
    Usage: dependencies=[Depends(require_role("administrator"))]
    """

    async def role_checker(current_user = Depends(get_current_user)):
        # TODO: Implement role checking
        # if current_user.role != required_role:
        #     raise HTTPException(
        #         status_code=status.HTTP_403_FORBIDDEN,
        #         detail=f"Required role: {required_role}",
        #     )
        return current_user

    return role_checker


def require_permission(permission: str):
    """
    Dependency to check if user has required permission
    Usage: dependencies=[Depends(require_permission("workflow:write"))]
    """

    async def permission_checker(current_user = Depends(get_current_user)):
        # TODO: Implement permission checking
        # if not has_permission(current_user, permission):
        #     raise HTTPException(
        #         status_code=status.HTTP_403_FORBIDDEN,
        #         detail=f"Required permission: {permission}",
        #     )
        return current_user

    return permission_checker
