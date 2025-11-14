"""
Node Execution Tasks
Celery tasks for executing individual workflow nodes
"""
from typing import Dict, Any
from celery.utils.log import get_task_logger

from app.celery_app import celery_app

logger = get_task_logger(__name__)


@celery_app.task(name="app.tasks.node_execution.execute_node", bind=True)
def execute_node(
    self,
    node_execution_id: str,
    workflow_execution_id: str,
    user_id: str,
) -> Dict[str, Any]:
    """
    Execute a single workflow node asynchronously

    Args:
        node_execution_id: NodeExecution ID to execute
        workflow_execution_id: Parent WorkflowExecution ID
        user_id: User ID executing the node

    Returns:
        dict: Node execution result
    """
    import asyncio
    from app.services.execution_service import ExecutionService
    from app.db.session import async_session_maker

    async def _execute():
        async with async_session_maker() as session:
            service = ExecutionService(session)
            result = await service.execute_node(
                node_execution_id, workflow_execution_id, user_id
            )
            return result

    try:
        logger.info(f"Starting node execution: {node_execution_id}")
        result = asyncio.run(_execute())
        logger.info(f"Completed node execution: {node_execution_id}")
        return result
    except Exception as e:
        logger.error(f"Error executing node {node_execution_id}: {str(e)}")
        # Retry the task
        raise self.retry(exc=e, countdown=30, max_retries=3)


@celery_app.task(name="app.tasks.node_execution.retry_node")
def retry_node(node_execution_id: str, user_id: str) -> Dict[str, Any]:
    """
    Retry a failed node execution

    Args:
        node_execution_id: NodeExecution ID to retry
        user_id: User ID retrying the node

    Returns:
        dict: Retry result
    """
    import asyncio
    from app.services.execution_service import ExecutionService
    from app.db.session import async_session_maker

    async def _retry():
        async with async_session_maker() as session:
            service = ExecutionService(session)
            result = await service.retry_node_execution(node_execution_id, user_id)
            return result

    try:
        logger.info(f"Retrying node execution: {node_execution_id}")
        result = asyncio.run(_retry())
        logger.info(f"Retry completed for node execution: {node_execution_id}")
        return result
    except Exception as e:
        logger.error(f"Error retrying node {node_execution_id}: {str(e)}")
        raise


@celery_app.task(name="app.tasks.node_execution.execute_agent_node")
def execute_agent_node(
    node_execution_id: str,
    agent_id: str,
    input_data: Dict[str, Any],
    context: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Execute an agent node (calls Claude AI)

    Args:
        node_execution_id: NodeExecution ID
        agent_id: Agent ID to execute
        input_data: Input data for the agent
        context: Shared workflow context

    Returns:
        dict: Agent execution result
    """
    import asyncio
    from app.services.agent_executor import AgentExecutor
    from app.db.session import async_session_maker

    async def _execute():
        async with async_session_maker() as session:
            executor = AgentExecutor(session)
            result = await executor.execute_agent(
                node_execution_id, agent_id, input_data, context
            )
            return result

    try:
        logger.info(f"Executing agent node: {node_execution_id} (agent: {agent_id})")
        result = asyncio.run(_execute())
        logger.info(f"Agent node execution completed: {node_execution_id}")
        return result
    except Exception as e:
        logger.error(f"Error executing agent node {node_execution_id}: {str(e)}")
        raise
