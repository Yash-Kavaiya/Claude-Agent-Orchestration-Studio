import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Separator } from './ui/separator'
import { ScrollArea } from './ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog'
import { 
  Users, 
  Plus, 
  Settings, 
  Trash2, 
  GitBranch, 
  Crown, 
  UserCheck, 
  Play, 
  Pause, 
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Link
} from 'lucide-react'
import { useWorkflowStore, Node } from '../store/workflow-store'

interface SubAgent {
  id: string
  name: string
  description: string
  systemPrompt: string
  model: string
  parentId?: string
  children: string[]
  role: 'coordinator' | 'specialist' | 'executor' | 'validator'
  priority: 'high' | 'medium' | 'low'
  status: 'active' | 'inactive' | 'error' | 'pending'
  capabilities: string[]
  restrictions: string[]
  delegation: {
    canDelegate: boolean
    maxDepth: number
    allowedRoles: string[]
  }
  communication: {
    canCommunicateUp: boolean
    canCommunicateLateral: boolean
    canCommunicateDown: boolean
  }
  execution: {
    timeout: number
    retries: number
    fallbackAgent?: string
  }
  metrics: {
    tasksCompleted: number
    averageResponseTime: number
    successRate: number
    lastActive: string
  }
}

interface SubAgentHierarchyProps {
  parentNodeId: string
  onClose: () => void
}

