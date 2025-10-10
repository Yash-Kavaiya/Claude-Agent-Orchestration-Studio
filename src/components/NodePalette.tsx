import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { 
  Bot, 
  Zap, 
  Database, 
  MessageSquare, 
  Settings, 
  Globe, 
  FileUp, 
  Mail, 
  Image, 
  Mic, 
  Volume2,
  GitBranch,
  Clock,
  Filter,
  Shuffle,
  Plus,
  Play,
  Palette,
  Server,
  Plug,
  Code,
  FileText,
  Link
} from 'lucide-react'

interface NodeTemplate {
  id: string
  type: 'agent' | 'trigger' | 'action' | 'logic' | 'integration' | 'mcp'
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  category: string
  isNew?: boolean
  isPro?: boolean
}

const NODE_TEMPLATES: NodeTemplate[] = [
  // Agent Nodes
  {
    id: 'claude-agent',
    type: 'agent',
    title: 'Claude Agent',
    description: 'Main conversation and reasoning agent',
    icon: Bot,
    category: 'Agents'
  },
  {
    id: 'specialized-agent',
    type: 'agent',
    title: 'Specialized Agent',
    description: 'Custom agent with specific tools and prompts',
    icon: Bot,
    category: 'Agents'
  },

  // Trigger Nodes
  {
    id: 'webhook-trigger',
    type: 'trigger',
    title: 'Webhook',
    description: 'HTTP endpoint trigger',
    icon: Zap,
    category: 'Triggers'
  },
  {
    id: 'schedule-trigger',
    type: 'trigger',
    title: 'Schedule',
    description: 'Time-based trigger',
    icon: Clock,
    category: 'Triggers'
  },
  {
    id: 'manual-trigger',
    type: 'trigger',
    title: 'Manual',
    description: 'Start workflow manually',
    icon: Play,
    category: 'Triggers'
  },

  // Action Nodes
  {
    id: 'database-action',
    type: 'action',
    title: 'Database',
    description: 'Store and query data',
    icon: Database,
    category: 'Actions'
  },
  {
    id: 'file-upload-action',
    type: 'action',
    title: 'File Upload',
    description: 'Handle file operations',
    icon: FileUp,
    category: 'Actions'
  },
  {
    id: 'email-action',
    type: 'action',
    title: 'Send Email',
    description: 'Send notifications via email',
    icon: Mail,
    category: 'Actions',
    isPro: true
  },

  // AI Integrations
  {
    id: 'openrouter-ai',
    type: 'integration',
    title: 'OpenRouter AI',
    description: 'Multi-model AI chat completions',
    icon: MessageSquare,
    category: 'AI Services',
    isPro: true
  },
  {
    id: 'image-generation',
    type: 'integration',
    title: 'Image Generation',
    description: 'Generate images with Gemini',
    icon: Image,
    category: 'AI Services'
  },
  {
    id: 'text-to-speech',
    type: 'integration',
    title: 'Text-to-Speech',
    description: 'Convert text to voice',
    icon: Volume2,
    category: 'AI Services',
    isPro: true
  },
  {
    id: 'speech-to-text',
    type: 'integration',
    title: 'Speech-to-Text',
    description: 'Transcribe audio to text',
    icon: Mic,
    category: 'AI Services',
    isPro: true
  },

  // Web Tools
  {
    id: 'web-search',
    type: 'integration',
    title: 'Web Search',
    description: 'Search the internet for real-time data',
    icon: Globe,
    category: 'Web Tools'
  },
  {
    id: 'web-reader',
    type: 'integration',
    title: 'Web Reader',
    description: 'Extract content from URLs',
    icon: Globe,
    category: 'Web Tools'
  },

  // Logic Nodes
  {
    id: 'condition',
    type: 'logic',
    title: 'Condition',
    description: 'Branch workflow based on conditions',
    icon: GitBranch,
    category: 'Logic'
  },
  {
    id: 'filter',
    type: 'logic',
    title: 'Filter',
    description: 'Filter and transform data',
    icon: Filter,
    category: 'Logic'
  },
  {
    id: 'merge',
    type: 'logic',
    title: 'Merge',
    description: 'Combine multiple data streams',
    icon: Shuffle,
    category: 'Logic'
  },

  // MCP Integration Nodes
  {
    id: 'mcp-server',
    type: 'mcp',
    title: 'MCP Server',
    description: 'Model Context Protocol server integration',
    icon: Server,
    category: 'MCP Integration',
    isNew: true
  },
  {
    id: 'mcp-github',
    type: 'mcp',
    title: 'GitHub MCP',
    description: 'GitHub repositories and issues via MCP',
    icon: Code,
    category: 'MCP Integration'
  },
  {
    id: 'mcp-database',
    type: 'mcp',
    title: 'Database MCP',
    description: 'PostgreSQL/MySQL via MCP protocol',
    icon: Database,
    category: 'MCP Integration'
  },
  {
    id: 'mcp-filesystem',
    type: 'mcp',
    title: 'File System MCP',
    description: 'Local file operations via MCP',
    icon: FileText,
    category: 'MCP Integration'
  },
  {
    id: 'mcp-web-scraper',
    type: 'mcp',
    title: 'Web Scraper MCP',
    description: 'Web scraping and data extraction',
    icon: Globe,
    category: 'MCP Integration'
  },
  {
    id: 'mcp-slack',
    type: 'mcp',
    title: 'Slack MCP',
    description: 'Slack workspace integration',
    icon: MessageSquare,
    category: 'MCP Integration'
  },
  {
    id: 'mcp-custom',
    type: 'mcp',
    title: 'Custom MCP',
    description: 'Custom MCP server connector',
    icon: Plug,
    category: 'MCP Integration'
  }
]

