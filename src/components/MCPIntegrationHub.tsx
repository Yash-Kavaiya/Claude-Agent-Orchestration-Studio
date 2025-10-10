import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Server, 
  Database, 
  Globe, 
  FileText, 
  MessageSquare, 
  Code, 
  Settings, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Plug,
  Link,
  Shield,
  Clock,
  Activity,
  Trash2,
  Edit
} from 'lucide-react';
import { useWorkflowStore } from '@/store/workflow-store';
import { MCPVisualConnector } from './MCPVisualConnector';

// MCP Server Types and Interfaces
export interface MCPServer {
  id: string;
  name: string;
  description: string;
  type: 'stdio' | 'http' | 'websocket' | 'in-process';
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  category: 'development' | 'database' | 'file-system' | 'web-services' | 'communication' | 'custom';
  endpoint?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  capabilities: string[];
  tools: MCPTool[];
  resources: MCPResource[];
  created: Date;
  lastSeen?: Date;
  config: MCPServerConfig;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  parameters?: any;
  category: string;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPServerConfig {
  auth?: {
    type: 'none' | 'basic' | 'bearer' | 'oauth2' | 'api-key';
    credentials?: Record<string, string>;
  };
  timeout: number;
  retries: number;
  rateLimit: {
    requests: number;
    windowMs: number;
  };
  logging: boolean;
  autoReconnect: boolean;
}

interface MCPConnection {
  id: string;
  agentId: string;
  serverId: string;
  status: 'connected' | 'connecting' | 'error' | 'disconnected';
  tools: string[];
  created: Date;
}

// Built-in MCP Server Templates
const MCP_SERVER_TEMPLATES: Partial<MCPServer>[] = [
  {
    name: 'GitHub Integration',
    description: 'Access GitHub repositories, issues, and pull requests',
    type: 'http',
    category: 'development',
    capabilities: ['repositories', 'issues', 'pull-requests', 'commits'],
    tools: [
      { name: 'list_repositories', description: 'List user repositories', inputSchema: {}, category: 'repository' },
      { name: 'create_issue', description: 'Create a new issue', inputSchema: {}, category: 'issue' },
      { name: 'list_pull_requests', description: 'List pull requests', inputSchema: {}, category: 'pull-request' }
    ],
    resources: []
  },
  {
    name: 'PostgreSQL Database',
    description: 'Connect to PostgreSQL database for data operations',
    type: 'stdio',
    category: 'database',
    capabilities: ['query', 'insert', 'update', 'delete', 'schema'],
    tools: [
      { name: 'execute_query', description: 'Execute SQL query', inputSchema: {}, category: 'database' },
      { name: 'list_tables', description: 'List database tables', inputSchema: {}, category: 'database' },
      { name: 'get_schema', description: 'Get table schema', inputSchema: {}, category: 'database' }
    ],
    resources: []
  },
  {
    name: 'File System',
    description: 'Access local file system operations',
    type: 'stdio',
    category: 'file-system',
    capabilities: ['read', 'write', 'list', 'search'],
    tools: [
      { name: 'read_file', description: 'Read file contents', inputSchema: {}, category: 'file' },
      { name: 'write_file', description: 'Write file contents', inputSchema: {}, category: 'file' },
      { name: 'list_directory', description: 'List directory contents', inputSchema: {}, category: 'file' }
    ],
    resources: []
  },
  {
    name: 'Slack Integration',
    description: 'Send messages and interact with Slack workspace',
    type: 'http',
    category: 'communication',
    capabilities: ['messages', 'channels', 'users'],
    tools: [
      { name: 'send_message', description: 'Send Slack message', inputSchema: {}, category: 'messaging' },
      { name: 'list_channels', description: 'List Slack channels', inputSchema: {}, category: 'messaging' },
      { name: 'get_users', description: 'Get workspace users', inputSchema: {}, category: 'messaging' }
    ],
    resources: []
  }
];

export const MCPIntegrationHub: React.FC = () => {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [selectedServer, setSelectedServer] = useState<MCPServer | null>(null);
  const [isAddingServer, setIsAddingServer] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'servers' | 'visual'>('servers');
  const [connections, setConnections] = useState<MCPConnection[]>([]);

  const { nodes } = useWorkflowStore();

  // Load servers from workflow store
  useEffect(() => {
    // In a real implementation, load from database or MCP discovery
    const mockServers: MCPServer[] = MCP_SERVER_TEMPLATES.map((template, index) => ({
      id: `mcp-${index}`,
      ...template,
      status: index === 0 ? 'connected' : 'disconnected',
      created: new Date(),
      config: {
        timeout: 5000,
        retries: 3,
        rateLimit: { requests: 100, windowMs: 60000 },
        logging: true,
        autoReconnect: true
      }
    })) as MCPServer[];
    
    setServers(mockServers);
  }, []);

  const handleAddServer = (template?: Partial<MCPServer>) => {
    const newServer: MCPServer = {
      id: `mcp-${Date.now()}`,
      name: template?.name || 'New MCP Server',
      description: template?.description || 'Custom MCP server integration',
      type: template?.type || 'http',
      status: 'disconnected',
      category: template?.category || 'custom',
      capabilities: template?.capabilities || [],
      tools: template?.tools || [],
      resources: template?.resources || [],
      created: new Date(),
      config: {
        timeout: 5000,
        retries: 3,
        rateLimit: { requests: 100, windowMs: 60000 },
        logging: true,
        autoReconnect: true
      }
    };
    
    setServers([...servers, newServer]);
    setSelectedServer(newServer);
    setIsAddingServer(false);
  };

  const handleToggleServer = (serverId: string) => {
    setServers(servers.map(server => 
      server.id === serverId 
        ? { ...server, status: server.status === 'connected' ? 'disconnected' : 'connected' }
        : server
    ));
  };

  const handleDeleteServer = (serverId: string) => {
    setServers(servers.filter(server => server.id !== serverId));
    if (selectedServer?.id === serverId) {
      setSelectedServer(null);
    }
  };

  const filteredServers = servers.filter(server => {
    const matchesCategory = filterCategory === 'all' || server.category === filterCategory;
    const matchesSearch = server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         server.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Get agents from workflow nodes
  const agents = nodes.filter(node => node.type === 'agent').map(node => ({
    id: node.id,
    name: node.data?.label || node.type,
    type: 'Claude Agent'
  }));

  const handleConnect = (agentId: string, serverId: string) => {
    const newConnection: MCPConnection = {
      id: `conn-${Date.now()}`,
      agentId,
      serverId,
      status: 'connecting',
      tools: servers.find(s => s.id === serverId)?.tools.map(t => t.name) || [],
      created: new Date()
    };

    setConnections([...connections, newConnection]);

    // Simulate connection process
    setTimeout(() => {
      setConnections(prev => prev.map(conn => 
        conn.id === newConnection.id 
          ? { ...conn, status: 'connected' }
          : conn
      ));
    }, 2000);
  };

  const handleDisconnect = (connectionId: string) => {
    setConnections(connections.filter(conn => conn.id !== connectionId));
  };

  const getStatusIcon = (status: MCPServer['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getCategoryIcon = (category: MCPServer['category']) => {
    switch (category) {
      case 'development':
        return <Code className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'file-system':
        return <FileText className="h-4 w-4" />;
      case 'web-services':
        return <Globe className="h-4 w-4" />;
      case 'communication':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Server className="h-4 w-4" />;
    }
  };

  if (activeTab === 'visual') {
    return (
      <div className="flex flex-col h-full">
        {/* Tab Navigation */}
        <div className="border-b border-border bg-background px-6 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('servers')}
              className="gap-2"
            >
              <Server className="h-4 w-4" />
              Server Management
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setActiveTab('visual')}
              className="gap-2"
            >
              <Link className="h-4 w-4" />
              Visual Connector
            </Button>
          </div>
        </div>

        {/* Visual Connector Content */}
        <div className="flex-1 overflow-hidden">
          <MCPVisualConnector
            agents={agents}
            servers={servers}
            connections={connections}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="border-b border-border bg-background px-6 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="default"
            size="sm"
            onClick={() => setActiveTab('servers')}
            className="gap-2"
          >
            <Server className="h-4 w-4" />
            Server Management
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab('visual')}
            className="gap-2"
          >
            <Link className="h-4 w-4" />
            Visual Connector
          </Button>
        </div>
      </div>

      {/* Server Management Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Server List */}
        <div className="w-80 border-r border-border bg-muted/20 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">MCP Servers</h2>
            <Dialog open={isAddingServer} onOpenChange={setIsAddingServer}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Server
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add MCP Server Integration</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {MCP_SERVER_TEMPLATES.map((template, index) => (
                    <Card 
                      key={index} 
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => handleAddServer(template)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(template.category!)}
                          <CardTitle className="text-sm">{template.name}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {template.capabilities?.slice(0, 3).map(cap => (
                            <Badge key={cap} variant="secondary" className="text-xs">{cap}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => handleAddServer()}
                  >
                    <Code className="h-4 w-4" />
                    Create Custom Server
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <div className="space-y-3 mb-4">
            <Input
              placeholder="Search servers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8"
            />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="database">Database</SelectItem>
                <SelectItem value="file-system">File System</SelectItem>
                <SelectItem value="web-services">Web Services</SelectItem>
                <SelectItem value="communication">Communication</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Server List */}
          <div className="space-y-2">
            {filteredServers.map(server => (
              <Card 
                key={server.id}
                className={`cursor-pointer transition-colors ${
                  selectedServer?.id === server.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedServer(server)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(server.category)}
                      <span className="font-medium text-sm">{server.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(server.status)}
                      <Switch
                        checked={server.status === 'connected'}
                        onCheckedChange={() => handleToggleServer(server.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{server.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs">{server.type}</Badge>
                      <Badge variant="secondary" className="text-xs">{server.tools.length} tools</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {server.status === 'connected' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Panel - Server Details */}
        <div className="flex-1 p-6 overflow-y-auto">
          {selectedServer ? (
            <MCPServerDetails 
              server={selectedServer} 
              onUpdate={(updatedServer) => {
                setServers(servers.map(s => s.id === updatedServer.id ? updatedServer : s));
                setSelectedServer(updatedServer);
              }}
              onDelete={() => handleDeleteServer(selectedServer.id)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div className="space-y-4">
                <Plug className="h-16 w-16 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Select an MCP Server</h3>
                  <p className="text-muted-foreground">Choose a server from the list to view its configuration and tools</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface MCPServerDetailsProps {
  server: MCPServer;
  onUpdate: (server: MCPServer) => void;
  onDelete: () => void;
}

const MCPServerDetails: React.FC<MCPServerDetailsProps> = ({ server, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedServer, setEditedServer] = useState<MCPServer>(server);

  const handleSave = () => {
    onUpdate(editedServer);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedServer(server);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              {server.category === 'development' && <Code className="h-5 w-5 text-primary" />}
              {server.category === 'database' && <Database className="h-5 w-5 text-primary" />}
              {server.category === 'file-system' && <FileText className="h-5 w-5 text-primary" />}
              {server.category === 'web-services' && <Globe className="h-5 w-5 text-primary" />}
              {server.category === 'communication' && <MessageSquare className="h-5 w-5 text-primary" />}
              {server.category === 'custom' && <Server className="h-5 w-5 text-primary" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{server.name}</h1>
              <p className="text-muted-foreground">{server.description}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Server Details Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tools">Tools ({server.tools.length})</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Connection Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  {server.status === 'connected' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {server.status === 'disconnected' && <AlertCircle className="h-4 w-4 text-gray-400" />}
                  {server.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                  <span className="capitalize font-medium">{server.status}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Last seen: {server.lastSeen ? server.lastSeen.toLocaleString() : 'Never'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Server Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge variant="outline">{server.type}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Category:</span>
                    <Badge variant="secondary">{server.category}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{server.created.toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {server.capabilities.map(capability => (
                  <Badge key={capability} variant="outline" className="text-xs">
                    {capability}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <div className="grid gap-3">
            {server.tools.map((tool, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-sm">{tool.name}</h4>
                      <p className="text-xs text-muted-foreground">{tool.description}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">{tool.category}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Connection Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Timeout:</span>
                  <span>{server.config.timeout}ms</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Retries:</span>
                  <span>{server.config.retries}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Auto Reconnect:</span>
                  <Switch checked={server.config.autoReconnect} disabled />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Logging:</span>
                  <Switch checked={server.config.logging} disabled />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Rate Limiting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Requests per window:</span>
                  <span>{server.config.rateLimit.requests}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Window duration:</span>
                  <span>{server.config.rateLimit.windowMs / 1000}s</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Connection Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>[INFO] {new Date().toLocaleTimeString()}</span>
                  <span>Server initialized</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>[SUCCESS] {new Date().toLocaleTimeString()}</span>
                  <span>Connection established</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>[INFO] {new Date().toLocaleTimeString()}</span>
                  <span>Tools discovered: {server.tools.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};