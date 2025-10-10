import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Zap,
  Clock,
  Shield,
  Network,
  Settings,
  BarChart3,
  Target,
  Workflow,
  Brain,
  Gauge,
  ArrowRight,
  Info,
  XCircle,
  Activity,
  Users,
  Database,
  Cpu,
  RefreshCw,
  Download,
  Eye,
  Play,
  Pause
} from 'lucide-react';
import { useWorkflowStore } from '@/store/workflow-store';
import { useExecutionStore } from '@/store/execution-store';

// Types for optimization recommendations
interface OptimizationRecommendation {
  id: string;
  type: 'performance' | 'security' | 'reliability' | 'efficiency' | 'usability';
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  estimatedImprovement: string;
  nodeId?: string;
  action: 'autofix' | 'manual' | 'review';
  details: string[];
  code?: string;
  applied: boolean;
  createdAt: Date;
}

interface WorkflowAnalysis {
  workflowId: string;
  complexity: {
    score: number;
    level: 'simple' | 'moderate' | 'complex' | 'very_complex';
    factors: string[];
  };
  performance: {
    score: number;
    bottlenecks: string[];
    executionTime: number;
    resourceUsage: number;
  };
  security: {
    score: number;
    risks: string[];
    vulnerabilities: string[];
  };
  reliability: {
    score: number;
    singlePoints: string[];
    errorHandling: number;
  };
  maintainability: {
    score: number;
    issues: string[];
    documentation: number;
  };
  recommendations: OptimizationRecommendation[];
  overallScore: number;
  lastAnalyzed: Date;
}

interface OptimizationMetrics {
  totalWorkflows: number;
  analyzedWorkflows: number;
  totalRecommendations: number;
  appliedRecommendations: number;
  averageScore: number;
  improvementPotential: number;
  criticalIssues: number;
  autoFixAvailable: number;
}

// Advanced Workflow Analysis Engine
class WorkflowAnalysisEngine {
  analyzeWorkflow(workflow: any, executionHistory: any[]): WorkflowAnalysis {
    const complexity = this.analyzeComplexity(workflow);
    const performance = this.analyzePerformance(workflow, executionHistory);
    const security = this.analyzeSecurity(workflow);
    const reliability = this.analyzeReliability(workflow);
    const maintainability = this.analyzeMaintainability(workflow);
    
    const recommendations = this.generateRecommendations(
      workflow,
      complexity,
      performance,
      security,
      reliability,
      maintainability
    );

    const overallScore = this.calculateOverallScore(
      complexity.score,
      performance.score,
      security.score,
      reliability.score,
      maintainability.score
    );

    return {
      workflowId: workflow._id,
      complexity,
      performance,
      security,
      reliability,
      maintainability,
      recommendations,
      overallScore,
      lastAnalyzed: new Date()
    };
  }

  private analyzeComplexity(workflow: any) {
    const nodeCount = workflow.nodes?.length || 0;
    const connectionCount = workflow.connections?.length || 0;
    const agentCount = workflow.nodes?.filter((n: any) => n.type === 'agent').length || 0;
    const subAgentCount = workflow.nodes?.reduce((acc: number, n: any) => 
      acc + (n.data?.subAgents?.length || 0), 0) || 0;
    
    const factors = [];
    let score = 100;

    if (nodeCount > 20) {
      factors.push(`High node count (${nodeCount})`);
      score -= 15;
    }
    if (connectionCount > nodeCount * 1.5) {
      factors.push('Dense interconnections');
      score -= 10;
    }
    if (agentCount > 5) {
      factors.push(`Multiple agents (${agentCount})`);
      score -= 10;
    }
    if (subAgentCount > 0) {
      factors.push(`Sub-agent hierarchy (${subAgentCount} sub-agents)`);
      score -= 5;
    }

    const level: 'simple' | 'moderate' | 'complex' | 'very_complex' = 
      score >= 80 ? 'simple' : 
      score >= 60 ? 'moderate' : 
      score >= 40 ? 'complex' : 'very_complex';

    return { score: Math.max(0, score), level, factors };
  }

