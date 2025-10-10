# Claude Agent Platform - Project Structure

## Project Description
A comprehensive Claude Agent SDK-based platform for building, orchestrating, and deploying AI agents with visual workflows. Features advanced agent configuration, drag-and-drop workflow builder, system prompt designer with templates, granular tool permissions manager with security controls, comprehensive MCP server integration hub with visual connectors, built-in tool ecosystem with AI, image, web, and file capabilities, hierarchical sub-agent management with delegation patterns, advanced memory and context management system with multi-level storage, real-time workflow execution engine with comprehensive monitoring, comprehensive agent performance analytics dashboard with enterprise-grade monitoring capabilities, advanced debugging and logging system with real-time monitoring, performance tracking, and comprehensive log management, intelligent workflow optimization engine with comprehensive analysis, smart recommendations, and automated improvement suggestions, and **multi-user collaboration system with enterprise-grade role-based permissions, team management, and workspace sharing**, all with Claude's signature warm, professional design aesthetic.

## Key Features
- Visual workflow canvas with drag-and-drop node editor and real-time positioning
- Advanced agent configuration with comprehensive system prompt designer and template library
- Granular tool permissions manager with 4-level security system (allow/prompt/deny/default)
- Risk-based tool classification (low/medium/high/critical) with comprehensive safety controls
- Individual tool permission overrides and contextual restrictions with audit logging
- Global security settings with compliance controls and rate limiting configuration
- MCP server integration hub with visual connectors and drag-and-drop connection builder
- Comprehensive MCP server management with templates for GitHub, PostgreSQL, Slack, File System
- Visual connection system with animated data flow indicators and real-time status monitoring
- **Built-in Tool Ecosystem** with comprehensive AI, image, web, and file processing capabilities
- **AI Chat Interface** with streaming responses, model selection (Default/Kimi K2), and conversation management
- **Image Generation System** with text-to-image, customizable parameters (model, aspect ratio, format)
- **Web Search Integration** with LLM-optimized results and comprehensive search capabilities
- **Web Content Reader** with clean content extraction and metadata parsing
- **File Upload System** with progress tracking, drag-and-drop support, and URL generation
- **Hierarchical Sub-Agent System** with comprehensive delegation management and orchestration patterns:
  - Multi-level agent hierarchy with visual tree/flat/role-based views
  - Role-based agent classification (coordinator, specialist, executor, validator)
  - Granular delegation controls with depth limits and permission inheritance
  - Advanced communication patterns (lateral, hierarchical) between sub-agents
  - Performance monitoring with task completion metrics and success rates
  - Comprehensive sub-agent configuration with individual system prompts and capabilities
  - Risk assessment and contextual restrictions for sub-agent operations
  - Real-time sub-agent status monitoring and health checks
- **Advanced Memory and Context Management System** with enterprise-grade capabilities:
  - **Context Management**: Rolling window, summarization, compression, and selective strategies
  - **Multi-level Memory**: Short-term (session/conversation/task) and long-term (vector storage, semantic search)
  - **Conversation Management**: Auto-save, compression thresholds, semantic grouping, turn limits
  - **State Management**: Workflow/agent state persistence with versioning and backup intervals
  - **Performance Optimization**: Caching strategies (LRU/LFU/TTL), preload context, smart compression
  - **Memory Configuration**: Context window management, retention ratios, history limits
  - **Advanced Storage**: Vector storage for semantic memory, auto-summarization capabilities
- **Real-time Workflow Execution Engine** with comprehensive monitoring and orchestration:
  - **Workflow Orchestration**: Intelligent execution order with dependency resolution and topological sorting
  - **Node Execution Management**: Real-time status tracking (pending/running/completed/failed/skipped) with progress indicators
  - **Execution Analytics**: Comprehensive performance metrics, node completion rates, execution duration tracking
  - **Real-time Monitoring**: Live execution dashboard with node status visualization and progress tracking
  - **DevvAI Integration**: Native AI agent execution with streaming chat completions and token usage tracking
  - **Execution Store**: Zustand-based real-time state management with execution history and node status updates
  - **Professional Execution Interface**: Tabbed execution panel with real-time logs, analytics, and control buttons
  - **Execution Controls**: Start, stop, pause, resume functionality with real-time workflow state management
  - **Node Result Tracking**: Comprehensive output capture, error handling, and performance monitoring
  - **Execution History**: Complete execution logging with duration, status, and node completion analytics
