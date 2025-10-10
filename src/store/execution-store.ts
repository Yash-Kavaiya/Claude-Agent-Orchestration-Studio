import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// Execution status types
export type ExecutionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled'
export type NodeExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

// Node execution state
export interface NodeExecutionState {
  nodeId: string
  status: NodeExecutionStatus
  progress?: number
  startTime?: Date
  endTime?: Date
  duration?: number
  output?: any
  error?: string
  performance?: {
    memoryUsage: number
    cpuTime: number
    tokensUsed?: number
  }
}

// Workflow execution state
export interface WorkflowExecutionState {
  id: string
  workflowId: string
  status: ExecutionStatus
  startTime: Date
  endTime?: Date
  duration?: number
  progress: number
  nodeStates: Map<string, NodeExecutionState>
  totalNodes: number
  completedNodes: number
  failedNodes: number
}

// Execution store interface
interface ExecutionStore {
  // Current execution state
  currentExecution: WorkflowExecutionState | null
  executionHistory: WorkflowExecutionState[]
  
  // Real-time node status updates
  nodeStatuses: Record<string, NodeExecutionStatus>
  
  // Actions
  startExecution: (workflowId: string, nodeIds: string[]) => void
  stopExecution: () => void
  pauseExecution: () => void
  resumeExecution: () => void
  
  updateNodeStatus: (nodeId: string, status: NodeExecutionStatus, details?: Partial<NodeExecutionState>) => void
  updateExecutionProgress: (progress: number) => void
  
  completeExecution: (success: boolean) => void
  clearExecution: () => void
  
  // Getters
  getNodeStatus: (nodeId: string) => NodeExecutionStatus
  isExecutionRunning: () => boolean
  getExecutionProgress: () => number
}

export const useExecutionStore = create<ExecutionStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    currentExecution: null,
    executionHistory: [],
    nodeStatuses: {},

    // Start execution
    startExecution: (workflowId: string, nodeIds: string[]) => {
      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const execution: WorkflowExecutionState = {
        id: executionId,
        workflowId,
        status: 'running',
        startTime: new Date(),
        progress: 0,
        nodeStates: new Map(),
        totalNodes: nodeIds.length,
        completedNodes: 0,
        failedNodes: 0
      }

      // Initialize node statuses
      const nodeStatuses: Record<string, NodeExecutionStatus> = {}
      nodeIds.forEach(nodeId => {
        nodeStatuses[nodeId] = 'pending'
        execution.nodeStates.set(nodeId, {
          nodeId,
          status: 'pending'
        })
      })

      set({ 
        currentExecution: execution,
        nodeStatuses
      })
    },

    // Stop execution
    stopExecution: () => {
      const { currentExecution } = get()
      if (currentExecution) {
        const updatedExecution = {
          ...currentExecution,
          status: 'cancelled' as ExecutionStatus,
          endTime: new Date()
        }
        updatedExecution.duration = updatedExecution.endTime.getTime() - updatedExecution.startTime.getTime()

        set(state => ({
          currentExecution: null,
          executionHistory: [updatedExecution, ...state.executionHistory],
          nodeStatuses: {}
        }))
      }
    },

    // Pause execution
    pauseExecution: () => {
      set(state => ({
        currentExecution: state.currentExecution ? {
          ...state.currentExecution,
          status: 'paused' as ExecutionStatus
        } : null
      }))
    },

    // Resume execution
    resumeExecution: () => {
      set(state => ({
        currentExecution: state.currentExecution ? {
          ...state.currentExecution,
          status: 'running' as ExecutionStatus
        } : null
      }))
    },

    // Update node status
    updateNodeStatus: (nodeId: string, status: NodeExecutionStatus, details?: Partial<NodeExecutionState>) => {
      set(state => {
        const { currentExecution } = state
        if (!currentExecution) return state

        // Update node status in the record
        const newNodeStatuses = {
          ...state.nodeStatuses,
          [nodeId]: status
        }

        // Update node state in execution
        const existingState = currentExecution.nodeStates.get(nodeId)
        const updatedNodeState: NodeExecutionState = {
          ...existingState,
          nodeId,
          status,
          ...details
        }
        
        currentExecution.nodeStates.set(nodeId, updatedNodeState)

        // Update execution counters
        const nodeStates = Array.from(currentExecution.nodeStates.values())
        const completedNodes = nodeStates.filter(n => n.status === 'completed').length
        const failedNodes = nodeStates.filter(n => n.status === 'failed').length
        
        const updatedExecution = {
          ...currentExecution,
          completedNodes,
          failedNodes,
          progress: ((completedNodes + failedNodes) / currentExecution.totalNodes) * 100
        }

        return {
          ...state,
          currentExecution: updatedExecution,
          nodeStatuses: newNodeStatuses
        }
      })
    },

    // Update execution progress
    updateExecutionProgress: (progress: number) => {
      set(state => ({
        currentExecution: state.currentExecution ? {
          ...state.currentExecution,
          progress
        } : null
      }))
    },

    // Complete execution
    completeExecution: (success: boolean) => {
      const { currentExecution } = get()
      if (currentExecution) {
        const endTime = new Date()
        const updatedExecution = {
          ...currentExecution,
          status: success ? 'completed' as ExecutionStatus : 'failed' as ExecutionStatus,
          endTime,
          duration: endTime.getTime() - currentExecution.startTime.getTime(),
          progress: 100
        }

        set(state => ({
          currentExecution: null,
          executionHistory: [updatedExecution, ...state.executionHistory],
          nodeStatuses: {}
        }))
      }
    },

    // Clear execution
    clearExecution: () => {
      set({
        currentExecution: null,
        nodeStatuses: {}
      })
    },

    // Get node status
    getNodeStatus: (nodeId: string) => {
      return get().nodeStatuses[nodeId] || 'pending'
    },

    // Is execution running
    isExecutionRunning: () => {
      const { currentExecution } = get()
      return currentExecution?.status === 'running'
    },

    // Get execution progress
    getExecutionProgress: () => {
      return get().currentExecution?.progress || 0
    }
  }))
)

// Subscribe to node status changes and update workflow store
useExecutionStore.subscribe(
  (state) => state.nodeStatuses,
  (nodeStatuses) => {
    // Update node statuses in workflow store
    // This will trigger re-renders of nodes with updated status
    Object.entries(nodeStatuses).forEach(([nodeId, status]) => {
      // Dispatch custom event to notify components
      window.dispatchEvent(new CustomEvent('node-status-change', {
        detail: { nodeId, status }
      }))
    })
  }
)