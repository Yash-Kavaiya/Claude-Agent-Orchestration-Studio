"""
Workflow Execution Tasks
Celery tasks for executing workflows
"""
from typing import Dict, Any
from celery.utils.log import get_task_logger

from app.celery_app import celery_app

logger = get_task_logger(__name__)


@celery_app.task(name="app.tasks.workflow_execution.execute_workflow", bind=True)
def execute_workflow(self, workflow_execution_id: str, user_id: str) -> Dict[str, Any]:
    """
    Execute a workflow asynchronously

    Args:
        workflow_execution_id: WorkflowExecution ID to execute
        user_id: User ID executing the workflow

    Returns:
        dict: Execution result
    """
    import asyncio
    from app.services.execution_service import ExecutionService
    from app.db.session import async_session_maker

    async def _execute():
        async with async_session_maker() as session:
            service = ExecutionService(session)
            result = await service.execute_workflow(workflow_execution_id, user_id)
            return result

    try:
        logger.info(f"Starting workflow execution: {workflow_execution_id}")
        result = asyncio.run(_execute())
        logger.info(f"Completed workflow execution: {workflow_execution_id}")
        return result
    except Exception as e:
        logger.error(f"Error executing workflow {workflow_execution_id}: {str(e)}")
        # Retry the task
        raise self.retry(exc=e, countdown=120, max_retries=2)


@celery_app.task(name="app.tasks.workflow_execution.retry_workflow")
def retry_workflow(workflow_execution_id: str, user_id: str) -> Dict[str, Any]:
    """
    Retry a failed workflow execution

    Args:
        workflow_execution_id: WorkflowExecution ID to retry
        user_id: User ID retrying the workflow

    Returns:
        dict: Retry result
    """
    import asyncio
    from app.services.execution_service import ExecutionService
    from app.db.session import async_session_maker

    async def _retry():
        async with async_session_maker() as session:
            service = ExecutionService(session)
            result = await service.retry_workflow_execution(workflow_execution_id, user_id)
            return result

    try:
        logger.info(f"Retrying workflow execution: {workflow_execution_id}")
        result = asyncio.run(_retry())
        logger.info(f"Retry completed for workflow execution: {workflow_execution_id}")
        return result
    except Exception as e:
        logger.error(f"Error retrying workflow {workflow_execution_id}: {str(e)}")
        raise
