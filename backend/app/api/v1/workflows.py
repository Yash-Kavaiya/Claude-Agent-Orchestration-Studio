"""
Workflow API Endpoints
Handles workflow CRUD operations and management
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_user
from app.services.workflow_service import WorkflowService
from app.schemas.workflow import (
    WorkflowCreate,
    WorkflowUpdate,
    WorkflowResponse,
    WorkflowListResponse,
    WorkflowStatusUpdate,
    WorkflowDuplicate,
    WorkflowValidationResult,
    WorkflowSearchParams,
)
from app.models.user import User

router = APIRouter()


@router.post("", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_workflow(
    workflow_data: WorkflowCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new workflow

    Args:
        workflow_data: Workflow creation data

    Returns:
        Created workflow
    """
    service = WorkflowService(db)

    try:
        workflow = await service.create_workflow(current_user.id, workflow_data)
        return WorkflowResponse.model_validate(workflow)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("", response_model=WorkflowListResponse)
async def list_workflows(
    query: str = Query(None, description="Search query"),
    status_filter: str = Query(None, alias="status", description="Status filter"),
    tags: List[str] = Query(None, description="Tag filters"),
    is_public: bool = Query(None, description="Public filter"),
    limit: int = Query(10, ge=1, le=100, description="Results per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List workflows with search and filtering

    Query Parameters:
        - query: Search term (name, description)
        - status: Filter by status (draft, published, archived)
        - tags: Filter by tags
        - is_public: Filter by visibility
        - limit: Results per page (1-100)
        - offset: Pagination offset

    Returns:
        Paginated list of workflows
    """
    service = WorkflowService(db)

    # Build search parameters
    params = WorkflowSearchParams(
        query=query,
        status=status_filter,
        tags=tags,
        is_public=is_public,
        limit=limit,
        offset=offset,
    )

    workflows, total = await service.list_workflows(current_user.id, params)

    return WorkflowListResponse(
        items=[WorkflowResponse.model_validate(w) for w in workflows],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(
    workflow_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get workflow by ID

    Args:
        workflow_id: Workflow ID

    Returns:
        Workflow details
    """
    service = WorkflowService(db)

    workflow = await service.get_workflow(workflow_id, current_user.id)

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found",
        )

    return WorkflowResponse.model_validate(workflow)


@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: str,
    workflow_data: WorkflowUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update workflow

    Args:
        workflow_id: Workflow ID
        workflow_data: Workflow update data

    Returns:
        Updated workflow
    """
    service = WorkflowService(db)

    try:
        workflow = await service.update_workflow(
            workflow_id, current_user.id, workflow_data
        )

        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow not found or access denied",
            )

        return WorkflowResponse.model_validate(workflow)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(
    workflow_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete workflow

    Args:
        workflow_id: Workflow ID

    Returns:
        204 No Content on success
    """
    service = WorkflowService(db)

    success = await service.delete_workflow(workflow_id, current_user.id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found or access denied",
        )

    return None


@router.patch("/{workflow_id}/status", response_model=WorkflowResponse)
async def update_workflow_status(
    workflow_id: str,
    status_data: WorkflowStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update workflow status

    Args:
        workflow_id: Workflow ID
        status_data: New status

    Returns:
        Updated workflow
    """
    service = WorkflowService(db)

    workflow = await service.update_status(
        workflow_id, current_user.id, status_data.status
    )

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found or access denied",
        )

    return WorkflowResponse.model_validate(workflow)


@router.post("/{workflow_id}/duplicate", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def duplicate_workflow(
    workflow_id: str,
    duplicate_data: WorkflowDuplicate = WorkflowDuplicate(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Duplicate a workflow

    Args:
        workflow_id: Workflow ID to duplicate
        duplicate_data: Duplication options

    Returns:
        Duplicated workflow
    """
    service = WorkflowService(db)

    workflow = await service.duplicate_workflow(
        workflow_id, current_user.id, duplicate_data.name
    )

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found or access denied",
        )

    return WorkflowResponse.model_validate(workflow)


@router.post("/{workflow_id}/validate", response_model=WorkflowValidationResult)
async def validate_workflow(
    workflow_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Validate workflow structure

    Args:
        workflow_id: Workflow ID

    Returns:
        Validation result with errors and warnings
    """
    service = WorkflowService(db)

    workflow = await service.get_workflow(workflow_id, current_user.id)

    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found",
        )

    is_valid, errors, warnings = await service.validate_workflow(workflow)

    return WorkflowValidationResult(
        is_valid=is_valid,
        errors=errors,
        warnings=warnings,
    )


@router.get("/{workflow_id}/versions", response_model=List[WorkflowResponse])
async def get_workflow_versions(
    workflow_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all versions of a workflow

    Args:
        workflow_id: Workflow ID

    Returns:
        List of workflow versions
    """
    service = WorkflowService(db)

    versions = await service.get_workflow_versions(workflow_id, current_user.id)

    return [WorkflowResponse.model_validate(v) for v in versions]