const CATEGORIES = [
  'Agents',
  'Triggers', 
  'Actions',
  'AI Services',
  'MCP Integration',
  'Web Tools',
  'Logic'
]

export function NodePalette() {
  const getNodeColor = (type: NodeTemplate['type']) => {
    switch (type) {
      case 'agent': return 'text-primary'
      case 'trigger': return 'text-green-600'
      case 'action': return 'text-blue-600'
      case 'integration': return 'text-purple-600'
      case 'logic': return 'text-orange-600'
      default: return 'text-muted-foreground'
    }
  }

  const handleDragStart = (e: React.DragEvent, template: NodeTemplate) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: template.type,
      title: template.title,
      nodeId: template.id
    }))
    e.dataTransfer.effectAllowed = 'copy'
    
    // Add visual feedback
    const dragImage = document.createElement('div')
    dragImage.innerHTML = `
      <div style="
        background: hsl(18 70% 60% / 0.1);
        border: 2px dashed hsl(18 70% 60% / 0.5);
        border-radius: 8px;
        padding: 12px;
        width: 200px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: hsl(18 70% 40%);
        font-weight: 500;
        font-size: 14px;
        transform: rotate(-3deg);
      ">
        + ${template.title}
      </div>
    `
    dragImage.style.position = 'absolute'
    dragImage.style.top = '-1000px'
    document.body.appendChild(dragImage)
    
    e.dataTransfer.setDragImage(dragImage, 100, 40)
    
    // Clean up drag image
    setTimeout(() => document.body.removeChild(dragImage), 0)
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
        <Palette className="w-3 h-3" />
        Node Palette
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-4">
          {CATEGORIES.map((category) => {
            const categoryNodes = NODE_TEMPLATES.filter(node => node.category === category)
            
            return (
              <div key={category}>
                <h4 className="text-xs font-medium text-muted-foreground mb-2 px-2">
                  {category}
                </h4>
                <div className="space-y-1">
                  {categoryNodes.map((template) => {
                    const Icon = template.icon
                    
                    return (
                      <div
                        key={template.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, template)}
                        className="group flex items-start gap-2 p-2 rounded-md hover:bg-sidebar-accent cursor-grab active:cursor-grabbing transition-colors"
                      >
                        <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${getNodeColor(template.type)}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-sm font-medium truncate">
                              {template.title}
                            </span>
                            {template.isNew && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                New
                              </Badge>
                            )}
                            {template.isPro && (
                              <Badge variant="outline" className="text-xs px-1 py-0 border-primary text-primary">
                                Pro
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {template.description}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Add Custom Node */}
      <div className="mt-4 pt-4 border-t border-sidebar-border">
        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
          <Plus className="w-4 h-4 mr-2" />
          Create Custom Node
        </Button>
      </div>
    </div>
  )
}