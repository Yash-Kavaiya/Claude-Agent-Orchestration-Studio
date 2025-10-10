import { useState } from 'react'
import { SubAgentHierarchy } from './SubAgentHierarchy'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Bot, 
  Code, 
  Shield, 
  Brain, 
  Users, 
  Play, 
  Save, 
  RotateCcw, 
  Eye,
  Sparkles,
  FileText,
  Globe,
  Database,
  MessageSquare,
  MessageCircle,
  Settings,
  Plus,
  X,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  GitBranch,
  Archive,
  Zap
} from 'lucide-react'

interface AgentConfig {
  id: string
  name: string
  description: string
  systemPrompt: string
  model: string
  temperature: number
  maxTokens: number
  tools: string[]
  permissions: {
    mode: 'default' | 'accept_edits' | 'plan_mode' | 'bypass'
    allowedTools: string[]
    disallowedTools: string[]
    toolPermissions: ToolPermission[]
    globalRestrictions: string[]
    auditEnabled: boolean
    customRateLimits: Record<string, number>
  }
  memory: {
    enabled: boolean
    contextWindow: number
    persistentMemory: boolean
    // Context Management
    contextStrategy: 'rolling' | 'summarization' | 'compression' | 'selective'
    contextRetentionRatio: number
    maxHistoryLength: number
    // Memory Types
    shortTermMemory: {
      enabled: boolean
      maxItems: number
      retention: 'session' | 'conversation' | 'task'
    }
    longTermMemory: {
      enabled: boolean
      vectorStorage: boolean
      semanticSearch: boolean
      autoSummarization: boolean
    }
    // Conversation Management
    conversationConfig: {
      maxTurns: number
      autoSave: boolean
      compressionThreshold: number
      semanticGrouping: boolean
    }
    // State Management
    stateManagement: {
      persistWorkflowState: boolean
      persistAgentState: boolean
      stateBackupInterval: number
      maxStateVersions: number
    }
    // Performance
    optimization: {
      enableCaching: boolean
      cacheStrategy: 'lru' | 'lfu' | 'ttl'
      cacheTTL: number
      preloadContext: boolean
    }
  }
  subAgents?: {
    enabled: boolean
    maxCount: number
    maxDepth: number
    strategy: 'automatic' | 'manual' | 'hybrid'
    communication: {
      lateral: boolean
      hierarchical: boolean
    }
    configs: any[]
  }
  enabled: boolean
}

interface AgentConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agentId?: string
}

const SYSTEM_PROMPT_TEMPLATES = [
  {
    id: 'default',
    name: 'Default Assistant',
    description: 'General purpose helpful AI assistant',
    prompt: `You are Claude, a helpful AI assistant created by Anthropic. You are thoughtful, helpful, and honest.

Key capabilities:
- Natural conversation and reasoning
- Code analysis and generation  
- Creative writing and brainstorming
- Research and information synthesis

Always be clear, concise, and helpful in your responses.`
  },
  {
    id: 'code_expert',
    name: 'Code Expert',
    description: 'Specialized in programming and software development',
    prompt: `You are a senior software engineer with expertise across multiple programming languages and frameworks. 

Your specializations include:
- Code review and optimization
- Architecture and design patterns
- Debugging and troubleshooting
- Best practices and security
- Performance optimization
- Documentation and testing

Provide detailed, accurate technical guidance with working code examples when appropriate.`
  },
  {
    id: 'analyst',
    name: 'Data Analyst',
    description: 'Expert in data analysis and insights',
    prompt: `You are a data analyst with deep expertise in statistical analysis, data visualization, and business intelligence.

Your capabilities include:
- Data cleaning and preprocessing
- Statistical analysis and hypothesis testing
- Data visualization recommendations
- Business insights and reporting
- Predictive modeling concepts
- SQL and data querying

Focus on providing actionable insights and clear explanations of complex data concepts.`
  },
  {
    id: 'creative',
    name: 'Creative Writer',
    description: 'Specialized in creative content and storytelling',
    prompt: `You are a creative writing specialist with expertise in storytelling, content creation, and literary analysis.

Your strengths include:
- Fiction and narrative writing
- Content marketing and copywriting
- Script and screenplay development
- Poetry and creative expression
- Character and world building
- Editorial and proofreading

Bring imagination and creativity to every project while maintaining professional quality.`
  }
]

// Tool permission levels
const PERMISSION_LEVELS = {
  ALLOW: 'allow',
  PROMPT: 'prompt', 
  DENY: 'deny'
} as const;

type PermissionLevel = typeof PERMISSION_LEVELS[keyof typeof PERMISSION_LEVELS];

// Risk levels for tools
const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const;

type RiskLevel = typeof RISK_LEVELS[keyof typeof RISK_LEVELS];

// Enhanced tool definition with granular permissions
interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  riskLevel: RiskLevel;
  defaultPermission: PermissionLevel;
  requiredAuth?: boolean;
  contextRestrictions?: string[];
  rateLimitPerHour?: number;
  auditRequired?: boolean;
  dependencies?: string[];
}

// Tool permission configuration
interface ToolPermission {
  toolId: string;
  permission: PermissionLevel;
  restrictions: string[];
  customRateLimit?: number;
  conditions?: string[];
}

