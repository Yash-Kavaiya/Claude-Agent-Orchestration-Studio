"""
Request Logger Middleware
Logs all HTTP requests and responses
"""
import time
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from loguru import logger

from app.config import settings


class RequestLoggerMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all HTTP requests and responses
    Includes timing information
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Start timer
        start_time = time.time()

        # Get request info
        method = request.method
        path = request.url.path
        client_ip = request.client.host if request.client else "unknown"

        # Process request
        response = await call_next(request)

        # Calculate duration
        duration = time.time() - start_time
        duration_ms = round(duration * 1000, 2)

        # Log request
        log_message = (
            f"{method} {path} - "
            f"Status: {response.status_code} - "
            f"Duration: {duration_ms}ms - "
            f"Client: {client_ip}"
        )

        if response.status_code >= 500:
            logger.error(log_message)
        elif response.status_code >= 400:
            logger.warning(log_message)
        else:
            # Only log successful requests in debug mode to reduce noise
            if settings.DEBUG:
                logger.info(log_message)

        # Add timing header
        response.headers["X-Process-Time"] = str(duration_ms)

        return response
