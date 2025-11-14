"""
Global Error Handler Middleware
Catches and formats all exceptions
"""
import traceback
from typing import Callable
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from loguru import logger

from app.config import settings


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """
    Global error handler middleware
    Catches all unhandled exceptions and returns formatted JSON responses
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        try:
            return await call_next(request)

        except Exception as exc:
            # Log the error
            logger.error(
                f"Unhandled exception: {exc}\n"
                f"Path: {request.method} {request.url.path}\n"
                f"Traceback: {traceback.format_exc()}"
            )

            # Determine status code
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR

            # Build error response
            error_response = {
                "error": {
                    "type": type(exc).__name__,
                    "message": str(exc),
                }
            }

            # Include traceback in development mode
            if settings.DEBUG:
                error_response["error"]["traceback"] = traceback.format_exc()

            return JSONResponse(
                status_code=status_code,
                content=error_response,
            )
