"""
Unit tests for DAG Resolver
"""
import pytest
from app.utils.dag_resolver import DAGResolver


@pytest.mark.unit
def test_dag_resolver_simple_linear():
    """Test DAG resolver with simple linear workflow"""
    nodes = [
        {"id": "node-1", "type": "trigger"},
        {"id": "node-2", "type": "agent"},
        {"id": "node-3", "type": "action"},
    ]
    connections = [
        {"source": "node-1", "target": "node-2"},
        {"source": "node-2", "target": "node-3"},
    ]

    resolver = DAGResolver(nodes, connections)
    levels = resolver.topological_sort()

    assert len(levels) == 3
    assert levels[0] == ["node-1"]
    assert levels[1] == ["node-2"]
    assert levels[2] == ["node-3"]


@pytest.mark.unit
def test_dag_resolver_parallel_nodes():
    """Test DAG resolver with parallel nodes"""
    nodes = [
        {"id": "node-1", "type": "trigger"},
        {"id": "node-2", "type": "agent"},
        {"id": "node-3", "type": "agent"},
        {"id": "node-4", "type": "action"},
    ]
    connections = [
        {"source": "node-1", "target": "node-2"},
        {"source": "node-1", "target": "node-3"},
        {"source": "node-2", "target": "node-4"},
        {"source": "node-3", "target": "node-4"},
    ]

    resolver = DAGResolver(nodes, connections)
    levels = resolver.topological_sort()

    assert len(levels) == 3
    assert levels[0] == ["node-1"]
    assert set(levels[1]) == {"node-2", "node-3"}  # Parallel execution
    assert levels[2] == ["node-4"]


@pytest.mark.unit
def test_dag_resolver_cycle_detection():
    """Test DAG resolver detects cycles"""
    nodes = [
        {"id": "node-1", "type": "agent"},
        {"id": "node-2", "type": "agent"},
        {"id": "node-3", "type": "agent"},
    ]
    connections = [
        {"source": "node-1", "target": "node-2"},
        {"source": "node-2", "target": "node-3"},
        {"source": "node-3", "target": "node-1"},  # Creates cycle
    ]

    resolver = DAGResolver(nodes, connections)

    with pytest.raises(ValueError, match="Cycle detected"):
        resolver.topological_sort()


@pytest.mark.unit
def test_dag_resolver_get_dependencies():
    """Test getting node dependencies"""
    nodes = [
        {"id": "node-1", "type": "trigger"},
        {"id": "node-2", "type": "agent"},
        {"id": "node-3", "type": "agent"},
    ]
    connections = [
        {"source": "node-1", "target": "node-2"},
        {"source": "node-2", "target": "node-3"},
    ]

    resolver = DAGResolver(nodes, connections)

    assert resolver.get_node_dependencies("node-1") == []
    assert resolver.get_node_dependencies("node-2") == ["node-1"]
    assert resolver.get_node_dependencies("node-3") == ["node-2"]


@pytest.mark.unit
def test_dag_resolver_get_dependents():
    """Test getting node dependents"""
    nodes = [
        {"id": "node-1", "type": "trigger"},
        {"id": "node-2", "type": "agent"},
        {"id": "node-3", "type": "agent"},
    ]
    connections = [
        {"source": "node-1", "target": "node-2"},
        {"source": "node-2", "target": "node-3"},
    ]

    resolver = DAGResolver(nodes, connections)

    assert resolver.get_node_dependents("node-1") == ["node-2"]
    assert resolver.get_node_dependents("node-2") == ["node-3"]
    assert resolver.get_node_dependents("node-3") == []


@pytest.mark.unit
def test_dag_resolver_can_execute_node():
    """Test checking if node can be executed"""
    nodes = [
        {"id": "node-1", "type": "trigger"},
        {"id": "node-2", "type": "agent"},
        {"id": "node-3", "type": "agent"},
    ]
    connections = [
        {"source": "node-1", "target": "node-2"},
        {"source": "node-2", "target": "node-3"},
    ]

    resolver = DAGResolver(nodes, connections)

    # Node-1 has no dependencies, can execute
    assert resolver.can_execute_node("node-1", set())

    # Node-2 depends on node-1
    assert not resolver.can_execute_node("node-2", set())
    assert resolver.can_execute_node("node-2", {"node-1"})

    # Node-3 depends on node-2
    assert not resolver.can_execute_node("node-3", {"node-1"})
    assert resolver.can_execute_node("node-3", {"node-1", "node-2"})


