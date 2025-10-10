import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Zap,
  Brain,
  Network,
  Database,
  FileText,
  Monitor,
  TrendingUp
} from 'lucide-react'
import { useWorkflowStore } from '@/store/workflow-store'
import { useExecutionStore } from '@/store/execution-store'
import type { ExecutionStatus, NodeExecutionStatus } from '@/store/execution-store'
import { DevvAI } from '@devvai/devv-code-backend'
import { logger } from './AdvancedDebuggingSystem'

// Execution log interface
interface ExecutionLog {
  id: string
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  nodeId?: string
  metadata?: Record<string, any>
}

// Node execution result interface (for backward compatibility)
interface NodeExecutionResult {
  nodeId: string
  status: NodeExecutionStatus
  startTime: Date
  endTime?: Date
  duration?: number
  output?: any
  error?: string
  logs: ExecutionLog[]
  performance: {
    memoryUsage: number
    cpuTime: number
    tokensUsed?: number
  }
}

export default function WorkflowExecutionEngine() {
  const { nodes, connections } = useWorkflowStore()
  const { 
    currentExecution, 
    executionHistory, 
    nodeStatuses,
    startExecution: startExecutionStore,
    stopExecution: stopExecutionStore,
    pauseExecution: pauseExecutionStore,
    resumeExecution: resumeExecutionStore,
    updateNodeStatus,
    completeExecution,
    isExecutionRunning,
    getExecutionProgress
  } = useExecutionStore()
  
  const [realTimeLogs, setRealTimeLogs] = useState<ExecutionLog[]>([])
  const [selectedExecution, setSelectedExecution] = useState<string>()

  // Legacy engine state for backward compatibility
  const engine = {
    currentExecution,
    executionHistory,
    isRunning: isExecutionRunning(),
    isPaused: currentExecution?.status === 'paused',
    progress: getExecutionProgress()
  }

  // Add execution log
  const addLog = useCallback((level: ExecutionLog['level'], message: string, nodeId?: string, metadata?: Record<string, any>) => {
    const log: ExecutionLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      level,
      message,
      nodeId,
      metadata
    }
    
    // Add to local state for real-time display
    setRealTimeLogs(prev => [log, ...prev])
    
    // Also log to advanced logging system with appropriate category
    logger.log(
      level === 'debug' ? 'debug' : 
      level === 'warn' ? 'warn' : 
      level === 'error' ? 'error' : 'info',
      'workflow',
      message,
      { 
        nodeId, 
        workflowId: engine.currentExecution?.workflowId,
        ...metadata 
      },
      nodeId,
      engine.currentExecution?.workflowId
    )
    
    // Log performance metrics if available
    if (metadata?.performance) {
      const perf = metadata.performance
      if (perf.memoryUsage) {
        logger.performance('Memory Usage', perf.memoryUsage, '%', 'workflow', 80)
      }
      if (perf.cpuTime) {
        logger.performance('CPU Time', perf.cpuTime, 'ms', 'workflow', 1000)
      }
      if (perf.tokensUsed) {
        logger.performance('Tokens Used', perf.tokensUsed, 'tokens', 'workflow')
      }
    }
  }, [engine.currentExecution])

  // Execute a single node
  const executeNode = async (nodeId: string, inputData: any): Promise<NodeExecutionResult> => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node) throw new Error(`Node ${nodeId} not found`)

    const startTime = new Date()
    addLog('info', `Starting execution of node: ${node.title || nodeId}`, nodeId)

    try {
      let output: any = {}
      let tokensUsed = 0

      // Execute based on node type
      switch (node.type) {
        case 'agent':
          if (node.data.systemPrompt) {
            addLog('info', `Executing AI agent with prompt`, nodeId)
            const devvAI = new DevvAI()
            const response = await devvAI.chat.completions.create({
              messages: [
                { role: 'system', content: node.data.systemPrompt },
                { role: 'user', content: JSON.stringify(inputData) }
              ],
              model: node.data.model || 'default'
            })
            output = { response: response.choices[0]?.message?.content, model: node.data.model || 'default' }
            tokensUsed = response.usage?.total_tokens || 0
          }
          break

        case 'trigger':
          addLog('info', `Trigger activated`, nodeId)
          output = { triggered: true, timestamp: new Date().toISOString(), data: inputData }
          break

        case 'logic':
          // Simple condition evaluation for logic nodes
          const result = Math.random() > 0.5 // Simplified logic
          addLog('info', `Logic evaluated: ${result}`, nodeId)
          output = { result, input: inputData }
          break

        case 'action':
          addLog('info', `Executing action`, nodeId)
          output = await executeAction('transform', inputData, nodeId)
          break

        case 'integration':
          addLog('info', `Integration processing`, nodeId)
          output = { processed: true, data: inputData }
          break

        default:
          addLog('warn', `Unknown node type: ${node.type}`, nodeId)
          output = { processed: false, error: 'Unknown node type' }
      }

      const endTime = new Date()
      const duration = endTime.getTime() - startTime.getTime()

      addLog('info', `Node execution completed in ${duration}ms`, nodeId)

      return {
        nodeId,
        status: 'completed',
        startTime,
        endTime,
        duration,
        output,
        logs: [],
        performance: {
          memoryUsage: Math.random() * 100, // Simulated
          cpuTime: duration,
          tokensUsed
        }
      }
    } catch (error) {
      const endTime = new Date()
      const duration = endTime.getTime() - startTime.getTime()
      
      addLog('error', `Node execution failed: ${error}`, nodeId)

      return {
        nodeId,
        status: 'failed',
        startTime,
        endTime,
        duration,
        error: error instanceof Error ? error.message : String(error),
        logs: [],
        performance: {
          memoryUsage: Math.random() * 100,
          cpuTime: duration,
          tokensUsed: 0
        }
      }
    }
  }

  // Evaluate condition (simplified)
  const evaluateCondition = (condition: string, data: any): boolean => {
    try {
      // Simple condition evaluation - in production, use a proper expression evaluator
      const context = { data, input: data }
      return new Function('context', `with(context) { return ${condition} }`)(context)
    } catch {
      return false
    }
  }

  // Execute action
  const executeAction = async (actionType: string, data: any, nodeId: string): Promise<any> => {
    switch (actionType) {
      case 'log':
        addLog('info', `Action log: ${JSON.stringify(data)}`, nodeId)
        return { logged: true, data }

      case 'transform':
        // Simple data transformation
        return { ...data, transformed: true, timestamp: new Date().toISOString() }

      case 'delay':
        const delay = Math.random() * 2000 + 500 // 500-2500ms
        await new Promise(resolve => setTimeout(resolve, delay))
        return { delayed: delay, data }

      default:
        return { actionType, processed: true, data }
    }
  }

  // Get execution order based on node connections
  const getExecutionOrder = (): string[] => {
    const visited = new Set<string>()
    const order: string[] = []
    
    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return
      visited.add(nodeId)
      
      // Find all nodes that this node depends on (incoming connections)
      const dependencies = connections.filter(conn => conn.target === nodeId)
      for (const dep of dependencies) {
        visit(dep.source)
      }
      
      order.push(nodeId)
    }
    
    // Start with trigger nodes
    const triggerNodes = nodes.filter(n => n.type === 'trigger')
    for (const trigger of triggerNodes) {
      visit(trigger.id)
    }
    
    // Visit any remaining unvisited nodes
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        visit(node.id)
      }
    }
    
    return order
  }

  // Listen for execution events from canvas
  useEffect(() => {
    const handleStartExecution = () => startExecution()
    const handleStopExecution = () => stopExecution()

    window.addEventListener('start-workflow-execution', handleStartExecution)
    window.addEventListener('stop-workflow-execution', handleStopExecution)

    return () => {
      window.removeEventListener('start-workflow-execution', handleStartExecution)
      window.removeEventListener('stop-workflow-execution', handleStopExecution)
    }
  }, [])

  // Start workflow execution
  const startExecution = async () => {
    if (nodes.length === 0) {
      addLog('warn', 'No nodes to execute')
      return
    }

    const nodeIds = nodes.map(n => n.id)
    startExecutionStore('current', nodeIds)
    
    addLog('info', `Starting workflow execution with ${nodeIds.length} nodes`)

    try {
      const executionOrder = getExecutionOrder()
      let inputData = { trigger: true } // Initial data

      for (const nodeId of executionOrder) {
        if (currentExecution?.status === 'paused') {
          addLog('info', 'Execution paused')
          break
        }

        // Update node status to running
        updateNodeStatus(nodeId, 'running', { 
          startTime: new Date() 
        })

        const result = await executeNode(nodeId, inputData)
        
        // Update node status based on result
        updateNodeStatus(nodeId, result.status, {
          endTime: result.endTime,
          duration: result.duration,
          output: result.output,
          error: result.error,
          performance: result.performance
        })
        
        // Pass output to next nodes
        if (result.status === 'completed' && result.output) {
          inputData = { ...inputData, [nodeId]: result.output }
        }

        // Add small delay for visual effect
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      // Complete execution
      const failedNodes = Object.values(nodeStatuses).filter(status => status === 'failed').length
      const success = failedNodes === 0
      
      addLog('info', `Workflow execution ${success ? 'completed successfully' : 'completed with errors'}`)
      completeExecution(success)

    } catch (error) {
      addLog('error', `Workflow execution failed: ${error}`)
      completeExecution(false)
    }
  }

  // Pause execution
  const pauseExecution = () => {
    pauseExecutionStore()
    addLog('info', 'Execution paused by user')
  }

  // Resume execution
  const resumeExecution = () => {
    resumeExecutionStore()
    addLog('info', 'Execution resumed by user')
  }

  // Stop execution
  const stopExecution = () => {
    stopExecutionStore()
    addLog('info', 'Execution stopped by user')
  }

  // Reset execution
  const resetExecution = () => {
    setRealTimeLogs([])
  }

  // Get status icon
  const getStatusIcon = (status: ExecutionStatus | NodeExecutionStatus) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-orange-500 animate-pulse" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'paused':
        return <Pause className="h-4 w-4 text-yellow-500" />
      case 'cancelled':
        return <Square className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  // Get status color
  const getStatusColor = (status: ExecutionStatus | NodeExecutionStatus) => {
    switch (status) {
      case 'running':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-none p-6 border-b bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Workflow Execution Engine</h1>
            <p className="text-gray-600">Real-time workflow orchestration and monitoring</p>
          </div>
          <div className="flex items-center gap-2">
            {!engine.isRunning ? (
              <Button 
                onClick={startExecution} 
                className="bg-orange-500 hover:bg-orange-600"
                disabled={nodes.length === 0}
              >
                <Play className="h-4 w-4 mr-2" />
                Execute Workflow
              </Button>
            ) : (
              <>
                {!engine.isPaused ? (
                  <Button onClick={pauseExecution} variant="outline">
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button onClick={resumeExecution} className="bg-orange-500 hover:bg-orange-600">
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </Button>
                )}
                <Button onClick={stopExecution} variant="destructive">
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </>
            )}
            <Button onClick={resetExecution} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        {(engine.isRunning || engine.progress > 0) && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Execution Progress
              </span>
              <span className="text-sm text-gray-500">{Math.round(engine.progress)}%</span>
            </div>
            <Progress value={engine.progress} className="h-2" />
          </div>
        )}
      </div>

      <div className="flex-1 p-6 overflow-hidden">
        <Tabs defaultValue="realtime" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="realtime">Real-time Monitoring</TabsTrigger>
            <TabsTrigger value="history">Execution History</TabsTrigger>
            <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
            <TabsTrigger value="debug">Debug Console</TabsTrigger>
          </TabsList>

          {/* Real-time Monitoring */}
          <TabsContent value="realtime" className="flex-1 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* Current Execution Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Current Execution
                  </CardTitle>
                  <CardDescription>
                    Live monitoring of workflow execution status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {engine.currentExecution ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Status</span>
                        <Badge className={getStatusColor(engine.currentExecution.status)}>
                          {getStatusIcon(engine.currentExecution.status)}
                          <span className="ml-2 capitalize">{engine.currentExecution.status}</span>
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-medium">Execution ID</span>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {engine.currentExecution.id}
                        </code>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-medium">Started</span>
                        <span className="text-sm text-gray-600">
                          {engine.currentExecution.startTime.toLocaleTimeString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="font-medium">Nodes Executed</span>
                        <span className="text-sm text-gray-600">
                          {engine.currentExecution.nodeStates.size} / {nodes.length}
                        </span>
                      </div>

                      {/* Node execution status */}
                      <div className="space-y-2">
                        <span className="font-medium">Node Status</span>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {Array.from(engine.currentExecution.nodeStates.entries()).map(([nodeId, state]) => {
                            const node = nodes.find(n => n.id === nodeId)
                            return (
                              <div key={nodeId} className="flex items-center justify-between text-sm">
                                <span className="truncate mr-2">
                                  {node?.title || nodeId}
                                </span>
                                <Badge variant="outline" className={`${getStatusColor(state.status)} text-xs`}>
                                  {getStatusIcon(state.status)}
                                </Badge>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No active execution</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Start a workflow to see real-time status
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Real-time Logs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Execution Logs
                  </CardTitle>
                  <CardDescription>
                    Real-time execution logs and events
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-80">
                    {realTimeLogs.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-sm">No logs available</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Execute a workflow to see logs
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {realTimeLogs.map((log) => (
                          <div
                            key={log.id}
                            className={`p-2 rounded border text-sm ${
                              log.level === 'error' 
                                ? 'bg-red-50 border-red-200 text-red-800'
                                : log.level === 'warn'
                                ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                                : log.level === 'debug'
                                ? 'bg-gray-50 border-gray-200 text-gray-600'
                                : 'bg-blue-50 border-blue-200 text-blue-800'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-medium">{log.message}</p>
                                {log.nodeId && (
                                  <p className="text-xs mt-1 opacity-75">
                                    Node: {nodes.find(n => n.id === log.nodeId)?.title || log.nodeId}
                                  </p>
                                )}
                              </div>
                              <span className="text-xs opacity-75 ml-2">
                                {log.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Execution History */}
          <TabsContent value="history" className="flex-1 mt-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Execution History
                </CardTitle>
                <CardDescription>
                  Previous workflow executions and results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {engine.executionHistory.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No execution history</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Execute workflows to see history here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {engine.executionHistory.map((execution) => (
                        <div
                          key={execution.id}
                          className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => setSelectedExecution(execution.id)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(execution.status)}
                              <span className="font-medium">{execution.id}</span>
                              <Badge className={getStatusColor(execution.status)}>
                                {execution.status}
                              </Badge>
                            </div>
                            <span className="text-sm text-gray-500">
                              {execution.startTime.toLocaleString()}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Duration</span>
                              <p className="font-medium">
                                {execution.duration ? `${execution.duration}ms` : 'N/A'}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-600">Nodes</span>
                              <p className="font-medium">{execution.nodeStates.size}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Success Rate</span>
                              <p className="font-medium">{((execution.completedNodes / execution.totalNodes) * 100).toFixed(1)}%</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Completed</span>
                              <p className="font-medium">{execution.completedNodes}/{execution.totalNodes}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Analytics */}
          <TabsContent value="analytics" className="flex-1 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Avg Response Time</span>
                        <span className="font-medium">
                          {engine.executionHistory.length > 0
                            ? `${Math.round(
                                engine.executionHistory.reduce((sum, ex) => sum + (ex.duration || 0), 0) /
                                engine.executionHistory.length
                              )}ms`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Success Rate</span>
                        <span className="font-medium">
                          {engine.executionHistory.length > 0
                            ? `${Math.round(
                                engine.executionHistory.reduce((sum, ex) => sum + ((ex.completedNodes / ex.totalNodes) * 100), 0) /
                                engine.executionHistory.length
                              )}%`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Executions</span>
                        <span className="font-medium">{engine.executionHistory.length}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Resource Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Tokens</span>
                        <span className="font-medium">
                          {engine.executionHistory.reduce((sum, ex) => {
                            // Calculate estimated tokens from completed nodes
                            return sum + (ex.completedNodes * 100) // Rough estimate
                          }, 0)}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Estimated Cost</span>
                        <span className="font-medium">
                          ${engine.executionHistory.reduce((sum, ex) => {
                            const tokens = ex.completedNodes * 100
                            return sum + (tokens * 0.0001) // Rough cost estimate
                          }, 0).toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    Workflow Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Active Nodes</span>
                        <span className="font-medium">{nodes.length}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Active Edges</span>
                        <span className="font-medium">{connections.length}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Complexity Score</span>
                        <span className="font-medium">
                          {Math.round((nodes.length * 2 + connections.length) / 3)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Debug Console */}
          <TabsContent value="debug" className="flex-1 mt-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Debug Console
                </CardTitle>
                <CardDescription>
                  Advanced debugging and diagnostic information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {/* Workflow structure debug */}
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Workflow Structure:</strong> {nodes.length} nodes, {connections.length} connections
                      </AlertDescription>
                    </Alert>

                    {/* Node types breakdown */}
                    <div className="p-3 bg-gray-50 rounded border">
                      <h4 className="font-medium mb-2">Node Type Distribution</h4>
                      <div className="text-sm space-y-1">
                        {Object.entries(
                          nodes.reduce((acc, node) => {
                            acc[node.type] = (acc[node.type] || 0) + 1
                            return acc
                          }, {} as Record<string, number>)
                        ).map(([type, count]) => (
                          <div key={type} className="flex justify-between">
                            <span className="capitalize">{type}:</span>
                            <span>{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Execution order */}
                    {nodes.length > 0 && (
                      <div className="p-3 bg-gray-50 rounded border">
                        <h4 className="font-medium mb-2">Execution Order</h4>
                        <div className="text-sm space-y-1">
                          {getExecutionOrder().map((nodeId, index) => {
                            const node = nodes.find(n => n.id === nodeId)
                            return (
                              <div key={nodeId} className="flex items-center gap-2">
                                <span className="w-6 h-6 bg-orange-100 text-orange-800 rounded-full flex items-center justify-center text-xs font-medium">
                                  {index + 1}
                                </span>
                                <span>{node?.title || nodeId}</span>
                                <Badge variant="outline" className="text-xs">
                                  {node?.type}
                                </Badge>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* System information */}
                    <div className="p-3 bg-gray-50 rounded border">
                      <h4 className="font-medium mb-2">System Information</h4>
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Engine Status:</span>
                          <span className="capitalize">{engine.isRunning ? 'Running' : 'Idle'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Logs Count:</span>
                          <span>{realTimeLogs.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>History Count:</span>
                          <span>{engine.executionHistory.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}