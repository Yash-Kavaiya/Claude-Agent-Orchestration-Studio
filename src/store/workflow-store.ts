import { create } from 'zustand'
import { table } from '@devvai/devv-code-backend'
import { useAuthStore } from './auth-store'

export interface Node {
  id: string
  type: 'agent' | 'trigger' | 'action' | 'logic' | 'integration'
  title: string
  position: { x: number; y: number }
  data: {
    label?: string
    description?: string
    status?: 'idle' | 'running' | 'success' | 'error'
    enabled?: boolean
    // Agent-specific configuration
    systemPrompt?: string
    model?: string
    temperature?: number
    maxTokens?: number
    tools?: string[]
    permissions?: {
      mode: 'default' | 'accept_edits' | 'plan_mode' | 'bypass'
      allowedTools: string[]
      disallowedTools: string[]
    }
    memory?: {
      enabled: boolean
      contextWindow: number
      persistentMemory: boolean
    }
    subAgents?: string[]
    subAgentConfigs?: any[]
    // General configuration
    config?: Record<string, unknown>
  }
}

export interface Connection {
  id: string
  source: string
  target: string
  sourceHandle: string
  targetHandle: string
}

export interface Workflow {
  _id?: string
  _uid?: string
  name: string
  description: string
  nodes: Node[]
  connections: Connection[]
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
  tags: string[]
}

export interface Agent {
  _id?: string
  _uid?: string
  name: string
  description: string
  system_prompt: string
  model: string
  temperature: number
  max_tokens: number
  tools: string[]
  status: 'active' | 'inactive' | 'draft'
  created_at: string
  updated_at: string
}

interface WorkflowState {
  // Current workflow state
  currentWorkflow: Workflow | null
  nodes: Node[]
  connections: Connection[]
  selectedNode: string | null
  
  // Data collections
  workflows: Workflow[]
  agents: Agent[]
  
  // Loading states
  isLoading: boolean
  isSaving: boolean
  error: string | null
  
  // Actions
  setSelectedNode: (nodeId: string | null) => void
  addNode: (node: Omit<Node, 'id'>) => void
  updateNode: (nodeId: string, updates: Partial<Node>) => void
  deleteNode: (nodeId: string) => void
  addConnection: (connection: Omit<Connection, 'id'>) => void
  deleteConnection: (connectionId: string) => void
  
  // Workflow management
  createWorkflow: (workflow: Omit<Workflow, '_id' | '_uid' | 'created_at' | 'updated_at'>) => Promise<void>
  saveWorkflow: () => Promise<void>
  loadWorkflow: (workflowId: string) => Promise<void>
  loadWorkflows: () => Promise<void>
  deleteWorkflow: (workflowId: string) => Promise<void>
  
  // Agent management
  createAgent: (agent: Omit<Agent, '_id' | '_uid' | 'created_at' | 'updated_at'>) => Promise<void>
  loadAgents: () => Promise<void>
  updateAgent: (agentId: string, updates: Partial<Agent>) => Promise<void>
  deleteAgent: (agentId: string) => Promise<void>
  
  // Utilities
  clearError: () => void
  newWorkflow: () => void
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  // Initial state
  currentWorkflow: null,
  nodes: [],
  connections: [],
  selectedNode: null,
  workflows: [],
  agents: [],
  isLoading: false,
  isSaving: false,
  error: null,

  // Node management
  setSelectedNode: (nodeId) => set({ selectedNode: nodeId }),
  
