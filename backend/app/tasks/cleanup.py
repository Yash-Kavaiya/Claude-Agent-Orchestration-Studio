"""
Cleanup Tasks
Periodic tasks for cleaning up old executions and data
"""
from datetime import datetime, timedelta
from sqlalchemy import select, delete
from celery.utils.log import get_task_logger

from app.celery_app import celery_app
from app.db.session import async_session_maker
from app.models.workflow_execution import WorkflowExecution
from app.models.node_execution import NodeExecution

logger = get_task_logger(__name__)


@celery_app.task(name="app.tasks.cleanup.cleanup_old_executions")
def cleanup_old_executions(days_old: int = 30):
    """
    Cleanup old workflow executions that are older than specified days

    Args:
        days_old: Number of days to keep executions (default: 30)

    Returns:
        dict: Cleanup statistics
    """
    import asyncio

    async def _cleanup():
        async with async_session_maker() as session:
            try:
                cutoff_date = datetime.utcnow() - timedelta(days=days_old)

                # Delete old completed executions
                result = await session.execute(
                    delete(WorkflowExecution).where(
                        WorkflowExecution.status == "completed",
                        WorkflowExecution.completed_at < cutoff_date
                    )
                )
                completed_deleted = result.rowcount

                # Delete old failed executions
                result = await session.execute(
                    delete(WorkflowExecution).where(
                        WorkflowExecution.status == "failed",
                        WorkflowExecution.created_at < cutoff_date
                    )
                )
                failed_deleted = result.rowcount

                await session.commit()

                total_deleted = completed_deleted + failed_deleted

                logger.info(
                    f"Cleaned up {total_deleted} old executions "
                    f"(completed: {completed_deleted}, failed: {failed_deleted})"
                )

                return {
                    "total_deleted": total_deleted,
                    "completed_deleted": completed_deleted,
                    "failed_deleted": failed_deleted,
                    "cutoff_date": cutoff_date.isoformat(),
                }
            except Exception as e:
                logger.error(f"Error cleaning up old executions: {str(e)}")
                await session.rollback()
                raise

    return asyncio.run(_cleanup())


@celery_app.task(name="app.tasks.cleanup.cleanup_failed_tasks")
def cleanup_failed_tasks(days_old: int = 7):
    """
    Cleanup failed tasks and their node executions

    Args:
        days_old: Number of days to keep failed tasks (default: 7)

    Returns:
        dict: Cleanup statistics
    """
    import asyncio

    async def _cleanup():
        async with async_session_maker() as session:
            try:
                cutoff_date = datetime.utcnow() - timedelta(days=days_old)

                # Get failed executions older than cutoff
                result = await session.execute(
                    select(WorkflowExecution.id).where(
                        WorkflowExecution.status == "failed",
                        WorkflowExecution.created_at < cutoff_date,
                        WorkflowExecution.retry_count >= WorkflowExecution.max_retries
                    )
                )
                failed_execution_ids = [row[0] for row in result.fetchall()]

                if not failed_execution_ids:
                    logger.info("No failed tasks to clean up")
                    return {
                        "total_deleted": 0,
                        "executions_deleted": 0,
                        "nodes_deleted": 0,
                    }

                # Delete associated node executions
                result = await session.execute(
                    delete(NodeExecution).where(
                        NodeExecution.workflow_execution_id.in_(failed_execution_ids)
                    )
                )
                nodes_deleted = result.rowcount

                # Delete workflow executions
                result = await session.execute(
                    delete(WorkflowExecution).where(
                        WorkflowExecution.id.in_(failed_execution_ids)
                    )
                )
                executions_deleted = result.rowcount

                await session.commit()

                logger.info(
                    f"Cleaned up {executions_deleted} failed executions "
                    f"and {nodes_deleted} node executions"
                )

                return {
                    "total_deleted": executions_deleted + nodes_deleted,
                    "executions_deleted": executions_deleted,
                    "nodes_deleted": nodes_deleted,
                    "cutoff_date": cutoff_date.isoformat(),
                }
            except Exception as e:
                logger.error(f"Error cleaning up failed tasks: {str(e)}")
                await session.rollback()
                raise

    return asyncio.run(_cleanup())


@celery_app.task(name="app.tasks.cleanup.cleanup_orphaned_node_executions")
def cleanup_orphaned_node_executions():
    """
    Cleanup orphaned node executions that don't have a parent workflow execution

    Returns:
        dict: Cleanup statistics
    """
    import asyncio

    async def _cleanup():
        async with async_session_maker() as session:
            try:
                # Find orphaned node executions
                result = await session.execute(
                    select(NodeExecution.id).where(
                        ~NodeExecution.workflow_execution_id.in_(
                            select(WorkflowExecution.id)
                        )
                    )
                )
                orphaned_ids = [row[0] for row in result.fetchall()]

                if not orphaned_ids:
                    logger.info("No orphaned node executions found")
                    return {"total_deleted": 0}

                # Delete orphaned node executions
                result = await session.execute(
                    delete(NodeExecution).where(NodeExecution.id.in_(orphaned_ids))
                )
                deleted_count = result.rowcount

                await session.commit()

                logger.info(f"Cleaned up {deleted_count} orphaned node executions")

                return {"total_deleted": deleted_count}
            except Exception as e:
                logger.error(f"Error cleaning up orphaned node executions: {str(e)}")
                await session.rollback()
                raise

    return asyncio.run(_cleanup())
