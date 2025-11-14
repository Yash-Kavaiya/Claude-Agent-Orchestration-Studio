# WebSocket Real-time Updates Guide

This guide explains how to use the WebSocket feature for real-time workflow execution updates.

## Overview

The WebSocket implementation provides real-time updates for:
- Workflow execution status changes
- Node execution progress
- Workflow modifications
- User-specific notifications

## Connection

### Endpoint
```
ws://localhost:8000/api/v1/ws?token=<JWT_ACCESS_TOKEN>
```

### Authentication
Pass your JWT access token as a query parameter:
```javascript
const ws = new WebSocket('ws://localhost:8000/api/v1/ws?token=' + accessToken);
```

## Message Format

### Client -> Server

#### Subscribe to a Room
```json
{
  "type": "subscribe",
  "room_id": "execution:123e4567-e89b-12d3-a456-426614174000"
}
```

#### Unsubscribe from a Room
```json
{
  "type": "unsubscribe",
  "room_id": "execution:123e4567-e89b-12d3-a456-426614174000"
}
```

#### Ping (Keepalive)
```json
{
  "type": "ping"
}
```

### Server -> Client

#### Connection Confirmation
```json
{
  "type": "connection",
  "event": "connected",
  "connection_id": "abc-123-def",
  "timestamp": "2024-01-01T00:00:00"
}
```

#### Subscription Confirmation
```json
{
  "type": "subscription",
  "event": "subscribed",
  "room_id": "execution:123e4567-e89b-12d3-a456-426614174000",
  "timestamp": "2024-01-01T00:00:00"
}
```

#### Execution Status Update
```json
{
  "type": "execution_update",
  "event": "status_changed",
  "data": {
    "execution_id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "running",
    "progress_percentage": 45.5,
    "completed_nodes": 3,
    "total_nodes": 7,
    "current_node": "node-3"
  },
  "timestamp": "2024-01-01T00:00:00"
}
```

#### Node Execution Update
```json
{
  "type": "node_update",
  "event": "status_changed",
  "data": {
    "execution_id": "123e4567-e89b-12d3-a456-426614174000",
    "node_execution_id": "abc-def-ghi",
    "node_id": "node-1",
    "node_name": "Customer Support Agent",
    "status": "running",
    "message": "Processing customer inquiry..."
  },
  "timestamp": "2024-01-01T00:00:00"
}
```

#### Pong Response
```json
{
  "type": "pong",
  "timestamp": "2024-01-01T00:00:00"
}
```

#### Error
```json
{
  "type": "error",
  "message": "Access denied to room",
  "room_id": "execution:123e4567-e89b-12d3-a456-426614174000"
}
```

## Room Types

### Execution Room
Subscribe to workflow execution updates:
```
execution:{execution_id}
```

Example:
```json
{
  "type": "subscribe",
  "room_id": "execution:123e4567-e89b-12d3-a456-426614174000"
}
```

### Workflow Room
Subscribe to workflow modification updates:
```
workflow:{workflow_id}
```

Example:
```json
{
  "type": "subscribe",
  "room_id": "workflow:123e4567-e89b-12d3-a456-426614174000"
}
```

### User Room
Automatically subscribed on connection. Receives user-specific updates:
```
user:{user_id}
```

## JavaScript Example

