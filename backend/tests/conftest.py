"""
Pytest Configuration and Fixtures
Shared test fixtures for all tests
"""
import asyncio
import pytest
import pytest_asyncio
from typing import AsyncGenerator, Generator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.main import app
from app.db.base import Base
from app.config import settings
from app.dependencies import get_db

# Test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/claude_orchestration_test"


# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    future=True,
)

# Create test session factory
TestSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """
    Create event loop for async tests
    """
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Create a fresh database session for each test
    Automatically rollback after test
    """
    # Create all tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Create session
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()

    # Drop all tables
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Create test client with database session override
    """

    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def test_user_data():
    """
    Sample user data for testing
    """
    return {
        "email": "test@example.com",
        "full_name": "Test User",
    }


@pytest.fixture
def test_workflow_data():
    """
    Sample workflow data for testing
    """
    return {
        "name": "Test Workflow",
        "description": "A test workflow",
        "nodes": [
            {
                "id": "node-1",
                "type": "agent",
                "title": "Test Agent",
                "position": {"x": 100, "y": 100},
                "data": {
                    "systemPrompt": "You are a helpful assistant",
                    "model": "claude-3-5-sonnet-20241022",
                    "temperature": 0.7,
                },
            }
        ],
        "connections": [],
        "tags": ["test"],
    }


@pytest.fixture
def test_agent_data():
    """
    Sample agent data for testing
    """
    return {
        "name": "Test Agent",
        "type": "agent",
        "node_id": "node-1",
        "system_prompt": "You are a helpful assistant",
        "model": "claude-3-5-sonnet-20241022",
        "temperature": 0.7,
        "max_tokens": 4096,
        "tools": ["web_search", "file_read"],
    }


@pytest_asyncio.fixture
async def authenticated_client(
    client: AsyncClient, db_session: AsyncSession
) -> AsyncGenerator[tuple[AsyncClient, dict], None]:
    """
    Create authenticated test client with JWT token
    Returns tuple of (client, auth_headers)
    """
    # TODO: Implement after auth system is built
    # 1. Create test user
    # 2. Generate JWT token
    # 3. Return client with auth headers

    auth_headers = {
        "Authorization": "Bearer test-token"
    }

    yield client, auth_headers


# Markers
pytest.mark.unit = pytest.mark.unit
pytest.mark.integration = pytest.mark.integration
pytest.mark.e2e = pytest.mark.e2e
pytest.mark.slow = pytest.mark.slow