- **Comprehensive Agent Performance Analytics Dashboard** with enterprise-grade monitoring:
  - **Multi-Tab Analytics Interface**: Overview, Agent Performance, Workflow Analytics, System Metrics, Tool Usage
  - **Real-time Performance Monitoring**: Live agent metrics with success rates, execution times, token usage
  - **Advanced Data Visualization**: Interactive charts with Recharts (Area, Bar, Pie, Line charts)
  - **System Health Dashboard**: Resource usage monitoring (CPU, memory, storage, network)
  - **Agent Performance Metrics**: Individual agent tracking with tool usage breakdown and performance indicators
  - **Workflow Analytics**: Performance classification (excellent/good/fair/poor) with complexity analysis
  - **Execution Trend Analysis**: Historical data visualization with success/failure rates over time
  - **API Usage Statistics**: Comprehensive tracking of DevvAI, image generation, web search, file operations
  - **Performance Distribution Analysis**: Visual breakdown of agent and workflow performance categories
  - **System Health Status**: Real-time monitoring of database, API services, memory, and network connectivity
  - **Tool Usage Distribution**: Detailed analytics on built-in tool ecosystem utilization
  - **Export Capabilities**: JSON export functionality for analytics data with timestamp tracking
  - **Auto-refresh System**: Configurable real-time data updates with manual refresh controls
  - **Professional Dashboard Design**: Claude-inspired warm aesthetics with comprehensive data presentation
  - **Enterprise Analytics Features**: Time range selection, filtering capabilities, search functionality
- **Advanced Debugging and Logging System** with enterprise-grade monitoring and debugging capabilities:
  - **Real-time Log Stream**: Live log monitoring with comprehensive filtering and search capabilities
  - **Multi-level Logging**: Debug, info, warn, error, trace, and performance log levels with granular control
  - **Category-based Logging**: System, workflow, agent, API, user, security, performance, and network categories
  - **Advanced Logger Class**: Centralized logging with listeners, performance metrics tracking, and filtering
  - **Log Entry Management**: Comprehensive log structure with timestamps, metadata, stack traces, and session tracking
  - **Performance Metrics Tracking**: Real-time performance monitoring with thresholds, status indicators, and trend analysis
  - **Search and Filter System**: Advanced log filtering by level, category, timestamp, and full-text search
  - **Network Activity Monitor**: Dedicated network monitoring with connection tracking and response time analysis
  - **Debug Console Interface**: Professional debugging interface with tabbed navigation and real-time updates
  - **Log Export Functionality**: JSON export capabilities with timestamps and comprehensive metadata
  - **Auto-scroll and Real-time Updates**: Live log streaming with configurable auto-scroll and refresh intervals
  - **Stack Trace Analysis**: Detailed error tracking with expandable stack traces and error context
  - **Session Management**: Session-based log tracking with user identification and workflow correlation
  - **Performance Profiling**: CPU usage, memory consumption, response time, and token usage tracking
  - **Integration with Execution Engine**: Seamless integration with workflow execution for comprehensive monitoring
  - **Log Configuration**: Configurable log retention, filtering preferences, and performance monitoring settings
- **Intelligent Workflow Optimization Engine** with comprehensive analysis and smart recommendations:
  - **Advanced Workflow Analysis Engine**: Multi-dimensional workflow assessment with intelligent scoring algorithms
  - **Complexity Analysis**: Comprehensive workflow complexity scoring with node count, connection density, agent hierarchy analysis
  - **Performance Analysis**: Execution time analysis, resource usage tracking, bottleneck detection, and optimization opportunities
  - **Security Analysis**: Risk assessment with vulnerability detection, permission analysis, and security best practices validation
  - **Reliability Analysis**: Single point of failure detection, error handling assessment, and resilience evaluation
  - **Maintainability Analysis**: Code quality assessment, documentation coverage, naming convention validation
  - **Smart Recommendation System**: AI-powered optimization suggestions with priority classification (critical/high/medium/low)
  - **Recommendation Categories**: Performance, security, reliability, efficiency, and usability improvements
  - **Auto-fix Capabilities**: Automated implementation of selected optimizations with code generation
  - **Impact Assessment**: Detailed impact analysis with effort estimation and improvement projections
  - **Comprehensive Analytics**: Real-time optimization metrics with workflow scoring and improvement tracking
  - **Professional Optimization Interface**: Multi-tab interface (Overview/Recommendations/Analysis/Insights) with enterprise-grade design
  - **Optimization Insights**: Strategic patterns, best practices, and optimization roadmaps with actionable guidance
  - **Export Capabilities**: Complete analysis export with comprehensive optimization reports and recommendations
  - **Real-time Analysis**: Live workflow analysis with auto-refresh capabilities and intelligent monitoring
  - **Visual Analytics**: Interactive charts and progress indicators for optimization metrics and improvement tracking