```javascript
class WorkflowWebSocket {
  constructor(accessToken) {
    this.token = accessToken;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    this.ws = new WebSocket(`ws://localhost:8000/api/v1/ws?token=${this.token}`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.reconnect();
    };
  }

  handleMessage(message) {
    switch (message.type) {
      case 'connection':
        console.log('Connected with ID:', message.connection_id);
        break;

      case 'execution_update':
        console.log('Execution update:', message.data);
        // Update UI with execution progress
        this.updateExecutionUI(message.data);
        break;

      case 'node_update':
        console.log('Node update:', message.data);
        // Update UI with node status
        this.updateNodeUI(message.data);
        break;

      case 'subscription':
        console.log('Subscribed to:', message.room_id);
        break;

      case 'pong':
        console.log('Pong received');
        break;

      case 'error':
        console.error('Error:', message.message);
        break;
    }
  }

  subscribeToExecution(executionId) {
    this.send({
      type: 'subscribe',
      room_id: `execution:${executionId}`
    });
  }

  unsubscribeFromExecution(executionId) {
    this.send({
      type: 'unsubscribe',
      room_id: `execution:${executionId}`
    });
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  ping() {
    this.send({ type: 'ping' });
  }

  reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), delay);
    }
  }

  updateExecutionUI(data) {
    // Update your UI with execution progress
    const progressBar = document.getElementById('execution-progress');
    if (progressBar) {
      progressBar.style.width = `${data.progress_percentage}%`;
      progressBar.textContent = `${Math.round(data.progress_percentage)}%`;
    }

    const statusElement = document.getElementById('execution-status');
    if (statusElement) {
      statusElement.textContent = data.status;
      statusElement.className = `status-${data.status}`;
    }
  }

  updateNodeUI(data) {
    // Update your UI with node status
    const nodeElement = document.getElementById(`node-${data.node_id}`);
    if (nodeElement) {
      nodeElement.className = `node status-${data.status}`;
      nodeElement.querySelector('.status').textContent = data.status;
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Usage
const wsClient = new WorkflowWebSocket(accessToken);
wsClient.connect();

// Subscribe to execution updates
wsClient.subscribeToExecution('123e4567-e89b-12d3-a456-426614174000');

// Keepalive ping every 30 seconds
setInterval(() => wsClient.ping(), 30000);
```

## React Example

```typescript
import { useEffect, useRef, useState } from 'react';

interface ExecutionUpdate {
  execution_id: string;
  status: string;
  progress_percentage: number;
  completed_nodes: number;
  total_nodes: number;
}

export function useWorkflowWebSocket(accessToken: string, executionId: string) {
  const ws = useRef<WebSocket | null>(null);
  const [executionStatus, setExecutionStatus] = useState<ExecutionUpdate | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to WebSocket
    ws.current = new WebSocket(`ws://localhost:8000/api/v1/ws?token=${accessToken}`);

    ws.current.onopen = () => {
      setIsConnected(true);
      // Subscribe to execution updates
      ws.current?.send(JSON.stringify({
        type: 'subscribe',
        room_id: `execution:${executionId}`
      }));
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === 'execution_update') {
        setExecutionStatus(message.data);
      }
    };

    ws.current.onclose = () => {
      setIsConnected(false);
    };

    // Cleanup on unmount
    return () => {
      ws.current?.close();
    };
  }, [accessToken, executionId]);

  return { executionStatus, isConnected };
}
```

## Access Control

- Users can only subscribe to rooms for workflows and executions they own
- Attempting to subscribe to unauthorized rooms will result in an error message
- User rooms are automatically subscribed on connection

## Best Practices

1. **Keepalive**: Send ping messages every 30-60 seconds to keep the connection alive
2. **Reconnection**: Implement exponential backoff for reconnection attempts
3. **Error Handling**: Handle connection errors gracefully
4. **Unsubscribe**: Unsubscribe from rooms when no longer needed
5. **Token Refresh**: Reconnect with a new token before the current one expires

## Monitoring

### Get WebSocket Statistics
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/v1/ws/stats
```

Response:
```json
{
  "total_connections": 5,
  "user_connections": 2,
  "active_rooms": 3
}
```

### Get Active Rooms
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/v1/ws/rooms
```

Response:
```json
{
  "active_rooms": [
    "execution:123e4567-e89b-12d3-a456-426614174000",
    "workflow:abc-def-ghi",
    "user:user-id"
  ],
  "total_rooms": 3
}
```

## Troubleshooting

### Connection Refused
- Ensure the backend server is running
- Check that WebSocket support is enabled in your reverse proxy (if using one)
- Verify the token is valid and not expired

### No Messages Received
- Check that you've subscribed to the correct room
- Verify you have access to the resource (workflow/execution)
- Check server logs for errors

### Frequent Disconnections
- Implement ping/pong keepalive
- Check network stability
- Verify token validity

## Production Considerations

For production deployments:

1. **Load Balancing**: Use Redis pub/sub for multi-worker support (coming soon)
2. **SSL/TLS**: Use `wss://` for secure WebSocket connections
3. **Rate Limiting**: Implement connection and message rate limits
4. **Monitoring**: Track connection counts, message rates, and errors
5. **Scaling**: Consider using a dedicated WebSocket server for high traffic
