import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bug, 
  Terminal, 
  Activity, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle, 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Filter,
  Search,
  Clock,
  Code,
  Database,
  Network,
  Cpu,
  HardDrive,
  Zap,
  Eye,
  EyeOff,
  Settings,
  Trash2,
  FileText
} from 'lucide-react';
import { useExecutionStore } from '@/store/execution-store';
import { useWorkflowStore } from '@/store/workflow-store';
import { format } from 'date-fns';

// Enhanced Logger Types
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'trace' | 'performance';
export type LogCategory = 'system' | 'workflow' | 'agent' | 'api' | 'user' | 'security' | 'performance' | 'network';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  details?: Record<string, any>;
  nodeId?: string;
  workflowId?: string;
  agentId?: string;
  sessionId?: string;
  userId?: string;
  stackTrace?: string;
  duration?: number;
  metadata?: {
    userAgent?: string;
    url?: string;
    method?: string;
    statusCode?: number;
    responseTime?: number;
  };
}

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  category: string;
  threshold?: number;
  status: 'good' | 'warning' | 'critical';
}

// Advanced Logger Class
class AdvancedLogger {
  private logs: LogEntry[] = [];
  private listeners: ((logs: LogEntry[]) => void)[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private performanceListeners: ((metrics: PerformanceMetric[]) => void)[] = [];
  private sessionId: string = Math.random().toString(36).substr(2, 9);
  private maxLogs: number = 10000;
  private logFilters: Partial<Record<LogLevel | LogCategory, boolean>> = {};

  constructor() {
    // Enable all log levels and categories by default
    this.logFilters = {
      debug: true,
      info: true,
      warn: true,
      error: true,
      trace: true,
      performance: true,
      system: true,
      workflow: true,
      agent: true,
      api: true,
      user: true,
      security: true,
      network: true
    };
  }

  log(level: LogLevel, category: LogCategory, message: string, details?: Record<string, any>, nodeId?: string, workflowId?: string) {
    const logEntry: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      level,
      category,
      message,
      details,
      nodeId,
      workflowId,
      sessionId: this.sessionId,
      userId: 'current-user' // This would come from auth store
    };

    // Add stack trace for errors
    if (level === 'error') {
      logEntry.stackTrace = new Error().stack;
    }

    this.addLog(logEntry);
  }

  performance(name: string, value: number, unit: string, category: string, threshold?: number) {
    const metric: PerformanceMetric = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      value,
      unit,
      timestamp: Date.now(),
      category,
      threshold,
      status: threshold ? 
        (value > threshold * 1.5 ? 'critical' : value > threshold ? 'warning' : 'good') : 
        'good'
    };

    this.performanceMetrics.unshift(metric);
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(0, 1000);
    }

    this.performanceListeners.forEach(listener => listener([...this.performanceMetrics]));

    // Also log performance metrics
    this.log('performance', 'performance', `${name}: ${value}${unit}`, { 
      metric: name, 
      value, 
      unit, 
      category,
      status: metric.status 
    });
  }

  private addLog(entry: LogEntry) {
    this.logs.unshift(entry);
    
    // Maintain max logs limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Notify listeners
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener);
    listener([...this.logs]);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  subscribeToPerformance(listener: (metrics: PerformanceMetric[]) => void) {
    this.performanceListeners.push(listener);
    listener([...this.performanceMetrics]);
    return () => {
      this.performanceListeners = this.performanceListeners.filter(l => l !== listener);
    };
  }

  getLogs(filters?: Partial<LogEntry>) {
    let filteredLogs = [...this.logs];

    if (filters) {
      filteredLogs = filteredLogs.filter(log => {
        return Object.entries(filters).every(([key, value]) => {
          if (value === undefined) return true;
          return log[key as keyof LogEntry] === value;
        });
      });
    }

    return filteredLogs;
  }

  clearLogs() {
    this.logs = [];
    this.listeners.forEach(listener => listener([]));
  }

  exportLogs() {
    return {
      logs: this.logs,
      performanceMetrics: this.performanceMetrics,
      sessionId: this.sessionId,
      exportedAt: Date.now()
    };
  }

  setFilter(key: LogLevel | LogCategory, enabled: boolean) {
    this.logFilters[key] = enabled;
  }

  getFilteredLogs() {
    return this.logs.filter(log => 
      this.logFilters[log.level] && this.logFilters[log.category]
    );
  }
}

// Global logger instance
export const logger = new AdvancedLogger();

