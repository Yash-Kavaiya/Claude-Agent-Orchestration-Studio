import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Settings, 
  Bot, 
  Code, 
  Play, 
  History, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Edit3,
  Zap,
  GitBranch
} from 'lucide-react'
import { AgentConfigDialog } from './AgentConfigDialog'
import { useWorkflowStore } from '@/store/workflow-store'

interface PropertiesPanelProps {
  selectedNode: string | null
}

export function PropertiesPanel({ selectedNode }: PropertiesPanelProps) {
  const { nodes, updateNode, deleteNode } = useWorkflowStore()
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [nodeConfig, setNodeConfig] = useState({
    title: 'Claude Agent',
    description: 'Main conversation and reasoning agent',
    systemPrompt: `You are Claude, a helpful AI assistant created by Anthropic. You are thoughtful, helpful, and honest.

Key capabilities:
- Natural conversation and reasoning
- Code analysis and generation  
- Creative writing and brainstorming
- Research and information synthesis

Always be clear, concise, and helpful in your responses.`,
    model: 'claude-3-sonnet',
    temperature: 0.7,
    maxTokens: 4000,
    enabled: true
  })

  const [executionLogs] = useState([
    {
      id: 1,
      timestamp: new Date().toISOString(),
      status: 'success',
      message: 'Agent executed successfully',
      duration: 1250,
      tokens: 324
    },
    {
      id: 2,
      timestamp: new Date(Date.now() - 300000).toISOString(),
      status: 'success',
      message: 'Agent executed successfully', 
      duration: 987,
      tokens: 156
    },
    {
      id: 3,
      timestamp: new Date(Date.now() - 600000).toISOString(),
      status: 'error',
      message: 'Rate limit exceeded',
      duration: 0,
      tokens: 0
    }
  ])

  const selectedNodeData = selectedNode ? nodes.find(n => n.id === selectedNode) : null

  useEffect(() => {
    if (selectedNodeData) {
      setNodeConfig({
        title: selectedNodeData.data.label || 'Untitled Node',
        description: selectedNodeData.data.description || '',
        systemPrompt: selectedNodeData.data.systemPrompt || nodeConfig.systemPrompt,
        model: selectedNodeData.data.model || 'claude-3-sonnet',
        temperature: selectedNodeData.data.temperature || 0.7,
        maxTokens: selectedNodeData.data.maxTokens || 4000,
        enabled: selectedNodeData.data.enabled !== false
      })
    }
  }, [selectedNodeData])

  const handleConfigSave = () => {
    if (selectedNode && selectedNodeData) {
      updateNode(selectedNode, {
        ...selectedNodeData,
        data: {
          ...selectedNodeData.data,
          label: nodeConfig.title,
          description: nodeConfig.description,
          systemPrompt: nodeConfig.systemPrompt,
          model: nodeConfig.model,
          temperature: nodeConfig.temperature,
          maxTokens: nodeConfig.maxTokens,
          enabled: nodeConfig.enabled
        }
      })
    }
  }

  const handleDeleteNode = () => {
    if (selectedNode) {
      deleteNode(selectedNode)
    }
  }

  if (!selectedNode) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Properties
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-2">
            <div className="p-3 bg-muted rounded-full w-fit mx-auto">
              <Bot className="w-6 h-6 text-muted-foreground" />
            </div>
            <h4 className="font-medium text-muted-foreground">No Node Selected</h4>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              Select a node on the canvas to view and edit its configuration
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Bot className="w-4 h-4 text-primary" />
            Node Configuration
          </h3>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2"
              onClick={() => setConfigDialogOpen(true)}
              title="Advanced Configuration"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2" title="Duplicate Node">
              <Copy className="w-3 h-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 text-destructive hover:text-destructive"
              onClick={handleDeleteNode}
              title="Delete Node"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {selectedNodeData?.type || 'Agent'}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {selectedNodeData?.data.model || 'claude-3-sonnet'}
          </Badge>
          <Badge 
            variant={selectedNodeData?.data.enabled !== false ? "default" : "outline"} 
            className="text-xs"
          >
            {selectedNodeData?.data.enabled !== false ? "Active" : "Disabled"}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <Tabs defaultValue="config" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="config" className="text-xs">Config</TabsTrigger>
              <TabsTrigger value="connections" className="text-xs">Connections</TabsTrigger>
              <TabsTrigger value="execution" className="text-xs">Execution</TabsTrigger>
              <TabsTrigger value="logs" className="text-xs">Logs</TabsTrigger>
            </TabsList>

            {/* Configuration Tab */}
            <TabsContent value="config" className="space-y-6">
              {/* Quick Actions */}
              <div className="flex gap-2 mb-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setConfigDialogOpen(true)}
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  Advanced Config
                </Button>
                <Button variant="outline" size="sm">
                  <Play className="w-3 h-3 mr-1" />
                  Test Node
                </Button>
              </div>

              {/* Basic Settings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Basic Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-xs">Node Title</Label>
                    <Input
                      id="title"
                      value={nodeConfig.title}
                      onChange={(e) => setNodeConfig(prev => ({ ...prev, title: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-xs">Description</Label>
                    <Textarea
                      id="description"
                      value={nodeConfig.description}
                      onChange={(e) => setNodeConfig(prev => ({ ...prev, description: e.target.value }))}
                      className="text-sm min-h-[60px]"
                      placeholder="Describe what this node does..."
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="enabled" className="text-xs">Enabled</Label>
                    <Switch
                      id="enabled"
                      checked={nodeConfig.enabled}
                      onCheckedChange={(checked) => setNodeConfig(prev => ({ ...prev, enabled: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Agent Configuration */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    Agent Configuration
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure the Claude agent behavior and capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="model" className="text-xs">Model</Label>
                    <Select value={nodeConfig.model} onValueChange={(value) => 
                      setNodeConfig(prev => ({ ...prev, model: value }))
                    }>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                        <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                        <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="temperature" className="text-xs">Temperature</Label>
                      <span className="text-xs text-muted-foreground">{nodeConfig.temperature}</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={nodeConfig.temperature}
                      onChange={(e) => setNodeConfig(prev => ({ 
                        ...prev, 
                        temperature: parseFloat(e.target.value) 
                      }))}
                      className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxTokens" className="text-xs">Max Tokens</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      value={nodeConfig.maxTokens}
                      onChange={(e) => setNodeConfig(prev => ({ 
                        ...prev, 
                        maxTokens: parseInt(e.target.value) || 0 
                      }))}
                      className="h-8 text-sm"
                      min="1"
                      max="8000"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* System Prompt */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    System Prompt
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Define the agent's personality, capabilities, and behavior
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        <Eye className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">
                        Templates
                      </Button>
                    </div>
                    <Textarea
                      value={nodeConfig.systemPrompt}
                      onChange={(e) => setNodeConfig(prev => ({ 
                        ...prev, 
                        systemPrompt: e.target.value 
                      }))}
                      className="text-sm font-mono min-h-[200px]"
                      placeholder="Enter system prompt..."
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{nodeConfig.systemPrompt.length} characters</span>
                      <span>~{Math.ceil(nodeConfig.systemPrompt.length / 4)} tokens</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Connections Tab */}
            <TabsContent value="connections" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    Node Connections
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Manage input and output connections
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Input Connections</Label>
                      <div className="text-center py-4 text-muted-foreground">
                        <GitBranch className="w-5 h-5 mx-auto mb-1" />
                        <p className="text-xs">No input connections</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Output Connections</Label>
                      <div className="text-center py-4 text-muted-foreground">
                        <GitBranch className="w-5 h-5 mx-auto mb-1" />
                        <p className="text-xs">No output connections</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Execution Tab */}
            <TabsContent value="execution" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Test Execution
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Test the agent with sample input
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Test Input</Label>
                    <Textarea
                      placeholder="Enter test message for the agent..."
                      className="text-sm min-h-[100px]"
                    />
                  </div>
                  <Button size="sm" className="w-full">
                    <Play className="w-3 h-3 mr-2" />
                    Run Test
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Avg Response Time</span>
                    <span className="text-xs font-medium">1.2s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Success Rate</span>
                    <span className="text-xs font-medium">96.5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Total Executions</span>
                    <span className="text-xs font-medium">1,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Avg Token Usage</span>
                    <span className="text-xs font-medium">234 tokens</span>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Execution History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {executionLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-2 bg-muted/50 rounded-lg">
                        <div className="mt-1">
                          {log.status === 'success' ? (
                            <CheckCircle className="w-3 h-3 text-green-500" />
                          ) : (
                            <AlertCircle className="w-3 h-3 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">{log.message}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {log.duration}ms
                            </span>
                            {log.tokens > 0 && (
                              <span>{log.tokens} tokens</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/30">
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={handleConfigSave}>
            Save Changes
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setConfigDialogOpen(true)}
          >
            <Settings className="w-3 h-3 mr-1" />
            Advanced
          </Button>
        </div>
      </div>

      {/* Advanced Configuration Dialog */}
      <AgentConfigDialog
        open={configDialogOpen}
        onOpenChange={setConfigDialogOpen}
        agentId={selectedNode || undefined}
      />
    </div>
  )
}