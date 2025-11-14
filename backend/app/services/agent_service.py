"""
Agent Service
Business logic for agent management
"""
import uuid
from typing import Optional, List, Tuple
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.models.agent import Agent
from app.models.workflow import Workflow
from app.schemas.agent import AgentCreate, AgentUpdate


class AgentService:
    """
    Service for managing AI agents
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_agent(
        self, workflow_id: uuid.UUID, user_id: uuid.UUID, data: AgentCreate
    ) -> Optional[Agent]:
        """
        Create a new agent

        Args:
            workflow_id: Workflow ID
            user_id: User ID
            data: Agent creation data

        Returns:
            Created agent if successful, None if workflow not found
        """
        # Verify workflow exists and user has access
        stmt = select(Workflow).where(
            and_(Workflow.id == workflow_id, Workflow.user_id == user_id)
        )
        result = await self.db.execute(stmt)
        workflow = result.scalar_one_or_none()

        if not workflow:
            return None

        # Create agent
        agent = Agent(
            workflow_id=workflow_id,
            user_id=user_id,
            node_id=data.node_id,
            name=data.name,
            type=data.type,
            system_prompt=data.system_prompt,
            model=data.model,
            temperature=data.temperature,
            max_tokens=data.max_tokens,
            tools=data.tools,
            permissions=data.permissions,
            memory_config=data.memory_config,
            sub_agents=data.sub_agents,
            metadata=data.metadata,
        )

        # Validate configuration
        is_valid, error = agent.validate_configuration()
        if not is_valid:
            raise ValueError(f"Invalid agent configuration: {error}")

        self.db.add(agent)
        await self.db.commit()
        await self.db.refresh(agent)

        logger.info(f"Created agent {agent.id} for workflow {workflow_id}")
        return agent

    async def get_agent(
        self, agent_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[Agent]:
        """
        Get agent by ID

        Args:
            agent_id: Agent ID
            user_id: User ID (for ownership check)

        Returns:
            Agent if found and owned by user, None otherwise
        """
        stmt = select(Agent).where(
            and_(Agent.id == agent_id, Agent.user_id == user_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_agent(
        self, agent_id: uuid.UUID, user_id: uuid.UUID, data: AgentUpdate
    ) -> Optional[Agent]:
        """
        Update agent

        Args:
            agent_id: Agent ID
            user_id: User ID (for ownership check)
            data: Agent update data

        Returns:
            Updated agent if found and updated, None otherwise
        """
        # Get agent
        agent = await self.get_agent(agent_id, user_id)
        if not agent:
            return None

        # Update fields
        if data.name is not None:
            agent.name = data.name
        if data.type is not None:
            agent.type = data.type
        if data.system_prompt is not None:
            agent.system_prompt = data.system_prompt
        if data.model is not None:
            agent.model = data.model
        if data.temperature is not None:
            agent.temperature = data.temperature
        if data.max_tokens is not None:
            agent.max_tokens = data.max_tokens
        if data.tools is not None:
            agent.tools = data.tools
        if data.permissions is not None:
            agent.permissions = data.permissions
        if data.memory_config is not None:
            agent.memory_config = data.memory_config
        if data.sub_agents is not None:
            agent.sub_agents = data.sub_agents
        if data.metadata is not None:
            agent.metadata = data.metadata

        # Validate configuration
        is_valid, error = agent.validate_configuration()
        if not is_valid:
            raise ValueError(f"Invalid agent configuration: {error}")

        await self.db.commit()
        await self.db.refresh(agent)

        logger.info(f"Updated agent {agent_id}")
        return agent

    async def delete_agent(
        self, agent_id: uuid.UUID, user_id: uuid.UUID
    ) -> bool:
        """
        Delete agent

        Args:
            agent_id: Agent ID
            user_id: User ID (for ownership check)

        Returns:
            True if deleted, False otherwise
        """
        agent = await self.get_agent(agent_id, user_id)
        if not agent:
            return False

        await self.db.delete(agent)
        await self.db.commit()

        logger.info(f"Deleted agent {agent_id}")
        return True

    async def list_agents(
        self,
        user_id: uuid.UUID,
        workflow_id: Optional[uuid.UUID] = None,
        agent_type: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> Tuple[List[Agent], int]:
        """
        List agents with filtering and pagination

        Args:
            user_id: User ID
            workflow_id: Optional workflow ID filter
            agent_type: Optional agent type filter
            limit: Results per page
            offset: Pagination offset

        Returns:
            Tuple of (agents, total_count)
        """
        # Build query
        query = select(Agent).where(Agent.user_id == user_id)

        # Apply filters
        if workflow_id:
            query = query.where(Agent.workflow_id == workflow_id)

        if agent_type:
            query = query.where(Agent.type == agent_type)

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        # Apply pagination and ordering
        query = query.order_by(Agent.created_at.desc())
        query = query.limit(limit).offset(offset)

        # Execute query
        result = await self.db.execute(query)
        agents = result.scalars().all()

        return list(agents), total

    async def get_agents_by_workflow(
        self, workflow_id: uuid.UUID, user_id: uuid.UUID
    ) -> List[Agent]:
        """
        Get all agents for a specific workflow

        Args:
            workflow_id: Workflow ID
            user_id: User ID

        Returns:
            List of agents
        """
        stmt = select(Agent).where(
            and_(Agent.workflow_id == workflow_id, Agent.user_id == user_id)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_agent_by_node_id(
        self, workflow_id: uuid.UUID, node_id: str, user_id: uuid.UUID
    ) -> Optional[Agent]:
        """
        Get agent by node ID within a workflow

        Args:
            workflow_id: Workflow ID
            node_id: Node ID from workflow canvas
            user_id: User ID

        Returns:
            Agent if found, None otherwise
        """
        stmt = select(Agent).where(
            and_(
                Agent.workflow_id == workflow_id,
                Agent.node_id == node_id,
                Agent.user_id == user_id,
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def bulk_create_agents(
        self, workflow_id: uuid.UUID, user_id: uuid.UUID, agents_data: List[AgentCreate]
    ) -> List[Agent]:
        """
        Create multiple agents at once

        Args:
            workflow_id: Workflow ID
            user_id: User ID
            agents_data: List of agent creation data

        Returns:
            List of created agents
        """
        # Verify workflow exists
        stmt = select(Workflow).where(
            and_(Workflow.id == workflow_id, Workflow.user_id == user_id)
        )
        result = await self.db.execute(stmt)
        workflow = result.scalar_one_or_none()

        if not workflow:
            return []

        # Create agents
        agents = []
        for data in agents_data:
            agent = Agent(
                workflow_id=workflow_id,
                user_id=user_id,
                node_id=data.node_id,
                name=data.name,
                type=data.type,
                system_prompt=data.system_prompt,
                model=data.model,
                temperature=data.temperature,
                max_tokens=data.max_tokens,
                tools=data.tools,
                permissions=data.permissions,
                memory_config=data.memory_config,
                sub_agents=data.sub_agents,
                metadata=data.metadata,
            )

            # Validate
            is_valid, error = agent.validate_configuration()
            if not is_valid:
                raise ValueError(f"Invalid agent configuration for {data.name}: {error}")

            agents.append(agent)

        # Bulk insert
        self.db.add_all(agents)
        await self.db.commit()

        # Refresh all
        for agent in agents:
            await self.db.refresh(agent)

        logger.info(f"Created {len(agents)} agents for workflow {workflow_id}")
        return agents

    async def bulk_delete_agents(
        self, workflow_id: uuid.UUID, user_id: uuid.UUID
    ) -> int:
        """
        Delete all agents for a workflow

        Args:
            workflow_id: Workflow ID
            user_id: User ID

        Returns:
            Number of agents deleted
        """
        # Get agents
        agents = await self.get_agents_by_workflow(workflow_id, user_id)

        # Delete
        for agent in agents:
            await self.db.delete(agent)

        await self.db.commit()

        logger.info(f"Deleted {len(agents)} agents from workflow {workflow_id}")
        return len(agents)

    async def sync_agents_with_workflow(
        self, workflow: Workflow, user_id: uuid.UUID
    ) -> Tuple[int, int, int]:
        """
        Synchronize agents with workflow nodes

        Creates agents for new nodes, updates existing ones, and removes orphaned agents.

        Args:
            workflow: Workflow object
            user_id: User ID

        Returns:
            Tuple of (created_count, updated_count, deleted_count)
        """
        created = 0
        updated = 0
        deleted = 0

        # Get existing agents
        existing_agents = await self.get_agents_by_workflow(workflow.id, user_id)
        existing_by_node_id = {agent.node_id: agent for agent in existing_agents}

        # Get node IDs from workflow
        workflow_node_ids = {
            node.get("id") for node in workflow.nodes if isinstance(node, dict)
        }

        # Find orphaned agents (agents without corresponding nodes)
        orphaned_node_ids = set(existing_by_node_id.keys()) - workflow_node_ids

        # Delete orphaned agents
        for node_id in orphaned_node_ids:
            agent = existing_by_node_id[node_id]
            await self.db.delete(agent)
            deleted += 1

        if deleted > 0:
            await self.db.commit()

        logger.info(
            f"Synced agents for workflow {workflow.id}: "
            f"created={created}, updated={updated}, deleted={deleted}"
        )

        return created, updated, deleted