// Debugging System Component
export default function AdvancedDebuggingSystem() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [isRecording, setIsRecording] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<LogCategory | 'all'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const executionStore = useExecutionStore();
  const workflowStore = useWorkflowStore();

  // Subscribe to logger updates
  useEffect(() => {
    const unsubscribeLogs = logger.subscribe(setLogs);
    const unsubscribePerformance = logger.subscribeToPerformance(setPerformanceMetrics);
    
    return () => {
      unsubscribeLogs();
      unsubscribePerformance();
    };
  }, []);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [logs, autoScroll]);

  // Performance monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate performance metrics
      logger.performance('Memory Usage', Math.random() * 100, '%', 'system', 80);
      logger.performance('CPU Usage', Math.random() * 100, '%', 'system', 70);
      logger.performance('Response Time', Math.random() * 500, 'ms', 'network', 200);
      logger.performance('Active Connections', Math.floor(Math.random() * 50), 'count', 'network', 30);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Log workflow events
  useEffect(() => {
    if (executionStore.currentExecution?.status === 'running') {
      logger.log('info', 'workflow', 'Workflow execution started', {
        workflowId: executionStore.currentExecution.workflowId,
        nodeCount: Object.keys(executionStore.nodeStatuses).length
      });
    }
  }, [executionStore.currentExecution]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = searchQuery === '' || 
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.level.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
      const matchesCategory = selectedCategory === 'all' || log.category === selectedCategory;
      
      return matchesSearch && matchesLevel && matchesCategory && isRecording;
    });
  }, [logs, searchQuery, selectedLevel, selectedCategory, isRecording]);

  const getLogIcon = (level: LogLevel) => {
    switch (level) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warn': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      case 'debug': return <Bug className="w-4 h-4 text-gray-500" />;
      case 'trace': return <Code className="w-4 h-4 text-purple-500" />;
      case 'performance': return <Zap className="w-4 h-4 text-green-500" />;
      default: return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: LogCategory) => {
    switch (category) {
      case 'system': return <Cpu className="w-4 h-4" />;
      case 'workflow': return <Activity className="w-4 h-4" />;
      case 'agent': return <Bug className="w-4 h-4" />;
      case 'api': return <Network className="w-4 h-4" />;
      case 'user': return <Eye className="w-4 h-4" />;
      case 'security': return <AlertTriangle className="w-4 h-4" />;
      case 'performance': return <Zap className="w-4 h-4" />;
      case 'network': return <Network className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const handleExportLogs = () => {
    const data = logger.exportLogs();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Demo functions for testing
  const generateTestLogs = () => {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'trace', 'performance'];
    const categories: LogCategory[] = ['system', 'workflow', 'agent', 'api', 'user', 'security'];
    
    levels.forEach((level, i) => {
      setTimeout(() => {
        logger.log(
          level, 
          categories[i % categories.length], 
          `Test ${level} message #${Date.now()}`,
          { testData: `Sample data for ${level}`, timestamp: Date.now() }
        );
      }, i * 100);
    });
  };

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold">Advanced Debugging & Logging</h2>
          <Badge variant={isRecording ? "default" : "secondary"}>
            {isRecording ? "Recording" : "Paused"}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateTestLogs}
          >
            <Bug className="w-4 h-4 mr-2" />
            Test Logs
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRecording(!isRecording)}
          >
            {isRecording ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => logger.clearLogs()}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportLogs}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="logs" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="logs">Real-time Logs</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="network">Network Monitor</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Real-time Logs Tab */}
        <TabsContent value="logs" className="flex-1 flex flex-col space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Filters & Search</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search logs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value as LogLevel | 'all')}
                  className="px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="all">All Levels</option>
                  <option value="error">Error</option>
                  <option value="warn">Warning</option>
                  <option value="info">Info</option>
                  <option value="debug">Debug</option>
                  <option value="trace">Trace</option>
                  <option value="performance">Performance</option>
                </select>
                
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as LogCategory | 'all')}
                  className="px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="all">All Categories</option>
                  <option value="system">System</option>
                  <option value="workflow">Workflow</option>
                  <option value="agent">Agent</option>
                  <option value="api">API</option>
                  <option value="user">User</option>
                  <option value="security">Security</option>
                  <option value="performance">Performance</option>
                  <option value="network">Network</option>
                </select>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto-scroll"
                    checked={autoScroll}
                    onCheckedChange={setAutoScroll}
                  />
                  <Label htmlFor="auto-scroll" className="text-sm">Auto-scroll</Label>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                Showing {filteredLogs.length} of {logs.length} log entries
              </div>
            </CardContent>
          </Card>

          {/* Logs Display */}
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Live Log Stream</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-full" ref={scrollAreaRef}>
                <div className="p-4 space-y-2">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="group hover:bg-muted/50 p-3 rounded-lg border transition-colors">
                      <div className="flex items-start space-x-3">
                        <div className="flex items-center space-x-2 min-w-0 flex-1">
                          {getLogIcon(log.level)}
                          {getCategoryIcon(log.category)}
                          <Badge variant="outline" className="text-xs">
                            {log.level}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {log.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.timestamp), 'HH:mm:ss.SSS')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2 ml-12">
                        <div className="text-sm font-medium">{log.message}</div>
                        
                        {log.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                              Show Details
                            </summary>
                            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                        
                        {log.stackTrace && (
                          <details className="mt-2">
                            <summary className="text-xs text-red-500 cursor-pointer hover:text-red-400">
                              Stack Trace
                            </summary>
                            <pre className="mt-2 text-xs bg-red-50 dark:bg-red-950 p-2 rounded overflow-x-auto text-red-800 dark:text-red-200">
                              {log.stackTrace}
                            </pre>
                          </details>
                        )}
                        
                        {(log.nodeId || log.workflowId) && (
                          <div className="mt-2 flex items-center space-x-2 text-xs text-muted-foreground">
                            {log.nodeId && <span>Node: {log.nodeId}</span>}
                            {log.workflowId && <span>Workflow: {log.workflowId}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {filteredLogs.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Terminal className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No logs match your current filters</p>
                      <p className="text-sm mt-2">Try adjusting your search query or filters</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="flex-1 flex flex-col space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {performanceMetrics.slice(0, 8).map((metric) => (
              <Card key={metric.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{metric.name}</p>
                      <p className="text-2xl font-bold">
                        {metric.value.toFixed(1)}{metric.unit}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        metric.status === 'critical' ? 'destructive' : 
                        metric.status === 'warning' ? 'secondary' : 
                        'default'
                      }
                    >
                      {metric.status}
                    </Badge>
                  </div>
                  {metric.threshold && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Threshold: {metric.threshold}{metric.unit}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Performance History</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {performanceMetrics.map((metric) => (
                    <div key={metric.id} className="flex items-center justify-between p-2 rounded border">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{metric.category}</Badge>
                        <span className="text-sm">{metric.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-mono">
                          {metric.value.toFixed(1)}{metric.unit}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(metric.timestamp), 'HH:mm:ss')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Network Monitor Tab */}
        <TabsContent value="network" className="flex-1 flex flex-col space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Network className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Active Connections</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {Math.floor(Math.random() * 50)}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Avg Response Time</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {Math.floor(Math.random() * 200)}ms
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">API Calls/min</span>
                </div>
                <p className="text-2xl font-bold mt-2">
                  {Math.floor(Math.random() * 100)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Network Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {logs
                    .filter(log => log.category === 'network' || log.category === 'api')
                    .slice(0, 20)
                    .map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-2 rounded border">
                      <div className="flex items-center space-x-2">
                        {getLogIcon(log.level)}
                        <span className="text-sm">{log.message}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.timestamp), 'HH:mm:ss')}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="flex-1 flex flex-col space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logging Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium">Log Levels</Label>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  {['debug', 'info', 'warn', 'error', 'trace', 'performance'].map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <Switch
                        id={`level-${level}`}
                        defaultChecked={true}
                        onCheckedChange={(checked) => logger.setFilter(level as LogLevel, checked)}
                      />
                      <Label htmlFor={`level-${level}`} className="text-sm capitalize">
                        {level}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium">Categories</Label>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  {['system', 'workflow', 'agent', 'api', 'user', 'security', 'performance', 'network'].map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Switch
                        id={`category-${category}`}
                        defaultChecked={true}
                        onCheckedChange={(checked) => logger.setFilter(category as LogCategory, checked)}
                      />
                      <Label htmlFor={`category-${category}`} className="text-sm capitalize">
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-sm font-medium">Performance Monitoring</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Enable Performance Tracking</span>
                    <Switch defaultChecked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Real-time Metrics</span>
                    <Switch defaultChecked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Network Monitoring</span>
                    <Switch defaultChecked={true} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}