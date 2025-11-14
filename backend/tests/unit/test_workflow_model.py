"""
Unit tests for Workflow model
"""
import pytest
import uuid
from app.models.workflow import Workflow


@pytest.mark.unit
def test_workflow_creation():
    """Test workflow model creation"""
    workflow = Workflow(
        user_id=uuid.uuid4(),
        name="Test Workflow",
        description="Test Description",
        status="draft",
        nodes=[],
        connections=[],
        settings={},
        tags=["test"],
    )

    assert workflow.name == "Test Workflow"
    assert workflow.status == "draft"
    assert isinstance(workflow.nodes, list)
    assert isinstance(workflow.tags, list)


@pytest.mark.unit
def test_workflow_validate_structure_valid():
    """Test workflow structure validation with valid workflow"""
    workflow = Workflow(
        user_id=uuid.uuid4(),
        name="Test Workflow",
        nodes=[
            {"id": "node-1", "type": "agent"},
            {"id": "node-2", "type": "trigger"},
        ],
        connections=[
            {"source": "node-1", "target": "node-2"}
        ],
        settings={},
        tags=[],
    )

    is_valid, error = workflow.validate_structure()
    assert is_valid is True
    assert error is None


@pytest.mark.unit
def test_workflow_validate_structure_duplicate_node_ids():
    """Test workflow validation with duplicate node IDs"""
    workflow = Workflow(
        user_id=uuid.uuid4(),
        name="Test Workflow",
        nodes=[
            {"id": "node-1", "type": "agent"},
            {"id": "node-1", "type": "trigger"},  # Duplicate ID
        ],
        connections=[],
        settings={},
        tags=[],
    )

    is_valid, error = workflow.validate_structure()
    assert is_valid is False
    assert "Duplicate node IDs" in error


@pytest.mark.unit
def test_workflow_validate_structure_invalid_connection():
    """Test workflow validation with invalid connection"""
    workflow = Workflow(
        user_id=uuid.uuid4(),
        name="Test Workflow",
        nodes=[
            {"id": "node-1", "type": "agent"},
        ],
        connections=[
            {"source": "node-1", "target": "node-2"}  # node-2 doesn't exist
        ],
        settings={},
        tags=[],
    )

    is_valid, error = workflow.validate_structure()
    assert is_valid is False
    assert "not found in nodes" in error


@pytest.mark.unit
def test_workflow_count_nodes():
    """Test counting nodes in workflow"""
    workflow = Workflow(
        user_id=uuid.uuid4(),
        name="Test Workflow",
        nodes=[
            {"id": "node-1", "type": "agent"},
            {"id": "node-2", "type": "trigger"},
            {"id": "node-3", "type": "action"},
        ],
        connections=[],
        settings={},
        tags=[],
    )

    assert workflow.count_nodes() == 3


@pytest.mark.unit
def test_workflow_count_connections():
    """Test counting connections in workflow"""
    workflow = Workflow(
        user_id=uuid.uuid4(),
        name="Test Workflow",
        nodes=[
            {"id": "node-1", "type": "agent"},
            {"id": "node-2", "type": "trigger"},
        ],
        connections=[
            {"source": "node-1", "target": "node-2"}
        ],
        settings={},
        tags=[],
    )

    assert workflow.count_connections() == 1


@pytest.mark.unit
def test_workflow_get_node_by_id():
    """Test getting node by ID"""
    workflow = Workflow(
        user_id=uuid.uuid4(),
        name="Test Workflow",
        nodes=[
            {"id": "node-1", "type": "agent", "name": "Test Agent"},
            {"id": "node-2", "type": "trigger"},
        ],
        connections=[],
        settings={},
        tags=[],
    )

    node = workflow.get_node_by_id("node-1")
    assert node is not None
    assert node["name"] == "Test Agent"

    non_existent = workflow.get_node_by_id("node-999")
    assert non_existent is None


@pytest.mark.unit
def test_workflow_to_dict():
    """Test workflow serialization to dictionary"""
    workflow = Workflow(
        user_id=uuid.uuid4(),
        name="Test Workflow",
        description="Test",
        status="published",
        nodes=[],
        connections=[],
        settings={},
        tags=["test", "demo"],
    )

    workflow_dict = workflow.to_dict()

    assert workflow_dict["name"] == "Test Workflow"
    assert workflow_dict["status"] == "published"
    assert workflow_dict["tags"] == ["test", "demo"]
    assert isinstance(workflow_dict["id"], str)
