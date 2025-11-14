"""
DAG Resolver
Resolves workflow node execution order using topological sort
"""
from typing import List, Dict, Any, Set, Tuple, Optional
from collections import defaultdict, deque


class DAGResolver:
    """
    Directed Acyclic Graph resolver for workflow execution order

    Uses Kahn's algorithm for topological sorting to determine
    the order in which nodes should be executed based on their dependencies.
    """

    def __init__(self, nodes: List[Dict[str, Any]], connections: List[Dict[str, Any]]):
        """
        Initialize DAG resolver

        Args:
            nodes: List of workflow nodes
            connections: List of connections between nodes
        """
        self.nodes = nodes
        self.connections = connections
        self.node_map = {node["id"]: node for node in nodes}
        self.adjacency_list = self._build_adjacency_list()
        self.in_degree = self._calculate_in_degree()

    def _build_adjacency_list(self) -> Dict[str, List[str]]:
        """
        Build adjacency list from connections

        Returns:
            dict: Adjacency list (node_id -> [child_node_ids])
        """
        adjacency = defaultdict(list)

        for conn in self.connections:
            source = conn.get("source")
            target = conn.get("target")

            if source and target:
                adjacency[source].append(target)

        return dict(adjacency)

    def _calculate_in_degree(self) -> Dict[str, int]:
        """
        Calculate in-degree (number of incoming edges) for each node

        Returns:
            dict: In-degree map (node_id -> in_degree)
        """
        in_degree = {node["id"]: 0 for node in self.nodes}

        for children in self.adjacency_list.values():
            for child in children:
                if child in in_degree:
                    in_degree[child] += 1

        return in_degree

    def topological_sort(self) -> List[List[str]]:
        """
        Perform topological sort to get execution order

        Returns nodes grouped by execution level (nodes at same level can run in parallel)

        Returns:
            list: List of levels, where each level is a list of node IDs

        Raises:
            ValueError: If cycle is detected in the workflow
        """
        in_degree_copy = self.in_degree.copy()
        queue = deque([node_id for node_id, degree in in_degree_copy.items() if degree == 0])

        if not queue:
            raise ValueError("No starting nodes found (all nodes have dependencies)")

        levels = []
        processed_nodes = set()

        while queue:
            # Process all nodes at current level (they have no remaining dependencies)
            current_level = list(queue)
            levels.append(current_level)

            queue.clear()

            # Process each node in current level
            for node_id in current_level:
                processed_nodes.add(node_id)

                # Reduce in-degree of children
                children = self.adjacency_list.get(node_id, [])
                for child in children:
                    if child in in_degree_copy:
                        in_degree_copy[child] -= 1

                        # If child has no more dependencies, add to next level
                        if in_degree_copy[child] == 0:
                            queue.append(child)

        # Check if all nodes were processed (detect cycles)
        if len(processed_nodes) != len(self.nodes):
            unprocessed = set(self.node_map.keys()) - processed_nodes
            raise ValueError(f"Cycle detected in workflow. Unprocessed nodes: {unprocessed}")

        return levels

    def get_execution_order(self) -> List[Tuple[int, str]]:
        """
        Get flat execution order with level information

        Returns:
            list: List of (level, node_id) tuples
        """
        levels = self.topological_sort()
        execution_order = []

        for level_idx, level_nodes in enumerate(levels):
            for node_id in level_nodes:
                execution_order.append((level_idx, node_id))

        return execution_order

    def get_node_dependencies(self, node_id: str) -> List[str]:
        """
        Get direct dependencies of a node (parent nodes)

        Args:
            node_id: Node ID to get dependencies for

        Returns:
            list: List of parent node IDs
        """
        dependencies = []

        for source, targets in self.adjacency_list.items():
            if node_id in targets:
                dependencies.append(source)

        return dependencies

    def get_node_dependents(self, node_id: str) -> List[str]:
        """
        Get direct dependents of a node (child nodes)

        Args:
            node_id: Node ID to get dependents for

        Returns:
            list: List of child node IDs
        """
        return self.adjacency_list.get(node_id, [])

    def can_execute_node(self, node_id: str, completed_nodes: Set[str]) -> bool:
        """
        Check if a node can be executed based on completed nodes

        Args:
            node_id: Node ID to check
            completed_nodes: Set of already completed node IDs

        Returns:
            bool: True if node can be executed
        """
        dependencies = self.get_node_dependencies(node_id)
        return all(dep in completed_nodes for dep in dependencies)

    def get_executable_nodes(self, completed_nodes: Set[str]) -> List[str]:
        """
        Get all nodes that can be executed given completed nodes

        Args:
            completed_nodes: Set of already completed node IDs

        Returns:
            list: List of executable node IDs
        """
        executable = []

        for node_id in self.node_map.keys():
            if node_id not in completed_nodes:
                if self.can_execute_node(node_id, completed_nodes):
                    executable.append(node_id)

        return executable

    def validate_workflow(self) -> Tuple[bool, Optional[str]]:
        """
        Validate workflow structure

        Returns:
            tuple: (is_valid, error_message)
        """
        # Check for cycles
        try:
            self.topological_sort()
        except ValueError as e:
            return False, str(e)

        # Check for disconnected nodes
        connected_nodes = set()
        for source, targets in self.adjacency_list.items():
            connected_nodes.add(source)
            connected_nodes.update(targets)

        all_node_ids = set(self.node_map.keys())
        disconnected = all_node_ids - connected_nodes

        if disconnected and len(disconnected) < len(all_node_ids):
            # Some nodes are disconnected but not all
            # This is a warning, not an error
            pass

        return True, None

    def get_critical_path(self) -> List[str]:
        """
        Get the critical path (longest path) through the workflow

        Returns:
            list: List of node IDs in the critical path
        """
        levels = self.topological_sort()

        if not levels:
            return []

        # For simplicity, return the path through the first node of each level
        # In a more complex implementation, this would calculate actual path lengths
        critical_path = [level[0] for level in levels]

        return critical_path

    def estimate_execution_levels(self) -> int:
        """
        Estimate number of execution levels (sequential steps)

        Returns:
            int: Number of levels
        """
        try:
            levels = self.topological_sort()
            return len(levels)
        except ValueError:
            return 0

    def get_parallel_potential(self) -> float:
        """
        Calculate parallel execution potential (0.0 to 1.0)

        Returns:
            float: Parallel potential ratio
        """
        if not self.nodes:
            return 0.0

        try:
            levels = self.topological_sort()
            total_nodes = len(self.nodes)
            num_levels = len(levels)

            if num_levels == 0:
                return 0.0

            # Perfect parallel: all nodes in one level (1.0)
            # Perfect sequential: one node per level (1/total_nodes)
            avg_nodes_per_level = total_nodes / num_levels
            parallel_potential = avg_nodes_per_level / total_nodes

            return parallel_potential
        except ValueError:
            return 0.0