  private analyzePerformance(workflow: any, executionHistory: any[]) {
    let score = 100;
    const bottlenecks = [];
    
    const avgExecutionTime = executionHistory.length > 0 
      ? executionHistory.reduce((acc, h) => acc + (h.duration || 0), 0) / executionHistory.length
      : 0;
    
    const resourceUsage = this.calculateResourceUsage(workflow);

    if (avgExecutionTime > 30000) { // 30 seconds
      bottlenecks.push('Long execution time');
      score -= 20;
    }
    if (resourceUsage > 80) {
      bottlenecks.push('High resource usage');
      score -= 15;
    }

    // Check for sequential processing that could be parallel
    const sequentialChains = this.findSequentialChains(workflow);
    if (sequentialChains.length > 3) {
      bottlenecks.push('Sequential processing chains');
      score -= 10;
    }

    return {
      score: Math.max(0, score),
      bottlenecks,
      executionTime: avgExecutionTime,
      resourceUsage
    };
  }

  private analyzeSecurity(workflow: any) {
    let score = 100;
    const risks = [];
    const vulnerabilities = [];

    // Check for insecure configurations
    workflow.nodes?.forEach((node: any) => {
      if (node.data?.tools?.includes('file-upload') && !node.data?.security?.fileValidation) {
        vulnerabilities.push(`Node ${node.data?.label}: Unrestricted file upload`);
        score -= 15;
      }
      
      if (node.data?.tools?.includes('web-search') && !node.data?.security?.urlFiltering) {
        risks.push(`Node ${node.data?.label}: Unfiltered web access`);
        score -= 10;
      }

      if (node.data?.permissions?.level === 'allow_all') {
        vulnerabilities.push(`Node ${node.data?.label}: Overprivileged permissions`);
        score -= 20;
      }
    });

    return { score: Math.max(0, score), risks, vulnerabilities };
  }

  private analyzeReliability(workflow: any) {
    let score = 100;
    const singlePoints = [];
    let errorHandling = 100;

    // Check for single points of failure
    const criticalNodes = workflow.nodes?.filter((n: any) => 
      (workflow.connections || []).filter((c: any) => c.source === n.id).length > 3
    ) || [];

    if (criticalNodes.length > 0) {
      singlePoints.push(`Critical nodes: ${criticalNodes.map((n: any) => n.data?.label).join(', ')}`);
      score -= 15;
    }

    // Check error handling
    const nodesWithoutErrorHandling = workflow.nodes?.filter((n: any) => 
      !n.data?.errorHandling?.enabled
    ).length || 0;

    if (nodesWithoutErrorHandling > 0) {
      errorHandling = Math.max(0, 100 - (nodesWithoutErrorHandling * 10));
      score -= 10;
    }

    return { score: Math.max(0, score), singlePoints, errorHandling };
  }

  private analyzeMaintainability(workflow: any) {
    let score = 100;
    const issues = [];
    let documentation = 100;

    // Check documentation
    const undocumentedNodes = workflow.nodes?.filter((n: any) => 
      !n.data?.description || n.data.description.trim().length < 10
    ).length || 0;

    if (undocumentedNodes > 0) {
      issues.push(`Undocumented nodes: ${undocumentedNodes}`);
      documentation = Math.max(0, 100 - (undocumentedNodes * 15));
      score -= 10;
    }

    // Check naming conventions
    const poorlyNamedNodes = workflow.nodes?.filter((n: any) => 
      !n.data?.label || n.data.label.length < 3 || /^(node|agent)\d*$/i.test(n.data.label)
    ).length || 0;

    if (poorlyNamedNodes > 0) {
      issues.push(`Poor naming: ${poorlyNamedNodes} nodes`);
      score -= 10;
    }

    return { score: Math.max(0, score), issues, documentation };
  }