@pytest.mark.unit
def test_dag_resolver_get_executable_nodes():
    """Test getting all executable nodes"""
    nodes = [
        {"id": "node-1", "type": "trigger"},
        {"id": "node-2", "type": "agent"},
        {"id": "node-3", "type": "agent"},
        {"id": "node-4", "type": "action"},
    ]
    connections = [
        {"source": "node-1", "target": "node-2"},
        {"source": "node-1", "target": "node-3"},
        {"source": "node-2", "target": "node-4"},
        {"source": "node-3", "target": "node-4"},
    ]

    resolver = DAGResolver(nodes, connections)

    # Initially, only node-1 is executable
    executable = resolver.get_executable_nodes(set())
    assert executable == ["node-1"]

    # After node-1 completes, node-2 and node-3 are executable
    executable = resolver.get_executable_nodes({"node-1"})
    assert set(executable) == {"node-2", "node-3"}

    # After node-2 completes, only node-3 is executable (node-4 still needs node-3)
    executable = resolver.get_executable_nodes({"node-1", "node-2"})
    assert executable == ["node-3"]

    # After both node-2 and node-3 complete, node-4 is executable
    executable = resolver.get_executable_nodes({"node-1", "node-2", "node-3"})
    assert executable == ["node-4"]


@pytest.mark.unit
def test_dag_resolver_validate_workflow():
    """Test workflow validation"""
    # Valid workflow
    nodes = [
        {"id": "node-1", "type": "trigger"},
        {"id": "node-2", "type": "agent"},
    ]
    connections = [{"source": "node-1", "target": "node-2"}]

    resolver = DAGResolver(nodes, connections)
    is_valid, error = resolver.validate_workflow()

    assert is_valid is True
    assert error is None

    # Invalid workflow (cycle)
    nodes_cycle = [
        {"id": "node-1", "type": "agent"},
        {"id": "node-2", "type": "agent"},
    ]
    connections_cycle = [
        {"source": "node-1", "target": "node-2"},
        {"source": "node-2", "target": "node-1"},
    ]

    resolver_cycle = DAGResolver(nodes_cycle, connections_cycle)
    is_valid, error = resolver_cycle.validate_workflow()

    assert is_valid is False
    assert "Cycle detected" in error


@pytest.mark.unit
def test_dag_resolver_execution_order():
    """Test getting flat execution order"""
    nodes = [
        {"id": "node-1", "type": "trigger"},
        {"id": "node-2", "type": "agent"},
        {"id": "node-3", "type": "agent"},
        {"id": "node-4", "type": "action"},
    ]
    connections = [
        {"source": "node-1", "target": "node-2"},
        {"source": "node-1", "target": "node-3"},
        {"source": "node-2", "target": "node-4"},
        {"source": "node-3", "target": "node-4"},
    ]

    resolver = DAGResolver(nodes, connections)
    execution_order = resolver.get_execution_order()

    # Check that we have 4 nodes
    assert len(execution_order) == 4

    # Check that levels are correct
    levels_dict = {node_id: level for level, node_id in execution_order}
    assert levels_dict["node-1"] == 0
    assert levels_dict["node-2"] == 1
    assert levels_dict["node-3"] == 1
    assert levels_dict["node-4"] == 2


@pytest.mark.unit
def test_dag_resolver_estimate_levels():
    """Test estimating execution levels"""
    nodes = [
        {"id": "node-1", "type": "trigger"},
        {"id": "node-2", "type": "agent"},
        {"id": "node-3", "type": "action"},
    ]
    connections = [
        {"source": "node-1", "target": "node-2"},
        {"source": "node-2", "target": "node-3"},
    ]

    resolver = DAGResolver(nodes, connections)
    levels = resolver.estimate_execution_levels()

    assert levels == 3


@pytest.mark.unit
def test_dag_resolver_parallel_potential():
    """Test calculating parallel execution potential"""
    # Fully sequential workflow (low parallel potential)
    nodes_sequential = [
        {"id": "node-1", "type": "trigger"},
        {"id": "node-2", "type": "agent"},
        {"id": "node-3", "type": "action"},
    ]
    connections_sequential = [
        {"source": "node-1", "target": "node-2"},
        {"source": "node-2", "target": "node-3"},
    ]

    resolver_sequential = DAGResolver(nodes_sequential, connections_sequential)
    parallel_potential_sequential = resolver_sequential.get_parallel_potential()

    # Should be close to 1/3 (one node per level)
    assert 0.3 < parallel_potential_sequential < 0.4

    # Fully parallel workflow (high parallel potential)
    nodes_parallel = [
        {"id": "node-1", "type": "agent"},
        {"id": "node-2", "type": "agent"},
        {"id": "node-3", "type": "agent"},
    ]
    connections_parallel = []  # No connections, all can run in parallel

    resolver_parallel = DAGResolver(nodes_parallel, connections_parallel)
    parallel_potential_parallel = resolver_parallel.get_parallel_potential()

    # Should be 1.0 (all nodes in one level)
    assert parallel_potential_parallel == 1.0
