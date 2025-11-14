"""
Integration tests for Execution API endpoints
"""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.workflow import Workflow
from app.models.workflow_execution import WorkflowExecution
from app.core.security import create_access_token, hash_token
from app.models.session import Session
from datetime import datetime, timedelta


async def create_test_user_with_token(db_session: AsyncSession) -> tuple[User, str]:
    """Helper to create a test user with valid token"""
    user = User(email="execution_test@example.com", is_active=True)
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
async def test_create_execution(client: AsyncClient, db_session: AsyncSession):
    """Test creating a workflow execution"""
    user, token = await create_test_user_with_token(db_session)

    # Create a test workflow
    workflow = Workflow(
        user_id=user.id,
        name="Test Workflow",
        nodes=[
            {"id": "node-1", "type": "trigger"},
            {"id": "node-2", "type": "agent"},
            {"id": "node-3", "type": "action"},
        ],
        connections=[
            {"source": "node-1", "target": "node-2"},
            {"source": "node-2", "target": "node-3"},
        ],
        settings={},
        tags=[],
    )
    db_session.add(workflow)
    await db_session.commit()

    # Create execution
    execution_data = {
        "input_data": {"test": "data"},
        "context": {"env": "test"},
        "priority": 5,
    }

    response = await client.post(
        f"/api/v1/workflows/{workflow.id}/executions",
        json=execution_data,
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "pending"
    assert data["input_data"] == {"test": "data"}
    assert data["total_nodes"] == 3
    assert data["priority"] == 5


@pytest.mark.integration
@pytest.mark.asyncio
async def test_list_executions(client: AsyncClient, db_session: AsyncSession):
    """Test listing workflow executions"""
    user, token = await create_test_user_with_token(db_session)

    # Create a test workflow
    workflow = Workflow(
        user_id=user.id,
        name="Test Workflow",
        nodes=[{"id": "node-1", "type": "trigger"}],
        connections=[],
        settings={},
        tags=[],
    )
    db_session.add(workflow)
    await db_session.flush()

    # Create test executions
    execution1 = WorkflowExecution(
        workflow_id=workflow.id,
        user_id=user.id,
        status="completed",
        total_nodes=1,
    )
    execution2 = WorkflowExecution(
        workflow_id=workflow.id,
        user_id=user.id,
        status="running",
        total_nodes=1,
    )
    db_session.add_all([execution1, execution2])
    await db_session.commit()

    # List all executions
    response = await client.get(
        "/api/v1/executions",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 2
    assert len(data["items"]) >= 2


@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_execution(client: AsyncClient, db_session: AsyncSession):
    """Test getting a specific execution"""
    user, token = await create_test_user_with_token(db_session)

    # Create a test workflow
    workflow = Workflow(
        user_id=user.id,
        name="Test Workflow",
        nodes=[{"id": "node-1", "type": "trigger"}],
        connections=[],
        settings={},
        tags=[],
    )
    db_session.add(workflow)
    await db_session.flush()

    # Create test execution
    execution = WorkflowExecution(
        workflow_id=workflow.id,
        user_id=user.id,
        status="completed",
        total_nodes=1,
    )
    db_session.add(execution)
    await db_session.commit()

    # Get execution
    response = await client.get(
        f"/api/v1/executions/{execution.id}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(execution.id)
    assert data["status"] == "completed"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_cancel_execution(client: AsyncClient, db_session: AsyncSession):
    """Test cancelling a running execution"""
    user, token = await create_test_user_with_token(db_session)

    # Create a test workflow
    workflow = Workflow(
        user_id=user.id,
        name="Test Workflow",
        nodes=[{"id": "node-1", "type": "trigger"}],
        connections=[],
        settings={},
        tags=[],
    )
    db_session.add(workflow)
    await db_session.flush()

    # Create test execution
    execution = WorkflowExecution(
        workflow_id=workflow.id,
        user_id=user.id,
        status="running",
        total_nodes=1,
    )
    db_session.add(execution)
    await db_session.commit()

    # Cancel execution
    response = await client.post(
        f"/api/v1/executions/{execution.id}/cancel",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["status"] == "cancelled"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_filter_executions_by_status(client: AsyncClient, db_session: AsyncSession):
    """Test filtering executions by status"""
    user, token = await create_test_user_with_token(db_session)

    # Create a test workflow
    workflow = Workflow(
        user_id=user.id,
        name="Test Workflow",
        nodes=[{"id": "node-1", "type": "trigger"}],
        connections=[],
        settings={},
        tags=[],
    )
    db_session.add(workflow)
    await db_session.flush()

    # Create executions with different statuses
    execution1 = WorkflowExecution(
        workflow_id=workflow.id,
        user_id=user.id,
        status="completed",
        total_nodes=1,
    )
    execution2 = WorkflowExecution(
        workflow_id=workflow.id,
        user_id=user.id,
        status="failed",
        total_nodes=1,
    )
    execution3 = WorkflowExecution(
        workflow_id=workflow.id,
        user_id=user.id,
        status="completed",
        total_nodes=1,
    )
    db_session.add_all([execution1, execution2, execution3])
    await db_session.commit()

    # Filter by completed status
    response = await client.get(
        "/api/v1/executions?status=completed",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert all(item["status"] == "completed" for item in data["items"])


@pytest.mark.integration
@pytest.mark.asyncio
async def test_filter_executions_by_workflow(client: AsyncClient, db_session: AsyncSession):
    """Test filtering executions by workflow ID"""
    user, token = await create_test_user_with_token(db_session)

    # Create two test workflows
    workflow1 = Workflow(
        user_id=user.id,
        name="Workflow 1",
        nodes=[{"id": "node-1", "type": "trigger"}],
        connections=[],
        settings={},
        tags=[],
    )
    workflow2 = Workflow(
        user_id=user.id,
        name="Workflow 2",
        nodes=[{"id": "node-1", "type": "trigger"}],
        connections=[],
        settings={},
        tags=[],
    )
    db_session.add_all([workflow1, workflow2])
    await db_session.flush()

    # Create executions for both workflows
    execution1 = WorkflowExecution(
        workflow_id=workflow1.id,
        user_id=user.id,
        status="completed",
        total_nodes=1,
    )
    execution2 = WorkflowExecution(
        workflow_id=workflow2.id,
        user_id=user.id,
        status="completed",
        total_nodes=1,
    )
    db_session.add_all([execution1, execution2])
    await db_session.commit()

    # Filter by workflow1
    response = await client.get(
        f"/api/v1/executions?workflow_id={workflow1.id}",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert all(item["workflow_id"] == str(workflow1.id) for item in data["items"])


@pytest.mark.integration
@pytest.mark.asyncio
async def test_get_execution_logs(client: AsyncClient, db_session: AsyncSession):
    """Test getting execution logs"""
    user, token = await create_test_user_with_token(db_session)

    # Create a test workflow
    workflow = Workflow(
        user_id=user.id,
        name="Test Workflow",
        nodes=[{"id": "node-1", "type": "trigger"}],
        connections=[],
        settings={},
        tags=[],
    )
    db_session.add(workflow)
    await db_session.flush()

    # Create test execution with logs
    execution = WorkflowExecution(
        workflow_id=workflow.id,
        user_id=user.id,
        status="completed",
        total_nodes=1,
        execution_log=[
            {"timestamp": "2024-01-01T00:00:00", "level": "info", "message": "Started"},
            {"timestamp": "2024-01-01T00:01:00", "level": "info", "message": "Completed"},
        ],
    )
    db_session.add(execution)
    await db_session.commit()

    # Get logs
    response = await client.get(
        f"/api/v1/executions/{execution.id}/logs",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert data[0]["message"] == "Started"
    assert data[1]["message"] == "Completed"


@pytest.mark.integration
@pytest.mark.asyncio
async def test_execution_access_control(client: AsyncClient, db_session: AsyncSession):
    """Test execution access control"""
    user1, token1 = await create_test_user_with_token(db_session)

    # Create another user
    user2 = User(email="execution_test2@example.com", is_active=True)
    db_session.add(user2)
    await db_session.flush()

    # Create workflow for user1
    workflow = Workflow(
        user_id=user1.id,
        name="User1 Workflow",
        nodes=[{"id": "node-1", "type": "trigger"}],
        connections=[],
        settings={},
        tags=[],
    )
    db_session.add(workflow)
    await db_session.flush()

    # Create execution for user1
    execution = WorkflowExecution(
        workflow_id=workflow.id,
        user_id=user1.id,
        status="completed",
        total_nodes=1,
    )
    db_session.add(execution)
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

    # Try to access user1's execution as user2
    response = await client.get(
        f"/api/v1/executions/{execution.id}",
        headers={"Authorization": f"Bearer {access_token2}"},
    )

    assert response.status_code == 404  # Should not be accessible
