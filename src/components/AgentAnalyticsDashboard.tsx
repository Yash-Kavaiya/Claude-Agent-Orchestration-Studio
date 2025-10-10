/**
 * Agent Performance Analytics Dashboard
 * Comprehensive monitoring and analytics for Claude agents and workflows
 */

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts"
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  Cpu,
  HardDrive,
  Database,
  Network,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Settings,
  AlertCircle,
  Target,
  Award,
  Globe,
  MessageSquare,
  FileText,
  Image as ImageIcon,
  Search
} from "lucide-react"

import { useWorkflowStore } from "@/store/workflow-store"
import { useExecutionStore } from "@/store/execution-store"

// Performance Metrics Interfaces
interface AgentMetrics {
  id: string
  name: string
  totalExecutions: number
  successRate: number
  averageExecutionTime: number
  totalTokensUsed: number
  errorRate: number
  lastExecuted: string
  performance: {
    cpu: number
    memory: number
    network: number
  }
  tools: {
    ai: number
    image: number
    web: number
    file: number
  }
}

interface SystemMetrics {
  totalAgents: number
  activeExecutions: number
  totalExecutions: number
  systemHealth: number
  resourceUsage: {
    cpu: number
    memory: number
    storage: number
    network: number
  }
  apiUsage: {
    devvai: number
    imageGen: number
    webSearch: number
    fileOps: number
  }
}

interface WorkflowAnalytics {
  id: string
  name: string
  executionCount: number
  successRate: number
  averageDuration: number
  nodeCount: number
  complexity: number
  lastRun: string
  performance: "excellent" | "good" | "fair" | "poor"
}

interface ExecutionTrend {
  date: string
  executions: number
  successes: number
  failures: number
  avgDuration: number
}