  private generateRecommendations(
    workflow: any,
    complexity: any,
    performance: any,
    security: any,
    reliability: any,
    maintainability: any
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Performance recommendations
    if (performance.bottlenecks.includes('Long execution time')) {
      recommendations.push({
        id: `perf_${Date.now()}_1`,
        type: 'performance',
        priority: 'high',
        category: 'Execution Speed',
        title: 'Optimize Sequential Processing',
        description: 'Convert sequential node chains to parallel execution where possible',
        impact: 'Reduce execution time by 40-60%',
        effort: 'medium',
        estimatedImprovement: '40-60% faster execution',
        action: 'manual',
        details: [
          'Identify independent node sequences',
          'Implement parallel execution patterns',
          'Add synchronization points where needed',
          'Test parallel execution thoroughly'
        ],
        applied: false,
        createdAt: new Date()
      });
    }

    // Security recommendations
    if (security.vulnerabilities.length > 0) {
      recommendations.push({
        id: `sec_${Date.now()}_1`,
        type: 'security',
        priority: 'critical',
        category: 'Access Control',
        title: 'Implement Granular Permissions',
        description: 'Replace overprivileged permissions with principle of least privilege',
        impact: 'Significantly reduce security attack surface',
        effort: 'medium',
        estimatedImprovement: 'Eliminate critical security vulnerabilities',
        action: 'manual',
        details: [
          'Review each node\'s required permissions',
          'Implement role-based access controls',
          'Add permission validation',
          'Enable security audit logging'
        ],
        applied: false,
        createdAt: new Date()
      });
    }

    // Reliability recommendations
    if (reliability.singlePoints.length > 0) {
      recommendations.push({
        id: `rel_${Date.now()}_1`,
        type: 'reliability',
        priority: 'high',
        category: 'Fault Tolerance',
        title: 'Add Redundancy and Failover',
        description: 'Implement backup paths for critical workflow components',
        impact: 'Improve workflow reliability by 80%',
        effort: 'high',
        estimatedImprovement: '80% improvement in reliability',
        action: 'manual',
        details: [
          'Identify critical failure points',
          'Design alternative execution paths',
          'Implement graceful degradation',
          'Add health checks and monitoring'
        ],
        applied: false,
        createdAt: new Date()
      });
    }

    // Efficiency recommendations
    if (complexity.level === 'very_complex' || complexity.level === 'complex') {
      recommendations.push({
        id: `eff_${Date.now()}_1`,
        type: 'efficiency',
        priority: 'medium',
        category: 'Workflow Structure',
        title: 'Simplify Workflow Architecture',
        description: 'Break down complex workflow into smaller, manageable sub-workflows',
        impact: 'Improve maintainability and debugging',
        effort: 'high',
        estimatedImprovement: '50% easier to maintain and debug',
        action: 'manual',
        details: [
          'Identify logical workflow boundaries',
          'Extract reusable sub-workflows',
          'Implement workflow composition patterns',
          'Document workflow interactions'
        ],
        applied: false,
        createdAt: new Date()
      });
    }

    // Usability recommendations
    if (maintainability.issues.length > 0) {
      recommendations.push({
        id: `usab_${Date.now()}_1`,
        type: 'usability',
        priority: 'low',
        category: 'Documentation',
        title: 'Improve Workflow Documentation',
        description: 'Add comprehensive descriptions and labels to all workflow components',
        impact: 'Better team collaboration and maintenance',
        effort: 'low',
        estimatedImprovement: 'Significantly improved developer experience',
        action: 'autofix',
        details: [
          'Add descriptive labels to all nodes',
          'Document node purposes and configurations',
          'Create workflow overview documentation',
          'Implement naming conventions'
        ],
        code: `// Auto-generate documentation templates for nodes
workflow.nodes.forEach(node => {
  if (!node.data.description) {
    node.data.description = \`\${node.type} node - Add description here\`;
  }
});`,
        applied: false,
        createdAt: new Date()
      });
    }

    return recommendations;
  }

  private calculateOverallScore(...scores: number[]): number {
    return Math.round(scores.reduce((acc, score) => acc + score, 0) / scores.length);
  }

  private calculateResourceUsage(workflow: any): number {
    // Simulate resource usage calculation
    const nodeCount = workflow.nodes?.length || 0;
    const agentCount = workflow.nodes?.filter((n: any) => n.type === 'agent').length || 0;
    const toolCount = workflow.nodes?.reduce((acc: number, n: any) => 
      acc + (n.data?.tools?.length || 0), 0) || 0;
    
    return Math.min(100, (nodeCount * 2) + (agentCount * 10) + (toolCount * 3));
  }

