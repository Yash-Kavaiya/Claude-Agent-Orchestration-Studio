"""
FastAPI Application Entry Point
Claude Agent Orchestration Studio Backend
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.middleware.error_handler import ErrorHandlerMiddleware
from app.middleware.request_logger import RequestLoggerMiddleware
from app.core.logging import setup_logging
from app.core.rate_limit import limiter
from app.api.v1 import auth as auth_router


# Setup logging
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager
    Handles startup and shutdown events
    """
    # Startup
    print("🚀 Starting Claude Agent Orchestration Studio Backend...")
    print(f"Environment: {settings.APP_ENV}")
    print(f"Debug Mode: {settings.DEBUG}")

    # Initialize database connection pool
    # Initialize Redis connection pool
    # Start background tasks if needed

    yield

    # Shutdown
    print("👋 Shutting down gracefully...")
    # Close database connections
    # Close Redis connections
    # Cleanup resources


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="Production-grade backend for AI agent orchestration and workflow automation",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
    lifespan=lifespan,
)


# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Custom Middleware
app.add_middleware(ErrorHandlerMiddleware)
app.add_middleware(RequestLoggerMiddleware)


# Rate Limiter
app.state.limiter = limiter


# API Routes
app.include_router(auth_router.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["Authentication"])


# Health Check Endpoints
@app.get("/health", tags=["Health"])
async def health_check():
    """Basic health check endpoint"""
    return {"status": "healthy", "service": "fastapi-backend"}


@app.get("/health/ready", tags=["Health"])
async def readiness_check():
    """Readiness check - verifies all dependencies are available"""
    # TODO: Add checks for database, redis, etc.
    return {"status": "ready", "dependencies": {"database": "ok", "redis": "ok"}}


# Root Endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint"""
    return {
        "message": "Claude Agent Orchestration Studio API",
        "version": "1.0.0",
        "docs": "/docs" if settings.DEBUG else "Documentation disabled in production",
    }


# API Routes - Will be added as we build them
# from app.api.v1 import auth, workflows, agents, execution, analytics, collaboration, mcp, tools, websocket
# app.include_router(auth.router, prefix=f"{settings.API_V1_PREFIX}/auth", tags=["Authentication"])
# app.include_router(workflows.router, prefix=f"{settings.API_V1_PREFIX}/workflows", tags=["Workflows"])
# app.include_router(agents.router, prefix=f"{settings.API_V1_PREFIX}/agents", tags=["Agents"])
# app.include_router(execution.router, prefix=f"{settings.API_V1_PREFIX}/executions", tags=["Execution"])
# app.include_router(analytics.router, prefix=f"{settings.API_V1_PREFIX}/analytics", tags=["Analytics"])
# app.include_router(collaboration.router, prefix=f"{settings.API_V1_PREFIX}/collaboration", tags=["Collaboration"])
# app.include_router(mcp.router, prefix=f"{settings.API_V1_PREFIX}/mcp", tags=["MCP"])
# app.include_router(tools.router, prefix=f"{settings.API_V1_PREFIX}/tools", tags=["Tools"])
# app.include_router(websocket.router, prefix=f"{settings.API_V1_PREFIX}/ws", tags=["WebSocket"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info" if not settings.DEBUG else "debug",
    )
