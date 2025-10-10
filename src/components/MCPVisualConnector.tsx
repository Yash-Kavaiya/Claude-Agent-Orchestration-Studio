import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Server, 
  Bot, 
  ArrowRight, 
  Check, 
  X, 
  Loader2, 
  AlertCircle,
  Link,
  Unlink
} from 'lucide-react';

interface MCPConnection {
  id: string;
  agentId: string;
  serverId: string;
  status: 'connected' | 'connecting' | 'error' | 'disconnected';
  tools: string[];
  created: Date;
}

interface MCPVisualConnectorProps {
  agents: Array<{ id: string; name: string; type: string }>;
  servers: Array<{ id: string; name: string; status: string; tools: Array<{ name: string }> }>;
  connections: MCPConnection[];
  onConnect: (agentId: string, serverId: string) => void;
  onDisconnect: (connectionId: string) => void;
}

export const MCPVisualConnector: React.FC<MCPVisualConnectorProps> = ({
  agents,
  servers,
  connections,
  onConnect,
  onDisconnect
}) => {
  const [draggedItem, setDraggedItem] = useState<{ type: 'agent' | 'server'; id: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleDragStart = (type: 'agent' | 'server', id: string) => {
    setDraggedItem({ type, id });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDropTarget(targetId);
  };

  const handleDrop = (e: React.DragEvent, targetId: string, targetType: 'agent' | 'server') => {
    e.preventDefault();
    
    if (draggedItem) {
      const { type: sourceType, id: sourceId } = draggedItem;
      
      // Only allow agent-to-server or server-to-agent connections
      if (sourceType !== targetType) {
        const agentId = sourceType === 'agent' ? sourceId : targetId;
        const serverId = sourceType === 'server' ? sourceId : targetId;
        
        // Check if connection already exists
        const existingConnection = connections.find(
          conn => conn.agentId === agentId && conn.serverId === serverId
        );
        
        if (!existingConnection) {
          onConnect(agentId, serverId);
        }
      }
    }
    
    handleDragEnd();
  };

  const getConnectionStatus = (agentId: string, serverId: string) => {
    return connections.find(conn => conn.agentId === agentId && conn.serverId === serverId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <Check className="h-3 w-3 text-green-500" />;
      case 'connecting':
        return <Loader2 className="h-3 w-3 text-yellow-500 animate-spin" />;
      case 'error':
        return <X className="h-3 w-3 text-red-500" />;
      default:
        return <AlertCircle className="h-3 w-3 text-gray-400" />;
    }
  };

  // Calculate connection lines
  const connectionLines = connections.map(connection => {
    const agentIndex = agents.findIndex(a => a.id === connection.agentId);
    const serverIndex = servers.findIndex(s => s.id === connection.serverId);
    
    if (agentIndex === -1 || serverIndex === -1) return null;
    
    // Calculate positions (simplified for demo)
    const agentY = 100 + agentIndex * 80;
    const serverY = 100 + serverIndex * 80;
    
    return {
      ...connection,
      path: `M 280 ${agentY} Q 400 ${agentY + (serverY - agentY) / 2} 520 ${serverY}`,
      agentY,
      serverY
    };
  }).filter(Boolean);

  return (
    <div className="h-full bg-background p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">MCP Visual Connector</h2>
        <p className="text-muted-foreground">
          Drag and drop to create connections between agents and MCP servers
        </p>
      </div>

      <div className="flex h-full gap-8">
        {/* Agents Panel */}
        <div className="w-80">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="h-5 w-5 text-primary" />
                Agents ({agents.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {agents.map((agent, index) => (
                <div
                  key={agent.id}
                  draggable
                  onDragStart={() => handleDragStart('agent', agent.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, agent.id)}
                  onDrop={(e) => handleDrop(e, agent.id, 'agent')}
                  className={`p-3 border rounded-lg cursor-move transition-all ${
                    draggedItem?.id === agent.id 
                      ? 'border-primary bg-primary/5 shadow-lg' 
                      : dropTarget === agent.id
                      ? 'border-primary/50 bg-primary/10'
                      : 'border-border bg-card hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{agent.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{agent.type}</Badge>
                  </div>
                  
                  {/* Connection indicators */}
                  <div className="flex flex-wrap gap-1">
                    {servers.map(server => {
                      const connection = getConnectionStatus(agent.id, server.id);
                      return connection ? (
                        <div 
                          key={server.id}
                          className="flex items-center gap-1 text-xs bg-muted rounded px-1.5 py-0.5"
                        >
                          {getStatusIcon(connection.status)}
                          <span>{server.name.slice(0, 8)}...</span>
                          <button
                            onClick={() => onDisconnect(connection.id)}
                            className="text-muted-foreground hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              ))}
              
              {agents.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No agents available</p>
                  <p className="text-xs">Create agents in the workflow canvas</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Connection Visualization */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 bg-muted/10 rounded-lg border-2 border-dashed border-border">
            <svg
              ref={svgRef}
              className="w-full h-full"
              style={{ minHeight: '400px' }}
            >
              {connectionLines.map((line, index) => (
                <g key={line?.id || index}>
                  <path
                    d={line?.path}
                    stroke={hoveredConnection === line?.id ? '#da7756' : '#e2e8f0'}
                    strokeWidth={hoveredConnection === line?.id ? 3 : 2}
                    fill="none"
                    strokeDasharray={line?.status === 'connected' ? 'none' : '5,5'}
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredConnection(line?.id || null)}
                    onMouseLeave={() => setHoveredConnection(null)}
                  />
                  
                  {/* Connection status indicator */}
                  <circle
                    cx="400"
                    cy={line ? line.agentY + (line.serverY - line.agentY) / 2 : 0}
                    r="8"
                    fill={
                      line?.status === 'connected' ? '#10b981' :
                      line?.status === 'connecting' ? '#f59e0b' :
                      line?.status === 'error' ? '#ef4444' : '#6b7280'
                    }
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredConnection(line?.id || null)}
                    onMouseLeave={() => setHoveredConnection(null)}
                  />
                  
                  {/* Animated flow indicator for active connections */}
                  {line?.status === 'connected' && (
                    <circle
                      r="3"
                      fill="#da7756"
                      opacity="0.8"
                    >
                      <animateMotion
                        dur="2s"
                        repeatCount="indefinite"
                        path={line.path}
                      />
                    </circle>
                  )}
                </g>
              ))}
              
              {/* Drop zone indicator */}
              {draggedItem && (
                <text
                  x="400"
                  y="300"
                  textAnchor="middle"
                  className="text-sm fill-muted-foreground font-medium"
                >
                  Drop here to create connection
                </text>
              )}
            </svg>
            
            {/* Instructions overlay */}
            {connections.length === 0 && !draggedItem && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <Link className="h-16 w-16 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Connect Agents to MCP Servers</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Drag agents from the left panel to MCP servers on the right to establish connections.
                      Connected agents can use tools and resources from their linked servers.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MCP Servers Panel */}
        <div className="w-80">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Server className="h-5 w-5 text-primary" />
                MCP Servers ({servers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {servers.map((server, index) => (
                <div
                  key={server.id}
                  draggable
                  onDragStart={() => handleDragStart('server', server.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, server.id)}
                  onDrop={(e) => handleDrop(e, server.id, 'server')}
                  className={`p-3 border rounded-lg cursor-move transition-all ${
                    draggedItem?.id === server.id 
                      ? 'border-primary bg-primary/5 shadow-lg' 
                      : dropTarget === server.id
                      ? 'border-primary/50 bg-primary/10'
                      : 'border-border bg-card hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Server className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{server.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(server.status)}
                      <span className="text-xs text-muted-foreground capitalize">{server.status}</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mb-2">
                    {server.tools.length} tools available
                  </div>
                  
                  {/* Connected agents indicators */}
                  <div className="flex flex-wrap gap-1">
                    {agents.map(agent => {
                      const connection = getConnectionStatus(agent.id, server.id);
                      return connection ? (
                        <div 
                          key={agent.id}
                          className="flex items-center gap-1 text-xs bg-muted rounded px-1.5 py-0.5"
                        >
                          <Bot className="h-3 w-3" />
                          <span>{agent.name.slice(0, 8)}...</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              ))}
              
              {servers.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <Server className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No MCP servers available</p>
                  <p className="text-xs">Add servers in the MCP Integration hub</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Connection Status Bar */}
      {connections.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-card border border-border rounded-lg px-4 py-2 shadow-lg">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Connected: {connections.filter(c => c.status === 'connected').length}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span>Connecting: {connections.filter(c => c.status === 'connecting').length}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Errors: {connections.filter(c => c.status === 'error').length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};