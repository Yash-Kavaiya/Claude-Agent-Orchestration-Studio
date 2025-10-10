import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useWorkflowStore, type Node } from '@/store/workflow-store'
import { useExecutionStore } from '@/store/execution-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Grid, 
  Play, 
  Square, 
  Bot,
  Zap,
  Database,
  MessageSquare,
  Settings,
  Sparkles,
  Plus
} from 'lucide-react'



interface Connection {
  id: string
  source: string
  target: string
  sourceHandle: string
  targetHandle: string
}

interface WorkflowCanvasProps {
  selectedNode: string | null
  onSelectNode: (nodeId: string | null) => void
}

const SAMPLE_NODES: Node[] = [
  {
    id: 'trigger-1',
    type: 'trigger',
    title: 'Webhook Trigger',
    position: { x: 100, y: 100 },
    data: {
      description: 'Receives HTTP requests',
      status: 'idle'
    }
  },
  {
    id: 'agent-1',
    type: 'agent',
    title: 'Claude Agent',
    position: { x: 400, y: 100 },
    data: {
      description: 'Main conversation agent',
      status: 'idle'
    }
  },
  {
    id: 'action-1',
    type: 'action',
    title: 'Database Query',
    position: { x: 700, y: 100 },
    data: {
      description: 'Store conversation data',
      status: 'idle'
    }
  }
]

const SAMPLE_CONNECTIONS: Connection[] = [
  {
    id: 'conn-1',
    source: 'trigger-1',
    target: 'agent-1',
    sourceHandle: 'output',
    targetHandle: 'input'
  },
  {
    id: 'conn-2',
    source: 'agent-1',
    target: 'action-1',
    sourceHandle: 'output',
    targetHandle: 'input'
  }
]