- **Multi-User Collaboration System** with enterprise-grade role-based permissions and team management:
  - **Comprehensive User Management**: Team member management with advanced role-based access controls
  - **4-Tier Role System**: Owner, Administrator, Editor, and Viewer roles with granular permission matrices
  - **Advanced Permission Controls**: Workflow, agent, collaboration, and admin permission categories with fine-grained access
  - **Team Management Interface**: Professional team dashboard with search, filtering, and bulk operations
  - **Invitation System**: Email-based invitations with custom messages, expiration dates, and approval workflows
  - **Workspace Management**: Configurable workspace settings with visibility controls and security policies
  - **Activity Tracking**: Comprehensive team activity feed with detailed action logging and user correlation
  - **Real-time Collaboration**: Live team status indicators, presence monitoring, and activity notifications
  - **Security & Compliance**: Guest access controls, approval workflows, and enterprise security settings
  - **Role-Based Permissions**: Granular permissions for workflows (create/read/update/delete/share/execute), agents (create/read/update/delete/configure), collaboration (invite/manage/export), and admin (manage users/roles/analytics/system settings)
  - **Professional UI Design**: Multi-tab interface (Team/Invitations/Roles/Activity/Settings) with Claude-inspired aesthetics
  - **Advanced Team Analytics**: Member activity tracking, role distribution analysis, and collaboration insights
  - **Invitation Management**: Pending invitation tracking with resend, revoke, and expiration management
  - **Workspace Settings**: Configurable visibility (private/team/public), invite policies, default roles, and feature toggles
  - **Enterprise Features**: Bulk user operations, CSV export, audit logging, and comprehensive reporting
- System prompt templates library (default assistant, code expert, data analyst, creative writer)
- Memory and context management configuration with sub-agent orchestration support
- Professional enterprise-ready interface with Claude-inspired warm aesthetic
- Email OTP authentication system with session persistence
- Database storage for workflows, agents, MCP server configurations, and collaboration data
- Responsive design with mobile-friendly interfaces

## Data Storage
Tables: 
- workflows (f0i2gib9dbeo) - Stores workflow definitions, nodes, and connections with expanded node data including agent configurations, sub-agent hierarchies, and comprehensive memory settings
- agents (f0i2gw15akn4) - Stores Claude agent configurations and settings with advanced tool permissions, sub-agent relationships, and memory management configurations
- collaboration_users (f0jrih6jruv4) - Stores collaboration user data including roles, permissions, and status for team management
- collaboration_invitations (f0jriqwujev4) - Stores invitation data for pending user invitations with expiration tracking
- collaboration_workspaces (f0jrjb13lds0) - Stores workspace configuration and settings with member management
- collaboration_activities (f0jrjqjcwm4g) - Stores team activity log for collaboration tracking and audit trails
Local: Authentication session in localStorage with Zustand persistence
Store: Real-time execution state management with node status tracking and execution history
Logging: Advanced logger with real-time log streaming, performance metrics tracking, and session-based log management
Optimization: Comprehensive workflow analysis engine with intelligent recommendation system and performance tracking

## Devv SDK Integration
Built-in: 
- Authentication system (email OTP verification)
- Database operations (workflow and agent CRUD with MCP server persistence, sub-agent data, memory configurations, and collaboration data management)
- **DevvAI chat completions** with default model and Kimi K2 support, streaming responses, native workflow execution integration
- **Image generation** with default and Google Gemini 2.5 models, customizable parameters
- **Web search** powered by Jina SERP API with LLM-optimized results
- **Web content reader** powered by Jina Reader API for clean content extraction
- **File upload service** with 200 files/day limit and public URL generation
External: Ready for integration with OpenRouter AI, ElevenLabs TTS/STT, Replicate models

