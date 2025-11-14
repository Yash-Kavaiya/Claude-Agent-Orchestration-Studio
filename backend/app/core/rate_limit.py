"""
Rate Limiting
Implement rate limiting for API endpoints
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request

from app.config import settings


def get_client_identifier(request: Request) -> str:
    """
    Get client identifier for rate limiting
    Uses user ID if authenticated, otherwise IP address
    """
    # Try to get user ID from request state (set by auth middleware)
    if hasattr(request.state, "user_id"):
        return f"user:{request.state.user_id}"

    # Fall back to IP address
    return get_remote_address(request)


# Create limiter instance
limiter = Limiter(
    key_func=get_client_identifier,
    default_limits=[f"{settings.RATE_LIMIT_PER_MINUTE}/minute"],
    storage_uri=settings.REDIS_URL,
)


# Rate limit decorators for specific endpoints
def otp_rate_limit():
    """Rate limit for OTP requests"""
    return limiter.limit(f"{settings.OTP_RATE_LIMIT}/{settings.OTP_RATE_LIMIT_WINDOW}seconds")


def auth_rate_limit():
    """Rate limit for authentication endpoints"""
    return limiter.limit("10/15minutes")


def api_rate_limit():
    """Standard rate limit for API endpoints"""
    return limiter.limit("1000/hour")


def ai_tool_rate_limit():
    """Rate limit for AI tool endpoints"""
    return limiter.limit("100/hour")