const COLORS = ['#ff8c42', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8']

export function AgentAnalyticsDashboard() {
  const { workflows, nodes } = useWorkflowStore()
  const { nodeStatuses, executionHistory, currentExecution } = useExecutionStore()
  
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d")
  const [selectedMetric, setSelectedMetric] = useState("performance")
  const [filterAgent, setFilterAgent] = useState("all")
  const [refreshInterval, setRefreshInterval] = useState(5)
  const [isAutoRefresh, setIsAutoRefresh] = useState(true)

  // Mock data generation (in real app, this would come from backend analytics)
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics[]>([])
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    totalAgents: 0,
    activeExecutions: 0,
    totalExecutions: 0,
    systemHealth: 98,
    resourceUsage: {
      cpu: 45,
      memory: 68,
      storage: 72,
      network: 34
    },
    apiUsage: {
      devvai: 1250,
      imageGen: 340,
      webSearch: 890,
      fileOps: 567
    }
  })
  const [workflowAnalytics, setWorkflowAnalytics] = useState<WorkflowAnalytics[]>([])
  const [executionTrends, setExecutionTrends] = useState<ExecutionTrend[]>([])

  // Generate analytics data based on current workflows and execution state
  useEffect(() => {
    generateAnalyticsData()
  }, [workflows, nodes, nodeStatuses, executionHistory])

  // Auto-refresh analytics
  useEffect(() => {
    if (!isAutoRefresh) return
    
    const interval = setInterval(() => {
      generateAnalyticsData()
    }, refreshInterval * 1000)

    return () => clearInterval(interval)
  }, [isAutoRefresh, refreshInterval])

  const generateAnalyticsData = () => {
    // Generate agent metrics from nodes
    const metrics: AgentMetrics[] = nodes.map((node, index) => ({
      id: node.id,
      name: node.data?.label || `Agent ${index + 1}`,
      totalExecutions: Math.floor(Math.random() * 500) + 50,
      successRate: Math.floor(Math.random() * 20) + 80,
      averageExecutionTime: Math.floor(Math.random() * 3000) + 500,
      totalTokensUsed: Math.floor(Math.random() * 50000) + 5000,
      errorRate: Math.floor(Math.random() * 15) + 2,
      lastExecuted: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      performance: {
        cpu: Math.floor(Math.random() * 50) + 20,
        memory: Math.floor(Math.random() * 40) + 30,
        network: Math.floor(Math.random() * 30) + 15
      },
      tools: {
        ai: Math.floor(Math.random() * 100) + 20,
        image: Math.floor(Math.random() * 50) + 5,
        web: Math.floor(Math.random() * 80) + 10,
        file: Math.floor(Math.random() * 60) + 8
      }
    }))

    // Generate workflow analytics
    const analytics: WorkflowAnalytics[] = workflows.map(workflow => {
      const successRate = Math.floor(Math.random() * 20) + 80
      const avgDuration = Math.floor(Math.random() * 5000) + 1000
      let performance: "excellent" | "good" | "fair" | "poor"
      
      if (successRate >= 95 && avgDuration <= 2000) performance = "excellent"
      else if (successRate >= 85 && avgDuration <= 3500) performance = "good"
      else if (successRate >= 75) performance = "fair"
      else performance = "poor"

      return {
        id: workflow._id,
        name: workflow.name,
        executionCount: Math.floor(Math.random() * 200) + 20,
        successRate,
        averageDuration: avgDuration,
        nodeCount: workflow.nodes?.length || 0,
        complexity: Math.floor(Math.random() * 10) + 1,
        lastRun: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        performance
      }
    })

    // Generate execution trends
    const trends: ExecutionTrend[] = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
      const executions = Math.floor(Math.random() * 100) + 20
      const successes = Math.floor(executions * (0.8 + Math.random() * 0.18))
      
      return {
        date: date.toISOString().split('T')[0],
        executions,
        successes,
        failures: executions - successes,
        avgDuration: Math.floor(Math.random() * 2000) + 1000
      }
    })

    setAgentMetrics(metrics)
    setWorkflowAnalytics(analytics)
    setExecutionTrends(trends)
    
    // Update system metrics
    setSystemMetrics(prev => ({
      ...prev,
      totalAgents: nodes.length,
      activeExecutions: Object.values(nodeStatuses).filter(status => status === 'running').length,
      totalExecutions: executionHistory.length
    }))
  }

  const exportAnalytics = () => {
    const data = {
      timestamp: new Date().toISOString(),
      agents: agentMetrics,
      workflows: workflowAnalytics,
      system: systemMetrics,
      trends: executionTrends
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getPerformanceBadge = (performance: string) => {
    const colors = {
      excellent: "bg-green-500",
      good: "bg-blue-500", 
      fair: "bg-yellow-500",
      poor: "bg-red-500"
    }
    return colors[performance as keyof typeof colors] || "bg-gray-500"
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-white">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive agent and workflow performance monitoring</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={() => generateAnalyticsData()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline" onClick={exportAnalytics}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="p-6 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Agents</p>
                  <p className="text-2xl font-bold text-gray-900">{systemMetrics.totalAgents}</p>
                </div>
                <Users className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Executions</p>
                  <p className="text-2xl font-bold text-gray-900">{systemMetrics.activeExecutions}</p>
                </div>
                <Activity className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Executions</p>
                  <p className="text-2xl font-bold text-gray-900">{systemMetrics.totalExecutions}</p>
                </div>
                <Target className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Health</p>
                  <p className="text-2xl font-bold text-gray-900">{systemMetrics.systemHealth}%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Analytics Content */}
      <div className="flex-1 p-6">
        <Tabs defaultValue="overview" className="h-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agents">Agent Performance</TabsTrigger>
            <TabsTrigger value="workflows">Workflow Analytics</TabsTrigger>
            <TabsTrigger value="system">System Metrics</TabsTrigger>
            <TabsTrigger value="tools">Tool Usage</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Execution Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Execution Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={executionTrends.slice(-7)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="executions" 
                        stackId="1"
                        stroke="#ff8c42" 
                        fill="#ff8c42" 
                        fillOpacity={0.6}
                        name="Total Executions"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="successes" 
                        stackId="2"
                        stroke="#4ecdc4" 
                        fill="#4ecdc4" 
                        fillOpacity={0.8}
                        name="Successful"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Performance Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5" />
                    Performance Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Excellent', value: workflowAnalytics.filter(w => w.performance === 'excellent').length, color: '#4ecdc4' },
                          { name: 'Good', value: workflowAnalytics.filter(w => w.performance === 'good').length, color: '#45b7d1' },
                          { name: 'Fair', value: workflowAnalytics.filter(w => w.performance === 'fair').length, color: '#ffeaa7' },
                          { name: 'Poor', value: workflowAnalytics.filter(w => w.performance === 'poor').length, color: '#ff6b6b' }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label
                      >
                        {workflowAnalytics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Resource Usage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="w-5 h-5" />
                    Resource Usage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>CPU Usage</span>
                      <span>{systemMetrics.resourceUsage.cpu}%</span>
                    </div>
                    <Progress value={systemMetrics.resourceUsage.cpu} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Memory Usage</span>
                      <span>{systemMetrics.resourceUsage.memory}%</span>
                    </div>
                    <Progress value={systemMetrics.resourceUsage.memory} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Storage Usage</span>
                      <span>{systemMetrics.resourceUsage.storage}%</span>
                    </div>
                    <Progress value={systemMetrics.resourceUsage.storage} />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Network Usage</span>
                      <span>{systemMetrics.resourceUsage.network}%</span>
                    </div>
                    <Progress value={systemMetrics.resourceUsage.network} />
                  </div>
                </CardContent>
              </Card>

              {/* API Usage Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    API Usage Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { name: 'DevvAI', usage: systemMetrics.apiUsage.devvai, icon: 'MessageSquare' },
                      { name: 'Image Gen', usage: systemMetrics.apiUsage.imageGen, icon: 'Image' },
                      { name: 'Web Search', usage: systemMetrics.apiUsage.webSearch, icon: 'Search' },
                      { name: 'File Ops', usage: systemMetrics.apiUsage.fileOps, icon: 'FileText' }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="usage" fill="#ff8c42" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Agent Performance Tab */}
          <TabsContent value="agents">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Agent Performance Metrics</CardTitle>
                  <div className="flex items-center gap-2">
                    <Input 
                      placeholder="Search agents..." 
                      className="w-48"
                    />
                    <Select value={filterAgent} onValueChange={setFilterAgent}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Agents</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="idle">Idle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {agentMetrics.map((agent) => (
                      <div key={agent.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{agent.name}</h3>
                            <p className="text-sm text-gray-600">ID: {agent.id}</p>
                          </div>
                          <Badge variant={agent.successRate >= 90 ? "default" : agent.successRate >= 75 ? "secondary" : "destructive"}>
                            {agent.successRate}% Success Rate
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-600">Executions</p>
                            <p className="font-semibold">{agent.totalExecutions}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Avg Time</p>
                            <p className="font-semibold">{agent.averageExecutionTime}ms</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Tokens Used</p>
                            <p className="font-semibold">{agent.totalTokensUsed.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Error Rate</p>
                            <p className="font-semibold text-red-600">{agent.errorRate}%</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-2">
                          <div className="text-center">
                            <MessageSquare className="w-4 h-4 mx-auto mb-1 text-orange-500" />
                            <p className="text-xs">{agent.tools.ai} AI</p>
                          </div>
                          <div className="text-center">
                            <ImageIcon className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                            <p className="text-xs">{agent.tools.image} Image</p>
                          </div>
                          <div className="text-center">
                            <Search className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                            <p className="text-xs">{agent.tools.web} Web</p>
                          </div>
                          <div className="text-center">
                            <FileText className="w-4 h-4 mx-auto mb-1 text-green-500" />
                            <p className="text-xs">{agent.tools.file} File</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflow Analytics Tab */}
          <TabsContent value="workflows">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Performance Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {workflowAnalytics.map((workflow) => (
                      <div key={workflow.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{workflow.name}</h3>
                            <p className="text-sm text-gray-600">{workflow.nodeCount} nodes • Complexity: {workflow.complexity}/10</p>
                          </div>
                          <Badge className={getPerformanceBadge(workflow.performance)}>
                            {workflow.performance}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-600">Executions</p>
                            <p className="font-semibold">{workflow.executionCount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Success Rate</p>
                            <p className="font-semibold">{workflow.successRate}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Avg Duration</p>
                            <p className="font-semibold">{workflow.averageDuration}ms</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Last Run</p>
                            <p className="font-semibold">{new Date(workflow.lastRun).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Metrics Tab */}
          <TabsContent value="system">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={executionTrends.slice(-14)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="avgDuration" stroke="#ff8c42" name="Avg Duration (ms)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>System Health Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Database Connection
                    </span>
                    <Badge variant="default">Healthy</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      API Services
                    </span>
                    <Badge variant="default">Operational</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      Memory Usage
                    </span>
                    <Badge variant="secondary">Moderate</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Network Connectivity
                    </span>
                    <Badge variant="default">Stable</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tool Usage Tab */}
          <TabsContent value="tools">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tool Usage Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'AI Chat', value: systemMetrics.apiUsage.devvai, color: '#ff8c42' },
                          { name: 'Web Search', value: systemMetrics.apiUsage.webSearch, color: '#4ecdc4' },
                          { name: 'File Operations', value: systemMetrics.apiUsage.fileOps, color: '#45b7d1' },
                          { name: 'Image Generation', value: systemMetrics.apiUsage.imageGen, color: '#96ceb4' }
                        ]}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label
                      >
                        {Object.entries(systemMetrics.apiUsage).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Tool Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-orange-500" />
                        <span>AI Chat</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{systemMetrics.apiUsage.devvai}</p>
                        <p className="text-sm text-gray-600">requests</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <ImageIcon className="w-5 h-5 text-purple-500" />
                        <span>Image Generation</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{systemMetrics.apiUsage.imageGen}</p>
                        <p className="text-sm text-gray-600">generations</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <Search className="w-5 h-5 text-blue-500" />
                        <span>Web Search</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{systemMetrics.apiUsage.webSearch}</p>
                        <p className="text-sm text-gray-600">searches</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-green-500" />
                        <span>File Operations</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{systemMetrics.apiUsage.fileOps}</p>
                        <p className="text-sm text-gray-600">operations</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}