const AVAILABLE_TOOLS: ToolDefinition[] = [
  // System Tools
  { 
    id: 'file_read', 
    name: 'File Reader', 
    description: 'Read and analyze file contents from the filesystem', 
    category: 'System',
    riskLevel: RISK_LEVELS.MEDIUM,
    defaultPermission: PERMISSION_LEVELS.PROMPT,
    contextRestrictions: ['workspace_only', 'size_limit_10mb'],
    auditRequired: true,
    rateLimitPerHour: 100
  },
  { 
    id: 'file_write', 
    name: 'File Writer', 
    description: 'Create, modify, and save file contents', 
    category: 'System',
    riskLevel: RISK_LEVELS.HIGH,
    defaultPermission: PERMISSION_LEVELS.PROMPT,
    contextRestrictions: ['workspace_only', 'backup_required', 'virus_scan'],
    auditRequired: true,
    rateLimitPerHour: 50
  },
  { 
    id: 'file_delete', 
    name: 'File Delete', 
    description: 'Delete files and directories with confirmation', 
    category: 'System',
    riskLevel: RISK_LEVELS.HIGH,
    defaultPermission: PERMISSION_LEVELS.PROMPT,
    contextRestrictions: ['workspace_only', 'confirmation_required', 'backup_required'],
    auditRequired: true,
    rateLimitPerHour: 20
  },
  { 
    id: 'code_execution', 
    name: 'Code Execution', 
    description: 'Execute code safely in sandboxed environments', 
    category: 'System',
    riskLevel: RISK_LEVELS.CRITICAL,
    defaultPermission: PERMISSION_LEVELS.DENY,
    contextRestrictions: ['sandbox_only', 'time_limit_30s', 'memory_limit_512mb'],
    auditRequired: true,
    rateLimitPerHour: 10,
    requiredAuth: true
  },

  // Web Tools  
  { 
    id: 'web_search', 
    name: 'Web Search', 
    description: 'Search the internet for real-time information', 
    category: 'Web',
    riskLevel: RISK_LEVELS.LOW,
    defaultPermission: PERMISSION_LEVELS.ALLOW,
    rateLimitPerHour: 200
  },
  { 
    id: 'web_reader', 
    name: 'Web Content Reader', 
    description: 'Extract and parse content from web pages', 
    category: 'Web',
    riskLevel: RISK_LEVELS.LOW,
    defaultPermission: PERMISSION_LEVELS.ALLOW,
    contextRestrictions: ['safe_domains_only'],
    rateLimitPerHour: 100
  },
  { 
    id: 'web_scraper', 
    name: 'Advanced Web Scraper', 
    description: 'Comprehensive web scraping with automation', 
    category: 'Web',
    riskLevel: RISK_LEVELS.MEDIUM,
    defaultPermission: PERMISSION_LEVELS.PROMPT,
    contextRestrictions: ['rate_limited', 'robots_txt_respect'],
    auditRequired: true,
    rateLimitPerHour: 30
  },

  // Development Tools
  { 
    id: 'git_operations', 
    name: 'Git Version Control', 
    description: 'Git repository management and operations', 
    category: 'Development',
    riskLevel: RISK_LEVELS.MEDIUM,
    defaultPermission: PERMISSION_LEVELS.PROMPT,
    contextRestrictions: ['workspace_only', 'branch_protection'],
    auditRequired: true,
    rateLimitPerHour: 50
  },
  { 
    id: 'package_manager', 
    name: 'Package Manager', 
    description: 'Install and manage software packages', 
    category: 'Development',
    riskLevel: RISK_LEVELS.HIGH,
    defaultPermission: PERMISSION_LEVELS.PROMPT,
    contextRestrictions: ['security_scan', 'trusted_sources'],
    auditRequired: true,
    rateLimitPerHour: 20,
    requiredAuth: true
  },
  { 
    id: 'docker_management', 
    name: 'Docker Container Management', 
    description: 'Manage Docker containers and images', 
    category: 'Development',
    riskLevel: RISK_LEVELS.HIGH,
    defaultPermission: PERMISSION_LEVELS.PROMPT,
    contextRestrictions: ['isolated_network', 'resource_limits'],
    auditRequired: true,
    rateLimitPerHour: 30,
    requiredAuth: true
  },

  // Data Tools
  { 
    id: 'database_query', 
    name: 'Database Operations', 
    description: 'Query and manipulate database contents', 
    category: 'Data',
    riskLevel: RISK_LEVELS.MEDIUM,
    defaultPermission: PERMISSION_LEVELS.PROMPT,
    contextRestrictions: ['read_only_default', 'connection_encryption'],
    auditRequired: true,
    rateLimitPerHour: 100,
    requiredAuth: true
  },
  { 
    id: 'data_export', 
    name: 'Data Export', 
    description: 'Export data in various formats (CSV, JSON, XML)', 
    category: 'Data',
    riskLevel: RISK_LEVELS.MEDIUM,
    defaultPermission: PERMISSION_LEVELS.PROMPT,
    contextRestrictions: ['size_limit_100mb', 'pii_detection'],
    auditRequired: true,
    rateLimitPerHour: 20
  },
  { 
    id: 'data_analysis', 
    name: 'Data Analysis', 
    description: 'Statistical analysis and data processing', 
    category: 'Data',
    riskLevel: RISK_LEVELS.LOW,
    defaultPermission: PERMISSION_LEVELS.ALLOW,
    rateLimitPerHour: 50
  },

  // Integration Tools
  { 
    id: 'api_calls', 
    name: 'External API Calls', 
    description: 'Make HTTP requests to third-party APIs', 
    category: 'Integration',
    riskLevel: RISK_LEVELS.MEDIUM,
    defaultPermission: PERMISSION_LEVELS.PROMPT,
    contextRestrictions: ['https_only', 'rate_respect'],
    auditRequired: true,
    rateLimitPerHour: 100
  },
  { 
    id: 'webhook_sender', 
    name: 'Webhook Sender', 
    description: 'Send webhook notifications and events', 
    category: 'Integration',
    riskLevel: RISK_LEVELS.MEDIUM,
    defaultPermission: PERMISSION_LEVELS.PROMPT,
    contextRestrictions: ['verified_endpoints'],
    auditRequired: true,
    rateLimitPerHour: 200
  },
  { 
    id: 'openrouter_ai', 
    name: 'OpenRouter AI Models', 
    description: 'Access to advanced AI models via OpenRouter', 
    category: 'Integration',
    riskLevel: RISK_LEVELS.LOW,
    defaultPermission: PERMISSION_LEVELS.ALLOW,
    rateLimitPerHour: 500,
    requiredAuth: true
  },

  // Creative Tools
  { 
    id: 'image_generation', 
    name: 'AI Image Generation', 
    description: 'Generate images from text prompts', 
    category: 'Creative',
    riskLevel: RISK_LEVELS.LOW,
    defaultPermission: PERMISSION_LEVELS.ALLOW,
    contextRestrictions: ['content_filter', 'resolution_limit'],
    rateLimitPerHour: 100
  },
  { 
    id: 'image_editing', 
    name: 'AI Image Editing', 
    description: 'Edit and enhance images with AI', 
    category: 'Creative',
    riskLevel: RISK_LEVELS.LOW,
    defaultPermission: PERMISSION_LEVELS.ALLOW,
    contextRestrictions: ['size_limit_50mb'],
    rateLimitPerHour: 50
  },
  { 
    id: 'video_generation', 
    name: 'Video Generation', 
    description: 'Create and edit videos with AI assistance', 
    category: 'Creative',
    riskLevel: RISK_LEVELS.MEDIUM,
    defaultPermission: PERMISSION_LEVELS.PROMPT,
    contextRestrictions: ['duration_limit_5min', 'content_filter'],
    rateLimitPerHour: 10
  },

  // Audio Tools
  { 
    id: 'text_to_speech', 
    name: 'Text to Speech', 
    description: 'Convert text to natural-sounding speech', 
    category: 'Audio',
    riskLevel: RISK_LEVELS.LOW,
    defaultPermission: PERMISSION_LEVELS.ALLOW,
    rateLimitPerHour: 200
  },
  { 
    id: 'speech_to_text', 
    name: 'Speech to Text', 
    description: 'Transcribe speech and audio to text', 
    category: 'Audio',
    riskLevel: RISK_LEVELS.LOW,
    defaultPermission: PERMISSION_LEVELS.ALLOW,
    contextRestrictions: ['duration_limit_30min'],
    rateLimitPerHour: 100
  },
  { 
    id: 'audio_editing', 
    name: 'Audio Processing', 
    description: 'Edit, enhance, and process audio files', 
    category: 'Audio',
    riskLevel: RISK_LEVELS.MEDIUM,
    defaultPermission: PERMISSION_LEVELS.PROMPT,
    contextRestrictions: ['size_limit_100mb'],
    rateLimitPerHour: 30
  },
]

