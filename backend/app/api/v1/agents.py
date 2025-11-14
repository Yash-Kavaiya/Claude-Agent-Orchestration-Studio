"""
Agent API Endpoints
Handles agent CRUD operations and management
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_db, get_current_user
from app.services.agent_service import AgentService
from app.schemas.agent import (
    AgentCreate,
    AgentUpdate,
    AgentResponse,
    AgentListResponse,
)
from app.models.user import User

router = APIRouter()


@router.post("", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def create_agent(
    agent_data: AgentCreate,
    workflow_id: str = Query(..., description="Workflow ID"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new agent

    Args:
        agent_data: Agent creation data
        workflow_id: Workflow ID for the agent

    Returns:
        Created agent
    """
    service = AgentService(db)

    try:
        agent = await service.create_agent(workflow_id, current_user.id, agent_data)

        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow not found or access denied",
            )

        return AgentResponse.model_validate(agent)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.get("", response_model=AgentListResponse)
async def list_agents(
    workflow_id: str = Query(None, description="Filter by workflow ID"),
    agent_type: str = Query(None, description="Filter by agent type"),
    limit: int = Query(100, ge=1, le=100, description="Results per page"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    List agents with filtering

    Query Parameters:
        - workflow_id: Filter by workflow
        - agent_type: Filter by type (agent, trigger, action, logic, integration)
        - limit: Results per page (1-100)
        - offset: Pagination offset

    Returns:
        Paginated list of agents
    """
    service = AgentService(db)

    agents, total = await service.list_agents(
        current_user.id,
        workflow_id=workflow_id,
        agent_type=agent_type,
        limit=limit,
        offset=offset,
    )

    return AgentListResponse(
        items=[AgentResponse.model_validate(a) for a in agents],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get agent by ID

    Args:
        agent_id: Agent ID

    Returns:
        Agent details
    """
    service = AgentService(db)

    agent = await service.get_agent(agent_id, current_user.id)

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found",
        )

    return AgentResponse.model_validate(agent)


@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    agent_data: AgentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update agent

    Args:
        agent_id: Agent ID
        agent_data: Agent update data

    Returns:
        Updated agent
    """
    service = AgentService(db)

    try:
        agent = await service.update_agent(agent_id, current_user.id, agent_data)

        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agent not found or access denied",
            )

        return AgentResponse.model_validate(agent)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(
    agent_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete agent

    Args:
        agent_id: Agent ID

    Returns:
        204 No Content on success
    """
    service = AgentService(db)

    success = await service.delete_agent(agent_id, current_user.id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found or access denied",
        )

    return None


@router.get("/workflow/{workflow_id}/agents", response_model=List[AgentResponse])
async def get_workflow_agents(
    workflow_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all agents for a specific workflow

    Args:
        workflow_id: Workflow ID

    Returns:
        List of agents in the workflow
    """
    service = AgentService(db)

    agents = await service.get_agents_by_workflow(workflow_id, current_user.id)

    return [AgentResponse.model_validate(a) for a in agents]


@router.post("/workflow/{workflow_id}/bulk", response_model=List[AgentResponse], status_code=status.HTTP_201_CREATED)
async def bulk_create_agents(
    workflow_id: str,
    agents_data: List[AgentCreate],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Create multiple agents at once

    Args:
        workflow_id: Workflow ID
        agents_data: List of agent creation data

    Returns:
        List of created agents
    """
    service = AgentService(db)

    try:
        agents = await service.bulk_create_agents(
            workflow_id, current_user.id, agents_data
        )

        if not agents:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow not found or access denied",
            )

        return [AgentResponse.model_validate(a) for a in agents]
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
