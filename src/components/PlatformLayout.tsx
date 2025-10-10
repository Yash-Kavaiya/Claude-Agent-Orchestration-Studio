import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Sparkles, 
  Menu, 
  Search, 
  Plus, 
  Settings, 
  User, 
  LogOut,
  Folder,
  Bot,
  Workflow,
  Palette,
  History,
  Bell,
  Server,
  Plug,
  Wrench,
  Activity,
  Play,
  BarChart3,
  Bug,
  Target,
  Users
} from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useWorkflowStore } from '@/store/workflow-store'
import { WorkflowCanvas } from './WorkflowCanvas'
import { NodePalette } from './NodePalette'
import { PropertiesPanel } from './PropertiesPanel'
import { MCPIntegrationHub } from './MCPIntegrationHub'
import { ToolEcosystemHub } from './ToolEcosystemHub'
import WorkflowExecutionEngine from './WorkflowExecutionEngine'
import { AgentAnalyticsDashboard } from './AgentAnalyticsDashboard'
import AdvancedDebuggingSystem from './AdvancedDebuggingSystem'
import { WorkflowOptimizationEngine } from './WorkflowOptimizationEngine'
import { CollaborationSystem } from './CollaborationSystem'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function PlatformLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'canvas' | 'mcp' | 'tools' | 'execution' | 'analytics' | 'debug' | 'optimization' | 'collaboration'>('canvas')
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2"
          >
            <Menu className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg">Claude Agent Platform</span>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 px-2">
              <Folder className="w-4 h-4 mr-1" />
              My Workspace
            </Button>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              placeholder="Search workflows, agents, tools..."
              className="w-full h-9 pl-9 pr-4 bg-muted/50 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="p-2">
            <Bell className="w-4 h-4" />
          </Button>
          
          <Button variant="ghost" size="sm" className="p-2">
            <Settings className="w-4 h-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          <div className="flex items-center gap-2">
            <div className="text-right text-sm">
              <div className="font-medium">{user?.name || 'User'}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
            
            <Button variant="ghost" size="sm" className="p-2" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className={`bg-sidebar-background border-r border-sidebar-border transition-all duration-300 shrink-0 ${
          sidebarCollapsed ? 'w-12' : 'w-80'
        }`}>
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            {!sidebarCollapsed && (
              <div className="p-4 border-b border-sidebar-border">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-sidebar-foreground">Project Explorer</h2>
                  <Button variant="ghost" size="sm" className="p-1 h-auto">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Sidebar Content */}
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {sidebarCollapsed ? (
                  <>
                    <Button variant="ghost" size="sm" className="w-full justify-center p-2">
                      <Workflow className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-center p-2">
                      <Bot className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-center p-2">
                      <Palette className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-center p-2" onClick={() => setActiveView('tools')}>
                      <Wrench className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-center p-2" onClick={() => setActiveView('execution')}>
                      <Activity className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-center p-2" onClick={() => setActiveView('analytics')}>
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-center p-2" onClick={() => setActiveView('debug')}>
                      <Bug className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-center p-2" onClick={() => setActiveView('optimization')}>
                      <Target className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-center p-2" onClick={() => setActiveView('collaboration')}>
                      <Users className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="w-full justify-center p-2">
                      <History className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Workflows Section */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <Workflow className="w-3 h-3" />
                        Workflows
                      </div>
                      <div className="space-y-1 mt-2">
                        <div 
                          className="px-2 py-1.5 text-sm text-muted-foreground rounded hover:bg-sidebar-accent cursor-pointer"
                          onClick={() => {
                            const { newWorkflow } = useWorkflowStore.getState()
                            newWorkflow()
                            setActiveView('canvas')
                          }}
                        >
                          + New Workflow
                        </div>
                      </div>
                    </div>

                    {/* Agents Section */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <Bot className="w-3 h-3" />
                        Agents
                      </div>
                      <div className="space-y-1 mt-2">
                        <div className="px-2 py-1.5 text-sm text-muted-foreground rounded hover:bg-sidebar-accent cursor-pointer">
                          + New Agent
                        </div>
                      </div>
                    </div>

                    {/* Node Palette */}
                    <NodePalette />

                    {/* MCP Servers Section */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <Server className="w-3 h-3" />
                        MCP Servers
                      </div>
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-sidebar-accent cursor-pointer"
                             onClick={() => setActiveView('mcp')}>
                          <span className="text-muted-foreground">GitHub Integration</span>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-sidebar-accent cursor-pointer"
                             onClick={() => setActiveView('mcp')}>
                          <span className="text-muted-foreground">PostgreSQL</span>
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        </div>
                        <div className="px-2 py-1.5 text-sm text-muted-foreground rounded hover:bg-sidebar-accent cursor-pointer"
                             onClick={() => setActiveView('mcp')}>
                          + Add Server
                        </div>
                      </div>
                    </div>

                    {/* Execution Engine Section */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <Activity className="w-3 h-3" />
                        Execution Engine
                      </div>
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-sidebar-accent cursor-pointer"
                             onClick={() => setActiveView('execution')}>
                          <span className="text-muted-foreground">Real-time Monitor</span>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-sidebar-accent cursor-pointer"
                             onClick={() => setActiveView('execution')}>
                          <span className="text-muted-foreground">Execution History</span>
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-sidebar-accent cursor-pointer"
                             onClick={() => setActiveView('execution')}>
                          <span className="text-muted-foreground">Performance Analytics</span>
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    {/* Built-in Tools Section */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <Wrench className="w-3 h-3" />
                        Built-in Tools
                      </div>
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-sidebar-accent cursor-pointer"
                             onClick={() => setActiveView('tools')}>
                          <span className="text-muted-foreground">AI Chat & Completions</span>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-sidebar-accent cursor-pointer"
                             onClick={() => setActiveView('tools')}>
                          <span className="text-muted-foreground">Image Generation</span>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-sidebar-accent cursor-pointer"
                             onClick={() => setActiveView('tools')}>
                          <span className="text-muted-foreground">Web Search & Reader</span>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-sidebar-accent cursor-pointer"
                             onClick={() => setActiveView('tools')}>
                          <span className="text-muted-foreground">File Upload</span>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    {/* Analytics Section */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <BarChart3 className="w-3 h-3" />
                        Analytics
                      </div>
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-sidebar-accent cursor-pointer"
                             onClick={() => setActiveView('analytics')}>
                          <span className="text-muted-foreground">Performance Dashboard</span>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-sidebar-accent cursor-pointer"
                             onClick={() => setActiveView('analytics')}>
                          <span className="text-muted-foreground">Agent Metrics</span>
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-sidebar-accent cursor-pointer"
                             onClick={() => setActiveView('analytics')}>
                          <span className="text-muted-foreground">System Health</span>
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    {/* Debug & Logging Section */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <Bug className="w-3 h-3" />
                        Debug & Logging
                      </div>
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-sidebar-accent cursor-pointer"
                             onClick={() => setActiveView('debug')}>
                          <span className="text-muted-foreground">Real-time Logs</span>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-sidebar-accent cursor-pointer"
                             onClick={() => setActiveView('debug')}>
                          <span className="text-muted-foreground">Performance Monitor</span>
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-sidebar-accent cursor-pointer"
                             onClick={() => setActiveView('debug')}>
                          <span className="text-muted-foreground">Network Activity</span>
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-sidebar-accent cursor-pointer"
                             onClick={() => setActiveView('debug')}>
                          <span className="text-muted-foreground">Debug Console</span>
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    {/* Optimization Section */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <Target className="w-3 h-3" />
                        Optimization
                      </div>
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-sidebar-accent cursor-pointer"
                             onClick={() => setActiveView('optimization')}>
                          <span className="text-muted-foreground">Workflow Analysis</span>
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-sidebar-accent cursor-pointer"
                             onClick={() => setActiveView('optimization')}>
                          <span className="text-muted-foreground">Recommendations</span>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-sidebar-accent cursor-pointer"
                             onClick={() => setActiveView('optimization')}>
                          <span className="text-muted-foreground">Performance Insights</span>
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    {/* Collaboration Section */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <Users className="w-3 h-3" />
                        Collaboration
                      </div>
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-sidebar-accent cursor-pointer"
                             onClick={() => setActiveView('collaboration')}>
                          <span className="text-muted-foreground">Team Management</span>
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-sidebar-accent cursor-pointer"
                             onClick={() => setActiveView('collaboration')}>
                          <span className="text-muted-foreground">Invitations</span>
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-sidebar-accent cursor-pointer"
                             onClick={() => setActiveView('collaboration')}>
                          <span className="text-muted-foreground">Role Permissions</span>
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center justify-between px-2 py-1.5 text-sm rounded hover:bg-sidebar-accent cursor-pointer"
                             onClick={() => setActiveView('collaboration')}>
                          <span className="text-muted-foreground">Activity Feed</span>
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        <History className="w-3 h-3" />
                        Recent
                      </div>
                      <div className="space-y-1 mt-2">
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          No recent activity
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        </aside>

        {/* Main Content Area with Tabs */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Navigation Tabs */}
          <div className="border-b border-border bg-background px-4 py-2">
            <Tabs value={activeView} onValueChange={(value: any) => setActiveView(value)} className="w-full">
              <TabsList className="grid w-fit grid-cols-8">
                <TabsTrigger value="canvas" className="gap-2">
                  <Workflow className="h-4 w-4" />
                  Workflow Canvas
                </TabsTrigger>
                <TabsTrigger value="mcp" className="gap-2">
                  <Plug className="h-4 w-4" />
                  MCP Integration
                </TabsTrigger>
                <TabsTrigger value="tools" className="gap-2">
                  <Wrench className="h-4 w-4" />
                  Tool Ecosystem
                </TabsTrigger>
                <TabsTrigger value="execution" className="gap-2">
                  <Activity className="h-4 w-4" />
                  Execution Engine
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="debug" className="gap-2">
                  <Bug className="h-4 w-4" />
                  Debug & Logs
                </TabsTrigger>
                <TabsTrigger value="optimization" className="gap-2">
                  <Target className="h-4 w-4" />
                  Optimization
                </TabsTrigger>
                <TabsTrigger value="collaboration" className="gap-2">
                  <Users className="h-4 w-4" />
                  Collaboration
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Tab Content */}
          <div className="flex-1 flex overflow-hidden">
            {activeView === 'canvas' && (
              <>
                {/* Canvas */}
                <main className="flex-1 relative overflow-hidden">
                  <WorkflowCanvas 
                    selectedNode={selectedNode}
                    onSelectNode={setSelectedNode}
                  />
                </main>

                {/* Right Properties Panel */}
                <aside className="w-80 bg-card border-l border-border shrink-0">
                  <PropertiesPanel selectedNode={selectedNode} />
                </aside>
              </>
            )}

            {activeView === 'mcp' && (
              <main className="flex-1 relative overflow-hidden">
                <MCPIntegrationHub />
              </main>
            )}

            {activeView === 'tools' && (
              <main className="flex-1 relative overflow-hidden">
                <ToolEcosystemHub />
              </main>
            )}

            {activeView === 'execution' && (
              <main className="flex-1 relative overflow-hidden">
                <WorkflowExecutionEngine />
              </main>
            )}

            {activeView === 'analytics' && (
              <main className="flex-1 relative overflow-hidden">
                <AgentAnalyticsDashboard />
              </main>
            )}

            {activeView === 'debug' && (
              <main className="flex-1 relative overflow-hidden">
                <AdvancedDebuggingSystem />
              </main>
            )}

            {activeView === 'optimization' && (
              <main className="flex-1 relative overflow-hidden">
                <WorkflowOptimizationEngine />
              </main>
            )}

            {activeView === 'collaboration' && (
              <main className="flex-1 relative overflow-hidden">
                <CollaborationSystem />
              </main>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}