export function AgentConfigDialog({ open, onOpenChange, agentId }: AgentConfigDialogProps) {
  const [config, setConfig] = useState<AgentConfig>({
    id: agentId || `agent_${Date.now()}`,
    name: 'New Agent',
    description: 'A helpful AI agent',
    systemPrompt: SYSTEM_PROMPT_TEMPLATES[0].prompt,
    model: 'claude-3-sonnet',
    temperature: 0.7,
    maxTokens: 4000,
    tools: ['web_search', 'web_reader'],
    permissions: {
      mode: 'default',
      allowedTools: [],
      disallowedTools: [],
      toolPermissions: [],
      globalRestrictions: ['workspace_only', 'rate_limited'],
      auditEnabled: true,
      customRateLimits: {}
    },
    memory: {
      enabled: true,
      contextWindow: 8000,
      persistentMemory: false,
      // Context Management
      contextStrategy: 'rolling',
      contextRetentionRatio: 0.7,
      maxHistoryLength: 1000,
      // Memory Types
      shortTermMemory: {
        enabled: true,
        maxItems: 50,
        retention: 'conversation'
      },
      longTermMemory: {
        enabled: false,
        vectorStorage: false,
        semanticSearch: false,
        autoSummarization: false
      },
      // Conversation Management
      conversationConfig: {
        maxTurns: 100,
        autoSave: true,
        compressionThreshold: 80,
        semanticGrouping: false
      },
      // State Management
      stateManagement: {
        persistWorkflowState: true,
        persistAgentState: false,
        stateBackupInterval: 300, // 5 minutes
        maxStateVersions: 10
      },
      // Performance
      optimization: {
        enableCaching: true,
        cacheStrategy: 'lru',
        cacheTTL: 3600, // 1 hour
        preloadContext: false
      }
    },
    subAgents: {
      enabled: false,
      maxCount: 5,
      maxDepth: 2,
      strategy: 'automatic',
      communication: {
        lateral: false,
        hierarchical: true
      },
      configs: []
    },
    enabled: true
  })

  const [activeTab, setActiveTab] = useState('basic')
  const [selectedTemplate, setSelectedTemplate] = useState('default')
  const [showSubAgentHierarchy, setShowSubAgentHierarchy] = useState(false)

  const handleTemplateSelect = (templateId: string) => {
    const template = SYSTEM_PROMPT_TEMPLATES.find(t => t.id === templateId)
    if (template) {
      setConfig(prev => ({ ...prev, systemPrompt: template.prompt }))
      setSelectedTemplate(templateId)
    }
  }

  // Helper to get risk level badge color
  const getRiskBadgeColor = (risk: RiskLevel) => {
    switch (risk) {
      case RISK_LEVELS.LOW: return 'bg-green-100 text-green-800 border-green-200'
      case RISK_LEVELS.MEDIUM: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case RISK_LEVELS.HIGH: return 'bg-orange-100 text-orange-800 border-orange-200'
      case RISK_LEVELS.CRITICAL: return 'bg-red-100 text-red-800 border-red-200'
    }
  }

  // Helper to get permission level for a tool
  const getToolPermission = (toolId: string): PermissionLevel => {
    const toolPerm = config.permissions.toolPermissions.find(tp => tp.toolId === toolId)
    if (toolPerm) return toolPerm.permission
    
    const tool = AVAILABLE_TOOLS.find(t => t.id === toolId)
    return tool?.defaultPermission || PERMISSION_LEVELS.PROMPT
  }

  // Update tool permission level
  const setToolPermission = (toolId: string, permission: PermissionLevel) => {
    setConfig(prev => {
      const toolPermissions = prev.permissions.toolPermissions.filter(tp => tp.toolId !== toolId)
      if (permission !== AVAILABLE_TOOLS.find(t => t.id === toolId)?.defaultPermission) {
        toolPermissions.push({
          toolId,
          permission,
          restrictions: [],
          conditions: []
        })
      }
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          toolPermissions
        }
      }
    })
  }

  const handleToolToggle = (toolId: string, enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      tools: enabled 
        ? [...prev.tools, toolId]
        : prev.tools.filter(t => t !== toolId)
    }))
    
    // If disabling tool, also remove from permissions
    if (!enabled) {
      setConfig(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          toolPermissions: prev.permissions.toolPermissions.filter(tp => tp.toolId !== toolId)
        }
      }))
    }
  }

  const handleSave = () => {
    // Here we would save to the workflow store
    console.log('Saving agent config:', config)
    onOpenChange(false)
  }

  const toolsByCategory = AVAILABLE_TOOLS.reduce((acc, tool) => {
    if (!acc[tool.category]) acc[tool.category] = []
    acc[tool.category].push(tool)
    return acc
  }, {} as Record<string, ToolDefinition[]>)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              Agent Configuration
            </DialogTitle>
            <DialogDescription>
              Configure your Claude agent's behavior, capabilities, and permissions
            </DialogDescription>
          </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="prompt">System Prompt</TabsTrigger>
            <TabsTrigger value="tools">Tools & Permissions</TabsTrigger>
            <TabsTrigger value="subagents">Sub-Agents</TabsTrigger>
            <TabsTrigger value="memory">Memory</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            {/* Basic Configuration */}
            <TabsContent value="basic" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                  <CardDescription>Configure the agent's basic properties</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Agent Name</Label>
                      <Input
                        id="name"
                        value={config.name}
                        onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter agent name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <Select value={config.model} onValueChange={(value) => 
                        setConfig(prev => ({ ...prev, model: value }))
                      }>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                          <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                          <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={config.description}
                      onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this agent does"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="temperature">Temperature</Label>
                        <span className="text-sm text-muted-foreground">{config.temperature}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={config.temperature}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          temperature: parseFloat(e.target.value) 
                        }))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Focused</span>
                        <span>Creative</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxTokens">Max Tokens</Label>
                      <Input
                        id="maxTokens"
                        type="number"
                        value={config.maxTokens}
                        onChange={(e) => setConfig(prev => ({ 
                          ...prev, 
                          maxTokens: parseInt(e.target.value) || 0 
                        }))}
                        min="1"
                        max="8000"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Agent Enabled</Label>
                      <p className="text-sm text-muted-foreground">Enable this agent in workflows</p>
                    </div>
                    <Switch
                      checked={config.enabled}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enabled: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* System Prompt Configuration */}
            <TabsContent value="prompt" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    System Prompt Designer
                  </CardTitle>
                  <CardDescription>Define the agent's personality, capabilities, and behavior</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Label>Prompt Templates</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {SYSTEM_PROMPT_TEMPLATES.map((template) => (
                        <Card 
                          key={template.id}
                          className={`cursor-pointer transition-colors hover:bg-muted ${
                            selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => handleTemplateSelect(template.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-primary mt-0.5" />
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{template.name}</h4>
                                <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="systemPrompt">System Prompt</Label>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Play className="w-4 h-4 mr-2" />
                          Test
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      id="systemPrompt"
                      value={config.systemPrompt}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        systemPrompt: e.target.value 
                      }))}
                      className="font-mono min-h-[300px] text-sm"
                      placeholder="Enter your custom system prompt..."
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{config.systemPrompt.length} characters</span>
                      <span>~{Math.ceil(config.systemPrompt.length / 4)} tokens</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tools & Permissions */}
            <TabsContent value="tools" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Tool Permissions
                  </CardTitle>
                  <CardDescription>Configure which tools the agent can use and permission settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Permission Mode</Label>
                    <Select 
                      value={config.permissions.mode} 
                      onValueChange={(value: any) => 
                        setConfig(prev => ({ 
                          ...prev, 
                          permissions: { ...prev.permissions, mode: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">
                          <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            <div>
                              <div className="font-medium">Default Mode</div>
                              <div className="text-xs text-muted-foreground">Standard behavior with permission prompts</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="accept_edits">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            <div>
                              <div className="font-medium">Accept Edits</div>
                              <div className="text-xs text-muted-foreground">Auto-accepts file edit permissions</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="plan_mode">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            <div>
                              <div className="font-medium">Plan Mode</div>
                              <div className="text-xs text-muted-foreground">Read-only analysis without modifications</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="bypass">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            <div>
                              <div className="font-medium">Bypass Permissions</div>
                              <div className="text-xs text-muted-foreground">Full autonomy for trusted environments</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Global Permissions Settings */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Global Security Settings
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Audit Logging</Label>
                          <p className="text-xs text-muted-foreground">Track all tool usage and decisions</p>
                        </div>
                        <Switch
                          checked={config.permissions.auditEnabled}
                          onCheckedChange={(checked) => 
                            setConfig(prev => ({ 
                              ...prev, 
                              permissions: { ...prev.permissions, auditEnabled: checked }
                            }))
                          }
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Global Restrictions</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {['workspace_only', 'rate_limited', 'https_only', 'content_filter', 'backup_required'].map((restriction) => (
                            <div key={restriction} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={restriction}
                                checked={config.permissions.globalRestrictions.includes(restriction)}
                                onChange={(e) => {
                                  setConfig(prev => ({
                                    ...prev,
                                    permissions: {
                                      ...prev.permissions,
                                      globalRestrictions: e.target.checked
                                        ? [...prev.permissions.globalRestrictions, restriction]
                                        : prev.permissions.globalRestrictions.filter(r => r !== restriction)
                                    }
                                  }))
                                }}
                                className="rounded"
                              />
                              <Label htmlFor={restriction} className="text-xs capitalize">
                                {restriction.replace('_', ' ')}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Available Tools with Granular Permissions</Label>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          Allow
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                          Prompt
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                          Deny
                        </span>
                      </div>
                    </div>
                    {Object.entries(toolsByCategory).map(([category, tools]) => (
                      <Card key={category}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            {category === 'System' && <Settings className="w-4 h-4" />}
                            {category === 'Web' && <Globe className="w-4 h-4" />}
                            {category === 'Development' && <Code className="w-4 h-4" />}
                            {category === 'Data' && <Database className="w-4 h-4" />}
                            {category === 'Integration' && <MessageSquare className="w-4 h-4" />}
                            {category === 'Creative' && <Sparkles className="w-4 h-4" />}
                            {category === 'Audio' && <MessageSquare className="w-4 h-4" />}
                            {category}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {tools.map((tool) => {
                            const currentPermission = getToolPermission(tool.id)
                            const isEnabled = config.tools.includes(tool.id)
                            
                            return (
                              <div key={tool.id} className="space-y-3 p-3 rounded-lg border bg-card">
                                {/* Tool Header */}
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="text-sm font-medium truncate">{tool.name}</h4>
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs border ${getRiskBadgeColor(tool.riskLevel)}`}
                                      >
                                        {tool.riskLevel.toUpperCase()}
                                      </Badge>
                                      {tool.requiredAuth && (
                                        <Badge variant="secondary" className="text-xs">
                                          Auth Required
                                        </Badge>
                                      )}
                                      {tool.auditRequired && (
                                        <Badge variant="outline" className="text-xs">
                                          Audited
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">{tool.description}</p>
                                    
                                    {/* Restrictions */}
                                    {tool.contextRestrictions && (
                                      <div className="flex flex-wrap gap-1 mb-2">
                                        {tool.contextRestrictions.map(restriction => (
                                          <Badge key={restriction} variant="secondary" className="text-xs">
                                            {restriction.replace('_', ' ')}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                    
                                    {/* Rate Limit */}
                                    {tool.rateLimitPerHour && (
                                      <p className="text-xs text-muted-foreground">
                                        Limit: {tool.rateLimitPerHour}/hour
                                      </p>
                                    )}
                                  </div>
                                  
                                  {/* Enable/Disable Toggle */}
                                  <div className="flex items-center gap-3 ml-3">
                                    <Switch
                                      checked={isEnabled}
                                      onCheckedChange={(checked) => handleToolToggle(tool.id, checked)}
                                      className="flex-shrink-0"
                                    />
                                  </div>
                                </div>
                                
                                {/* Permission Controls (only shown when enabled) */}
                                {isEnabled && (
                                  <div className="space-y-2 pt-2 border-t">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-xs font-medium">Permission Level</Label>
                                      <div className="flex items-center gap-1">
                                        {Object.values(PERMISSION_LEVELS).map(level => {
                                          const isActive = currentPermission === level
                                          const colors = {
                                            allow: 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200',
                                            prompt: 'bg-yellow-100 border-yellow-300 text-yellow-700 hover:bg-yellow-200', 
                                            deny: 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200'
                                          }
                                          
                                          return (
                                            <button
                                              key={level}
                                              onClick={() => setToolPermission(tool.id, level)}
                                              className={`px-2 py-1 text-xs rounded border transition-colors ${
                                                isActive 
                                                  ? colors[level]
                                                  : 'bg-background border-border text-muted-foreground hover:bg-muted'
                                              }`}
                                            >
                                              {level.charAt(0).toUpperCase() + level.slice(1)}
                                            </button>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sub-Agents Configuration */}
            <TabsContent value="subagents" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Sub-Agent Hierarchy
                  </CardTitle>
                  <CardDescription>
                    Manage sub-agents and delegation patterns for complex task orchestration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Enable Sub-Agent Delegation</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow this agent to create and manage sub-agents for task delegation
                      </p>
                    </div>
                    <Switch
                      checked={config.subAgents?.enabled || false}
                      onCheckedChange={(checked) => setConfig(prev => ({ 
                        ...prev, 
                        subAgents: { ...prev.subAgents, enabled: checked }
                      }))}
                    />
                  </div>

                  {config.subAgents?.enabled && (
                    <>
                      <Separator />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="maxSubAgents">Maximum Sub-Agents</Label>
                          <Input
                            id="maxSubAgents"
                            type="number"
                            value={config.subAgents?.maxCount || 5}
                            onChange={(e) => setConfig(prev => ({ 
                              ...prev, 
                              subAgents: { 
                                ...prev.subAgents, 
                                maxCount: parseInt(e.target.value) || 0 
                              }
                            }))}
                            min="1"
                            max="50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="delegationDepth">Max Delegation Depth</Label>
                          <Select 
                            value={(config.subAgents?.maxDepth || 2).toString()} 
                            onValueChange={(value) => setConfig(prev => ({ 
                              ...prev, 
                              subAgents: { 
                                ...prev.subAgents, 
                                maxDepth: parseInt(value) 
                              }
                            }))}
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

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Delegation Strategy</Label>
                          <Select 
                            value={config.subAgents?.strategy || 'automatic'} 
                            onValueChange={(value: 'automatic' | 'manual' | 'hybrid') => setConfig(prev => ({ 
                              ...prev, 
                              subAgents: { 
                                ...prev.subAgents, 
                                strategy: value 
                              }
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="automatic">Automatic Delegation</SelectItem>
                              <SelectItem value="manual">Manual Approval Required</SelectItem>
                              <SelectItem value="hybrid">Hybrid (Smart + Manual)</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground">
                            How the agent should handle task delegation to sub-agents
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Communication Mode</Label>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="lateral-comm"
                                checked={config.subAgents?.communication?.lateral || false}
                                onCheckedChange={(checked) => setConfig(prev => ({ 
                                  ...prev, 
                                  subAgents: { 
                                    ...prev.subAgents, 
                                    communication: {
                                      ...prev.subAgents?.communication,
                                      lateral: !!checked
                                    }
                                  }
                                }))}
                              />
                              <Label htmlFor="lateral-comm" className="text-sm">
                                Enable lateral communication between sub-agents
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="hierarchical-comm"
                                checked={config.subAgents?.communication?.hierarchical || true}
                                onCheckedChange={(checked) => setConfig(prev => ({ 
                                  ...prev, 
                                  subAgents: { 
                                    ...prev.subAgents, 
                                    communication: {
                                      ...prev.subAgents?.communication,
                                      hierarchical: !!checked
                                    }
                                  }
                                }))}
                              />
                              <Label htmlFor="hierarchical-comm" className="text-sm">
                                Enable hierarchical communication (parent-child)
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label>Current Sub-Agents</Label>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setShowSubAgentHierarchy(true)}
                            className="gap-2"
                          >
                            <GitBranch className="w-4 h-4" />
                            Manage Hierarchy
                          </Button>
                        </div>
                        
                        <div className="bg-muted/50 rounded-lg p-4">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                              <span>
                                {(config.subAgents?.configs?.filter((a: any) => a.status === 'active') || []).length} Active
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                              <span>
                                {(config.subAgents?.configs?.filter((a: any) => a.status === 'inactive') || []).length} Inactive
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                              <span>
                                {config.subAgents?.configs?.length || 0} Total
                              </span>
                            </div>
                          </div>
                          
                          {(!config.subAgents?.configs || config.subAgents.configs.length === 0) && (
                            <div className="text-center py-8">
                              <Users className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">No sub-agents configured</p>
                              <p className="text-xs text-muted-foreground">
                                Click "Manage Hierarchy" to create your first sub-agent
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Memory Configuration */}
            <TabsContent value="memory" className="space-y-6 mt-0">
              {/* Basic Memory Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    Memory & Context Management
                  </CardTitle>
                  <CardDescription>Configure how the agent manages context, memory, and conversation state</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Enable Memory System</Label>
                      <p className="text-sm text-muted-foreground">Allow the agent to maintain conversation context and state</p>
                    </div>
                    <Switch
                      checked={config.memory.enabled}
                      onCheckedChange={(checked) => setConfig(prev => ({ 
                        ...prev, 
                        memory: { ...prev.memory, enabled: checked }
                      }))}
                    />
                  </div>

                  {config.memory.enabled && (
                    <>
                      <Separator />
                      
                      {/* Context Window Configuration */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="contextWindow">Context Window (tokens)</Label>
                          <Input
                            id="contextWindow"
                            type="number"
                            value={config.memory.contextWindow}
                            onChange={(e) => setConfig(prev => ({ 
                              ...prev, 
                              memory: { 
                                ...prev.memory, 
                                contextWindow: parseInt(e.target.value) || 0 
                              }
                            }))}
                            min="1000"
                            max="32000"
                          />
                          <p className="text-xs text-muted-foreground">
                            Maximum tokens to maintain in active context window
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="contextStrategy">Context Management Strategy</Label>
                          <Select 
                            value={config.memory.contextStrategy} 
                            onValueChange={(value) => setConfig(prev => ({ 
                              ...prev, 
                              memory: { ...prev.memory, contextStrategy: value as any }
                            }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="rolling">Rolling Window - Keep recent messages</SelectItem>
                              <SelectItem value="summarization">Summarization - Compress old context</SelectItem>
                              <SelectItem value="compression">Compression - Semantic compression</SelectItem>
                              <SelectItem value="selective">Selective - Keep important messages</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="retentionRatio">Context Retention Ratio</Label>
                            <Input
                              id="retentionRatio"
                              type="number"
                              step="0.1"
                              min="0.1"
                              max="1.0"
                              value={config.memory.contextRetentionRatio}
                              onChange={(e) => setConfig(prev => ({ 
                                ...prev, 
                                memory: { ...prev.memory, contextRetentionRatio: parseFloat(e.target.value) || 0.7 }
                              }))}
                            />
                            <p className="text-xs text-muted-foreground">
                              Ratio of context to retain when compressing (0.1-1.0)
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="maxHistory">Max History Length</Label>
                            <Input
                              id="maxHistory"
                              type="number"
                              value={config.memory.maxHistoryLength}
                              onChange={(e) => setConfig(prev => ({ 
                                ...prev, 
                                memory: { ...prev.memory, maxHistoryLength: parseInt(e.target.value) || 1000 }
                              }))}
                            />
                            <p className="text-xs text-muted-foreground">
                              Maximum number of conversation turns to retain
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Persistent Memory</Label>
                          <p className="text-sm text-muted-foreground">Save memory across workflow executions and sessions</p>
                        </div>
                        <Switch
                          checked={config.memory.persistentMemory}
                          onCheckedChange={(checked) => setConfig(prev => ({ 
                            ...prev, 
                            memory: { ...prev.memory, persistentMemory: checked }
                          }))}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Short-term Memory Configuration */}
              {config.memory.enabled && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Short-term Memory
                    </CardTitle>
                    <CardDescription>Configure temporary memory for active conversations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Enable Short-term Memory</Label>
                        <p className="text-sm text-muted-foreground">Maintain context within active conversation</p>
                      </div>
                      <Switch
                        checked={config.memory.shortTermMemory.enabled}
                        onCheckedChange={(checked) => setConfig(prev => ({ 
                          ...prev, 
                          memory: { 
                            ...prev.memory, 
                            shortTermMemory: { ...prev.memory.shortTermMemory, enabled: checked }
                          }
                        }))}
                      />
                    </div>

                    {config.memory.shortTermMemory.enabled && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="stmMaxItems">Max Items</Label>
                            <Input
                              id="stmMaxItems"
                              type="number"
                              value={config.memory.shortTermMemory.maxItems}
                              onChange={(e) => setConfig(prev => ({ 
                                ...prev, 
                                memory: { 
                                  ...prev.memory, 
                                  shortTermMemory: { 
                                    ...prev.memory.shortTermMemory, 
                                    maxItems: parseInt(e.target.value) || 50 
                                  }
                                }
                              }))}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="stmRetention">Retention Policy</Label>
                            <Select 
                              value={config.memory.shortTermMemory.retention} 
                              onValueChange={(value) => setConfig(prev => ({ 
                                ...prev, 
                                memory: { 
                                  ...prev.memory, 
                                  shortTermMemory: { ...prev.memory.shortTermMemory, retention: value as any }
                                }
                              }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="session">Session - Clear on browser close</SelectItem>
                                <SelectItem value="conversation">Conversation - Clear when chat ends</SelectItem>
                                <SelectItem value="task">Task - Clear when workflow completes</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Long-term Memory Configuration */}
              {config.memory.enabled && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Archive className="w-4 h-4" />
                      Long-term Memory
                    </CardTitle>
                    <CardDescription>Configure persistent memory and knowledge retention</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Enable Long-term Memory</Label>
                        <p className="text-sm text-muted-foreground">Persistent knowledge and experience retention</p>
                      </div>
                      <Switch
                        checked={config.memory.longTermMemory.enabled}
                        onCheckedChange={(checked) => setConfig(prev => ({ 
                          ...prev, 
                          memory: { 
                            ...prev.memory, 
                            longTermMemory: { ...prev.memory.longTermMemory, enabled: checked }
                          }
                        }))}
                      />
                    </div>

                    {config.memory.longTermMemory.enabled && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label>Vector Storage</Label>
                            <p className="text-xs text-muted-foreground">Enable semantic memory storage</p>
                          </div>
                          <Switch
                            checked={config.memory.longTermMemory.vectorStorage}
                            onCheckedChange={(checked) => setConfig(prev => ({ 
                              ...prev, 
                              memory: { 
                                ...prev.memory, 
                                longTermMemory: { ...prev.memory.longTermMemory, vectorStorage: checked }
                              }
                            }))}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label>Semantic Search</Label>
                            <p className="text-xs text-muted-foreground">Search memory by meaning</p>
                          </div>
                          <Switch
                            checked={config.memory.longTermMemory.semanticSearch}
                            onCheckedChange={(checked) => setConfig(prev => ({ 
                              ...prev, 
                              memory: { 
                                ...prev.memory, 
                                longTermMemory: { ...prev.memory.longTermMemory, semanticSearch: checked }
                              }
                            }))}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label>Auto-summarization</Label>
                            <p className="text-xs text-muted-foreground">Automatically summarize conversations</p>
                          </div>
                          <Switch
                            checked={config.memory.longTermMemory.autoSummarization}
                            onCheckedChange={(checked) => setConfig(prev => ({ 
                              ...prev, 
                              memory: { 
                                ...prev.memory, 
                                longTermMemory: { ...prev.memory.longTermMemory, autoSummarization: checked }
                              }
                            }))}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Conversation Management */}
              {config.memory.enabled && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      Conversation Management
                    </CardTitle>
                    <CardDescription>Configure how conversations are managed and stored</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="maxTurns">Max Conversation Turns</Label>
                        <Input
                          id="maxTurns"
                          type="number"
                          value={config.memory.conversationConfig.maxTurns}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            memory: { 
                              ...prev.memory, 
                              conversationConfig: { 
                                ...prev.memory.conversationConfig, 
                                maxTurns: parseInt(e.target.value) || 100 
                              }
                            }
                          }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="compressionThreshold">Compression Threshold (%)</Label>
                        <Input
                          id="compressionThreshold"
                          type="number"
                          min="0"
                          max="100"
                          value={config.memory.conversationConfig.compressionThreshold}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            memory: { 
                              ...prev.memory, 
                              conversationConfig: { 
                                ...prev.memory.conversationConfig, 
                                compressionThreshold: parseInt(e.target.value) || 80 
                              }
                            }
                          }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Auto-save Conversations</Label>
                          <p className="text-xs text-muted-foreground">Automatically save conversation state</p>
                        </div>
                        <Switch
                          checked={config.memory.conversationConfig.autoSave}
                          onCheckedChange={(checked) => setConfig(prev => ({ 
                            ...prev, 
                            memory: { 
                              ...prev.memory, 
                              conversationConfig: { ...prev.memory.conversationConfig, autoSave: checked }
                            }
                          }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Semantic Grouping</Label>
                          <p className="text-xs text-muted-foreground">Group related conversation topics</p>
                        </div>
                        <Switch
                          checked={config.memory.conversationConfig.semanticGrouping}
                          onCheckedChange={(checked) => setConfig(prev => ({ 
                            ...prev, 
                            memory: { 
                              ...prev.memory, 
                              conversationConfig: { ...prev.memory.conversationConfig, semanticGrouping: checked }
                            }
                          }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* State Management */}
              {config.memory.enabled && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      State Management
                    </CardTitle>
                    <CardDescription>Configure how agent and workflow states are persisted</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Persist Workflow State</Label>
                          <p className="text-xs text-muted-foreground">Save workflow execution state</p>
                        </div>
                        <Switch
                          checked={config.memory.stateManagement.persistWorkflowState}
                          onCheckedChange={(checked) => setConfig(prev => ({ 
                            ...prev, 
                            memory: { 
                              ...prev.memory, 
                              stateManagement: { ...prev.memory.stateManagement, persistWorkflowState: checked }
                            }
                          }))}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Persist Agent State</Label>
                          <p className="text-xs text-muted-foreground">Save agent internal state</p>
                        </div>
                        <Switch
                          checked={config.memory.stateManagement.persistAgentState}
                          onCheckedChange={(checked) => setConfig(prev => ({ 
                            ...prev, 
                            memory: { 
                              ...prev.memory, 
                              stateManagement: { ...prev.memory.stateManagement, persistAgentState: checked }
                            }
                          }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="backupInterval">Backup Interval (seconds)</Label>
                        <Input
                          id="backupInterval"
                          type="number"
                          value={config.memory.stateManagement.stateBackupInterval}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            memory: { 
                              ...prev.memory, 
                              stateManagement: { 
                                ...prev.memory.stateManagement, 
                                stateBackupInterval: parseInt(e.target.value) || 300 
                              }
                            }
                          }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxVersions">Max State Versions</Label>
                        <Input
                          id="maxVersions"
                          type="number"
                          value={config.memory.stateManagement.maxStateVersions}
                          onChange={(e) => setConfig(prev => ({ 
                            ...prev, 
                            memory: { 
                              ...prev.memory, 
                              stateManagement: { 
                                ...prev.memory.stateManagement, 
                                maxStateVersions: parseInt(e.target.value) || 10 
                              }
                            }
                          }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Performance Optimization */}
              {config.memory.enabled && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Performance Optimization
                    </CardTitle>
                    <CardDescription>Configure memory system performance and caching</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Enable Caching</Label>
                        <p className="text-sm text-muted-foreground">Cache frequently accessed memory for better performance</p>
                      </div>
                      <Switch
                        checked={config.memory.optimization.enableCaching}
                        onCheckedChange={(checked) => setConfig(prev => ({ 
                          ...prev, 
                          memory: { 
                            ...prev.memory, 
                            optimization: { ...prev.memory.optimization, enableCaching: checked }
                          }
                        }))}
                      />
                    </div>

                    {config.memory.optimization.enableCaching && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="cacheStrategy">Cache Strategy</Label>
                            <Select 
                              value={config.memory.optimization.cacheStrategy} 
                              onValueChange={(value) => setConfig(prev => ({ 
                                ...prev, 
                                memory: { 
                                  ...prev.memory, 
                                  optimization: { ...prev.memory.optimization, cacheStrategy: value as any }
                                }
                              }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="lru">LRU - Least Recently Used</SelectItem>
                                <SelectItem value="lfu">LFU - Least Frequently Used</SelectItem>
                                <SelectItem value="ttl">TTL - Time To Live</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="cacheTTL">Cache TTL (seconds)</Label>
                            <Input
                              id="cacheTTL"
                              type="number"
                              value={config.memory.optimization.cacheTTL}
                              onChange={(e) => setConfig(prev => ({ 
                                ...prev, 
                                memory: { 
                                  ...prev.memory, 
                                  optimization: { 
                                    ...prev.memory.optimization, 
                                    cacheTTL: parseInt(e.target.value) || 3600 
                                  }
                                }
                              }))}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label>Preload Context</Label>
                            <p className="text-sm text-muted-foreground">Preload relevant context for faster responses</p>
                          </div>
                          <Switch
                            checked={config.memory.optimization.preloadContext}
                            onCheckedChange={(checked) => setConfig(prev => ({ 
                              ...prev, 
                              memory: { 
                                ...prev.memory, 
                                optimization: { ...prev.memory.optimization, preloadContext: checked }
                              }
                            }))}
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Advanced Configuration */}
            <TabsContent value="advanced" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Advanced Settings
                  </CardTitle>
                  <CardDescription>Configure advanced agent behavior and performance settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="agent-status">Agent Status</Label>
                      <Select 
                        value={config.enabled ? 'active' : 'inactive'} 
                        onValueChange={(value) => setConfig(prev => ({ 
                          ...prev, 
                          enabled: value === 'active' 
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Control whether this agent can be invoked and execute tasks
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <Label>Performance Settings</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="concurrent-tasks">Max Concurrent Tasks</Label>
                          <Select defaultValue="3">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 Task</SelectItem>
                              <SelectItem value="3">3 Tasks</SelectItem>
                              <SelectItem value="5">5 Tasks</SelectItem>
                              <SelectItem value="10">10 Tasks</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="timeout">Task Timeout (seconds)</Label>
                          <Input
                            id="timeout"
                            type="number"
                            defaultValue="300"
                            min="30"
                            max="3600"
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <Label>Error Handling</Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label>Auto-retry on Failure</Label>
                            <p className="text-sm text-muted-foreground">Automatically retry failed tasks</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="max-retries">Max Retries</Label>
                            <Input
                              id="max-retries"
                              type="number"
                              defaultValue="3"
                              min="0"
                              max="10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="retry-delay">Retry Delay (seconds)</Label>
                            <Input
                              id="retry-delay"
                              type="number"
                              defaultValue="5"
                              min="1"
                              max="300"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Custom Hooks & Events</CardTitle>
                  <CardDescription>Configure custom tool event responses and hooks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6 text-muted-foreground">
                    <Settings className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-sm">Custom hooks configuration coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="ghost">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sub-Agent Hierarchy Modal */}
      {showSubAgentHierarchy && (
        <SubAgentHierarchy
          parentNodeId={agentId || ''}
          onClose={() => setShowSubAgentHierarchy(false)}
        />
      )}
    </>
  )
}