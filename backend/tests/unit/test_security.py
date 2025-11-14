"""
Unit tests for security utilities
"""
import pytest
from datetime import timedelta
from jose import jwt, JWTError

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    hash_token,
    verify_token_hash,
)
from app.config import settings


@pytest.mark.unit
def test_hash_password():
    """Test password hashing"""
    password = "test_password_123"
    hashed = hash_password(password)

    assert hashed != password
    assert len(hashed) > 0
    assert hashed.startswith("$argon2")


@pytest.mark.unit
def test_verify_password():
    """Test password verification"""
    password = "test_password_123"
    hashed = hash_password(password)

    # Correct password
    assert verify_password(password, hashed) is True

    # Wrong password
    assert verify_password("wrong_password", hashed) is False


@pytest.mark.unit
def test_create_access_token():
    """Test access token creation"""
    data = {"sub": "test-user-id", "email": "test@example.com"}
    token = create_access_token(data)

    assert isinstance(token, str)
    assert len(token) > 0

    # Decode and verify
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    assert payload["sub"] == "test-user-id"
    assert payload["email"] == "test@example.com"
    assert payload["type"] == "access"
    assert "exp" in payload
    assert "iat" in payload


@pytest.mark.unit
def test_create_refresh_token():
    """Test refresh token creation"""
    data = {"sub": "test-user-id"}
    token = create_refresh_token(data)

    assert isinstance(token, str)
    assert len(token) > 0

    # Decode and verify
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    assert payload["sub"] == "test-user-id"
    assert payload["type"] == "refresh"


@pytest.mark.unit
def test_decode_access_token():
    """Test access token decoding"""
    data = {"sub": "test-user-id", "email": "test@example.com"}
    token = create_access_token(data)

    payload = decode_access_token(token)
    assert payload["sub"] == "test-user-id"
    assert payload["email"] == "test@example.com"
    assert payload["type"] == "access"


@pytest.mark.unit
def test_decode_refresh_token():
    """Test refresh token decoding"""
    data = {"sub": "test-user-id"}
    token = create_refresh_token(data)

    payload = decode_refresh_token(token)
    assert payload["sub"] == "test-user-id"
    assert payload["type"] == "refresh"


@pytest.mark.unit
def test_decode_invalid_token():
    """Test decoding invalid token"""
    with pytest.raises(JWTError):
        decode_access_token("invalid_token")


@pytest.mark.unit
def test_decode_wrong_token_type():
    """Test decoding token with wrong type"""
    # Create refresh token but try to decode as access token
    data = {"sub": "test-user-id"}
    refresh_token = create_refresh_token(data)

    with pytest.raises(JWTError):
        decode_access_token(refresh_token)


@pytest.mark.unit
def test_hash_token():
    """Test token hashing"""
    token = "test_token_12345"
    hashed = hash_token(token)

    assert isinstance(hashed, str)
    assert len(hashed) == 64  # SHA-256 produces 64 hex characters
    assert hashed != token


@pytest.mark.unit
def test_verify_token_hash():
    """Test token hash verification"""
    token = "test_token_12345"
    hashed = hash_token(token)

    # Correct token
    assert verify_token_hash(token, hashed) is True

    # Wrong token
    assert verify_token_hash("wrong_token", hashed) is False


@pytest.mark.unit
def test_custom_expiry():
    """Test custom token expiry"""
    data = {"sub": "test-user-id"}
    custom_expiry = timedelta(hours=2)

    token = create_access_token(data, expires_delta=custom_expiry)
    payload = decode_access_token(token)

    # Token should be valid
    assert payload["sub"] == "test-user-id"
