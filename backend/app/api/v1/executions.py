"""
Execution API Endpoints
Handles workflow execution operations and monitoring
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_user
from app.services.execution_service import ExecutionService
from app.schemas.execution import (
    ExecutionCreate,
    ExecutionUpdate,
    WorkflowExecutionResponse,
    WorkflowExecutionDetailResponse,
    WorkflowExecutionListResponse,
    NodeExecutionResponse,
    NodeExecutionDetailResponse,
    ExecutionActionResponse,
)
from app.models.user import User
from app.tasks.workflow_execution import execute_workflow
import uuid

router = APIRouter()


@router.post(
    "/workflows/{workflow_id}/executions",
    response_model=WorkflowExecutionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_execution(
    workflow_id: str,
    execution_data: ExecutionCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new workflow execution

    Args:
        workflow_id: Workflow ID to execute
        execution_data: Execution configuration
        background_tasks: FastAPI background tasks

    Returns:
        Created workflow execution
    """
    service = ExecutionService(db)

    try:
        workflow_uuid = uuid.UUID(workflow_id)
        execution = await service.create_execution(
            workflow_uuid, current_user.id, execution_data
        )

        if not execution:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow not found or access denied",
            )

        # Trigger async execution via Celery
        if execution_data.scheduled_at is None:
            # Execute immediately in background
            background_tasks.add_task(
                execute_workflow.delay,
                str(execution.id),
                str(current_user.id),
            )

        return WorkflowExecutionResponse.model_validate(execution)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("/executions", response_model=WorkflowExecutionListResponse)
async def list_executions(
    workflow_id: Optional[str] = Query(None, description="Filter by workflow ID"),
    status_filter: Optional[str] = Query(None, description="Filter by status", alias="status"),
    limit: int = Query(100, ge=1, le=100, description="Results per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List workflow executions with filtering

    Query Parameters:
        - workflow_id: Filter by workflow
        - status: Filter by status (pending, running, completed, failed, cancelled)
        - limit: Results per page (1-100)
        - offset: Pagination offset

    Returns:
        Paginated list of workflow executions
    """
    service = ExecutionService(db)

    try:
        workflow_uuid = uuid.UUID(workflow_id) if workflow_id else None
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid workflow ID format",
        )

    executions, total = await service.list_executions(
        current_user.id,
        workflow_id=workflow_uuid,
        status=status_filter,
        limit=limit,
        offset=offset,
    )

    return WorkflowExecutionListResponse(
        items=[WorkflowExecutionResponse.model_validate(e) for e in executions],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/executions/{execution_id}", response_model=WorkflowExecutionDetailResponse)
async def get_execution(
    execution_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get workflow execution by ID with details

    Args:
        execution_id: Execution ID

    Returns:
        Workflow execution details including node executions
    """
    service = ExecutionService(db)

    try:
        execution_uuid = uuid.UUID(execution_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid execution ID format",
        )

    execution = await service.get_execution(execution_uuid, current_user.id)

    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found",
        )

    return WorkflowExecutionDetailResponse.model_validate(execution)


@router.post(
    "/executions/{execution_id}/cancel",
    response_model=ExecutionActionResponse,
)
async def cancel_execution(
    execution_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Cancel a running workflow execution

    Args:
        execution_id: Execution ID

    Returns:
        Action response
    """
    service = ExecutionService(db)

    try:
        execution_uuid = uuid.UUID(execution_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid execution ID format",
        )

    try:
        execution = await service.cancel_execution(execution_uuid, current_user.id)

        if not execution:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Execution not found or access denied",
            )

        return ExecutionActionResponse(
            success=True,
            message="Execution cancelled successfully",
            execution_id=execution.id,
            status=execution.status,
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/executions/{execution_id}/retry",
    response_model=ExecutionActionResponse,
)
async def retry_execution(
    execution_id: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retry a failed workflow execution

    Args:
        execution_id: Execution ID

    Returns:
        Action response
    """
    service = ExecutionService(db)

    try:
        execution_uuid = uuid.UUID(execution_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid execution ID format",
        )

    try:
        execution = await service.get_execution(execution_uuid, current_user.id)

        if not execution:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Execution not found or access denied",
            )

        if not execution.can_retry():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Execution cannot be retried (not failed or max retries reached)",
            )

        # Trigger retry in background
        background_tasks.add_task(
            execute_workflow.delay,
            str(execution.id),
            str(current_user.id),
        )

        return ExecutionActionResponse(
            success=True,
            message="Execution retry initiated",
            execution_id=execution.id,
            status="pending",
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get(
    "/executions/{execution_id}/nodes",
    response_model=List[NodeExecutionResponse],
)
async def get_execution_nodes(
    execution_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all node executions for a workflow execution

    Args:
        execution_id: Execution ID

    Returns:
        List of node executions
    """
    service = ExecutionService(db)

    try:
        execution_uuid = uuid.UUID(execution_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid execution ID format",
        )

    execution = await service.get_execution(execution_uuid, current_user.id)

    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found",
        )

    return [
        NodeExecutionResponse.model_validate(node_exec)
        for node_exec in execution.node_executions
    ]


@router.get(
    "/executions/{execution_id}/nodes/{node_execution_id}",
    response_model=NodeExecutionDetailResponse,
)
async def get_node_execution(
    execution_id: str,
    node_execution_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get detailed information about a specific node execution

    Args:
        execution_id: Execution ID
        node_execution_id: Node execution ID

    Returns:
        Node execution details
    """
    service = ExecutionService(db)

    try:
        execution_uuid = uuid.UUID(execution_id)
        node_execution_uuid = uuid.UUID(node_execution_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid ID format",
        )

    execution = await service.get_execution(execution_uuid, current_user.id)

    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found",
        )

    # Find node execution
    node_execution = None
    for node_exec in execution.node_executions:
        if node_exec.id == node_execution_uuid:
            node_execution = node_exec
            break

    if not node_execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Node execution not found",
        )

    return NodeExecutionDetailResponse.model_validate(node_execution)


@router.get(
    "/executions/{execution_id}/logs",
    response_model=List[dict],
)
async def get_execution_logs(
    execution_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get execution logs

    Args:
        execution_id: Execution ID

    Returns:
        Execution logs
    """
    service = ExecutionService(db)

    try:
        execution_uuid = uuid.UUID(execution_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid execution ID format",
        )

    execution = await service.get_execution(execution_uuid, current_user.id)

    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Execution not found",
        )

    return execution.execution_log or []
