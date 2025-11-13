# FastAPI Production Backend - Implementation Plan
## Claude Agent Orchestration Studio

> **Branch**: `claude/fastapi-production-backend-01SXXAzPn5p3tMibvm6gh1pf`
> **Date**: 2025-11-13
> **Purpose**: Replace DevvAI backend with production-grade FastAPI backend

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Database Design](#database-design)
6. [API Endpoints](#api-endpoints)
7. [Authentication & Authorization](#authentication--authorization)
8. [Workflow Execution Engine](#workflow-execution-engine)
9. [Real-time Features](#real-time-features)
10. [External Integrations](#external-integrations)
11. [Security Implementation](#security-implementation)
12. [Performance & Scalability](#performance--scalability)
13. [Monitoring & Observability](#monitoring--observability)
14. [Testing Strategy](#testing-strategy)
15. [Deployment Strategy](#deployment-strategy)
16. [Implementation Phases](#implementation-phases)

---

## Executive Summary

### Current State
- **Frontend**: React/Vite application (696 KB, 63 components, ~11,778 lines)
- **Backend**: DevvAI managed service (@devvai/devv-code-backend)
- **Features**: Workflow builder, agent orchestration, analytics, collaboration

### Target State
- **Backend**: Production-grade FastAPI application
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Cache**: Redis for sessions and real-time data
- **Queue**: Celery for async workflow execution
- **AI Integration**: Claude AI SDK, external AI services
- **Deployment**: Docker + Kubernetes/Cloud platform

### Key Requirements
1. Replace all DevvAI backend functionality
2. Maintain 100% frontend compatibility
3. Implement enterprise-grade security
4. Support real-time workflow execution
5. Scale to handle 10,000+ concurrent users
6. Achieve <100ms API response time (p95)
7. 99.9% uptime SLA

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Frontend                            │
│  (Vite + React Router + Zustand + shadcn/ui)                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS/WSS
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                     API Gateway / Load Balancer                  │
│                    (NGINX / Traefik / ALB)                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐ ┌───────▼────────┐ ┌───────▼────────┐
│  FastAPI       │ │  FastAPI       │ │  FastAPI       │
│  Instance 1    │ │  Instance 2    │ │  Instance N    │
└───────┬────────┘ └───────┬────────┘ └───────┬────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐ ┌───────▼────────┐ ┌───────▼────────┐
│  PostgreSQL    │ │     Redis      │ │  Celery        │
│  (Primary)     │ │   (Cache +     │ │  Workers       │
│                │ │   Sessions)    │ │  (Workflow     │
│  PostgreSQL    │ │                │ │   Execution)   │
│  (Replicas)    │ │                │ │                │
└────────────────┘ └────────────────┘ └────────┬───────┘
                                                │
                            ┌───────────────────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
        ┌───────▼──┐ ┌─────▼──┐ ┌─────▼──────┐
        │ Claude   │ │ File   │ │  External  │
        │ AI API   │ │Storage │ │  AI APIs   │
        │          │ │ (S3)   │ │            │
        └──────────┘ └────────┘ └────────────┘
```

### Microservices Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    FastAPI Application                    │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Auth       │  │  Workflows   │  │ Collaboration│  │
│  │   Service    │  │   Service    │  │   Service    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Execution   │  │  Analytics   │  │     MCP      │  │
│  │   Engine     │  │   Service    │  │   Service    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │    Tools     │  │     AI       │  │    File      │  │
│  │   Service    │  │   Service    │  │   Service    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Core Backend Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | FastAPI | 0.109+ | High-performance async web framework |
| **Language** | Python | 3.11+ | Modern Python with type hints |
| **ASGI Server** | Uvicorn | 0.27+ | Production ASGI server |
| **Database** | PostgreSQL | 15+ | Primary relational database |
| **ORM** | SQLAlchemy | 2.0+ | Database abstraction layer |
| **Migrations** | Alembic | 1.13+ | Database schema migrations |
| **Cache** | Redis | 7.2+ | Session storage, caching, pub/sub |
| **Task Queue** | Celery | 5.3+ | Async task execution |
| **Message Broker** | Redis/RabbitMQ | Latest | Task queue broker |
| **WebSocket** | FastAPI WebSocket | Built-in | Real-time communication |

### AI & Integration Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Claude AI** | anthropic-sdk | Claude API integration |
| **Image Generation** | httpx + API clients | Multiple AI image services |
| **Web Search** | Jina SERP API | Web search capabilities |
| **Web Reading** | Jina Reader API | Web content extraction |
| **File Storage** | AWS S3 / MinIO | Object storage |
| **Email** | SendGrid / AWS SES | OTP delivery |

### DevOps & Monitoring Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Containerization** | Docker | Application packaging |
| **Orchestration** | Kubernetes / Docker Compose | Container management |
| **Reverse Proxy** | NGINX / Traefik | Load balancing, SSL |
| **Logging** | Loguru / ELK Stack | Application logging |
| **Metrics** | Prometheus + Grafana | Performance monitoring |
| **Tracing** | OpenTelemetry | Distributed tracing |
| **Error Tracking** | Sentry | Error monitoring |
| **APM** | New Relic / Datadog | Application performance |

### Security Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Authentication** | JWT | Token-based auth |
| **Password Hashing** | bcrypt / Argon2 | Secure password storage |
| **Rate Limiting** | slowapi | API rate limiting |
| **CORS** | FastAPI CORS middleware | Cross-origin requests |
| **Input Validation** | Pydantic | Request validation |
| **Secret Management** | Vault / AWS Secrets Manager | Credential storage |

---

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                      # FastAPI application entry point
│   ├── config.py                    # Configuration management
│   ├── dependencies.py              # Dependency injection
│   │
│   ├── api/                         # API routes
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py              # Authentication endpoints
│   │   │   ├── workflows.py         # Workflow CRUD
│   │   │   ├── agents.py            # Agent management
│   │   │   ├── execution.py         # Workflow execution
│   │   │   ├── analytics.py         # Analytics endpoints
│   │   │   ├── collaboration.py     # Team & collaboration
│   │   │   ├── mcp.py              # MCP integration
│   │   │   ├── tools.py            # Tool ecosystem
│   │   │   ├── files.py            # File operations
│   │   │   └── websocket.py        # WebSocket connections
│   │   └── deps.py                 # Route dependencies
│   │
│   ├── core/                        # Core functionality
│   │   ├── __init__.py
│   │   ├── security.py             # Security utilities
│   │   ├── auth.py                 # Auth logic
│   │   ├── rate_limit.py           # Rate limiting
│   │   ├── cache.py                # Caching utilities
│   │   ├── exceptions.py           # Custom exceptions
│   │   └── logging.py              # Logging configuration
│   │
│   ├── models/                      # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py                 # User model
│   │   ├── workflow.py             # Workflow model
│   │   ├── agent.py                # Agent model
│   │   ├── execution.py            # Execution history
│   │   ├── collaboration.py        # Team models
│   │   ├── mcp_server.py           # MCP server model
│   │   ├── analytics.py            # Analytics models
│   │   └── file.py                 # File metadata
│   │
│   ├── schemas/                     # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── user.py                 # User schemas
│   │   ├── workflow.py             # Workflow schemas
│   │   ├── agent.py                # Agent schemas
│   │   ├── execution.py            # Execution schemas
│   │   ├── collaboration.py        # Team schemas
│   │   ├── mcp.py                  # MCP schemas
│   │   ├── analytics.py            # Analytics schemas
│   │   └── common.py               # Common schemas
│   │
│   ├── services/                    # Business logic
│   │   ├── __init__.py
│   │   ├── auth_service.py         # Authentication logic
│   │   ├── workflow_service.py     # Workflow operations
│   │   ├── agent_service.py        # Agent operations
│   │   ├── execution_service.py    # Workflow execution
│   │   ├── analytics_service.py    # Analytics calculation
│   │   ├── collaboration_service.py # Team management
│   │   ├── mcp_service.py          # MCP operations
│   │   ├── ai_service.py           # AI API integration
│   │   ├── tool_service.py         # Tool operations
│   │   └── file_service.py         # File operations
│   │
│   ├── workers/                     # Celery tasks
│   │   ├── __init__.py
│   │   ├── celery_app.py           # Celery configuration
│   │   ├── workflow_tasks.py       # Workflow execution tasks
│   │   ├── analytics_tasks.py      # Analytics calculation
│   │   ├── notification_tasks.py   # Email notifications
│   │   └── cleanup_tasks.py        # Maintenance tasks
│   │
│   ├── db/                          # Database utilities
│   │   ├── __init__.py
│   │   ├── session.py              # Database session
│   │   ├── base.py                 # Base model
│   │   └── init_db.py              # Database initialization
│   │
│   ├── integrations/                # External integrations
│   │   ├── __init__.py
│   │   ├── claude.py               # Claude AI client
│   │   ├── image_generation.py     # Image AI clients
│   │   ├── web_search.py           # Web search client
│   │   ├── web_reader.py           # Web reader client
│   │   ├── email.py                # Email service
│   │   └── storage.py              # S3/MinIO client
│   │
│   ├── middleware/                  # Custom middleware
│   │   ├── __init__.py
│   │   ├── error_handler.py        # Global error handling
│   │   ├── request_logger.py       # Request logging
│   │   ├── rate_limit.py           # Rate limiting middleware
│   │   └── cors.py                 # CORS configuration
│   │
│   └── utils/                       # Utility functions
│       ├── __init__.py
│       ├── email.py                # Email utilities
│       ├── otp.py                  # OTP generation
│       ├── validators.py           # Custom validators
│       ├── formatters.py           # Data formatters
│       └── helpers.py              # Helper functions
│
├── alembic/                         # Database migrations
│   ├── versions/                   # Migration files
│   ├── env.py                      # Alembic environment
│   └── script.py.mako              # Migration template
│
├── tests/                           # Test suite
│   ├── __init__.py
│   ├── conftest.py                 # Pytest fixtures
│   ├── unit/                       # Unit tests
│   ├── integration/                # Integration tests
│   └── e2e/                        # End-to-end tests
│
├── scripts/                         # Utility scripts
│   ├── init_db.py                  # Initialize database
│   ├── seed_data.py                # Seed test data
│   └── migrate.py                  # Migration helper
│
├── docker/                          # Docker configuration
│   ├── Dockerfile                  # Production image
│   ├── Dockerfile.dev              # Development image
│   └── docker-compose.yml          # Local development
│
├── k8s/                            # Kubernetes manifests
│   ├── deployment.yaml             # App deployment
│   ├── service.yaml                # Service definition
│   ├── ingress.yaml                # Ingress rules
│   ├── configmap.yaml              # Configuration
│   └── secrets.yaml                # Secrets (template)
│
├── .env.example                    # Environment template
├── .gitignore                      # Git ignore rules
├── alembic.ini                     # Alembic configuration
├── pytest.ini                      # Pytest configuration
├── requirements.txt                # Production dependencies
├── requirements-dev.txt            # Development dependencies
└── README.md                       # Backend documentation
```

---

## Database Design

### Database Schema

#### Users & Authentication

```sql
-- users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),  -- NULL for OTP-only auth
    full_name VARCHAR(255),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);

-- otp_codes table
CREATE TABLE otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    purpose VARCHAR(50) NOT NULL,  -- 'login', 'signup', 'reset'
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_otp_email ON otp_codes(email);
CREATE INDEX idx_otp_expires ON otp_codes(expires_at);

-- sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    refresh_token_hash VARCHAR(255) UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    ip_address INET,
    user_agent TEXT,
    last_activity_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

#### Workflows & Agents

```sql
-- workflows table
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft',  -- draft, published, archived
    nodes JSONB NOT NULL DEFAULT '[]',
    connections JSONB NOT NULL DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    parent_workflow_id UUID REFERENCES workflows(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workflows_user ON workflows(user_id);
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflows_tags ON workflows USING GIN(tags);
CREATE INDEX idx_workflows_nodes ON workflows USING GIN(nodes);

-- agents table
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    node_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,  -- agent, trigger, action, logic, integration
    system_prompt TEXT,
    model VARCHAR(100),
    temperature DECIMAL(3,2),
    max_tokens INTEGER,
    tools JSONB DEFAULT '[]',
    permissions JSONB DEFAULT '{}',
    memory_config JSONB DEFAULT '{}',
    sub_agents UUID[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agents_workflow ON agents(workflow_id);
CREATE INDEX idx_agents_user ON agents(user_id);
CREATE INDEX idx_agents_node ON agents(node_id);
CREATE INDEX idx_agents_type ON agents(type);
```

#### Workflow Execution

```sql
-- workflow_executions table
CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',  -- pending, running, completed, failed
    trigger_type VARCHAR(50),
    trigger_data JSONB,
    start_time TIMESTAMP DEFAULT NOW(),
    end_time TIMESTAMP,
    duration_ms INTEGER,
    error_message TEXT,
    execution_log JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_executions_user ON workflow_executions(user_id);
CREATE INDEX idx_executions_status ON workflow_executions(status);
CREATE INDEX idx_executions_start_time ON workflow_executions(start_time DESC);

-- node_executions table
CREATE TABLE node_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    node_id VARCHAR(255) NOT NULL,
    agent_id UUID REFERENCES agents(id),
    status VARCHAR(50) DEFAULT 'pending',
    input_data JSONB,
    output_data JSONB,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_ms INTEGER,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_node_executions_execution ON node_executions(execution_id);
CREATE INDEX idx_node_executions_node ON node_executions(node_id);
CREATE INDEX idx_node_executions_status ON node_executions(status);
```

#### Analytics

```sql
-- analytics_metrics table
CREATE TABLE analytics_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    metric_type VARCHAR(100) NOT NULL,  -- execution_time, success_rate, token_usage, etc.
    metric_value DECIMAL(15,4) NOT NULL,
    dimensions JSONB DEFAULT '{}',
    timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_user ON analytics_metrics(user_id);
CREATE INDEX idx_analytics_workflow ON analytics_metrics(workflow_id);
CREATE INDEX idx_analytics_type ON analytics_metrics(metric_type);
CREATE INDEX idx_analytics_timestamp ON analytics_metrics(timestamp DESC);

-- analytics_aggregates table (pre-calculated)
CREATE TABLE analytics_aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    period VARCHAR(20) NOT NULL,  -- hourly, daily, weekly, monthly
    period_start TIMESTAMP NOT NULL,
    metrics JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, workflow_id, period, period_start)
);

CREATE INDEX idx_aggregates_user_period ON analytics_aggregates(user_id, period, period_start);
CREATE INDEX idx_aggregates_workflow_period ON analytics_aggregates(workflow_id, period, period_start);
```

#### Collaboration

```sql
-- workspaces table
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);

-- workspace_members table
CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,  -- owner, administrator, editor, viewer
    permissions JSONB DEFAULT '{}',
    invited_by UUID REFERENCES users(id),
    joined_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_members_user ON workspace_members(user_id);

-- invitations table
CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    invited_by UUID NOT NULL REFERENCES users(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invitations_workspace ON invitations(workspace_id);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_token ON invitations(token);

-- activity_logs table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_workspace ON activity_logs(workspace_id);
CREATE INDEX idx_activity_user ON activity_logs(user_id);
CREATE INDEX idx_activity_created ON activity_logs(created_at DESC);
```

#### MCP & Tools

```sql
-- mcp_servers table
CREATE TABLE mcp_servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,  -- stdio, sse
    command TEXT,
    args TEXT[],
    env JSONB DEFAULT '{}',
    capabilities JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'disconnected',
    last_connected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mcp_user ON mcp_servers(user_id);
CREATE INDEX idx_mcp_status ON mcp_servers(status);

-- files table
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100),
    storage_provider VARCHAR(50) DEFAULT 's3',
    storage_key TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_files_user ON files(user_id);
CREATE INDEX idx_files_created ON files(created_at DESC);
```

### Database Relationships Diagram

```
users ────┬─── workflows ───┬─── agents
          │                 │
          │                 └─── workflow_executions ─── node_executions
          │
          ├─── analytics_metrics
          ├─── analytics_aggregates
          │
          ├─── workspaces ───┬─── workspace_members
          │                  ├─── invitations
          │                  └─── activity_logs
          │
          ├─── mcp_servers
          ├─── files
          └─── sessions ─── otp_codes
```

---

## API Endpoints

### Authentication API (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/request-otp` | Request OTP code | No |
| POST | `/auth/verify-otp` | Verify OTP and login | No |
| POST | `/auth/refresh` | Refresh access token | Yes (Refresh Token) |
| POST | `/auth/logout` | Logout user | Yes |
| GET | `/auth/me` | Get current user | Yes |
| PATCH | `/auth/me` | Update user profile | Yes |

**Example: Request OTP**
```json
POST /api/v1/auth/request-otp
{
  "email": "user@example.com",
  "purpose": "login"
}

Response 200:
{
  "success": true,
  "message": "OTP sent to email",
  "expires_in": 300
}
```

**Example: Verify OTP**
```json
POST /api/v1/auth/verify-otp
{
  "email": "user@example.com",
  "code": "123456"
}

Response 200:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

### Workflows API (`/api/v1/workflows`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/workflows` | List user workflows | Yes |
| POST | `/workflows` | Create workflow | Yes |
| GET | `/workflows/{id}` | Get workflow details | Yes |
| PUT | `/workflows/{id}` | Update workflow | Yes |
| DELETE | `/workflows/{id}` | Delete workflow | Yes |
| PATCH | `/workflows/{id}/status` | Change workflow status | Yes |
| POST | `/workflows/{id}/duplicate` | Duplicate workflow | Yes |
| GET | `/workflows/{id}/versions` | Get workflow versions | Yes |

**Example: List Workflows**
```json
GET /api/v1/workflows?status=published&limit=10&offset=0

Response 200:
{
  "items": [
    {
      "id": "uuid",
      "name": "Customer Support Agent",
      "description": "Automated customer support workflow",
      "status": "published",
      "nodes": [...],
      "connections": [...],
      "tags": ["customer-support", "automation"],
      "created_at": "2025-11-13T10:00:00Z",
      "updated_at": "2025-11-13T12:00:00Z"
    }
  ],
  "total": 25,
  "limit": 10,
  "offset": 0
}
```

**Example: Create Workflow**
```json
POST /api/v1/workflows
{
  "name": "New Workflow",
  "description": "Description here",
  "nodes": [],
  "connections": [],
  "tags": ["new"]
}

Response 201:
{
  "id": "uuid",
  "name": "New Workflow",
  "status": "draft",
  "created_at": "2025-11-13T10:00:00Z"
}
```

### Agents API (`/api/v1/agents`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/agents` | List agents | Yes |
| POST | `/agents` | Create agent | Yes |
| GET | `/agents/{id}` | Get agent details | Yes |
| PUT | `/agents/{id}` | Update agent | Yes |
| DELETE | `/agents/{id}` | Delete agent | Yes |
| POST | `/agents/{id}/test` | Test agent | Yes |

### Execution API (`/api/v1/executions`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/executions` | Start workflow execution | Yes |
| GET | `/executions` | List executions | Yes |
| GET | `/executions/{id}` | Get execution details | Yes |
| POST | `/executions/{id}/cancel` | Cancel execution | Yes |
| GET | `/executions/{id}/logs` | Get execution logs | Yes |
| GET | `/executions/{id}/nodes` | Get node executions | Yes |

**Example: Start Execution**
```json
POST /api/v1/executions
{
  "workflow_id": "uuid",
  "trigger_type": "manual",
  "trigger_data": {}
}

Response 202:
{
  "id": "execution-uuid",
  "workflow_id": "uuid",
  "status": "pending",
  "created_at": "2025-11-13T10:00:00Z"
}
```

### Analytics API (`/api/v1/analytics`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/analytics/overview` | Get analytics overview | Yes |
| GET | `/analytics/workflows/{id}` | Get workflow analytics | Yes |
| GET | `/analytics/performance` | Get performance metrics | Yes |
| GET | `/analytics/usage` | Get usage statistics | Yes |
| GET | `/analytics/costs` | Get cost analysis | Yes |

### Collaboration API (`/api/v1/collaboration`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/workspaces` | List workspaces | Yes |
| POST | `/workspaces` | Create workspace | Yes |
| GET | `/workspaces/{id}` | Get workspace details | Yes |
| PATCH | `/workspaces/{id}` | Update workspace | Yes |
| DELETE | `/workspaces/{id}` | Delete workspace | Yes |
| GET | `/workspaces/{id}/members` | List members | Yes |
| POST | `/workspaces/{id}/invite` | Invite member | Yes |
| DELETE | `/workspaces/{id}/members/{user_id}` | Remove member | Yes |
| GET | `/invitations` | List invitations | Yes |
| POST | `/invitations/{token}/accept` | Accept invitation | Yes |
| GET | `/activity` | Get activity logs | Yes |

### MCP API (`/api/v1/mcp`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/mcp/servers` | List MCP servers | Yes |
| POST | `/mcp/servers` | Create MCP server | Yes |
| GET | `/mcp/servers/{id}` | Get server details | Yes |
| PUT | `/mcp/servers/{id}` | Update server | Yes |
| DELETE | `/mcp/servers/{id}` | Delete server | Yes |
| POST | `/mcp/servers/{id}/connect` | Connect to server | Yes |
| POST | `/mcp/servers/{id}/disconnect` | Disconnect server | Yes |
| GET | `/mcp/servers/{id}/tools` | List server tools | Yes |

### Tools API (`/api/v1/tools`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/tools/ai/chat` | Claude chat completion | Yes |
| POST | `/tools/ai/image` | Generate image | Yes |
| POST | `/tools/web/search` | Web search | Yes |
| POST | `/tools/web/read` | Read web content | Yes |
| POST | `/tools/files/upload` | Upload file | Yes |
| GET | `/tools/files/{id}` | Get file | Yes |
| DELETE | `/tools/files/{id}` | Delete file | Yes |

### WebSocket API (`/api/v1/ws`)

| Endpoint | Description | Auth Required |
|----------|-------------|---------------|
| `/ws/executions/{id}` | Real-time execution updates | Yes |
| `/ws/analytics` | Real-time analytics stream | Yes |
| `/ws/collaboration/{workspace_id}` | Collaboration events | Yes |

---

## Authentication & Authorization

### JWT Authentication Flow

```
┌──────────┐                     ┌──────────┐                    ┌──────────┐
│          │  1. Request OTP     │          │                    │          │
│  Client  │────────────────────>│  FastAPI │                    │  Email   │
│          │                     │          │──── Send OTP ─────>│  Service │
│          │  2. OTP Sent (200)  │          │                    │          │
│          │<────────────────────│          │                    └──────────┘
│          │                     │          │
│          │  3. Verify OTP      │          │
│          │────────────────────>│          │
│          │                     │          │──┐
│          │                     │          │  │ Validate OTP
│          │                     │          │<─┘ Generate JWT
│          │                     │          │
│          │  4. JWT Tokens      │          │
│          │<────────────────────│          │
│          │                     │          │
│          │  5. API Request     │          │
│          │    + Bearer Token   │          │
│          │────────────────────>│          │──┐
│          │                     │          │  │ Verify JWT
│          │                     │          │<─┘ Check permissions
│          │  6. Response        │          │
│          │<────────────────────│          │
└──────────┘                     └──────────┘
```

### Token Structure

**Access Token** (15-minute expiry):
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "type": "access",
  "exp": 1699876543,
  "iat": 1699875643,
  "jti": "token-uuid"
}
```

**Refresh Token** (7-day expiry):
```json
{
  "sub": "user-uuid",
  "type": "refresh",
  "exp": 1700481443,
  "iat": 1699875643,
  "jti": "token-uuid"
}
```

### Role-Based Access Control (RBAC)

#### Workspace Roles

| Role | Permissions |
|------|-------------|
| **Owner** | Full access: manage workspace, members, workflows, delete workspace |
| **Administrator** | Manage workflows, members, settings (cannot delete workspace) |
| **Editor** | Create/edit/execute workflows (cannot manage members) |
| **Viewer** | View workflows and executions only (read-only) |

#### Permission Matrix

| Action | Owner | Admin | Editor | Viewer |
|--------|-------|-------|--------|--------|
| View workflows | ✅ | ✅ | ✅ | ✅ |
| Create workflows | ✅ | ✅ | ✅ | ❌ |
| Edit workflows | ✅ | ✅ | ✅ | ❌ |
| Delete workflows | ✅ | ✅ | ✅ | ❌ |
| Execute workflows | ✅ | ✅ | ✅ | ❌ |
| View analytics | ✅ | ✅ | ✅ | ✅ |
| Invite members | ✅ | ✅ | ❌ | ❌ |
| Remove members | ✅ | ✅ | ❌ | ❌ |
| Change roles | ✅ | ✅ | ❌ | ❌ |
| Workspace settings | ✅ | ✅ | ❌ | ❌ |
| Delete workspace | ✅ | ❌ | ❌ | ❌ |

### Security Implementation

#### Password Hashing
```python
# Use Argon2id (recommended) or bcrypt
from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
    argon2__memory_cost=65536,
    argon2__time_cost=3,
    argon2__parallelism=4
)
```

#### Rate Limiting
```python
# Per endpoint rate limits
/auth/request-otp: 5 requests / 15 minutes per IP
/auth/verify-otp: 10 requests / 15 minutes per IP
/api/*: 1000 requests / hour per user
/tools/ai/*: 100 requests / hour per user
```

---

## Workflow Execution Engine

### Execution Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Endpoint                          │
│                  POST /executions                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Create execution record
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Celery Task Queue                          │
│               (execute_workflow.delay())                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Async execution
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Celery Worker                              │
│                                                              │
│  1. Load workflow definition                                │
│  2. Build execution graph (DAG)                             │
│  3. Topological sort for execution order                    │
│  4. Execute nodes in order:                                 │
│     ┌──────────────────────────────────────┐              │
│     │  For each node:                       │              │
│     │  - Validate inputs                    │              │
│     │  - Execute node logic                 │              │
│     │  - Update status (WebSocket)          │              │
│     │  - Store results                      │              │
│     │  - Handle errors                      │              │
│     │  - Pass outputs to next nodes         │              │
│     └──────────────────────────────────────┘              │
│  5. Complete execution                                      │
│  6. Calculate metrics                                       │
│  7. Send notifications                                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ Real-time updates
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               WebSocket Connections                          │
│           (Push status to connected clients)                 │
└─────────────────────────────────────────────────────────────┘
```

### Node Execution Logic

#### Node Types & Execution

1. **Trigger Nodes**
   - Manual trigger
   - Scheduled trigger (cron)
   - Webhook trigger
   - Event trigger

2. **Agent Nodes**
   - Load agent configuration
   - Prepare system prompt + context
   - Call Claude AI API
   - Process response
   - Extract outputs

3. **Action Nodes**
   - API calls
   - Database operations
   - File operations
   - External integrations

4. **Logic Nodes**
   - Conditional branching (if/else)
   - Loops (for/while)
   - Data transformation
   - Variable assignment

5. **Integration Nodes**
   - MCP server calls
   - Third-party service integration
   - Custom tool execution

### Error Handling & Retries

```python
# Retry configuration
MAX_RETRIES = 3
RETRY_DELAY = [5, 30, 120]  # seconds (exponential backoff)

# Error types
- TransientError: Retry automatically
- PermanentError: Fail immediately
- ValidationError: Fail with details
```

### Execution States

```
pending → running → completed
                 → failed
                 → cancelled
```

---

## Real-time Features

### WebSocket Implementation

#### Connection Management
```python
# WebSocket endpoint
@router.websocket("/ws/executions/{execution_id}")
async def execution_websocket(
    websocket: WebSocket,
    execution_id: str,
    current_user: User = Depends(get_current_user_ws)
):
    await websocket.accept()

    # Subscribe to Redis pub/sub channel
    channel = f"execution:{execution_id}"

    # Send updates to client
    async for message in redis.subscribe(channel):
        await websocket.send_json(message)
```

#### Message Format
```json
{
  "type": "node_status",
  "execution_id": "uuid",
  "node_id": "node-1",
  "status": "running",
  "timestamp": "2025-11-13T10:00:00Z",
  "data": {
    "progress": 50,
    "message": "Processing..."
  }
}
```

### Redis Pub/Sub

```python
# Publish execution update
await redis.publish(
    f"execution:{execution_id}",
    json.dumps({
        "type": "status_change",
        "status": "completed",
        "timestamp": datetime.utcnow().isoformat()
    })
)
```

---

## External Integrations

### Claude AI Integration

```python
# app/integrations/claude.py
from anthropic import Anthropic

class ClaudeClient:
    def __init__(self, api_key: str):
        self.client = Anthropic(api_key=api_key)

    async def chat_completion(
        self,
        messages: List[dict],
        model: str = "claude-3-5-sonnet-20241022",
        max_tokens: int = 4096,
        temperature: float = 0.7,
        system: str = None
    ) -> dict:
        response = await self.client.messages.create(
            model=model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system,
            messages=messages
        )
        return response
```

### Image Generation Integration

```python
# Multiple providers
- Default: DALL-E 3 / Stability AI
- Alternative: Google Gemini 2.5 Imagen
```

### Web Search Integration (Jina SERP)

```python
# app/integrations/web_search.py
async def search_web(query: str, num_results: int = 10) -> List[dict]:
    url = "https://s.jina.ai"
    params = {"q": query, "num": num_results}
    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params)
        return response.json()
```

### File Storage Integration (S3)

```python
# app/integrations/storage.py
import boto3

class S3Storage:
    def __init__(self):
        self.s3 = boto3.client('s3')
        self.bucket = settings.S3_BUCKET

    async def upload_file(
        self,
        file: UploadFile,
        key: str
    ) -> str:
        await self.s3.upload_fileobj(
            file.file,
            self.bucket,
            key
        )
        return f"s3://{self.bucket}/{key}"
```

---

## Security Implementation

### Security Checklist

#### Authentication Security
- ✅ JWT with short expiry (15 min access, 7 day refresh)
- ✅ Secure token storage (httpOnly cookies or secure storage)
- ✅ OTP rate limiting (5 requests per 15 min)
- ✅ OTP expiry (5 minutes)
- ✅ Session invalidation on logout
- ✅ Concurrent session limit (optional)

#### API Security
- ✅ HTTPS only (TLS 1.3)
- ✅ CORS configuration (whitelist domains)
- ✅ CSRF protection (for cookie-based auth)
- ✅ Rate limiting (per user/IP)
- ✅ Request size limits (10MB default)
- ✅ Input validation (Pydantic)
- ✅ SQL injection prevention (ORM parameterized queries)
- ✅ XSS prevention (content escaping)

#### Data Security
- ✅ Encryption at rest (database-level)
- ✅ Encryption in transit (TLS)
- ✅ Sensitive data masking in logs
- ✅ Secure credential storage (Vault/Secrets Manager)
- ✅ PII data handling (GDPR compliance)

#### Infrastructure Security
- ✅ Network isolation (VPC)
- ✅ Firewall rules (security groups)
- ✅ DDoS protection (CloudFlare/AWS Shield)
- ✅ Regular security updates
- ✅ Vulnerability scanning
- ✅ Penetration testing

### Security Headers

```python
# app/middleware/security_headers.py
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response
```

---

## Performance & Scalability

### Performance Targets

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| API Response Time (p50) | < 50ms | 100ms |
| API Response Time (p95) | < 100ms | 200ms |
| API Response Time (p99) | < 200ms | 500ms |
| Database Query Time | < 10ms | 50ms |
| Workflow Execution Start | < 1s | 3s |
| Concurrent Users | 10,000+ | - |
| Requests per Second | 5,000+ | - |
| WebSocket Connections | 5,000+ | - |
| Uptime | 99.9% | 99.5% |

### Optimization Strategies

#### Database Optimization
```python
# Indexing strategy
- Primary keys: UUID with GIN index
- Foreign keys: B-tree indexes
- JSONB columns: GIN indexes for queries
- Timestamp columns: B-tree indexes for sorting

# Query optimization
- Use select_related() for joins
- Implement pagination (limit/offset)
- Cache frequent queries (Redis)
- Read replicas for read-heavy operations
- Connection pooling (50 connections)
```

#### Caching Strategy
```python
# Redis caching layers
1. Session cache (TTL: 15 min)
2. User data cache (TTL: 5 min)
3. Workflow definition cache (TTL: 30 min)
4. Analytics cache (TTL: 1 hour)
5. Static content cache (TTL: 24 hours)

# Cache invalidation
- On data update: Clear specific keys
- On workflow edit: Clear workflow cache
- On user update: Clear user cache
```

#### Async Processing
```python
# Celery queues
- high_priority: Critical tasks (execution start)
- default: Normal tasks (analytics calculation)
- low_priority: Batch operations (cleanup)

# Worker scaling
- Auto-scale workers based on queue length
- Separate workers for different task types
```

### Horizontal Scaling

```
┌─────────────────────────────────────────────┐
│         Load Balancer (NGINX)                │
│      (Round-robin / Least connections)       │
└──────────────┬──────────────────────────────┘
               │
     ┌─────────┼─────────┐
     │         │         │
┌────▼───┐ ┌──▼────┐ ┌──▼────┐
│FastAPI │ │FastAPI│ │FastAPI│
│Pod 1   │ │Pod 2  │ │Pod N  │
└────┬───┘ └───┬───┘ └───┬───┘
     │         │         │
     └─────────┼─────────┘
               │
      ┌────────┼────────┐
      │        │        │
┌─────▼──┐ ┌──▼───┐ ┌──▼──────┐
│PostgreSQL Redis  │ Celery   │
│ Cluster│         │ Workers  │
└────────┘ └───────┘ └─────────┘
```

---

## Monitoring & Observability

### Logging Strategy

#### Log Levels
```python
DEBUG: Development debugging
INFO: General informational messages
WARNING: Warning messages (rate limit approaching)
ERROR: Error messages (execution failed)
CRITICAL: Critical errors (database down)
```

#### Structured Logging
```json
{
  "timestamp": "2025-11-13T10:00:00Z",
  "level": "INFO",
  "logger": "app.services.execution",
  "message": "Workflow execution started",
  "context": {
    "user_id": "uuid",
    "workflow_id": "uuid",
    "execution_id": "uuid",
    "ip_address": "192.168.1.1"
  },
  "trace_id": "trace-uuid",
  "span_id": "span-uuid"
}
```

### Metrics Collection

#### Application Metrics (Prometheus)
```python
# Request metrics
http_requests_total
http_request_duration_seconds
http_request_size_bytes

# Workflow metrics
workflow_executions_total
workflow_execution_duration_seconds
workflow_execution_status

# Database metrics
db_connections_active
db_query_duration_seconds
db_query_errors_total

# Celery metrics
celery_tasks_total
celery_task_duration_seconds
celery_queue_length
```

#### Business Metrics
```python
# User metrics
active_users_total
new_users_daily
user_retention_rate

# Workflow metrics
workflows_created_daily
workflows_executed_daily
average_execution_time

# AI metrics
ai_api_calls_total
ai_tokens_consumed_total
ai_api_errors_total
```

### Alerting Rules

```yaml
# Prometheus alerting rules
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
  for: 5m
  annotations:
    summary: "High error rate detected"

- alert: SlowAPIResponses
  expr: histogram_quantile(0.95, http_request_duration_seconds) > 0.5
  for: 10m
  annotations:
    summary: "API response time degraded"

- alert: DatabaseConnectionPoolExhausted
  expr: db_connections_active / db_connections_max > 0.9
  for: 5m
  annotations:
    summary: "Database connection pool near limit"

- alert: CeleryQueueBacklog
  expr: celery_queue_length > 1000
  for: 10m
  annotations:
    summary: "Celery queue has large backlog"
```

### Distributed Tracing

```python
# OpenTelemetry integration
from opentelemetry import trace
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

# Auto-instrument FastAPI
FastAPIInstrumentor.instrument_app(app)

# Custom spans
tracer = trace.get_tracer(__name__)

async def execute_workflow(workflow_id: str):
    with tracer.start_as_current_span("workflow_execution"):
        span = trace.get_current_span()
        span.set_attribute("workflow.id", workflow_id)
        # ... execution logic
```

---

## Testing Strategy

### Test Pyramid

```
        ┌────────────────┐
        │   E2E Tests    │  10%
        │   (Playwright) │
        └────────────────┘
       ┌──────────────────┐
       │Integration Tests │  30%
       │    (Pytest)      │
       └──────────────────┘
     ┌──────────────────────┐
     │    Unit Tests        │  60%
     │    (Pytest)          │
     └──────────────────────┘
```

### Unit Tests

```python
# tests/unit/test_services/test_workflow_service.py
import pytest
from app.services.workflow_service import WorkflowService

@pytest.mark.asyncio
async def test_create_workflow(db_session, test_user):
    service = WorkflowService(db_session)

    workflow_data = {
        "name": "Test Workflow",
        "description": "Test",
        "nodes": [],
        "connections": []
    }

    workflow = await service.create_workflow(
        user_id=test_user.id,
        data=workflow_data
    )

    assert workflow.name == "Test Workflow"
    assert workflow.status == "draft"

# Coverage target: 80%+
```

### Integration Tests

```python
# tests/integration/test_api/test_workflows.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_workflow_crud_flow(client: AsyncClient, auth_headers):
    # Create
    response = await client.post(
        "/api/v1/workflows",
        json={"name": "Test Workflow"},
        headers=auth_headers
    )
    assert response.status_code == 201
    workflow_id = response.json()["id"]

    # Read
    response = await client.get(
        f"/api/v1/workflows/{workflow_id}",
        headers=auth_headers
    )
    assert response.status_code == 200

    # Update
    response = await client.put(
        f"/api/v1/workflows/{workflow_id}",
        json={"name": "Updated Workflow"},
        headers=auth_headers
    )
    assert response.status_code == 200

    # Delete
    response = await client.delete(
        f"/api/v1/workflows/{workflow_id}",
        headers=auth_headers
    )
    assert response.status_code == 204
```

### End-to-End Tests

```python
# tests/e2e/test_workflow_execution.py
import pytest
from playwright.async_api import async_playwright

@pytest.mark.e2e
async def test_complete_workflow_execution():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Login
        await page.goto("http://localhost:5173")
        await page.fill("#email", "test@example.com")
        await page.click("#request-otp")
        # ... OTP verification

        # Create workflow
        await page.click("#create-workflow")
        # ... workflow creation

        # Execute workflow
        await page.click("#execute-workflow")

        # Verify execution
        await page.wait_for_selector(".execution-status")
        status = await page.text_content(".execution-status")
        assert status == "completed"
```

### Load Testing

```python
# Load testing with Locust
from locust import HttpUser, task, between

class WorkflowUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        # Login
        response = self.client.post("/api/v1/auth/verify-otp", json={
            "email": "test@example.com",
            "code": "123456"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}

    @task(3)
    def list_workflows(self):
        self.client.get("/api/v1/workflows", headers=self.headers)

    @task(1)
    def execute_workflow(self):
        self.client.post(
            "/api/v1/executions",
            json={"workflow_id": "test-uuid"},
            headers=self.headers
        )

# Run: locust -f tests/load/test_workflows.py --users 1000 --spawn-rate 10
```

---

## Deployment Strategy

### Docker Configuration

#### Dockerfile (Production)
```dockerfile
# backend/docker/Dockerfile
FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini .

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

#### Docker Compose (Development)
```yaml
# docker/docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: claude_orchestration
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  backend:
    build:
      context: ../
      dockerfile: docker/Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/claude_orchestration
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
      - CLAUDE_API_KEY=${CLAUDE_API_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ../app:/app/app
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  celery_worker:
    build:
      context: ../
      dockerfile: docker/Dockerfile
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/claude_orchestration
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
      - CLAUDE_API_KEY=${CLAUDE_API_KEY}
    depends_on:
      - postgres
      - redis
    command: celery -A app.workers.celery_app worker --loglevel=info

  celery_beat:
    build:
      context: ../
      dockerfile: docker/Dockerfile
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/claude_orchestration
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis
    command: celery -A app.workers.celery_app beat --loglevel=info

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes Deployment

#### Deployment Manifest
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fastapi-backend
  labels:
    app: fastapi-backend
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: fastapi-backend
  template:
    metadata:
      labels:
        app: fastapi-backend
    spec:
      containers:
      - name: fastapi
        image: your-registry/fastapi-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: backend-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: backend-secrets
              key: redis-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
```

#### Service & Ingress
```yaml
# k8s/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: fastapi-backend-service
spec:
  selector:
    app: fastapi-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: ClusterIP
---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: fastapi-backend-ingress
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - api.your-domain.com
    secretName: api-tls-secret
  rules:
  - host: api.your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: fastapi-backend-service
            port:
              number: 80
```

### CI/CD Pipeline

#### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy Backend

on:
  push:
    branches: [main, staging]
    paths:
      - 'backend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements-dev.txt

      - name: Run tests
        run: |
          cd backend
          pytest --cov=app --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          file: ./backend/docker/Dockerfile
          push: true
          tags: |
            ghcr.io/${{ github.repository }}/backend:${{ github.sha }}
            ghcr.io/${{ github.repository }}/backend:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/fastapi-backend \
            fastapi=ghcr.io/${{ github.repository }}/backend:${{ github.sha }}
          kubectl rollout status deployment/fastapi-backend
```

### Environment Configuration

```bash
# .env.production
# Application
APP_NAME=Claude Agent Orchestration Studio
APP_ENV=production
DEBUG=false
LOG_LEVEL=INFO

# Server
HOST=0.0.0.0
PORT=8000
WORKERS=4

# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/db
DATABASE_POOL_SIZE=50
DATABASE_MAX_OVERFLOW=10

# Redis
REDIS_URL=redis://redis:6379/0
REDIS_POOL_SIZE=50

# Security
SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=["https://your-frontend.com"]

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60

# AI Services
CLAUDE_API_KEY=your-claude-api-key
DEFAULT_AI_MODEL=claude-3-5-sonnet-20241022

# Email
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=noreply@your-domain.com

# File Storage
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1

# Monitoring
SENTRY_DSN=your-sentry-dsn
PROMETHEUS_PORT=9090

# Celery
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

#### Week 1: Project Setup & Core Infrastructure
- ✅ Initialize FastAPI project structure
- ✅ Set up PostgreSQL database
- ✅ Configure SQLAlchemy ORM
- ✅ Create Alembic migrations
- ✅ Set up Redis connection
- ✅ Configure development environment
- ✅ Set up Docker development environment
- ✅ Initialize Git repository on feature branch

**Deliverables**:
- Working development environment
- Database schema migrations
- Docker Compose setup
- Basic FastAPI app running

#### Week 2: Authentication System
- ✅ Implement User model
- ✅ Build OTP generation & validation
- ✅ Create JWT token system
- ✅ Build authentication endpoints
- ✅ Implement rate limiting
- ✅ Add session management
- ✅ Write unit tests for auth

**Deliverables**:
- Complete authentication system
- OTP email delivery
- JWT token refresh flow
- Test coverage >80%

---

### Phase 2: Core Features (Weeks 3-5)

#### Week 3: Workflow & Agent Management
- ✅ Implement Workflow CRUD endpoints
- ✅ Implement Agent CRUD endpoints
- ✅ Build workflow validation logic
- ✅ Create node/connection management
- ✅ Implement workflow versioning
- ✅ Add tagging and search
- ✅ Write integration tests

**Deliverables**:
- Complete workflow API
- Agent management API
- Frontend integration ready
- Test coverage >75%

#### Week 4: Workflow Execution Engine
- ✅ Set up Celery workers
- ✅ Build execution orchestration
- ✅ Implement node execution logic
- ✅ Create DAG resolver
- ✅ Build error handling & retries
- ✅ Implement execution logging
- ✅ Create WebSocket notifications

**Deliverables**:
- Working execution engine
- Real-time status updates
- Error recovery mechanisms
- Execution history tracking

#### Week 5: AI Integrations
- ✅ Integrate Claude AI SDK
- ✅ Build AI service abstraction
- ✅ Implement image generation
- ✅ Add web search integration
- ✅ Create web reading service
- ✅ Build tool ecosystem endpoints
- ✅ Add usage tracking

**Deliverables**:
- All AI tools functional
- Tool usage limits enforced
- Cost tracking implemented
- Integration tests complete

---

### Phase 3: Advanced Features (Weeks 6-8)

#### Week 6: Analytics System
- ✅ Implement metrics collection
- ✅ Build analytics calculation service
- ✅ Create analytics aggregation (Celery tasks)
- ✅ Build analytics API endpoints
- ✅ Implement real-time metrics
- ✅ Add caching layer
- ✅ Create dashboard data endpoints

**Deliverables**:
- Complete analytics API
- Pre-aggregated metrics
- Real-time performance data
- Cached analytics queries

#### Week 7: Collaboration Features
- ✅ Implement Workspace model
- ✅ Build team management
- ✅ Create invitation system
- ✅ Implement RBAC
- ✅ Add activity logging
- ✅ Build permission checks
- ✅ Create collaboration API

**Deliverables**:
- Multi-user workspaces
- Role-based access control
- Invitation flow working
- Activity tracking complete

#### Week 8: MCP Integration
- ✅ Implement MCP server management
- ✅ Build MCP connection handling
- ✅ Create MCP tool discovery
- ✅ Integrate MCP with execution engine
- ✅ Add MCP server templates
- ✅ Implement MCP API endpoints
- ✅ Write MCP integration tests

**Deliverables**:
- MCP integration complete
- Server management UI ready
- Tool discovery functional
- Template library created

---

### Phase 4: Production Readiness (Weeks 9-11)

#### Week 9: Security & Performance
- ✅ Implement comprehensive rate limiting
- ✅ Add input validation & sanitization
- ✅ Set up CORS properly
- ✅ Implement security headers
- ✅ Add request/response logging
- ✅ Optimize database queries
- ✅ Implement caching strategy
- ✅ Add database connection pooling
- ✅ Run security audit

**Deliverables**:
- Security hardening complete
- Performance optimizations done
- Query optimization applied
- Security audit passed

#### Week 10: Monitoring & Testing
- ✅ Set up Prometheus metrics
- ✅ Configure Grafana dashboards
- ✅ Implement distributed tracing
- ✅ Set up error tracking (Sentry)
- ✅ Create alerting rules
- ✅ Write E2E tests
- ✅ Run load tests
- ✅ Achieve >80% code coverage

**Deliverables**:
- Monitoring stack deployed
- Alerting configured
- E2E test suite complete
- Load testing results documented

#### Week 11: Deployment & Documentation
- ✅ Create Kubernetes manifests
- ✅ Set up CI/CD pipeline
- ✅ Configure production environment
- ✅ Run staging deployment
- ✅ Write API documentation
- ✅ Create deployment guide
- ✅ Perform final testing
- ✅ Deploy to production

**Deliverables**:
- Production deployment complete
- API documentation published
- Runbooks created
- System fully operational

---

### Phase 5: Post-Launch (Week 12+)

#### Ongoing Tasks
- Monitor system performance
- Fix bugs and issues
- Optimize based on metrics
- Add feature enhancements
- Scale infrastructure as needed
- Regular security updates
- User feedback implementation

---

## Success Metrics

### Technical Metrics
- ✅ API response time < 100ms (p95)
- ✅ 99.9% uptime
- ✅ < 0.1% error rate
- ✅ 80%+ test coverage
- ✅ 10,000+ concurrent users supported

### Business Metrics
- ✅ 100% feature parity with DevvAI backend
- ✅ Frontend fully migrated (no DevvAI dependencies)
- ✅ Production deployment successful
- ✅ Zero security vulnerabilities
- ✅ User satisfaction maintained

---

## Risk Management

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Database performance issues | Medium | High | Database optimization, read replicas, query monitoring |
| Workflow execution failures | Medium | High | Comprehensive error handling, retries, monitoring |
| AI API rate limits | High | Medium | Rate limiting, queueing, fallback providers |
| WebSocket scaling issues | Medium | Medium | Redis pub/sub, horizontal scaling |
| Security vulnerabilities | Low | Critical | Security audits, penetration testing, code reviews |

### Operational Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Deployment failures | Low | High | Automated rollback, canary deployments, staging env |
| Data loss | Very Low | Critical | Regular backups, point-in-time recovery, replicas |
| Service outages | Low | High | Health checks, auto-scaling, multi-AZ deployment |
| Cost overruns | Medium | Medium | Cost monitoring, alerts, resource optimization |

---

## Appendix

### Technology Decisions Rationale

**Why FastAPI?**
- High performance (comparable to Node.js and Go)
- Automatic API documentation (OpenAPI)
- Built-in async support
- Type hints and validation (Pydantic)
- Modern Python features
- Large ecosystem

**Why PostgreSQL?**
- ACID compliance
- JSON support (JSONB)
- Advanced indexing
- Mature and stable
- Great performance
- Excellent ORM support

**Why Redis?**
- Fast in-memory storage
- Pub/sub capabilities
- Session storage
- Caching layer
- Celery broker support
- WebSocket scaling

**Why Celery?**
- Mature task queue
- Multiple broker support
- Distributed execution
- Task scheduling
- Retry mechanisms
- Monitoring tools

---

## Conclusion

This production-level FastAPI backend plan provides a comprehensive roadmap for replacing the DevvAI backend with a custom, scalable, and production-ready solution. The implementation follows industry best practices for security, performance, monitoring, and deployment.

### Key Highlights
- ✅ Enterprise-grade architecture
- ✅ Comprehensive security implementation
- ✅ Real-time workflow execution
- ✅ Advanced monitoring & observability
- ✅ Horizontal scalability
- ✅ 11-week implementation timeline
- ✅ Complete test coverage
- ✅ Production deployment strategy

### Next Steps
1. Review and approve this plan
2. Set up development environment
3. Begin Phase 1 implementation
4. Regular progress reviews
5. Iterative deployment to staging
6. Final production deployment

---

**Document Version**: 1.0
**Last Updated**: 2025-11-13
**Author**: Claude (Sonnet 4.5)
**Status**: Ready for Implementation
