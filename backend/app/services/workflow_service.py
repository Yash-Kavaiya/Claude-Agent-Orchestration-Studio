"""
Workflow Service
Business logic for workflow management
"""
import uuid
from typing import Optional, List, Tuple
from sqlalchemy import select, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger

from app.models.workflow import Workflow
from app.models.agent import Agent
from app.schemas.workflow import (
    WorkflowCreate,
    WorkflowUpdate,
    WorkflowSearchParams,
)


class WorkflowService:
    """
    Service for managing workflows
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_workflow(
        self, user_id: uuid.UUID, data: WorkflowCreate
    ) -> Workflow:
        """
        Create a new workflow

        Args:
            user_id: User ID
            data: Workflow creation data

        Returns:
            Created workflow
        """
        # Convert Pydantic models to dicts for JSONB storage
        nodes = [node.model_dump() for node in data.nodes]
        connections = [conn.model_dump() for conn in data.connections]

        # Create workflow
        workflow = Workflow(
            user_id=user_id,
            name=data.name,
            description=data.description,
            status="draft",
            nodes=nodes,
            connections=connections,
            settings=data.settings,
            tags=data.tags,
            is_public=data.is_public,
        )

        # Validate structure
        is_valid, error = workflow.validate_structure()
        if not is_valid:
            raise ValueError(f"Invalid workflow structure: {error}")

        self.db.add(workflow)
        await self.db.commit()
        await self.db.refresh(workflow)

        logger.info(f"Created workflow {workflow.id} for user {user_id}")
        return workflow

    async def get_workflow(
        self, workflow_id: uuid.UUID, user_id: uuid.UUID
    ) -> Optional[Workflow]:
        """
        Get workflow by ID

        Args:
            workflow_id: Workflow ID
            user_id: User ID (for ownership check)

        Returns:
            Workflow if found and owned by user, None otherwise
        """
        stmt = select(Workflow).where(
            and_(
                Workflow.id == workflow_id,
                or_(Workflow.user_id == user_id, Workflow.is_public == True),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_workflow(
        self, workflow_id: uuid.UUID, user_id: uuid.UUID, data: WorkflowUpdate
    ) -> Optional[Workflow]:
        """
        Update workflow

        Args:
            workflow_id: Workflow ID
            user_id: User ID (for ownership check)
            data: Workflow update data

        Returns:
            Updated workflow if found and updated, None otherwise
        """
        # Get workflow
        workflow = await self.get_workflow(workflow_id, user_id)
        if not workflow or workflow.user_id != user_id:
            return None

        # Update fields
        if data.name is not None:
            workflow.name = data.name
        if data.description is not None:
            workflow.description = data.description
        if data.nodes is not None:
            workflow.nodes = [node.model_dump() for node in data.nodes]
        if data.connections is not None:
            workflow.connections = [conn.model_dump() for conn in data.connections]
        if data.settings is not None:
            workflow.settings = data.settings
        if data.tags is not None:
            workflow.tags = data.tags
        if data.is_public is not None:
            workflow.is_public = data.is_public

        # Validate structure
        is_valid, error = workflow.validate_structure()
        if not is_valid:
            raise ValueError(f"Invalid workflow structure: {error}")

        await self.db.commit()
        await self.db.refresh(workflow)

        logger.info(f"Updated workflow {workflow_id}")
        return workflow

    async def delete_workflow(
        self, workflow_id: uuid.UUID, user_id: uuid.UUID
    ) -> bool:
        """
        Delete workflow

        Args:
            workflow_id: Workflow ID
            user_id: User ID (for ownership check)

        Returns:
            True if deleted, False otherwise
        """
        workflow = await self.get_workflow(workflow_id, user_id)
        if not workflow or workflow.user_id != user_id:
            return False

        await self.db.delete(workflow)
        await self.db.commit()

        logger.info(f"Deleted workflow {workflow_id}")
        return True

    async def list_workflows(
        self, user_id: uuid.UUID, params: WorkflowSearchParams
    ) -> Tuple[List[Workflow], int]:
        """
        List workflows with search and pagination

        Args:
            user_id: User ID
            params: Search parameters

        Returns:
            Tuple of (workflows, total_count)
        """
        # Build query
        query = select(Workflow).where(
            or_(Workflow.user_id == user_id, Workflow.is_public == True)
        )

        # Apply filters
        if params.status:
            query = query.where(Workflow.status == params.status)

        if params.is_public is not None:
            query = query.where(Workflow.is_public == params.is_public)

        if params.tags:
            # Match any of the provided tags
            query = query.where(Workflow.tags.overlap(params.tags))

        if params.query:
            # Search in name and description
            search_term = f"%{params.query}%"
            query = query.where(
                or_(
                    Workflow.name.ilike(search_term),
                    Workflow.description.ilike(search_term),
                )
            )

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar_one()

        # Apply pagination and ordering
        query = query.order_by(Workflow.updated_at.desc())
        query = query.limit(params.limit).offset(params.offset)

        # Execute query
        result = await self.db.execute(query)
        workflows = result.scalars().all()

        return list(workflows), total

    async def update_status(
        self, workflow_id: uuid.UUID, user_id: uuid.UUID, status: str
    ) -> Optional[Workflow]:
        """
        Update workflow status

        Args:
            workflow_id: Workflow ID
            user_id: User ID
            status: New status (draft, published, archived)

        Returns:
            Updated workflow if found, None otherwise
        """
        workflow = await self.get_workflow(workflow_id, user_id)
        if not workflow or workflow.user_id != user_id:
            return None

        workflow.status = status
        await self.db.commit()
        await self.db.refresh(workflow)

        logger.info(f"Updated workflow {workflow_id} status to {status}")
        return workflow

    async def duplicate_workflow(
        self, workflow_id: uuid.UUID, user_id: uuid.UUID, new_name: Optional[str] = None
    ) -> Optional[Workflow]:
        """
        Duplicate a workflow

        Args:
            workflow_id: Workflow ID to duplicate
            user_id: User ID
            new_name: Optional new name for duplicated workflow

        Returns:
            Duplicated workflow if successful, None otherwise
        """
        # Get original workflow
        original = await self.get_workflow(workflow_id, user_id)
        if not original:
            return None

        # Create duplicate
        duplicate_name = new_name or f"{original.name} (Copy)"

        duplicate = Workflow(
            user_id=user_id,
            name=duplicate_name,
            description=original.description,
            status="draft",
            nodes=original.nodes.copy() if original.nodes else [],
            connections=original.connections.copy() if original.connections else [],
            settings=original.settings.copy() if original.settings else {},
            tags=original.tags.copy() if original.tags else [],
            is_public=False,  # Always private for duplicates
            parent_workflow_id=original.id,
        )

        self.db.add(duplicate)
        await self.db.commit()
        await self.db.refresh(duplicate)

        logger.info(f"Duplicated workflow {workflow_id} to {duplicate.id}")
        return duplicate

    async def get_workflow_agents(
        self, workflow_id: uuid.UUID, user_id: uuid.UUID
    ) -> List[Agent]:
        """
        Get all agents for a workflow

        Args:
            workflow_id: Workflow ID
            user_id: User ID

        Returns:
            List of agents
        """
        # Verify workflow access
        workflow = await self.get_workflow(workflow_id, user_id)
        if not workflow:
            return []

        # Get agents
        stmt = select(Agent).where(Agent.workflow_id == workflow_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def validate_workflow(
        self, workflow: Workflow
    ) -> Tuple[bool, List[str], List[str]]:
        """
        Validate workflow structure and configuration

        Args:
            workflow: Workflow to validate

        Returns:
            Tuple of (is_valid, errors, warnings)
        """
        errors = []
        warnings = []

        # Validate basic structure
        is_valid, error = workflow.validate_structure()
        if not is_valid:
            errors.append(error)

        # Check for empty workflow
        if not workflow.nodes:
            warnings.append("Workflow has no nodes")

        # Check for disconnected nodes
        if workflow.connections:
            connected_nodes = set()
            for conn in workflow.connections:
                if isinstance(conn, dict):
                    connected_nodes.add(conn.get("source"))
                    connected_nodes.add(conn.get("target"))

            all_node_ids = {node.get("id") for node in workflow.nodes if isinstance(node, dict)}
            disconnected = all_node_ids - connected_nodes

            if disconnected and len(all_node_ids) > 1:
                warnings.append(f"Disconnected nodes found: {', '.join(disconnected)}")

        # Check for circular dependencies (basic check)
        # TODO: Implement more sophisticated cycle detection

        return len(errors) == 0, errors, warnings

    async def get_workflow_versions(
        self, workflow_id: uuid.UUID, user_id: uuid.UUID
    ) -> List[Workflow]:
        """
        Get all versions of a workflow

        Args:
            workflow_id: Workflow ID
            user_id: User ID

        Returns:
            List of workflow versions
        """
        stmt = select(Workflow).where(
            and_(
                or_(
                    Workflow.id == workflow_id,
                    Workflow.parent_workflow_id == workflow_id,
                ),
                Workflow.user_id == user_id,
            )
        ).order_by(Workflow.created_at.desc())

        result = await self.db.execute(stmt)
        return list(result.scalars().all())