  private findSequentialChains(workflow: any): any[] {
    // Simulate finding sequential processing chains
    const chains = [];
    const connections = workflow.connections || [];
    
    // Group nodes by connection patterns
    const nodeConnections = new Map();
    connections.forEach((conn: any) => {
      if (!nodeConnections.has(conn.source)) {
        nodeConnections.set(conn.source, []);
      }
      nodeConnections.get(conn.source).push(conn.target);
    });

    // Find chains longer than 2 nodes
    nodeConnections.forEach((targets, source) => {
      if (targets.length === 1) {
        const chain = [source];
        let current = targets[0];
        
        while (nodeConnections.has(current) && nodeConnections.get(current).length === 1) {
          chain.push(current);
          current = nodeConnections.get(current)[0];
        }
        
        if (chain.length > 2) {
          chains.push(chain);
        }
      }
    });

    return chains;
  }
}

export function WorkflowOptimizationEngine() {
  const { workflows, currentWorkflow } = useWorkflowStore();
  const { executionHistory } = useExecutionStore();
  const [analyses, setAnalyses] = useState<Map<string, WorkflowAnalysis>>(new Map());
  const [metrics, setMetrics] = useState<OptimizationMetrics | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  const analysisEngine = new WorkflowAnalysisEngine();

  // Generate optimization metrics
  const generateMetrics = useCallback(() => {
    const totalWorkflows = workflows.length;
    const analyzedWorkflows = analyses.size;
    
    let totalRecommendations = 0;
    let appliedRecommendations = 0;
    let totalScore = 0;
    let criticalIssues = 0;
    let autoFixAvailable = 0;

    analyses.forEach((analysis) => {
      totalRecommendations += analysis.recommendations.length;
      appliedRecommendations += analysis.recommendations.filter(r => r.applied).length;
      totalScore += analysis.overallScore;
      criticalIssues += analysis.recommendations.filter(r => r.priority === 'critical').length;
      autoFixAvailable += analysis.recommendations.filter(r => r.action === 'autofix').length;
    });

    const averageScore = analyzedWorkflows > 0 ? totalScore / analyzedWorkflows : 0;
    const improvementPotential = Math.max(0, 100 - averageScore);

    setMetrics({
      totalWorkflows,
      analyzedWorkflows,
      totalRecommendations,
      appliedRecommendations,
      averageScore,
      improvementPotential,
      criticalIssues,
      autoFixAvailable
    });
  }, [workflows, analyses]);

  // Analyze workflow
  const analyzeWorkflow = useCallback(async (workflowId: string) => {
    setIsAnalyzing(true);
    
    try {
      const workflow = workflows.find(w => w._id === workflowId);
      if (!workflow) return;

      const workflowExecutions = executionHistory.filter(h => h.workflowId === workflowId);
      const analysis = analysisEngine.analyzeWorkflow(workflow, workflowExecutions);
      
      setAnalyses(prev => new Map(prev.set(workflowId, analysis)));
      
      // Simulate analysis delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));
    } finally {
      setIsAnalyzing(false);
    }
  }, [workflows, executionHistory, analysisEngine]);

  // Analyze all workflows
  const analyzeAllWorkflows = useCallback(async () => {
    setIsAnalyzing(true);
    
    for (const workflow of workflows) {
      await analyzeWorkflow(workflow._id);
    }
  }, [workflows, analyzeWorkflow]);

  // Apply recommendation
  const applyRecommendation = useCallback((workflowId: string, recommendationId: string) => {
    setAnalyses(prev => {
      const newAnalyses = new Map(prev);
      const analysis = newAnalyses.get(workflowId);
      
      if (analysis) {
        const updatedRecommendations = analysis.recommendations.map(rec => 
          rec.id === recommendationId ? { ...rec, applied: true } : rec
        );
        
        newAnalyses.set(workflowId, {
          ...analysis,
          recommendations: updatedRecommendations
        });
      }
      
      return newAnalyses;
    });
  }, []);

  // Export analysis data
  const exportAnalysisData = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      metrics,
      analyses: Array.from(analyses.entries()).map(([id, analysis]) => ({
        workflowId: id,
        analysis
      }))
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workflow-optimization-analysis-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [analyses, metrics]);

  // Auto-refresh logic
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        if (currentWorkflow?._id) {
          analyzeWorkflow(currentWorkflow._id);
        }
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh, currentWorkflow, analyzeWorkflow]);

  // Generate metrics when analyses change
  useEffect(() => {
    generateMetrics();
  }, [generateMetrics]);

  const selectedAnalysis = selectedWorkflow ? analyses.get(selectedWorkflow) : null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return <Zap className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      case 'reliability': return <CheckCircle className="w-4 h-4" />;
      case 'efficiency': return <TrendingUp className="w-4 h-4" />;
      case 'usability': return <Users className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workflow Optimization</h1>
          <p className="text-gray-600 mt-1">Intelligent analysis and recommendations for workflow improvement</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-orange-50 border-orange-200 text-orange-700' : ''}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
          </Button>
          
          <Button variant="outline" onClick={exportAnalysisData} disabled={analyses.size === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export Analysis
          </Button>
          
          <Button onClick={analyzeAllWorkflows} disabled={isAnalyzing || workflows.length === 0}>
            <Brain className="w-4 h-4 mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'Analyze All'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <Tabs defaultValue="overview" className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start px-6 bg-transparent border-b rounded-none h-12">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              Detailed Analysis
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Optimization Insights
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="overview" className="h-full m-0">
              <div className="h-full p-6 overflow-y-auto">
                {/* Metrics Overview */}
                {metrics && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Analyzed Workflows</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-2xl font-bold text-gray-900">
                          {metrics.analyzedWorkflows}/{metrics.totalWorkflows}
                        </div>
                        <Progress 
                          value={metrics.totalWorkflows > 0 ? (metrics.analyzedWorkflows / metrics.totalWorkflows) * 100 : 0} 
                          className="mt-2" 
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-2xl font-bold text-gray-900">
                          {Math.round(metrics.averageScore)}/100
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {metrics.improvementPotential}% improvement potential
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-2xl font-bold text-gray-900">
                          {metrics.appliedRecommendations}/{metrics.totalRecommendations}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {metrics.autoFixAvailable} auto-fixable
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Critical Issues</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="text-2xl font-bold text-red-600">
                          {metrics.criticalIssues}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          Require immediate attention
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Workflows List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Workflow className="w-5 h-5" />
                      Workflow Analysis Status
                    </CardTitle>
                    <CardDescription>
                      Select a workflow to view detailed analysis and recommendations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-3">
                        {workflows.map((workflow) => {
                          const analysis = analyses.get(workflow._id);
                          return (
                            <div
                              key={workflow._id}
                              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                selectedWorkflow === workflow._id 
                                  ? 'border-orange-200 bg-orange-50' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => setSelectedWorkflow(workflow._id)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-gray-900">{workflow.name}</h4>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {workflow.nodes?.length || 0} nodes • {workflow.connections?.length || 0} connections
                                  </p>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  {analysis ? (
                                    <>
                                      <div className="text-right">
                                        <div className="text-lg font-semibold text-gray-900">
                                          {analysis.overallScore}/100
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {analysis.recommendations.length} recommendations
                                        </div>
                                      </div>
                                      <CheckCircle className="w-5 h-5 text-green-500" />
                                    </>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        analyzeWorkflow(workflow._id);
                                      }}
                                      disabled={isAnalyzing}
                                    >
                                      <Activity className="w-4 h-4 mr-2" />
                                      Analyze
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="h-full m-0">
              <div className="h-full p-6 overflow-y-auto">
                {selectedAnalysis ? (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="w-5 h-5" />
                          Optimization Recommendations
                          <Badge variant="secondary">{selectedAnalysis.recommendations.length}</Badge>
                        </CardTitle>
                        <CardDescription>
                          Intelligent suggestions to improve workflow performance, security, and maintainability
                        </CardDescription>
                      </CardHeader>
                    </Card>

                    <div className="space-y-4">
                      {selectedAnalysis.recommendations.map((recommendation) => (
                        <Card key={recommendation.id} className="overflow-hidden">
                          <CardHeader className="pb-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                {getTypeIcon(recommendation.type)}
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-gray-900">{recommendation.title}</h3>
                                    <Badge className={getPriorityColor(recommendation.priority)}>
                                      {recommendation.priority}
                                    </Badge>
                                    <Badge variant="outline">{recommendation.category}</Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-2">{recommendation.description}</p>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span>Impact: {recommendation.impact}</span>
                                    <span>Effort: {recommendation.effort}</span>
                                    <span>{recommendation.estimatedImprovement}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {recommendation.action === 'autofix' && (
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    <Zap className="w-3 h-3 mr-1" />
                                    Auto-fix
                                  </Badge>
                                )}
                                
                                <Button
                                  size="sm"
                                  variant={recommendation.applied ? "secondary" : "default"}
                                  onClick={() => !recommendation.applied && applyRecommendation(selectedAnalysis.workflowId, recommendation.id)}
                                  disabled={recommendation.applied}
                                >
                                  {recommendation.applied ? (
                                    <>
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Applied
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-4 h-4 mr-2" />
                                      Apply
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          
                          <CardContent className="pt-0">
                            <div className="space-y-3">
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Implementation Steps:</h4>
                                <ul className="space-y-1 text-sm text-gray-600">
                                  {recommendation.details.map((detail, index) => (
                                    <li key={index} className="flex items-center gap-2">
                                      <ArrowRight className="w-3 h-3 text-gray-400" />
                                      {detail}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              {recommendation.code && (
                                <div>
                                  <h4 className="text-sm font-medium text-gray-700 mb-2">Auto-fix Code:</h4>
                                  <pre className="bg-gray-50 p-3 rounded text-xs text-gray-800 overflow-x-auto">
                                    {recommendation.code}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {selectedAnalysis.recommendations.length === 0 && (
                        <Card className="text-center py-12">
                          <CardContent>
                            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Excellent Work!</h3>
                            <p className="text-gray-600">
                              This workflow is well-optimized. No immediate recommendations at this time.
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                ) : (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Workflow</h3>
                      <p className="text-gray-600">
                        Choose a workflow from the overview tab to view its optimization recommendations.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="h-full m-0">
              <div className="h-full p-6 overflow-y-auto">
                {selectedAnalysis ? (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Gauge className="w-5 h-5" />
                          Detailed Analysis
                        </CardTitle>
                        <CardDescription>
                          Comprehensive breakdown of workflow metrics and performance indicators
                        </CardDescription>
                      </CardHeader>
                    </Card>

                    {/* Analysis Metrics Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Complexity Analysis */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Complexity Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Complexity Score</span>
                              <span className="text-lg font-bold">{selectedAnalysis.complexity.score}/100</span>
                            </div>
                            <Progress value={selectedAnalysis.complexity.score} />
                            
                            <div>
                              <span className="text-sm font-medium text-gray-700">Level: </span>
                              <Badge className={
                                selectedAnalysis.complexity.level === 'simple' ? 'bg-green-100 text-green-800' :
                                selectedAnalysis.complexity.level === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                                selectedAnalysis.complexity.level === 'complex' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }>
                                {selectedAnalysis.complexity.level.replace('_', ' ')}
                              </Badge>
                            </div>
                            
                            {selectedAnalysis.complexity.factors.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Complexity Factors:</h4>
                                <ul className="space-y-1 text-sm text-gray-600">
                                  {selectedAnalysis.complexity.factors.map((factor, index) => (
                                    <li key={index}>• {factor}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Performance Analysis */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Performance Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Performance Score</span>
                              <span className="text-lg font-bold">{selectedAnalysis.performance.score}/100</span>
                            </div>
                            <Progress value={selectedAnalysis.performance.score} />
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Avg Execution:</span>
                                <div className="font-medium">{(selectedAnalysis.performance.executionTime / 1000).toFixed(1)}s</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Resource Usage:</span>
                                <div className="font-medium">{selectedAnalysis.performance.resourceUsage}%</div>
                              </div>
                            </div>
                            
                            {selectedAnalysis.performance.bottlenecks.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Bottlenecks:</h4>
                                <ul className="space-y-1 text-sm text-gray-600">
                                  {selectedAnalysis.performance.bottlenecks.map((bottleneck, index) => (
                                    <li key={index}>• {bottleneck}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Security Analysis */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Security Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Security Score</span>
                              <span className="text-lg font-bold">{selectedAnalysis.security.score}/100</span>
                            </div>
                            <Progress value={selectedAnalysis.security.score} />
                            
                            {selectedAnalysis.security.vulnerabilities.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-red-700 mb-2">Vulnerabilities:</h4>
                                <ul className="space-y-1 text-sm text-red-600">
                                  {selectedAnalysis.security.vulnerabilities.map((vuln, index) => (
                                    <li key={index}>• {vuln}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {selectedAnalysis.security.risks.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-orange-700 mb-2">Security Risks:</h4>
                                <ul className="space-y-1 text-sm text-orange-600">
                                  {selectedAnalysis.security.risks.map((risk, index) => (
                                    <li key={index}>• {risk}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Reliability Analysis */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Reliability Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Reliability Score</span>
                              <span className="text-lg font-bold">{selectedAnalysis.reliability.score}/100</span>
                            </div>
                            <Progress value={selectedAnalysis.reliability.score} />
                            
                            <div>
                              <span className="text-sm text-gray-600">Error Handling:</span>
                              <div className="font-medium">{selectedAnalysis.reliability.errorHandling}%</div>
                            </div>
                            
                            {selectedAnalysis.reliability.singlePoints.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-red-700 mb-2">Single Points of Failure:</h4>
                                <ul className="space-y-1 text-sm text-red-600">
                                  {selectedAnalysis.reliability.singlePoints.map((point, index) => (
                                    <li key={index}>• {point}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Overall Score Summary */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Overall Assessment</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="text-3xl font-bold text-gray-900">
                            {selectedAnalysis.overallScore}/100
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-gray-700">
                              {selectedAnalysis.overallScore >= 90 ? 'Excellent' :
                               selectedAnalysis.overallScore >= 75 ? 'Good' :
                               selectedAnalysis.overallScore >= 60 ? 'Fair' : 'Needs Improvement'}
                            </div>
                            <div className="text-sm text-gray-500">
                              Last analyzed: {selectedAnalysis.lastAnalyzed.toLocaleString()}
                            </div>
                          </div>
                        </div>
                        
                        <Progress value={selectedAnalysis.overallScore} className="mb-4" />
                        
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-center">
                          <div>
                            <div className="text-lg font-semibold">{selectedAnalysis.complexity.score}</div>
                            <div className="text-xs text-gray-500">Complexity</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold">{selectedAnalysis.performance.score}</div>
                            <div className="text-xs text-gray-500">Performance</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold">{selectedAnalysis.security.score}</div>
                            <div className="text-xs text-gray-500">Security</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold">{selectedAnalysis.reliability.score}</div>
                            <div className="text-xs text-gray-500">Reliability</div>
                          </div>
                          <div>
                            <div className="text-lg font-semibold">{selectedAnalysis.maintainability.score}</div>
                            <div className="text-xs text-gray-500">Maintainability</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card className="text-center py-12">
                    <CardContent>
                      <Gauge className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Workflow</h3>
                      <p className="text-gray-600">
                        Choose a workflow from the overview tab to view detailed analysis metrics.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="insights" className="h-full m-0">
              <div className="h-full p-6 overflow-y-auto">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Optimization Insights
                      </CardTitle>
                      <CardDescription>
                        Strategic recommendations and patterns for workflow optimization
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  {/* Global Insights */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Performance Patterns
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2">Sequential Processing</h4>
                            <p className="text-sm text-blue-800">
                              Most workflows show sequential processing patterns. Consider parallelizing independent operations to reduce execution time by 40-60%.
                            </p>
                          </div>
                          
                          <div className="p-4 bg-green-50 rounded-lg">
                            <h4 className="font-medium text-green-900 mb-2">Resource Optimization</h4>
                            <p className="text-sm text-green-800">
                              Implement caching strategies and connection pooling to reduce resource consumption and improve response times.
                            </p>
                          </div>
                          
                          <div className="p-4 bg-purple-50 rounded-lg">
                            <h4 className="font-medium text-purple-900 mb-2">Memory Management</h4>
                            <p className="text-sm text-purple-800">
                              Enable smart compression and context management to optimize memory usage in long-running workflows.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          Security Best Practices
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-4 bg-red-50 rounded-lg">
                            <h4 className="font-medium text-red-900 mb-2">Principle of Least Privilege</h4>
                            <p className="text-sm text-red-800">
                              Review and restrict node permissions. Many workflows use overprivileged access that increases security risk.
                            </p>
                          </div>
                          
                          <div className="p-4 bg-orange-50 rounded-lg">
                            <h4 className="font-medium text-orange-900 mb-2">Input Validation</h4>
                            <p className="text-sm text-orange-800">
                              Implement comprehensive input validation and sanitization for all external data sources and user inputs.
                            </p>
                          </div>
                          
                          <div className="p-4 bg-yellow-50 rounded-lg">
                            <h4 className="font-medium text-yellow-900 mb-2">Audit Logging</h4>
                            <p className="text-sm text-yellow-800">
                              Enable detailed audit logging for security-sensitive operations and compliance requirements.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Reliability Improvements
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-4 bg-emerald-50 rounded-lg">
                            <h4 className="font-medium text-emerald-900 mb-2">Error Handling</h4>
                            <p className="text-sm text-emerald-800">
                              Implement comprehensive error handling and recovery mechanisms. Add retry logic with exponential backoff.
                            </p>
                          </div>
                          
                          <div className="p-4 bg-cyan-50 rounded-lg">
                            <h4 className="font-medium text-cyan-900 mb-2">Redundancy</h4>
                            <p className="text-sm text-cyan-800">
                              Design backup execution paths for critical workflow components to eliminate single points of failure.
                            </p>
                          </div>
                          
                          <div className="p-4 bg-indigo-50 rounded-lg">
                            <h4 className="font-medium text-indigo-900 mb-2">Health Monitoring</h4>
                            <p className="text-sm text-indigo-800">
                              Add comprehensive health checks and monitoring to detect and respond to issues proactively.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Maintainability Tips
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <h4 className="font-medium text-slate-900 mb-2">Documentation</h4>
                            <p className="text-sm text-slate-800">
                              Add comprehensive descriptions to all nodes and workflows. Good documentation reduces debugging time by 70%.
                            </p>
                          </div>
                          
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2">Modular Design</h4>
                            <p className="text-sm text-gray-800">
                              Break complex workflows into smaller, reusable sub-workflows for better maintainability and testing.
                            </p>
                          </div>
                          
                          <div className="p-4 bg-stone-50 rounded-lg">
                            <h4 className="font-medium text-stone-900 mb-2">Naming Conventions</h4>
                            <p className="text-sm text-stone-800">
                              Use consistent, descriptive names for nodes and variables. Clear naming improves team collaboration.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Optimization Roadmap */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Workflow className="w-5 h-5" />
                        Optimization Roadmap
                      </CardTitle>
                      <CardDescription>
                        Recommended order for implementing optimizations across your workflows
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 border border-red-200 bg-red-50 rounded-lg">
                          <div className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                          <div>
                            <h4 className="font-medium text-red-900">Address Critical Security Issues</h4>
                            <p className="text-sm text-red-700">Fix overprivileged permissions and implement input validation</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 p-4 border border-orange-200 bg-orange-50 rounded-lg">
                          <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                          <div>
                            <h4 className="font-medium text-orange-900">Implement Error Handling</h4>
                            <p className="text-sm text-orange-700">Add comprehensive error handling and recovery mechanisms</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                          <div className="w-8 h-8 bg-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                          <div>
                            <h4 className="font-medium text-yellow-900">Optimize Performance Bottlenecks</h4>
                            <p className="text-sm text-yellow-700">Parallelize workflows and implement caching strategies</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                          <div>
                            <h4 className="font-medium text-blue-900">Improve Documentation</h4>
                            <p className="text-sm text-blue-700">Add comprehensive descriptions and implement naming conventions</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 p-4 border border-green-200 bg-green-50 rounded-lg">
                          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">5</div>
                          <div>
                            <h4 className="font-medium text-green-900">Implement Advanced Features</h4>
                            <p className="text-sm text-green-700">Add monitoring, analytics, and advanced optimization features</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}