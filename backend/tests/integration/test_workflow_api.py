"""
Integration tests for Workflow API endpoints
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.workflow import Workflow
from app.core.security import create_access_token, hash_token
from app.models.session import Session
from datetime import datetime, timedelta


async def create_test_user_with_token(db_session: AsyncSession) -> tuple[User, str]:
    """Helper to create a test user with valid token"""
    user = User(email="workflow_test@example.com", is_active=True)
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
async def test_create_workflow(client: AsyncClient, db_session: AsyncSession):
    """Test creating a workflow"""
    user, token = await create_test_user_with_token(db_session)

    workflow_data = {
        "name": "Test Workflow",
        "description": "Test Description",
        "nodes": [
            {"id": "node-1", "type": "agent", "position": {"x": 100, "y": 100}, "data": {}}
        ],
        "connections": [],
        "settings": {},
        "tags": ["test"],
        "is_public": False,
    }

    response = await client.post(
        "/api/v1/workflows",
        json=workflow_data,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Workflow"
    assert data["status"] == "draft"
    assert len(data["nodes"]) == 1
    assert data["tags"] == ["test"]


@pytest.mark.integration
@pytest.mark.asyncio
async def test_list_workflows(client: AsyncClient, db_session: AsyncSession):
    """Test listing workflows"""
    user, token = await create_test_user_with_token(db_session)

    # Create test workflows
    workflow1 = Workflow(
        user_id=user.id,
        name="Workflow 1",
        nodes=[],
        connections=[],
        settings={},
        tags=["test"],
    )
    workflow2 = Workflow(
        user_id=user.id,
        name="Workflow 2",
        status="published",
        nodes=[],
        connections=[],
        settings={},
        tags=["production"],
    )
    db_session.add_all([workflow1, workflow2])
    await db_session.commit()

    response = await client.get(
        "/api/v1/workflows",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2


@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_workflow(client: AsyncClient, db_session: AsyncSession):
    """Test getting a specific workflow"""
    user, token = await create_test_user_with_token(db_session)

    # Create test workflow
    workflow = Workflow(
        user_id=user.id,
        name="Test Workflow",
        description="Test",
        nodes=[],
        connections=[],
        settings={},
        tags=[],
    )
    db_session.add(workflow)
    await db_session.commit()

    response = await client.get(
        f"/api/v1/workflows/{workflow.id}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Workflow"
    assert data["id"] == str(workflow.id)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_update_workflow(client: AsyncClient, db_session: AsyncSession):
    """Test updating a workflow"""
    user, token = await create_test_user_with_token(db_session)

    # Create test workflow
    workflow = Workflow(
        user_id=user.id,
        name="Original Name",
        nodes=[],
        connections=[],
        settings={},
        tags=[],
    )
    db_session.add(workflow)
    await db_session.commit()

    # Update workflow
    update_data = {
        "name": "Updated Name",
        "description": "New description",
        "tags": ["updated"],
    }

    response = await client.put(
        f"/api/v1/workflows/{workflow.id}",
        json=update_data,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["description"] == "New description"
    assert data["tags"] == ["updated"]


@pytest.mark.integration
@pytest.mark.asyncio
async def test_delete_workflow(client: AsyncClient, db_session: AsyncSession):
    """Test deleting a workflow"""
    user, token = await create_test_user_with_token(db_session)

    # Create test workflow
    workflow = Workflow(
        user_id=user.id,
        name="To Be Deleted",
        nodes=[],
        connections=[],
        settings={},
        tags=[],
    )
    db_session.add(workflow)
    await db_session.commit()

    workflow_id = workflow.id

    # Delete workflow
    response = await client.delete(
        f"/api/v1/workflows/{workflow_id}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 204

    # Verify deletion
    response = await client.get(
        f"/api/v1/workflows/{workflow_id}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.asyncio
async def test_update_workflow_status(client: AsyncClient, db_session: AsyncSession):
    """Test updating workflow status"""
    user, token = await create_test_user_with_token(db_session)

    # Create test workflow
    workflow = Workflow(
        user_id=user.id,
        name="Test Workflow",
        status="draft",
        nodes=[],
        connections=[],
        settings={},
        tags=[],
    )
    db_session.add(workflow)
    await db_session.commit()

    # Update status
    response = await client.patch(
        f"/api/v1/workflows/{workflow.id}/status",
        json={"status": "published"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "published"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_duplicate_workflow(client: AsyncClient, db_session: AsyncSession):
    """Test duplicating a workflow"""
    user, token = await create_test_user_with_token(db_session)

    # Create test workflow
    workflow = Workflow(
        user_id=user.id,
        name="Original Workflow",
        description="Original",
        nodes=[{"id": "node-1", "type": "agent"}],
        connections=[],
        settings={"key": "value"},
        tags=["original"],
    )
    db_session.add(workflow)
    await db_session.commit()

    # Duplicate workflow
    response = await client.post(
        f"/api/v1/workflows/{workflow.id}/duplicate",
        json={"name": "Duplicated Workflow"},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Duplicated Workflow"
    assert data["status"] == "draft"
    assert len(data["nodes"]) == 1
    assert data["parent_workflow_id"] == str(workflow.id)


@pytest.mark.integration
@pytest.mark.asyncio
async def test_validate_workflow(client: AsyncClient, db_session: AsyncSession):
    """Test workflow validation"""
    user, token = await create_test_user_with_token(db_session)

    # Create workflow with validation issues
    workflow = Workflow(
        user_id=user.id,
        name="Test Workflow",
        nodes=[
            {"id": "node-1", "type": "agent"},
            {"id": "node-2", "type": "trigger"},
            {"id": "node-3", "type": "action"},  # Disconnected
        ],
        connections=[
            {"source": "node-1", "target": "node-2"}
        ],
        settings={},
        tags=[],
    )
    db_session.add(workflow)
    await db_session.commit()

    # Validate workflow
    response = await client.post(
        f"/api/v1/workflows/{workflow.id}/validate",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is True
    assert len(data["warnings"]) > 0  # Should warn about disconnected node


@pytest.mark.integration
@pytest.mark.asyncio
async def test_workflow_search(client: AsyncClient, db_session: AsyncSession):
    """Test workflow search functionality"""
    user, token = await create_test_user_with_token(db_session)

    # Create test workflows
    workflow1 = Workflow(
        user_id=user.id,
        name="Customer Support Bot",
        description="Handles customer inquiries",
        nodes=[],
        connections=[],
        settings={},
        tags=["customer-support"],
    )
    workflow2 = Workflow(
        user_id=user.id,
        name="Sales Assistant",
        description="Helps with sales",
        nodes=[],
        connections=[],
        settings={},
        tags=["sales"],
    )
    db_session.add_all([workflow1, workflow2])
    await db_session.commit()

    # Search by query
    response = await client.get(
        "/api/v1/workflows?query=customer",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any("Customer" in item["name"] for item in data["items"])


@pytest.mark.integration
@pytest.mark.asyncio
async def test_workflow_access_control(client: AsyncClient, db_session: AsyncSession):
    """Test workflow access control"""
    user1, token1 = await create_test_user_with_token(db_session)

    # Create another user
    user2 = User(email="workflow_test2@example.com", is_active=True)
    db_session.add(user2)
    await db_session.flush()

    # Create workflow for user1
    workflow = Workflow(
        user_id=user1.id,
        name="Private Workflow",
        is_public=False,
        nodes=[],
        connections=[],
        settings={},
        tags=[],
    )
    db_session.add(workflow)
    await db_session.commit()

    # Create token for user2
    token_data2 = {"sub": str(user2.id), "email": user2.email}
    access_token2 = create_access_token(token_data2)
    session2 = Session(
        user_id=user2.id,
        token_hash=hash_token(access_token2),
        expires_at=datetime.utcnow() + timedelta(hours=1),
        last_activity_at=datetime.utcnow(),
    )
    db_session.add(session2)
    await db_session.commit()

    # Try to access user1's private workflow as user2
    response = await client.get(
        f"/api/v1/workflows/{workflow.id}",
        headers={"Authorization": f"Bearer {access_token2}"},
    )

    assert response.status_code == 404  # Should not be accessible
