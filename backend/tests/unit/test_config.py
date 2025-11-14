"""
Unit tests for configuration
"""
import pytest
from app.config import settings, is_production, is_development


@pytest.mark.unit
def test_settings_loaded():
    """Test that settings are loaded correctly"""
    assert settings.APP_NAME == "Claude Agent Orchestration Studio"
    assert settings.API_V1_PREFIX == "/api/v1"


@pytest.mark.unit
def test_database_url():
    """Test database URL configuration"""
    assert settings.DATABASE_URL is not None
    assert "postgresql" in settings.DATABASE_URL


@pytest.mark.unit
def test_redis_url():
    """Test Redis URL configuration"""
    assert settings.REDIS_URL is not None
    assert "redis" in settings.REDIS_URL


@pytest.mark.unit
def test_environment_checks():
    """Test environment check functions"""
    # These will depend on the actual environment
    assert isinstance(is_production(), bool)
    assert isinstance(is_development(), bool)


@pytest.mark.unit
def test_cors_origins():
    """Test CORS origins configuration"""
    assert isinstance(settings.CORS_ORIGINS, list)
    assert len(settings.CORS_ORIGINS) > 0


@pytest.mark.unit
def test_jwt_settings():
    """Test JWT configuration"""
    assert settings.SECRET_KEY is not None
    assert settings.JWT_ALGORITHM == "HS256"
    assert settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES > 0
    assert settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS > 0


@pytest.mark.unit
def test_ai_model_settings():
    """Test AI model configuration"""
    assert settings.DEFAULT_AI_MODEL is not None
    assert settings.MAX_TOKENS > 0
    assert 0 <= settings.DEFAULT_TEMPERATURE <= 2


@pytest.mark.unit
def test_rate_limiting_settings():
    """Test rate limiting configuration"""
    assert settings.RATE_LIMIT_PER_MINUTE > 0
    assert settings.OTP_RATE_LIMIT > 0
    assert settings.OTP_RATE_LIMIT_WINDOW > 0