## Special Requirements
- Claude-inspired design system with warm orange primary color (18 70% 60%)
- Visual workflow builder similar to n8n/OpenAI AgentKit with enhanced drag-and-drop
- MCP (Model Context Protocol) integration with visual connector system
- Agent orchestration and execution monitoring with real-time status indicators
- Professional enterprise-ready interface with comprehensive security controls
- Advanced system prompt designer with template library and syntax highlighting
- Comprehensive tool permissions management with granular security controls and audit logging
- Risk-based security assessment with contextual restrictions and rate limiting
- Visual MCP server connections with animated data flow and drag-and-drop interface
- Built-in MCP server templates for common integrations (GitHub, databases, file systems)
- **Comprehensive tool ecosystem** with tabbed interface and real-time result tracking
- **Professional tool result management** with detailed input/output logging and error handling
- **Hierarchical sub-agent management** with comprehensive delegation patterns and orchestration controls
- **Advanced sub-agent configuration** with role-based classification and performance monitoring
- **Multi-level communication patterns** between sub-agents with lateral and hierarchical messaging
- **Enterprise-grade memory management** with multi-tiered storage, semantic search, and intelligent compression
- **Advanced context management** with multiple strategies and retention policies
- **Performance-optimized memory system** with caching, preloading, and smart state management
- **Real-time workflow execution** with comprehensive monitoring, analytics, and professional execution controls
- **Native DevvAI integration** with proper chat completions API usage and streaming support
- **Execution state management** with real-time updates and comprehensive execution history
- **Enterprise-grade analytics dashboard** with comprehensive performance monitoring and data visualization
- **Professional analytics interface** with multi-tab navigation and advanced filtering capabilities
- **Real-time analytics updates** with configurable refresh intervals and export functionality
- **Advanced debugging and logging system** with real-time monitoring, comprehensive filtering, and enterprise-grade log management
- **Professional debugging interface** with multi-tab navigation, real-time log streaming, and performance profiling
- **Comprehensive error tracking** with stack trace analysis, session correlation, and detailed metadata logging
- **Intelligent workflow optimization** with comprehensive analysis engine, smart recommendations, and automated improvement suggestions
- **Professional optimization interface** with multi-dimensional analysis, strategic insights, and enterprise-grade optimization recommendations
- **Advanced optimization analytics** with performance tracking, improvement metrics, and comprehensive reporting capabilities
- **Enterprise-grade collaboration system** with comprehensive team management, role-based permissions, and workspace sharing
- **Professional collaboration interface** with multi-tab navigation, advanced user management, and enterprise security controls
- **Advanced team analytics** with activity tracking, permission auditing, and collaboration insights

/src
├── components/          # Core UI components
│   ├── ui/             # Pre-installed shadcn/ui components
│   ├── AuthScreen.tsx  # Email OTP authentication interface
│   ├── PlatformLayout.tsx # Main platform layout with 8-tab navigation (Canvas/MCP Integration/Tools/Execution/Analytics/Debug/Optimization/Collaboration)
│   ├── WorkflowCanvas.tsx # Drag-and-drop workflow canvas with comprehensive drop zone handling
│   ├── NodePalette.tsx # Draggable node components palette including MCP integration nodes
│   ├── PropertiesPanel.tsx # Node configuration panel with enhanced agent integration
│   ├── AgentConfigDialog.tsx # **Advanced agent configuration with comprehensive memory management, granular tool permissions system, and sub-agent management**
│   ├── SubAgentHierarchy.tsx # **Comprehensive sub-agent hierarchy management with visual tree interface**
│   ├── MCPIntegrationHub.tsx # Comprehensive MCP server management with visual interface
│   ├── MCPVisualConnector.tsx # Visual drag-and-drop MCP connection builder with real-time status
│   ├── ToolEcosystemHub.tsx # Comprehensive built-in tool ecosystem with AI, image, web, and file capabilities
│   ├── WorkflowExecutionEngine.tsx # **Real-time workflow execution engine with comprehensive monitoring, DevvAI integration, and professional execution interface**
│   ├── AgentAnalyticsDashboard.tsx # **Comprehensive agent performance analytics dashboard with enterprise-grade monitoring and data visualization**
│   ├── AdvancedDebuggingSystem.tsx # **Advanced debugging and logging system with real-time monitoring, performance tracking, and comprehensive log management**
│   ├── WorkflowOptimizationEngine.tsx # **Intelligent workflow optimization engine with comprehensive analysis, smart recommendations, and automated improvement suggestions**
│   └── CollaborationSystem.tsx # **Enterprise-grade multi-user collaboration system with role-based permissions, team management, invitation system, workspace configuration, and comprehensive activity tracking**
│
├── store/              # Zustand state management
│   ├── auth-store.ts   # Authentication state and actions
│   ├── workflow-store.ts # Workflow and agent management with enhanced node operations, expanded data model, sub-agent support, and memory configurations
│   └── execution-store.ts # **Real-time execution state management with node status tracking, execution history, and comprehensive workflow orchestration**
│
├── pages/              # Route pages
│   ├── HomePage.tsx    # Original home page (unused in authenticated state)
│   └── NotFoundPage.tsx # 404 error page
│
├── hooks/              # Custom hooks
│   ├── use-mobile.ts   # Mobile detection hook
│   └── use-toast.ts    # Toast notification system
│
├── lib/                # Utility functions
│   └── utils.ts        # Utility functions including cn for Tailwind
│
├── App.tsx             # Root component with auth-based routing
├── main.tsx            # Application entry point
└── index.css           # Claude-inspired design system with warm color palette