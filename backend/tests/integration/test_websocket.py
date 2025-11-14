"""
Integration tests for WebSocket connections
"""
import pytest
import asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.core.security import create_access_token, hash_token
from app.models.session import Session
from datetime import datetime, timedelta
from app.core.websocket import manager


async def create_test_user_with_token(db_session: AsyncSession) -> tuple[User, str]:
    """Helper to create a test user with valid token"""
    user = User(email="websocket_test@example.com", is_active=True)
    db_session.add(user)
    await db_session.flush()

    # Create token
    token_data = {"sub": str(user.id), "email": user.email}
    access_token = create_access_token(token_data)

    # Create session
    session = Session(
        user_id=user.id,
        token_hash=hash_token(access_token),
        expires_at=datetime.utcnow() + timedelta(hours=1),
        last_activity_at=datetime.utcnow(),
    )
    db_session.add(session)
    await db_session.commit()

    return user, access_token


@pytest.mark.integration
@pytest.mark.asyncio
async def test_websocket_manager_connection():
    """Test WebSocket manager connection handling"""
    from fastapi import WebSocket

    # Test that manager exists and has correct initial state
    assert manager.get_connection_count() == 0

    # Note: Full WebSocket testing requires a running server
    # These tests verify the manager's state management


@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_websocket_stats(client: AsyncClient, db_session: AsyncSession):
    """Test getting WebSocket statistics endpoint"""
    user, token = await create_test_user_with_token(db_session)

    response = await client.get(
        "/api/v1/ws/stats",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "total_connections" in data
    assert "user_connections" in data
    assert "active_rooms" in data
    assert data["total_connections"] >= 0


@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_active_rooms(client: AsyncClient, db_session: AsyncSession):
    """Test getting active rooms endpoint"""
    user, token = await create_test_user_with_token(db_session)

    response = await client.get(
        "/api/v1/ws/rooms",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "active_rooms" in data
    assert "total_rooms" in data
    assert isinstance(data["active_rooms"], list)


@pytest.mark.unit
def test_websocket_manager_state():
    """Test WebSocket manager state management"""
    # Test connection count
    count = manager.get_connection_count()
    assert isinstance(count, int)
    assert count >= 0

    # Test active rooms
    rooms = manager.get_active_rooms()
    assert isinstance(rooms, list)


@pytest.mark.unit
def test_websocket_room_id_formats():
    """Test WebSocket room ID format validation"""
    # Valid room ID formats
    valid_room_ids = [
        "execution:123e4567-e89b-12d3-a456-426614174000",
        "workflow:123e4567-e89b-12d3-a456-426614174000",
        "user:123e4567-e89b-12d3-a456-426614174000",
    ]

    for room_id in valid_room_ids:
        parts = room_id.split(":", 1)
        assert len(parts) == 2
        assert parts[0] in ["execution", "workflow", "user"]
