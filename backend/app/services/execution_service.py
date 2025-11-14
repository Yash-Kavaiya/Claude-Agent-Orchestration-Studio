"""
Execution Service
Handles workflow and node execution business logic
"""
import uuid
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.workflow import Workflow
from app.models.workflow_execution import WorkflowExecution
from app.models.node_execution import NodeExecution
from app.models.agent import Agent
from app.utils.dag_resolver import DAGResolver
from app.schemas.execution import ExecutionCreate, WorkflowExecutionResponse
from app.core.websocket import broadcast_execution_update, broadcast_node_update


class ExecutionService:
    """Service for managing workflow and node execution"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_execution(
        self, workflow_id: uuid.UUID, user_id: uuid.UUID, data: ExecutionCreate
    ) -> Optional[WorkflowExecution]:
        """
        Create a new workflow execution

        Args:
            workflow_id: Workflow ID to execute
            user_id: User ID creating the execution
            data: Execution creation data

        Returns:
            WorkflowExecution: Created execution or None if workflow not found
        """
        # Get workflow
        result = await self.db.execute(
            select(Workflow).where(
                and_(Workflow.id == workflow_id, Workflow.user_id == user_id)
            )
        )
        workflow = result.scalar_one_or_none()

        if not workflow:
            return None

        # Validate workflow structure
        is_valid, error = workflow.validate_structure()
        if not is_valid:
            raise ValueError(f"Invalid workflow structure: {error}")

        # Create DAG resolver to validate execution order
        try:
            dag_resolver = DAGResolver(workflow.nodes, workflow.connections)
            dag_resolver.validate_workflow()
            execution_order = dag_resolver.get_execution_order()
        except ValueError as e:
            raise ValueError(f"Workflow validation failed: {str(e)}")

        # Create workflow execution
        execution = WorkflowExecution(
            workflow_id=workflow_id,
            user_id=user_id,
            status="pending",
            input_data=data.input_data or {},
            context=data.context or {},
            total_nodes=len(workflow.nodes),
            priority=data.priority or 0,
            scheduled_at=data.scheduled_at,
            max_retries=data.max_retries or 3,
        )

        self.db.add(execution)
        await self.db.flush()

        # Create node executions
        for order, (level, node_id) in enumerate(execution_order):
            node = workflow.get_node_by_id(node_id)
            if not node:
                continue

            # Get agent for this node if it's an agent type
            agent = None
            if node.get("type") == "agent":
                agent_result = await self.db.execute(
                    select(Agent).where(
                        and_(
                            Agent.workflow_id == workflow_id,
                            Agent.node_id == node_id,
                        )
                    )
                )
                agent = agent_result.scalar_one_or_none()

            # Get dependencies
            dependencies = dag_resolver.get_node_dependencies(node_id)
            dependents = dag_resolver.get_node_dependents(node_id)

            node_execution = NodeExecution(
                workflow_execution_id=execution.id,
                agent_id=agent.id if agent else None,
                user_id=user_id,
                node_id=node_id,
                node_name=node.get("name", f"Node {node_id}"),
                node_type=node.get("type", "unknown"),
                status="pending",
                execution_order=order,
                parent_node_ids=dependencies,
                child_node_ids=dependents,
                max_retries=3,
            )

            self.db.add(node_execution)

        await self.db.commit()
        await self.db.refresh(execution)

        execution.add_log_entry("info", "Workflow execution created")
        await self.db.commit()

        return execution

    async def get_execution(
        self, execution_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[WorkflowExecution]:
        """
        Get workflow execution by ID

        Args:
            execution_id: WorkflowExecution ID
            user_id: User ID

        Returns:
            WorkflowExecution or None
        """
        result = await self.db.execute(
            select(WorkflowExecution)
            .where(
                and_(
                    WorkflowExecution.id == execution_id,
                    WorkflowExecution.user_id == user_id,
                )
            )
            .options(selectinload(WorkflowExecution.node_executions))
        )
        return result.scalar_one_or_none()

    async def list_executions(
        self,
        user_id: uuid.UUID,
        workflow_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Tuple[List[WorkflowExecution], int]:
        """
        List workflow executions with filtering

        Args:
            user_id: User ID
            workflow_id: Optional workflow ID filter
            status: Optional status filter
            limit: Results per page
            offset: Pagination offset

        Returns:
            tuple: (executions, total_count)
        """
        # Build query
        query = select(WorkflowExecution).where(WorkflowExecution.user_id == user_id)

        if workflow_id:
            query = query.where(WorkflowExecution.workflow_id == workflow_id)

        if status:
            query = query.where(WorkflowExecution.status == status)

        # Get total count
        count_result = await self.db.execute(
            select(WorkflowExecution.id).where(WorkflowExecution.user_id == user_id)
        )
        total = len(count_result.fetchall())

        # Get paginated results
        query = query.order_by(WorkflowExecution.created_at.desc()).limit(limit).offset(offset)
        result = await self.db.execute(query)
        executions = result.scalars().all()

        return list(executions), total

    async def cancel_execution(
        self, execution_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[WorkflowExecution]:
        """
        Cancel a running workflow execution

        Args:
            execution_id: WorkflowExecution ID
            user_id: User ID

        Returns:
            WorkflowExecution or None
        """
        execution = await self.get_execution(execution_id, user_id)

        if not execution:
            return None

        if execution.status not in ["pending", "running"]:
            raise ValueError(f"Cannot cancel execution with status: {execution.status}")

        execution.status = "cancelled"
        execution.completed_at = datetime.utcnow()
        execution.calculate_duration()
        execution.add_log_entry("info", "Workflow execution cancelled by user")

        # Cancel all pending/running node executions
        result = await self.db.execute(
            select(NodeExecution).where(
                and_(
                    NodeExecution.workflow_execution_id == execution_id,
                    NodeExecution.status.in_(["pending", "running"]),
                )
            )
        )
        node_executions = result.scalars().all()

        for node_exec in node_executions:
            node_exec.status = "cancelled"
            node_exec.add_log_entry("info", "Node execution cancelled")

        await self.db.commit()
        await self.db.refresh(execution)

        # Broadcast WebSocket event
        await broadcast_execution_update(
            str(execution.id),
            execution.status,
            execution.get_progress_percentage(),
            execution.completed_nodes,
            execution.total_nodes,
        )

        return execution

    async def execute_workflow(
        self, execution_id: str, user_id: str
    ) -> Dict[str, Any]:
        """
        Execute a workflow (called by Celery task)

        Args:
            execution_id: WorkflowExecution ID
            user_id: User ID

        Returns:
            dict: Execution result
        """
        execution_uuid = uuid.UUID(execution_id)
        user_uuid = uuid.UUID(user_id)

        # Get execution
        execution = await self.get_execution(execution_uuid, user_uuid)

        if not execution:
            raise ValueError("Workflow execution not found")

        # Update status to running
        execution.status = "running"
        execution.started_at = datetime.utcnow()
        execution.add_log_entry("info", "Workflow execution started")
        await self.db.commit()

        # Broadcast WebSocket event
        await broadcast_execution_update(
            str(execution.id),
            execution.status,
            execution.get_progress_percentage(),
            execution.completed_nodes,
            execution.total_nodes,
        )

        try:
            # Get workflow
            result = await self.db.execute(
                select(Workflow).where(Workflow.id == execution.workflow_id)
            )
            workflow = result.scalar_one()

            # Create DAG resolver
            dag_resolver = DAGResolver(workflow.nodes, workflow.connections)
            levels = dag_resolver.topological_sort()

            # Execute nodes level by level
            completed_nodes = set()

            for level_idx, level_nodes in enumerate(levels):
                execution.add_log_entry(
                    "info", f"Executing level {level_idx + 1}/{len(levels)} with {len(level_nodes)} nodes"
                )

                # Execute all nodes in this level (can be parallelized)
                for node_id in level_nodes:
                    # Get node execution
                    result = await self.db.execute(
                        select(NodeExecution).where(
                            and_(
                                NodeExecution.workflow_execution_id == execution_uuid,
                                NodeExecution.node_id == node_id,
                            )
                        )
                    )
                    node_execution = result.scalar_one_or_none()

                    if node_execution:
                        # Execute node
                        await self._execute_node_inline(node_execution, execution)
                        completed_nodes.add(node_id)

                        # Update workflow execution progress
                        execution.completed_nodes = len(completed_nodes)
                        await self.db.commit()

                        # Broadcast progress update
                        await broadcast_execution_update(
                            str(execution.id),
                            execution.status,
                            execution.get_progress_percentage(),
                            execution.completed_nodes,
                            execution.total_nodes,
                            node_id,
                        )

            # Mark execution as completed
            execution.status = "completed"
            execution.completed_at = datetime.utcnow()
            execution.calculate_duration()
            execution.add_log_entry("info", "Workflow execution completed successfully")
            await self.db.commit()

            # Broadcast completion event
            await broadcast_execution_update(
                str(execution.id),
                execution.status,
                100.0,
                execution.completed_nodes,
                execution.total_nodes,
            )

            return {
                "status": "completed",
                "execution_id": str(execution.id),
                "duration": float(execution.duration_seconds) if execution.duration_seconds else None,
            }

        except Exception as e:
            # Mark execution as failed
            execution.status = "failed"
            execution.completed_at = datetime.utcnow()
            execution.calculate_duration()
            execution.error_message = str(e)
            execution.add_log_entry("error", f"Workflow execution failed: {str(e)}")
            await self.db.commit()

            # Broadcast failure event
            await broadcast_execution_update(
                str(execution.id),
                execution.status,
                execution.get_progress_percentage(),
                execution.completed_nodes,
                execution.total_nodes,
            )

            raise

    async def _execute_node_inline(
        self, node_execution: NodeExecution, workflow_execution: WorkflowExecution
    ) -> None:
        """
        Execute a single node (inline, not via Celery)

        Args:
            node_execution: NodeExecution to execute
            workflow_execution: Parent WorkflowExecution
        """
        node_execution.status = "running"
        node_execution.started_at = datetime.utcnow()
        node_execution.add_log_entry("info", "Node execution started")
        await self.db.commit()

        # Broadcast node started event
        await broadcast_node_update(
            str(workflow_execution.id),
            str(node_execution.id),
            node_execution.node_id,
            node_execution.node_name,
            node_execution.status,
            "Node execution started",
        )

        try:
            # Prepare input data from parent nodes
            input_data = {}
            for parent_id in node_execution.parent_node_ids:
                result = await self.db.execute(
                    select(NodeExecution).where(
                        and_(
                            NodeExecution.workflow_execution_id == workflow_execution.id,
                            NodeExecution.node_id == parent_id,
                        )
                    )
                )
                parent_node = result.scalar_one_or_none()
                if parent_node:
                    input_data[parent_id] = parent_node.output_data

            # Execute based on node type
            if node_execution.node_type == "agent":
                # Execute agent node (would call Claude AI)
                output_data = await self._execute_agent_node(
                    node_execution, input_data, workflow_execution.context
                )
            else:
                # For other node types, just pass through
                output_data = {"status": "completed", "input": input_data}

            # Update node execution
            node_execution.status = "completed"
            node_execution.completed_at = datetime.utcnow()
            node_execution.calculate_duration()
            node_execution.output_data = output_data
            node_execution.add_log_entry("info", "Node execution completed")
            await self.db.commit()

            # Broadcast node completed event
            await broadcast_node_update(
                str(workflow_execution.id),
                str(node_execution.id),
                node_execution.node_id,
                node_execution.node_name,
                node_execution.status,
                "Node execution completed",
            )

        except Exception as e:
            node_execution.status = "failed"
            node_execution.completed_at = datetime.utcnow()
            node_execution.calculate_duration()
            node_execution.error_message = str(e)
            node_execution.add_log_entry("error", f"Node execution failed: {str(e)}")
            workflow_execution.failed_nodes += 1
            await self.db.commit()

            # Broadcast node failed event
            await broadcast_node_update(
                str(workflow_execution.id),
                str(node_execution.id),
                node_execution.node_id,
                node_execution.node_name,
                node_execution.status,
                f"Node execution failed: {str(e)}",
            )

            raise

    async def _execute_agent_node(
        self, node_execution: NodeExecution, input_data: Dict[str, Any], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Execute an agent node (placeholder for Claude AI execution)

        Args:
            node_execution: NodeExecution to execute
            input_data: Input data from parent nodes
            context: Shared workflow context

        Returns:
            dict: Agent execution output
        """
        # This is a placeholder - would integrate with Claude AI SDK
        # For now, just return mock data
        return {
            "status": "completed",
            "response": "Agent execution completed (mock)",
            "input_data": input_data,
            "context": context,
        }

    async def execute_node(
        self, node_execution_id: str, workflow_execution_id: str, user_id: str
    ) -> Dict[str, Any]:
        """
        Execute a single node (called by Celery task)

        Args:
            node_execution_id: NodeExecution ID
            workflow_execution_id: WorkflowExecution ID
            user_id: User ID

        Returns:
            dict: Node execution result
        """
        node_execution_uuid = uuid.UUID(node_execution_id)
        workflow_execution_uuid = uuid.UUID(workflow_execution_id)

        # Get node execution
        result = await self.db.execute(
            select(NodeExecution).where(NodeExecution.id == node_execution_uuid)
        )
        node_execution = result.scalar_one_or_none()

        if not node_execution:
            raise ValueError("Node execution not found")

        # Get workflow execution
        result = await self.db.execute(
            select(WorkflowExecution).where(WorkflowExecution.id == workflow_execution_uuid)
        )
        workflow_execution = result.scalar_one_or_none()

        if not workflow_execution:
            raise ValueError("Workflow execution not found")

        # Execute node
        await self._execute_node_inline(node_execution, workflow_execution)

        return {
            "status": node_execution.status,
            "node_execution_id": str(node_execution.id),
            "output_data": node_execution.output_data,
        }

    async def retry_workflow_execution(
        self, execution_id: str, user_id: str
    ) -> Dict[str, Any]:
        """
        Retry a failed workflow execution

        Args:
            execution_id: WorkflowExecution ID
            user_id: User ID

        Returns:
            dict: Retry result
        """
        execution_uuid = uuid.UUID(execution_id)
        user_uuid = uuid.UUID(user_id)

        execution = await self.get_execution(execution_uuid, user_uuid)

        if not execution:
            raise ValueError("Workflow execution not found")

        if not execution.can_retry():
            raise ValueError("Workflow execution cannot be retried")

        # Increment retry count
        execution.retry_count += 1
        execution.status = "pending"
        execution.error_message = None
        execution.error_details = {}
        execution.add_log_entry("info", f"Workflow execution retry #{execution.retry_count}")
        await self.db.commit()

        # Re-execute workflow
        return await self.execute_workflow(str(execution.id), str(user_id))

    async def retry_node_execution(
        self, node_execution_id: str, user_id: str
    ) -> Dict[str, Any]:
        """
        Retry a failed node execution

        Args:
            node_execution_id: NodeExecution ID
            user_id: User ID

        Returns:
            dict: Retry result
        """
        node_execution_uuid = uuid.UUID(node_execution_id)

        # Get node execution
        result = await self.db.execute(
            select(NodeExecution).where(NodeExecution.id == node_execution_uuid)
        )
        node_execution = result.scalar_one_or_none()

        if not node_execution:
            raise ValueError("Node execution not found")

        if not node_execution.can_retry():
            raise ValueError("Node execution cannot be retried")

        # Get workflow execution
        result = await self.db.execute(
            select(WorkflowExecution).where(WorkflowExecution.id == node_execution.workflow_execution_id)
        )
        workflow_execution = result.scalar_one_or_none()

        if not workflow_execution:
            raise ValueError("Workflow execution not found")

        # Increment retry count
        node_execution.retry_count += 1
        node_execution.status = "pending"
        node_execution.error_message = None
        node_execution.error_details = {}
        node_execution.add_log_entry("info", f"Node execution retry #{node_execution.retry_count}")
        await self.db.commit()

        # Re-execute node
        return await self.execute_node(
            str(node_execution.id),
            str(workflow_execution.id),
            user_id,
        )
