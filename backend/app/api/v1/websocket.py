"""
WebSocket API Endpoints
Handles WebSocket connections for real-time updates
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, status
from fastapi.exceptions import HTTPException
from typing import Optional
import json

from app.core.websocket import manager
from app.core.logging import get_logger
from app.dependencies import get_current_user_ws
from app.models.user import User

logger = get_logger(__name__)

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token"),
):
    """
    WebSocket endpoint for real-time updates

    Query Parameters:
        - token: JWT access token for authentication

    Message Format (Client -> Server):
        {
            "type": "subscribe|unsubscribe|ping",
            "room_id": "execution:123|workflow:456",  // For subscribe/unsubscribe
        }

    Message Format (Server -> Client):
        {
            "type": "connection|subscription|execution_update|node_update|workflow_update|pong",
            "event": "connected|subscribed|status_changed|...",
            "data": {...},
            "timestamp": "2024-01-01T00:00:00"
        }

    Room IDs:
        - execution:{execution_id} - Subscribe to execution updates
        - workflow:{workflow_id} - Subscribe to workflow updates
        - user:{user_id} - Subscribe to user-specific updates
    """
    connection_id = None

    try:
        # Authenticate user from token
        from app.services.auth_service import AuthService
        from app.db.session import async_session_maker

        async with async_session_maker() as session:
            auth_service = AuthService(session)
            user = await auth_service.get_user_from_token(token)

            if user is None:
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return

        # Connect to WebSocket manager
        connection_id = await manager.connect(websocket, str(user.id))

        # Auto-subscribe to user's personal room
        user_room_id = f"user:{user.id}"
        await manager.subscribe_to_room(connection_id, user_room_id)

        # Main message loop
        while True:
            try:
                # Receive message from client
                data = await websocket.receive_text()
                message = json.loads(data)

                message_type = message.get("type")

                if message_type == "subscribe":
                    # Subscribe to a room
                    room_id = message.get("room_id")
                    if room_id:
                        # Validate room access
                        if await _validate_room_access(room_id, user):
                            await manager.subscribe_to_room(connection_id, room_id)
                        else:
                            await manager.send_personal_message(
                                connection_id,
                                {
                                    "type": "error",
                                    "message": "Access denied to room",
                                    "room_id": room_id,
                                },
                            )

                elif message_type == "unsubscribe":
                    # Unsubscribe from a room
                    room_id = message.get("room_id")
                    if room_id:
                        await manager.unsubscribe_from_room(connection_id, room_id)

                elif message_type == "ping":
                    # Handle ping/pong for keepalive
                    await manager.handle_ping(connection_id)

                else:
                    # Unknown message type
                    await manager.send_personal_message(
                        connection_id,
                        {
                            "type": "error",
                            "message": f"Unknown message type: {message_type}",
                        },
                    )

            except json.JSONDecodeError:
                logger.error(f"Invalid JSON received from {connection_id}")
                await manager.send_personal_message(
                    connection_id,
                    {
                        "type": "error",
                        "message": "Invalid JSON format",
                    },
                )

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {connection_id}")

    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")

    finally:
        # Cleanup connection
        if connection_id:
            await manager.disconnect(connection_id)


async def _validate_room_access(room_id: str, user: User) -> bool:
    """
    Validate if user has access to a room

    Args:
        room_id: Room ID (e.g., "execution:123", "workflow:456")
        user: User instance

    Returns:
        bool: True if user has access
    """
    try:
        # Parse room ID
        room_type, resource_id = room_id.split(":", 1)

        # User's own room - always allowed
        if room_type == "user" and resource_id == str(user.id):
            return True

        # Execution room - check if user owns the execution
        if room_type == "execution":
            from app.db.session import async_session_maker
            from app.services.execution_service import ExecutionService
            import uuid

            async with async_session_maker() as session:
                service = ExecutionService(session)
                execution = await service.get_execution(
                    uuid.UUID(resource_id), user.id
                )
                return execution is not None

        # Workflow room - check if user owns the workflow
        if room_type == "workflow":
            from app.db.session import async_session_maker
            from app.services.workflow_service import WorkflowService
            import uuid

            async with async_session_maker() as session:
                service = WorkflowService(session)
                workflow = await service.get_workflow(
                    uuid.UUID(resource_id), user.id
                )
                return workflow is not None

        # Unknown room type
        return False

    except (ValueError, IndexError):
        logger.error(f"Invalid room ID format: {room_id}")
        return False
    except Exception as e:
        logger.error(f"Error validating room access: {str(e)}")
        return False


@router.get("/ws/stats")
async def get_websocket_stats(current_user: User = Depends(get_current_user_ws)):
    """
    Get WebSocket statistics (for debugging)

    Returns:
        WebSocket statistics
    """
    return {
        "total_connections": manager.get_connection_count(),
        "user_connections": manager.get_user_connection_count(str(current_user.id)),
        "active_rooms": len(manager.get_active_rooms()),
    }


@router.get("/ws/rooms")
async def get_active_rooms(current_user: User = Depends(get_current_user_ws)):
    """
    Get list of active rooms (for debugging)

    Returns:
        List of active room IDs
    """
    return {
        "active_rooms": manager.get_active_rooms(),
        "total_rooms": len(manager.get_active_rooms()),
    }