  addNode: (nodeData) => {
    const newNode: Node = {
      ...nodeData,
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    set((state) => ({ nodes: [...state.nodes, newNode] }))
  },
  
  updateNode: (nodeId, updates) => {
    set((state) => ({
      nodes: state.nodes.map(node =>
        node.id === nodeId ? { ...node, ...updates } : node
      )
    }))
  },
  
  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter(node => node.id !== nodeId),
      connections: state.connections.filter(conn => 
        conn.source !== nodeId && conn.target !== nodeId
      ),
      selectedNode: state.selectedNode === nodeId ? null : state.selectedNode
    }))
  },
  
  addConnection: (connectionData) => {
    const newConnection: Connection = {
      ...connectionData,
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    set((state) => ({ connections: [...state.connections, newConnection] }))
  },
  
  deleteConnection: (connectionId) => {
    set((state) => ({
      connections: state.connections.filter(conn => conn.id !== connectionId)
    }))
  },

  // Workflow management
  createWorkflow: async (workflowData) => {
    try {
      set({ isSaving: true, error: null })
      
      const user = useAuthStore.getState().user
      if (!user) throw new Error('User not authenticated')
      
      const now = new Date().toISOString()
      const workflow: Omit<Workflow, '_id'> = {
        ...workflowData,
        _uid: user.uid,
        nodes: get().nodes,
        connections: get().connections,
        created_at: now,
        updated_at: now
      }
      
      const dbWorkflow = {
        ...workflow,
        nodes: JSON.stringify(workflow.nodes),
        connections: JSON.stringify(workflow.connections),
        tags: workflow.tags.join(',')
      }
      
      await table.addItem('f0i2gib9dbeo', dbWorkflow)
      
      set((state) => ({ 
        currentWorkflow: workflow,
        workflows: [...state.workflows, workflow],
        isSaving: false
      }))
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create workflow',
        isSaving: false
      })
      throw error
    }
  },
  
  saveWorkflow: async () => {
    try {
      const { currentWorkflow, nodes, connections } = get()
      if (!currentWorkflow?._id) {
        throw new Error('No workflow to save')
      }
      
      set({ isSaving: true, error: null })
      
      const user = useAuthStore.getState().user
      if (!user) throw new Error('User not authenticated')
      
      const updatedWorkflow = {
        ...currentWorkflow,
        nodes,
        connections,
        updated_at: new Date().toISOString()
      }
      
      const dbWorkflow = {
        _uid: user.uid,
        _id: currentWorkflow._id,
        name: updatedWorkflow.name,
        description: updatedWorkflow.description,
        nodes: JSON.stringify(updatedWorkflow.nodes),
        connections: JSON.stringify(updatedWorkflow.connections),
        status: updatedWorkflow.status,
        updated_at: updatedWorkflow.updated_at,
        tags: updatedWorkflow.tags.join(',')
      }
      
      await table.updateItem('f0i2gib9dbeo', dbWorkflow)
      
      set((state) => ({
        currentWorkflow: updatedWorkflow,
        workflows: state.workflows.map(w => 
          w._id === updatedWorkflow._id ? updatedWorkflow : w
        ),
        isSaving: false
      }))
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to save workflow',
        isSaving: false
      })
      throw error
    }
  },
  
  loadWorkflow: async (workflowId) => {
    try {
      set({ isLoading: true, error: null })
      
      const user = useAuthStore.getState().user
      if (!user) throw new Error('User not authenticated')
      
      const result = await table.getItems('f0i2gib9dbeo', {
        query: {
          _uid: user.uid,
          _id: workflowId
        }
      })
      
      if (result.items.length === 0) {
        throw new Error('Workflow not found')
      }
      
      const dbWorkflow = result.items[0]
      const workflow: Workflow = {
        _id: dbWorkflow._id,
        _uid: dbWorkflow._uid,
        name: dbWorkflow.name,
        description: dbWorkflow.description,
        status: dbWorkflow.status,
        created_at: dbWorkflow.created_at,
        updated_at: dbWorkflow.updated_at,
        nodes: JSON.parse(dbWorkflow.nodes || '[]'),
        connections: JSON.parse(dbWorkflow.connections || '[]'),
        tags: dbWorkflow.tags ? dbWorkflow.tags.split(',') : []
      }
      
      set({
        currentWorkflow: workflow,
        nodes: workflow.nodes,
        connections: workflow.connections,
        isLoading: false
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load workflow',
        isLoading: false
      })
      throw error
    }
  },
  
  loadWorkflows: async () => {
    try {
      set({ isLoading: true, error: null })
      
      const user = useAuthStore.getState().user
      if (!user) throw new Error('User not authenticated')
      
      const result = await table.getItems('f0i2gib9dbeo', {
        query: { _uid: user.uid },
        sort: 'updated_at',
        order: 'desc'
      })
      
      const workflows: Workflow[] = result.items.map(item => ({
        _id: item._id,
        _uid: item._uid,
        name: item.name,
        description: item.description,
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        nodes: JSON.parse(item.nodes || '[]'),
        connections: JSON.parse(item.connections || '[]'),
        tags: item.tags ? item.tags.split(',') : []
      }))
      
      set({ workflows, isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load workflows',
        isLoading: false
      })
      throw error
    }
  },
  
  deleteWorkflow: async (workflowId) => {
    try {
      const user = useAuthStore.getState().user
      if (!user) throw new Error('User not authenticated')
      
      await table.deleteItem('f0i2gib9dbeo', {
        _uid: user.uid,
        _id: workflowId
      })
      
      set((state) => ({
        workflows: state.workflows.filter(w => w._id !== workflowId),
        currentWorkflow: state.currentWorkflow?._id === workflowId ? null : state.currentWorkflow
      }))
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete workflow'
      })
      throw error
    }
  },

  // Agent management
  createAgent: async (agentData) => {
    try {
      set({ isSaving: true, error: null })
      
      const user = useAuthStore.getState().user
      if (!user) throw new Error('User not authenticated')
      
      const now = new Date().toISOString()
      const agent: Omit<Agent, '_id'> = {
        ...agentData,
        _uid: user.uid,
        created_at: now,
        updated_at: now
      }
      
      const dbAgent = {
        ...agent,
        tools: JSON.stringify(agent.tools)
      }
      
      await table.addItem('f0i2gw15akn4', dbAgent)
      
      set((state) => ({ 
        agents: [...state.agents, agent],
        isSaving: false
      }))
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create agent',
        isSaving: false
      })
      throw error
    }
  },
  
  loadAgents: async () => {
    try {
      set({ isLoading: true, error: null })
      
      const user = useAuthStore.getState().user
      if (!user) throw new Error('User not authenticated')
      
      const result = await table.getItems('f0i2gw15akn4', {
        query: { _uid: user.uid },
        sort: 'updated_at',
        order: 'desc'
      })
      
      const agents: Agent[] = result.items.map(item => ({
        _id: item._id,
        _uid: item._uid,
        name: item.name,
        description: item.description,
        system_prompt: item.system_prompt,
        model: item.model,
        temperature: item.temperature,
        max_tokens: item.max_tokens,
        status: item.status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        tools: JSON.parse(item.tools || '[]')
      }))
      
      set({ agents, isLoading: false })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load agents',
        isLoading: false
      })
      throw error
    }
  },
  
  updateAgent: async (agentId, updates) => {
    try {
      const user = useAuthStore.getState().user
      if (!user) throw new Error('User not authenticated')
      
      const dbUpdates = {
        _uid: user.uid,
        _id: agentId,
        ...updates,
        updated_at: new Date().toISOString(),
        ...(updates.tools && { tools: JSON.stringify(updates.tools) })
      }
      
      await table.updateItem('f0i2gw15akn4', dbUpdates)
      
      set((state) => ({
        agents: state.agents.map(agent =>
          agent._id === agentId 
            ? { ...agent, ...updates, updated_at: dbUpdates.updated_at }
            : agent
        )
      }))
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update agent'
      })
      throw error
    }
  },
  
  deleteAgent: async (agentId) => {
    try {
      const user = useAuthStore.getState().user
      if (!user) throw new Error('User not authenticated')
      
      await table.deleteItem('f0i2gw15akn4', {
        _uid: user.uid,
        _id: agentId
      })
      
      set((state) => ({
        agents: state.agents.filter(agent => agent._id !== agentId)
      }))
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete agent'
      })
      throw error
    }
  },

  // Utilities
  clearError: () => set({ error: null }),
  
  newWorkflow: () => {
    set({
      currentWorkflow: null,
      nodes: [],
      connections: [],
      selectedNode: null
    })
  }
}))