export function WorkflowCanvas({ selectedNode, onSelectNode }: WorkflowCanvasProps) {
  const [zoom, setZoom] = useState(100)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number; type: string; title: string } | null>(null)
  const [isConnecting, setIsConnecting] = useState<{ nodeId: string; x: number; y: number } | null>(null)
  const [tempConnection, setTempConnection] = useState<{ x: number; y: number } | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  
  // Use workflow store for state management
  const { nodes, connections, addNode, updateNode, addConnection, deleteConnection } = useWorkflowStore()
  const { nodeStatuses } = useExecutionStore()
  
  // Don't auto-initialize - let user create new workflow
  const [initialized, setInitialized] = useState(false)

  const getNodeIcon = (type: Node['type']) => {
    switch (type) {
      case 'agent': return Bot
      case 'trigger': return Zap
      case 'action': return Database
      case 'logic': return Settings
      default: return MessageSquare
    }
  }

  const getNodeColor = (type: Node['type']) => {
    switch (type) {
      case 'agent': return 'bg-primary/10 border-primary/30 text-primary'
      case 'trigger': return 'bg-green-500/10 border-green-500/30 text-green-700'
      case 'action': return 'bg-blue-500/10 border-blue-500/30 text-blue-700'
      case 'logic': return 'bg-purple-500/10 border-purple-500/30 text-purple-700'
      default: return 'bg-muted border-border'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-orange-500 animate-pulse'
      case 'completed': return 'bg-green-500'
      case 'failed': return 'bg-red-500'
      case 'pending': return 'bg-gray-400'
      case 'paused': return 'bg-yellow-500'
      case 'skipped': return 'bg-gray-300'
      // Legacy statuses
      case 'success': return 'bg-green-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    setIsDragging(nodeId)
    setDragStart({ x: e.clientX, y: e.clientY })
    onSelectNode(nodeId)
  }, [onSelectNode])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return

    const deltaX = (e.clientX - dragStart.x) / (zoom / 100)
    const deltaY = (e.clientY - dragStart.y) / (zoom / 100)

    const currentNode = nodes.find(n => n.id === isDragging)
    if (currentNode) {
      updateNode(isDragging, {
        position: {
          x: currentNode.position.x + deltaX,
          y: currentNode.position.y + deltaY
        }
      })
    }

    setDragStart({ x: e.clientX, y: e.clientY })
  }, [isDragging, dragStart, zoom, nodes, updateNode])

  const handleMouseUp = useCallback(() => {
    setIsDragging(null)
    if (isConnecting) {
      setIsConnecting(null)
      setTempConnection(null)
    }
  }, [isConnecting])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelectNode(null)
    }
  }, [onSelectNode])

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 500))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 10))
  const handleZoomReset = () => {
    setZoom(100)
    setPan({ x: 0, y: 0 })
  }

  // Generate unique ID for new nodes
  const generateNodeId = (type: string) => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 5)
    return `${type}-${timestamp}-${random}`
  }

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 }
    
    const rect = canvasRef.current.getBoundingClientRect()
    const canvasX = (screenX - rect.left - pan.x) / (zoom / 100)
    const canvasY = (screenY - rect.top - pan.y) / (zoom / 100)
    
    return { x: canvasX, y: canvasY }
  }, [pan, zoom])

  // Handle drag over canvas
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setIsDragOver(true)
    
    // Update drag preview position
    const canvasPos = screenToCanvas(e.clientX, e.clientY)
    const dragData = e.dataTransfer.types.includes('application/json')
    
    if (dragData) {
      try {
        // We can't access dataTransfer.getData during dragover, so we'll show a generic preview
        setDragPreview({
          x: canvasPos.x - 100, // Center the preview
          y: canvasPos.y - 40,
          type: 'preview',
          title: 'Drop to add node'
        })
      } catch (error) {
        // Ignore errors during preview
      }
    }
  }, [screenToCanvas])

  // Handle drag leave canvas
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only set drag over to false if we're leaving the canvas completely
    if (!canvasRef.current?.contains(e.relatedTarget as HTMLElement)) {
      setIsDragOver(false)
      setDragPreview(null)
    }
  }, [])

  // Handle drop on canvas
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    setDragPreview(null)
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'))
      const canvasPos = screenToCanvas(e.clientX, e.clientY)
      
      const newNodeData = {
        type: dragData.type,
        title: dragData.title,
        position: {
          x: Math.max(0, canvasPos.x - 100), // Offset to center the node
          y: Math.max(0, canvasPos.y - 40)
        },
        data: {
          description: getDefaultDescription(dragData.type),
          status: 'idle' as const,
          config: {}
        }
      }
      
      // Store in workflow store (this will generate ID and add to state)
      addNode(newNodeData)
      
      // Get the store state to access nodes with the new node
      const storeState = useWorkflowStore.getState()
      const newNode = storeState.nodes[storeState.nodes.length - 1] // Get the last added node
      
      // Select the newly created node
      if (newNode) {
        onSelectNode(newNode.id)
      }
    } catch (error) {
      console.error('Error handling drop:', error)
    }
  }, [screenToCanvas, addNode, onSelectNode])

  // Get default description based on node type
  const getDefaultDescription = (type: string) => {
    switch (type) {
      case 'agent': return 'AI agent for conversation and reasoning'
      case 'trigger': return 'Triggers workflow execution'
      case 'action': return 'Performs specific actions'
      case 'logic': return 'Controls workflow flow and logic'
      case 'integration': return 'External service integration'
      default: return 'Workflow component'
    }
  }

  // Handle connection start from output handle
  const handleConnectionStart = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    const node = nodes.find(n => n.id === nodeId)
    if (node) {
      setIsConnecting({ 
        nodeId, 
        x: node.position.x + 200, 
        y: node.position.y + 40 
      })
    }
  }, [nodes])

  // Handle connection drag
  const handleConnectionDrag = useCallback((e: React.MouseEvent) => {
    if (isConnecting && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left - pan.x) / (zoom / 100)
      const y = (e.clientY - rect.top - pan.y) / (zoom / 100)
      setTempConnection({ x, y })
    }
  }, [isConnecting, pan, zoom])

  // Handle connection end on input handle
  const handleConnectionEnd = useCallback((e: React.MouseEvent, targetNodeId: string) => {
    e.stopPropagation()
    if (isConnecting && isConnecting.nodeId !== targetNodeId) {
      // Check if connection already exists
      const existingConnection = connections.find(
        conn => conn.source === isConnecting.nodeId && conn.target === targetNodeId
      )
      
      if (!existingConnection) {
        addConnection({
          source: isConnecting.nodeId,
          target: targetNodeId,
          sourceHandle: 'output',
          targetHandle: 'input'
        })
      }
    }
    setIsConnecting(null)
    setTempConnection(null)
  }, [isConnecting, connections, addConnection])

  // Handle canvas mouse move (for both dragging and connecting)
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      handleMouseMove(e)
    }
    if (isConnecting) {
      handleConnectionDrag(e)
    }
  }, [isDragging, isConnecting, handleMouseMove, handleConnectionDrag])

  // Delete connection on click
  const handleConnectionClick = useCallback((e: React.MouseEvent, connectionId: string) => {
    e.stopPropagation()
    if (e.shiftKey || e.ctrlKey) {
      deleteConnection(connectionId)
    }
  }, [deleteConnection])

  return (
    <div className="h-full relative bg-canvas-bg overflow-hidden">
      {/* Canvas Controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className="bg-card/80 backdrop-blur border border-border rounded-lg p-2 flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm font-medium min-w-[50px] text-center">
            {zoom}%
          </span>
          <Button variant="ghost" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleZoomReset}>
            <Maximize className="w-4 h-4" />
          </Button>
        </div>

        <div className="bg-card/80 backdrop-blur border border-border rounded-lg p-2 flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Grid className="w-4 h-4" />
          </Button>
        </div>

        {nodes.length > 0 && (
          <div className="bg-card/80 backdrop-blur border border-border rounded-lg px-3 py-2">
            <span className="text-sm text-muted-foreground">
              {nodes.length} node{nodes.length !== 1 ? 's' : ''} • {connections.length} connection{connections.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Execution Controls */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-card/80 backdrop-blur border border-border rounded-lg p-2 flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => {
              // Switch to execution view and start execution
              window.dispatchEvent(new CustomEvent('start-workflow-execution'))
            }}
          >
            <Play className="w-4 h-4" />
            <span className="ml-1 text-sm">Execute</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              // Stop execution
              window.dispatchEvent(new CustomEvent('stop-workflow-execution'))
            }}
          >
            <Square className="w-4 h-4" />
            <span className="ml-1 text-sm">Stop</span>
          </Button>
        </div>
      </div>

      {/* Canvas with Grid */}
      <div 
        ref={canvasRef}
        className={`canvas-grid h-full w-full cursor-grab active:cursor-grabbing relative ${
          isDragOver ? 'canvas-drop-zone' : ''
        }`}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
          transformOrigin: '0 0'
        }}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Connection Lines SVG */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="hsl(var(--canvas-connection))"
              />
            </marker>
          </defs>
          
          {connections.map((connection) => {
            const sourceNode = nodes.find(n => n.id === connection.source)
            const targetNode = nodes.find(n => n.id === connection.target)
            
            if (!sourceNode || !targetNode) return null
            
            const startX = sourceNode.position.x + 200 // Node width
            const startY = sourceNode.position.y + 40  // Half node height
            const endX = targetNode.position.x
            const endY = targetNode.position.y + 40
            
            const controlPoint1X = startX + (endX - startX) * 0.5
            const controlPoint1Y = startY
            const controlPoint2X = startX + (endX - startX) * 0.5
            const controlPoint2Y = endY
            
            return (
              <g key={connection.id}>
                {/* Invisible wider path for easier clicking */}
                <path
                  className="cursor-pointer pointer-events-auto"
                  d={`M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="20"
                  onClick={(e) => handleConnectionClick(e, connection.id)}
                />
                {/* Visible connection line */}
                <path
                  className="workflow-connection pointer-events-none"
                  d={`M ${startX} ${startY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${endX} ${endY}`}
                />
              </g>
            )
          })}
          
          {/* Temporary connection line while dragging */}
          {isConnecting && tempConnection && (
            <path
              className="workflow-connection-temp"
              d={`M ${isConnecting.x} ${isConnecting.y} L ${tempConnection.x} ${tempConnection.y}`}
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray="5,5"
              fill="none"
              opacity="0.6"
            />
          )}
        </svg>

        {/* Drag Preview */}
        {dragPreview && (
          <div
            className="absolute pointer-events-none opacity-60"
            style={{
              left: dragPreview.x,
              top: dragPreview.y,
              width: 200,
              height: 80,
              zIndex: 20
            }}
          >
            <div className="h-full p-3 rounded-lg border-2 border-dashed border-primary/50 bg-primary/10 flex items-center justify-center">
              <div className="text-sm font-medium text-primary">
                {dragPreview.title}
              </div>
            </div>
          </div>
        )}

        {/* Workflow Nodes */}
        {nodes.map((node) => {
          const Icon = getNodeIcon(node.type)
          const isSelected = selectedNode === node.id
          const isDraggingThis = isDragging === node.id
          
          return (
            <div
              key={node.id}
              className={`absolute cursor-pointer select-none ${
                isSelected ? 'workflow-node selected' : 'workflow-node'
              } ${isDraggingThis ? 'dragging' : ''}`}
              style={{
                left: node.position.x,
                top: node.position.y,
                width: 200,
                height: 80,
                zIndex: isSelected ? 10 : 5
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            >
              {/* Node Content */}
              <div className={`h-full p-3 rounded-lg border-2 ${getNodeColor(node.type)} ${
                isSelected ? 'ring-2 ring-primary/50' : ''
              }`}>
                <div className="flex items-start gap-2 h-full">
                  <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {node.title}
                    </div>
                    {node.data.description && (
                      <div className="text-xs opacity-70 mt-1 line-clamp-2">
                        {node.data.description}
                      </div>
                    )}
                    <div className="mt-2">
                      <Badge 
                        variant="outline" 
                        className="text-xs px-1.5 py-0.5 h-auto"
                      >
                        <div 
                          className={`w-1.5 h-1.5 rounded-full mr-1 ${getStatusColor(nodeStatuses[node.id] || node.data.status || 'idle')}`}
                        />
                        {nodeStatuses[node.id] || node.data.status || 'idle'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Connection Points */}
                {/* Input handle (left) */}
                <div 
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 cursor-crosshair z-10"
                  onMouseUp={(e) => handleConnectionEnd(e, node.id)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-3 h-3 bg-primary border-2 border-card rounded-full hover:w-4 hover:h-4 transition-all" />
                </div>
                {/* Output handle (right) */}
                <div 
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1 cursor-crosshair z-10"
                  onMouseDown={(e) => handleConnectionStart(e, node.id)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="w-3 h-3 bg-primary border-2 border-card rounded-full hover:w-4 hover:h-4 transition-all" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center space-y-6 max-w-lg px-4">
            <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full w-fit mx-auto">
              <Sparkles className="w-16 h-16 text-primary" />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold">Build Your First AI Agent Workflow</h3>
              <p className="text-muted-foreground text-lg">
                Drag and drop components from the left sidebar to design powerful agent workflows
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="bg-card/50 p-4 rounded-lg border border-border">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-2 mx-auto">
                  <Zap className="w-5 h-5 text-green-700" />
                </div>
                <div className="text-sm font-medium">1. Add Trigger</div>
                <div className="text-xs text-muted-foreground mt-1">Start the workflow</div>
              </div>
              <div className="bg-card/50 p-4 rounded-lg border border-border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 mx-auto">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="text-sm font-medium">2. Add Agent</div>
                <div className="text-xs text-muted-foreground mt-1">AI reasoning</div>
              </div>
              <div className="bg-card/50 p-4 rounded-lg border border-border">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2 mx-auto">
                  <Database className="w-5 h-5 text-blue-700" />
                </div>
                <div className="text-sm font-medium">3. Add Action</div>
                <div className="text-xs text-muted-foreground mt-1">Execute tasks</div>
              </div>
            </div>
            <div className="pt-2">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Tip:</strong> Drag from the right side of a node to create connections
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}