export function SubAgentHierarchy({ parentNodeId, onClose }: SubAgentHierarchyProps) {
  const { nodes, updateNode } = useWorkflowStore()
  const [subAgents, setSubAgents] = useState<SubAgent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<SubAgent | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'tree' | 'flat' | 'roles'>('tree')

  // Get the parent node
  const parentNode = nodes.find(node => node.id === parentNodeId)

  // Initialize sub-agents from parent node data
  useEffect(() => {
    if (parentNode?.data.subAgents) {
      // Load existing sub-agents configuration
      const agentConfigs = parentNode.data.subAgentConfigs || []
      setSubAgents(agentConfigs)
    }
  }, [parentNode])

  // Save sub-agents to parent node
  const saveSubAgents = (agents: SubAgent[]) => {
    setSubAgents(agents)
    updateNode(parentNodeId, {
      data: {
        ...parentNode?.data,
        subAgents: agents.map(a => a.id),
        subAgentConfigs: agents
      }
    })
  }

  const createSubAgent = (parentId?: string) => {
    const newAgent: SubAgent = {
      id: `sub_agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: 'New Sub-Agent',
      description: 'A specialized sub-agent for specific tasks',
      systemPrompt: 'You are a helpful AI assistant specialized in specific tasks.',
      model: 'default',
      parentId,
      children: [],
      role: 'specialist',
      priority: 'medium',
      status: 'inactive',
      capabilities: [],
      restrictions: [],
      delegation: {
        canDelegate: false,
        maxDepth: 2,
        allowedRoles: ['executor']
      },
      communication: {
        canCommunicateUp: true,
        canCommunicateLateral: false,
        canCommunicateDown: true
      },
      execution: {
        timeout: 30000,
        retries: 3
      },
      metrics: {
        tasksCompleted: 0,
        averageResponseTime: 0,
        successRate: 0,
        lastActive: new Date().toISOString()
      }
    }

    const updatedAgents = [...subAgents, newAgent]
    
    // Update parent's children if creating a child agent
    if (parentId) {
      const parentIndex = updatedAgents.findIndex(a => a.id === parentId)
      if (parentIndex !== -1) {
        updatedAgents[parentIndex].children.push(newAgent.id)
      }
    }

    saveSubAgents(updatedAgents)
    setSelectedAgent(newAgent)
    setIsCreating(true)
  }

  const updateSubAgent = (agentId: string, updates: Partial<SubAgent>) => {
    const updatedAgents = subAgents.map(agent =>
      agent.id === agentId ? { ...agent, ...updates } : agent
    )
    saveSubAgents(updatedAgents)
    
    if (selectedAgent?.id === agentId) {
      setSelectedAgent({ ...selectedAgent, ...updates })
    }
  }

  const deleteSubAgent = (agentId: string) => {
    const agent = subAgents.find(a => a.id === agentId)
    if (!agent) return

    let updatedAgents = [...subAgents]

    // Remove from parent's children
    if (agent.parentId) {
      const parentIndex = updatedAgents.findIndex(a => a.id === agent.parentId)
      if (parentIndex !== -1) {
        updatedAgents[parentIndex].children = updatedAgents[parentIndex].children.filter(id => id !== agentId)
      }
    }

    // Reassign children to parent or delete them
    agent.children.forEach(childId => {
      const childIndex = updatedAgents.findIndex(a => a.id === childId)
      if (childIndex !== -1) {
        if (agent.parentId) {
          updatedAgents[childIndex].parentId = agent.parentId
          const grandparentIndex = updatedAgents.findIndex(a => a.id === agent.parentId)
          if (grandparentIndex !== -1) {
            updatedAgents[grandparentIndex].children.push(childId)
          }
        } else {
          updatedAgents[childIndex].parentId = undefined
        }
      }
    })

    // Remove the agent
    updatedAgents = updatedAgents.filter(a => a.id !== agentId)
    
    saveSubAgents(updatedAgents)
    setSelectedAgent(null)
  }

  const toggleExpanded = (agentId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(agentId)) {
      newExpanded.delete(agentId)
    } else {
      newExpanded.add(agentId)
    }
    setExpandedNodes(newExpanded)
  }

  const getRootAgents = () => subAgents.filter(agent => !agent.parentId)
  
  const getChildAgents = (parentId: string) => subAgents.filter(agent => agent.parentId === parentId)

  const getAgentsByRole = () => {
    const roles = ['coordinator', 'specialist', 'executor', 'validator']
    return roles.map(role => ({
      role,
      agents: subAgents.filter(agent => agent.role === role)
    }))
  }

  const AgentCard = ({ agent, level = 0 }: { agent: SubAgent; level?: number }) => {
    const hasChildren = agent.children.length > 0
    const isExpanded = expandedNodes.has(agent.id)
    const childAgents = getChildAgents(agent.id)

    const statusColors = {
      active: 'bg-green-500/10 text-green-600 border-green-500/20',
      inactive: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
      error: 'bg-red-500/10 text-red-600 border-red-500/20',
      pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
    }

    const roleIcons = {
      coordinator: Crown,
      specialist: UserCheck,
      executor: Play,
      validator: Eye
    }

    const RoleIcon = roleIcons[agent.role]

    return (
      <div className="space-y-2" style={{ marginLeft: `${level * 24}px` }}>
        <Card className={`transition-all duration-200 hover:shadow-md ${selectedAgent?.id === agent.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {hasChildren && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(agent.id)}
                    className="h-6 w-6 p-0"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                )}
                <RoleIcon className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-sm font-medium">{agent.name}</CardTitle>
                  <CardDescription className="text-xs">{agent.description}</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={statusColors[agent.status]}>
                  {agent.status}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {agent.role}
                </Badge>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedAgent(agent)}
                    className="h-8 w-8 p-0"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => createSubAgent(agent.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Sub-Agent</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{agent.name}"? This action cannot be undone.
                          {agent.children.length > 0 && (
                            <span className="block mt-2 text-yellow-600">
                              This agent has {agent.children.length} child agent(s) that will be reassigned.
                            </span>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteSubAgent(agent.id)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Play className="h-3 w-3" />
                <span>{agent.metrics.tasksCompleted} tasks</span>
              </div>
              <div className="flex items-center gap-1">
                <RotateCcw className="h-3 w-3" />
                <span>{agent.metrics.successRate}% success</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                <span>{agent.children.length} sub-agents</span>
              </div>
            </div>
          </CardHeader>
        </Card>

        {isExpanded && hasChildren && (
          <div className="space-y-2">
            {childAgents.map(childAgent => (
              <AgentCard key={childAgent.id} agent={childAgent} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl border shadow-2xl w-full max-w-7xl h-[90vh] flex">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Sub-Agent Hierarchy</h2>
                <p className="text-muted-foreground">
                  Manage and orchestrate sub-agents for "{parentNode?.title}"
                </p>
              </div>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="view-mode">View:</Label>
                <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tree">Tree View</SelectItem>
                    <SelectItem value="flat">Flat List</SelectItem>
                    <SelectItem value="roles">By Roles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={() => createSubAgent()} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Root Agent
              </Button>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground ml-auto">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  <span>{subAgents.filter(a => a.status === 'active').length} Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                  <span>{subAgents.filter(a => a.status === 'inactive').length} Inactive</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                  <span>{subAgents.filter(a => a.status === 'error').length} Error</span>
                </div>
              </div>
            </div>
          </div>

          {/* Agent Hierarchy Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Agents List */}
            <div className="flex-1 p-6 overflow-auto">
              {subAgents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No Sub-Agents</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first sub-agent to start building your agent hierarchy
                  </p>
                  <Button onClick={() => createSubAgent()} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Sub-Agent
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {viewMode === 'tree' && (
                      <>
                        {getRootAgents().map(agent => (
                          <AgentCard key={agent.id} agent={agent} />
                        ))}
                      </>
                    )}
                    
                    {viewMode === 'flat' && (
                      <>
                        {subAgents.map(agent => (
                          <AgentCard key={agent.id} agent={agent} />
                        ))}
                      </>
                    )}
                    
                    {viewMode === 'roles' && (
                      <>
                        {getAgentsByRole().map(({ role, agents }) => (
                          <div key={role} className="space-y-2">
                            <h3 className="text-lg font-medium capitalize">{role}s ({agents.length})</h3>
                            {agents.map(agent => (
                              <AgentCard key={agent.id} agent={agent} />
                            ))}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Agent Configuration Panel */}
            {selectedAgent && (
              <div className="w-96 border-l bg-muted/30 flex flex-col">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-medium">Configure Agent</h3>
                  <p className="text-sm text-muted-foreground">{selectedAgent.name}</p>
                </div>
                
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-foreground">Basic Information</h4>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="agent-name">Name</Label>
                          <Input
                            id="agent-name"
                            value={selectedAgent.name}
                            onChange={(e) => updateSubAgent(selectedAgent.id, { name: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="agent-description">Description</Label>
                          <Textarea
                            id="agent-description"
                            value={selectedAgent.description}
                            onChange={(e) => updateSubAgent(selectedAgent.id, { description: e.target.value })}
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label htmlFor="agent-role">Role</Label>
                          <Select
                            value={selectedAgent.role}
                            onValueChange={(value: any) => updateSubAgent(selectedAgent.id, { role: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="coordinator">Coordinator</SelectItem>
                              <SelectItem value="specialist">Specialist</SelectItem>
                              <SelectItem value="executor">Executor</SelectItem>
                              <SelectItem value="validator">Validator</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="agent-priority">Priority</Label>
                          <Select
                            value={selectedAgent.priority}
                            onValueChange={(value: any) => updateSubAgent(selectedAgent.id, { priority: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">High Priority</SelectItem>
                              <SelectItem value="medium">Medium Priority</SelectItem>
                              <SelectItem value="low">Low Priority</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* System Prompt */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-foreground">System Prompt</h4>
                      <Textarea
                        value={selectedAgent.systemPrompt}
                        onChange={(e) => updateSubAgent(selectedAgent.id, { systemPrompt: e.target.value })}
                        rows={4}
                        placeholder="Define the agent's role and behavior..."
                      />
                    </div>

                    <Separator />

                    {/* Delegation Settings */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-foreground">Delegation</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="can-delegate">Can Delegate Tasks</Label>
                          <Button
                            variant={selectedAgent.delegation.canDelegate ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateSubAgent(selectedAgent.id, { 
                              delegation: { 
                                ...selectedAgent.delegation, 
                                canDelegate: !selectedAgent.delegation.canDelegate 
                              }
                            })}
                          >
                            {selectedAgent.delegation.canDelegate ? 'Enabled' : 'Disabled'}
                          </Button>
                        </div>
                        <div>
                          <Label htmlFor="max-depth">Max Delegation Depth</Label>
                          <Select
                            value={selectedAgent.delegation.maxDepth.toString()}
                            onValueChange={(value) => updateSubAgent(selectedAgent.id, { 
                              delegation: { 
                                ...selectedAgent.delegation, 
                                maxDepth: parseInt(value) 
                              }
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 Level</SelectItem>
                              <SelectItem value="2">2 Levels</SelectItem>
                              <SelectItem value="3">3 Levels</SelectItem>
                              <SelectItem value="5">5 Levels</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Execution Settings */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-foreground">Execution</h4>
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="timeout">Timeout (seconds)</Label>
                          <Input
                            id="timeout"
                            type="number"
                            value={selectedAgent.execution.timeout / 1000}
                            onChange={(e) => updateSubAgent(selectedAgent.id, { 
                              execution: { 
                                ...selectedAgent.execution, 
                                timeout: parseInt(e.target.value) * 1000 
                              }
                            })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="retries">Max Retries</Label>
                          <Input
                            id="retries"
                            type="number"
                            value={selectedAgent.execution.retries}
                            onChange={(e) => updateSubAgent(selectedAgent.id, { 
                              execution: { 
                                ...selectedAgent.execution, 
                                retries: parseInt(e.target.value) 
                              }
                            })}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Metrics */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-foreground">Performance Metrics</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tasks Completed:</span>
                          <span>{selectedAgent.metrics.tasksCompleted}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Success Rate:</span>
                          <span>{selectedAgent.metrics.successRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg Response Time:</span>
                          <span>{selectedAgent.metrics.averageResponseTime}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Last Active:</span>
                          <span>{new Date(selectedAgent.metrics.lastActive).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}