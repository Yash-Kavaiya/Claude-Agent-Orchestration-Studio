"""
Integration tests for authentication API endpoints
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.otp_code import OTPCode


@pytest.mark.integration
@pytest.mark.asyncio
async def test_request_otp_success(client: AsyncClient):
    """Test successful OTP request"""
    response = await client.post(
        "/api/v1/auth/request-otp",
        json={"email": "test@example.com", "purpose": "login"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "message" in data
    assert data["expires_in"] > 0


@pytest.mark.integration
@pytest.mark.asyncio
async def test_request_otp_invalid_email(client: AsyncClient):
    """Test OTP request with invalid email"""
    response = await client.post(
        "/api/v1/auth/request-otp",
        json={"email": "invalid-email", "purpose": "login"},
    )

    assert response.status_code == 422  # Validation error


@pytest.mark.integration
@pytest.mark.asyncio
async def test_request_otp_invalid_purpose(client: AsyncClient):
    """Test OTP request with invalid purpose"""
    response = await client.post(
        "/api/v1/auth/request-otp",
        json={"email": "test@example.com", "purpose": "invalid"},
    )

    assert response.status_code == 422  # Validation error


@pytest.mark.integration
@pytest.mark.asyncio
async def test_verify_otp_new_user(client: AsyncClient, db_session: AsyncSession):
    """Test OTP verification for new user (signup flow)"""
    email = "newuser@example.com"

    # Create OTP in database
    from datetime import datetime, timedelta
    from app.utils.otp import generate_otp

    otp_code = generate_otp()
    otp = OTPCode(
        email=email,
        code=otp_code,
        purpose="login",
        expires_at=datetime.utcnow() + timedelta(minutes=5),
    )
    db_session.add(otp)
    await db_session.commit()

    # Verify OTP
    response = await client.post(
        "/api/v1/auth/verify-otp",
        json={"email": email, "code": otp_code},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert "user" in data
    assert data["user"]["email"] == email


@pytest.mark.integration
@pytest.mark.asyncio
async def test_verify_otp_existing_user(client: AsyncClient, db_session: AsyncSession):
    """Test OTP verification for existing user"""
    email = "existing@example.com"

    # Create user
    user = User(email=email, is_active=True)
    db_session.add(user)
    await db_session.flush()

    # Create OTP
    from datetime import datetime, timedelta
    from app.utils.otp import generate_otp

    otp_code = generate_otp()
    otp = OTPCode(
        email=email,
        code=otp_code,
        purpose="login",
        expires_at=datetime.utcnow() + timedelta(minutes=5),
    )
    db_session.add(otp)
    await db_session.commit()

    # Verify OTP
    response = await client.post(
        "/api/v1/auth/verify-otp",
        json={"email": email, "code": otp_code},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == email


@pytest.mark.integration
@pytest.mark.asyncio
async def test_verify_otp_invalid_code(client: AsyncClient, db_session: AsyncSession):
    """Test OTP verification with invalid code"""
    response = await client.post(
        "/api/v1/auth/verify-otp",
        json={"email": "test@example.com", "code": "999999"},
    )

    assert response.status_code == 401
    data = response.json()
    assert "detail" in data


@pytest.mark.integration
@pytest.mark.asyncio
async def test_verify_otp_expired(client: AsyncClient, db_session: AsyncSession):
    """Test OTP verification with expired code"""
    email = "test@example.com"

    # Create expired OTP
    from datetime import datetime, timedelta
    from app.utils.otp import generate_otp

    otp_code = generate_otp()
    otp = OTPCode(
        email=email,
        code=otp_code,
        purpose="login",
        expires_at=datetime.utcnow() - timedelta(minutes=1),  # Expired
    )
    db_session.add(otp)
    await db_session.commit()

    # Try to verify
    response = await client.post(
        "/api/v1/auth/verify-otp",
        json={"email": email, "code": otp_code},
    )

    assert response.status_code == 401


@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient, db_session: AsyncSession):
    """Test getting current user info"""
    email = "currentuser@example.com"

    # Create user and session
    user = User(email=email, is_active=True, full_name="Test User")
    db_session.add(user)
    await db_session.flush()

    # Create tokens
    from app.core.security import create_access_token, hash_token
    from app.models.session import Session
    from datetime import datetime, timedelta

    token_data = {"sub": str(user.id), "email": user.email}
    access_token = create_access_token(token_data)

    session = Session(
        user_id=user.id,
        token_hash=hash_token(access_token),
        expires_at=datetime.utcnow() + timedelta(hours=1),
        last_activity_at=datetime.utcnow(),
    )
    db_session.add(session)
    await db_session.commit()

    # Get current user
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == email
    assert data["full_name"] == "Test User"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_current_user_no_token(client: AsyncClient):
    """Test getting current user without token"""
    response = await client.get("/api/v1/auth/me")

    assert response.status_code == 403  # No credentials


@pytest.mark.integration
@pytest.mark.asyncio
async def test_update_current_user(client: AsyncClient, db_session: AsyncSession):
    """Test updating current user info"""
    email = "updateuser@example.com"

    # Create user and session
    user = User(email=email, is_active=True)
    db_session.add(user)
    await db_session.flush()

    # Create tokens
    from app.core.security import create_access_token, hash_token
    from app.models.session import Session
    from datetime import datetime, timedelta

    token_data = {"sub": str(user.id), "email": user.email}
    access_token = create_access_token(token_data)

    session = Session(
        user_id=user.id,
        token_hash=hash_token(access_token),
        expires_at=datetime.utcnow() + timedelta(hours=1),
        last_activity_at=datetime.utcnow(),
    )
    db_session.add(session)
    await db_session.commit()

    # Update user
    response = await client.patch(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
        json={"full_name": "Updated Name", "avatar_url": "https://example.com/avatar.jpg"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Name"
    assert data["avatar_url"] == "https://example.com/avatar.jpg"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_logout(client: AsyncClient, db_session: AsyncSession):
    """Test user logout"""
    email = "logoutuser@example.com"

    # Create user and session
    user = User(email=email, is_active=True)
    db_session.add(user)
    await db_session.flush()

    # Create tokens
    from app.core.security import create_access_token, hash_token
    from app.models.session import Session
    from datetime import datetime, timedelta

    token_data = {"sub": str(user.id), "email": user.email}
    access_token = create_access_token(token_data)

    session = Session(
        user_id=user.id,
        token_hash=hash_token(access_token),
        expires_at=datetime.utcnow() + timedelta(hours=1),
        last_activity_at=datetime.utcnow(),
    )
    db_session.add(session)
    await db_session.commit()

    # Logout
    response = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert response.status_code == 204

    # Try to use token again (should fail)
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert response.status_code == 401


@pytest.mark.integration
@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, db_session: AsyncSession):
    """Test token refresh"""
    email = "refreshuser@example.com"

    # Create user
    user = User(email=email, is_active=True)
    db_session.add(user)
    await db_session.flush()

    # Create tokens
    from app.core.security import create_access_token, create_refresh_token, hash_token
    from app.models.session import Session
    from datetime import datetime, timedelta

    token_data = {"sub": str(user.id), "email": user.email}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    session = Session(
        user_id=user.id,
        token_hash=hash_token(access_token),
        refresh_token_hash=hash_token(refresh_token),
        expires_at=datetime.utcnow() + timedelta(days=7),
        last_activity_at=datetime.utcnow(),
    )
    db_session.add(session)
    await db_session.commit()

    # Refresh token
    response = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["access_token"] != access_token  # Should be new token
