"""
WebSocket Connection Manager
Handles WebSocket connections, subscriptions, and broadcasting
"""
import json
import uuid
from typing import Dict, Set, Optional, Any
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
import asyncio
from collections import defaultdict

from app.core.logging import get_logger

logger = get_logger(__name__)


class ConnectionManager:
    """
    WebSocket connection manager

    Manages WebSocket connections, user subscriptions, and message broadcasting.
    Supports room-based subscriptions for workflow and execution updates.
    """

    def __init__(self):
        # Active connections: {connection_id: WebSocket}
        self.active_connections: Dict[str, WebSocket] = {}

        # User connections: {user_id: Set[connection_id]}
        self.user_connections: Dict[str, Set[str]] = defaultdict(set)

        # Room subscriptions: {room_id: Set[connection_id]}
        self.room_subscriptions: Dict[str, Set[str]] = defaultdict(set)

        # Connection metadata: {connection_id: {user_id, connected_at, ...}}
        self.connection_metadata: Dict[str, Dict[str, Any]] = {}

    async def connect(
        self, websocket: WebSocket, user_id: str, connection_id: Optional[str] = None
    ) -> str:
        """
        Accept a new WebSocket connection

        Args:
            websocket: WebSocket instance
            user_id: User ID
            connection_id: Optional custom connection ID

        Returns:
            str: Connection ID
        """
        await websocket.accept()

        if connection_id is None:
            connection_id = str(uuid.uuid4())

        self.active_connections[connection_id] = websocket
        self.user_connections[user_id].add(connection_id)

        self.connection_metadata[connection_id] = {
            "user_id": user_id,
            "connected_at": datetime.utcnow().isoformat(),
            "subscriptions": set(),
        }

        logger.info(f"WebSocket connected: {connection_id} (user: {user_id})")

        # Send connection confirmation
        await self.send_personal_message(
            connection_id,
            {
                "type": "connection",
                "event": "connected",
                "connection_id": connection_id,
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

        return connection_id

    async def disconnect(self, connection_id: str):
        """
        Disconnect a WebSocket connection

        Args:
            connection_id: Connection ID to disconnect
        """
        if connection_id not in self.active_connections:
            return

        # Remove from active connections
        websocket = self.active_connections.pop(connection_id, None)

        # Remove from user connections
        metadata = self.connection_metadata.get(connection_id, {})
        user_id = metadata.get("user_id")
        if user_id and user_id in self.user_connections:
            self.user_connections[user_id].discard(connection_id)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]

        # Remove from room subscriptions
        subscriptions = metadata.get("subscriptions", set())
        for room_id in subscriptions:
            self.room_subscriptions[room_id].discard(connection_id)
            if not self.room_subscriptions[room_id]:
                del self.room_subscriptions[room_id]

        # Remove metadata
        self.connection_metadata.pop(connection_id, None)

        logger.info(f"WebSocket disconnected: {connection_id} (user: {user_id})")

        # Close websocket if still open
        if websocket:
            try:
                await websocket.close()
            except Exception as e:
                logger.error(f"Error closing websocket {connection_id}: {str(e)}")

    async def subscribe_to_room(self, connection_id: str, room_id: str):
        """
        Subscribe a connection to a room

        Args:
            connection_id: Connection ID
            room_id: Room ID (e.g., workflow:{workflow_id}, execution:{execution_id})
        """
        if connection_id not in self.active_connections:
            return

        self.room_subscriptions[room_id].add(connection_id)

        if connection_id in self.connection_metadata:
            self.connection_metadata[connection_id]["subscriptions"].add(room_id)

        logger.info(f"Connection {connection_id} subscribed to room: {room_id}")

        # Send subscription confirmation
        await self.send_personal_message(
            connection_id,
            {
                "type": "subscription",
                "event": "subscribed",
                "room_id": room_id,
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

    async def unsubscribe_from_room(self, connection_id: str, room_id: str):
        """
        Unsubscribe a connection from a room

        Args:
            connection_id: Connection ID
            room_id: Room ID
        """
        if room_id in self.room_subscriptions:
            self.room_subscriptions[room_id].discard(connection_id)
            if not self.room_subscriptions[room_id]:
                del self.room_subscriptions[room_id]

        if connection_id in self.connection_metadata:
            self.connection_metadata[connection_id]["subscriptions"].discard(room_id)

        logger.info(f"Connection {connection_id} unsubscribed from room: {room_id}")

        # Send unsubscription confirmation
        await self.send_personal_message(
            connection_id,
            {
                "type": "subscription",
                "event": "unsubscribed",
                "room_id": room_id,
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

    async def send_personal_message(self, connection_id: str, message: dict):
        """
        Send a message to a specific connection

        Args:
            connection_id: Connection ID
            message: Message data (will be JSON encoded)
        """
        websocket = self.active_connections.get(connection_id)
        if websocket:
            try:
                await websocket.send_json(message)
            except WebSocketDisconnect:
                await self.disconnect(connection_id)
            except Exception as e:
                logger.error(f"Error sending message to {connection_id}: {str(e)}")
                await self.disconnect(connection_id)

    async def send_to_user(self, user_id: str, message: dict):
        """
        Send a message to all connections of a user

        Args:
            user_id: User ID
            message: Message data (will be JSON encoded)
        """
        connection_ids = self.user_connections.get(user_id, set()).copy()

        for connection_id in connection_ids:
            await self.send_personal_message(connection_id, message)

    async def broadcast_to_room(self, room_id: str, message: dict):
        """
        Broadcast a message to all connections in a room

        Args:
            room_id: Room ID
            message: Message data (will be JSON encoded)
        """
        connection_ids = self.room_subscriptions.get(room_id, set()).copy()

        if not connection_ids:
            logger.debug(f"No subscribers in room: {room_id}")
            return

        logger.info(f"Broadcasting to room {room_id}: {len(connection_ids)} connections")

        for connection_id in connection_ids:
            await self.send_personal_message(connection_id, message)

    async def broadcast_to_all(self, message: dict):
        """
        Broadcast a message to all active connections

        Args:
            message: Message data (will be JSON encoded)
        """
        connection_ids = list(self.active_connections.keys())

        for connection_id in connection_ids:
            await self.send_personal_message(connection_id, message)

    def get_connection_count(self) -> int:
        """Get total number of active connections"""
        return len(self.active_connections)

    def get_user_connection_count(self, user_id: str) -> int:
        """Get number of connections for a specific user"""
        return len(self.user_connections.get(user_id, set()))

    def get_room_subscriber_count(self, room_id: str) -> int:
        """Get number of subscribers in a room"""
        return len(self.room_subscriptions.get(room_id, set()))

    def get_connection_info(self, connection_id: str) -> Optional[Dict[str, Any]]:
        """Get connection metadata"""
        return self.connection_metadata.get(connection_id)

    def get_active_rooms(self) -> list[str]:
        """Get list of active room IDs"""
        return list(self.room_subscriptions.keys())

    async def handle_ping(self, connection_id: str):
        """
        Handle ping message from client

        Args:
            connection_id: Connection ID
        """
        await self.send_personal_message(
            connection_id,
            {
                "type": "pong",
                "timestamp": datetime.utcnow().isoformat(),
            },
        )


# Global connection manager instance
manager = ConnectionManager()


async def broadcast_execution_update(
    execution_id: str,
    status: str,
    progress_percentage: float,
    completed_nodes: int,
    total_nodes: int,
    current_node: Optional[str] = None,
):
    """
    Broadcast execution status update to subscribers

    Args:
        execution_id: Execution ID
        status: Execution status
        progress_percentage: Progress percentage
        completed_nodes: Number of completed nodes
        total_nodes: Total number of nodes
        current_node: Current node ID
    """
    message = {
        "type": "execution_update",
        "event": "status_changed",
        "data": {
            "execution_id": execution_id,
            "status": status,
            "progress_percentage": progress_percentage,
            "completed_nodes": completed_nodes,
            "total_nodes": total_nodes,
            "current_node": current_node,
        },
        "timestamp": datetime.utcnow().isoformat(),
    }

    room_id = f"execution:{execution_id}"
    await manager.broadcast_to_room(room_id, message)


async def broadcast_node_update(
    execution_id: str,
    node_execution_id: str,
    node_id: str,
    node_name: str,
    status: str,
    message_text: Optional[str] = None,
):
    """
    Broadcast node execution update to subscribers

    Args:
        execution_id: Workflow execution ID
        node_execution_id: Node execution ID
        node_id: Node ID
        node_name: Node name
        status: Node status
        message_text: Optional message
    """
    message = {
        "type": "node_update",
        "event": "status_changed",
        "data": {
            "execution_id": execution_id,
            "node_execution_id": node_execution_id,
            "node_id": node_id,
            "node_name": node_name,
            "status": status,
            "message": message_text,
        },
        "timestamp": datetime.utcnow().isoformat(),
    }

    room_id = f"execution:{execution_id}"
    await manager.broadcast_to_room(room_id, message)


async def broadcast_workflow_update(workflow_id: str, event: str, data: dict):
    """
    Broadcast workflow update to subscribers

    Args:
        workflow_id: Workflow ID
        event: Event type (created, updated, deleted, published)
        data: Event data
    """
    message = {
        "type": "workflow_update",
        "event": event,
        "data": data,
        "timestamp": datetime.utcnow().isoformat(),
    }

    room_id = f"workflow:{workflow_id}"
    await manager.broadcast_to_room(room_id, message)
