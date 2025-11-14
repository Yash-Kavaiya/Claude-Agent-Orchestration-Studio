"""
Application Configuration
Manages all environment variables and settings
"""
from typing import List, Optional
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Application Settings
    APP_NAME: str = "Claude Agent Orchestration Studio"
    APP_ENV: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # API Settings
    API_V1_PREFIX: str = "/api/v1"

    # Database Settings
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/claude_orchestration"
    DATABASE_POOL_SIZE: int = 50
    DATABASE_MAX_OVERFLOW: int = 10
    DATABASE_ECHO: bool = False

    # Redis Settings
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_POOL_SIZE: int = 50

    # Security Settings
    SECRET_KEY: str = "your-secret-key-change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS Settings
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    OTP_RATE_LIMIT: int = 5  # 5 OTP requests per 15 minutes
    OTP_RATE_LIMIT_WINDOW: int = 900  # 15 minutes in seconds

    # OTP Settings
    OTP_LENGTH: int = 6
    OTP_EXPIRY_MINUTES: int = 5

    # AI Service Settings
    CLAUDE_API_KEY: Optional[str] = None
    DEFAULT_AI_MODEL: str = "claude-3-5-sonnet-20241022"
    MAX_TOKENS: int = 4096
    DEFAULT_TEMPERATURE: float = 0.7

    # Email Settings
    EMAIL_PROVIDER: str = "sendgrid"  # sendgrid, ses, smtp
    SENDGRID_API_KEY: Optional[str] = None
    EMAIL_FROM: str = "noreply@claude-orchestration.com"
    EMAIL_FROM_NAME: str = "Claude Orchestration Studio"

    # SMTP Settings (if using SMTP provider)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_TLS: bool = True

    # File Storage Settings
    STORAGE_PROVIDER: str = "s3"  # s3, minio, local
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    S3_BUCKET: Optional[str] = None
    S3_REGION: str = "us-east-1"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_FILE_EXTENSIONS: List[str] = [
        ".pdf",
        ".txt",
        ".json",
        ".csv",
        ".md",
        ".py",
        ".js",
        ".ts",
    ]

    # Web Integration Settings
    JINA_SERP_API_KEY: Optional[str] = None
    JINA_READER_API_KEY: Optional[str] = None

    # Image Generation Settings
    OPENAI_API_KEY: Optional[str] = None  # For DALL-E
    STABILITY_API_KEY: Optional[str] = None  # For Stable Diffusion

    # Monitoring Settings
    SENTRY_DSN: Optional[str] = None
    PROMETHEUS_PORT: int = 9090

    # Celery Settings
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    CELERY_TASK_TRACK_STARTED: bool = True
    CELERY_TASK_TIME_LIMIT: int = 3600  # 1 hour

    # Development Mode Settings
    DEV_MODE: bool = False  # Enables development shortcuts (bypass OTP, etc.)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )


# Create global settings instance
settings = Settings()


# Helper functions
def is_production() -> bool:
    """Check if running in production environment"""
    return settings.APP_ENV == "production"


def is_development() -> bool:
    """Check if running in development environment"""
    return settings.APP_ENV == "development"


def is_staging() -> bool:
    """Check if running in staging environment"""
    return settings.APP_ENV == "staging"
