# Claude Agent Orchestration Studio - Backend

> Production-grade FastAPI backend for AI agent orchestration and workflow automation

## 🎯 Overview

This is a high-performance, scalable FastAPI backend that powers the Claude Agent Orchestration Studio. It provides REST APIs, real-time WebSocket communication, and asynchronous workflow execution using Celery.

### Key Features

- ⚡ **High Performance**: FastAPI with async/await support
- 🔐 **Secure Authentication**: JWT tokens with OTP email verification
- 📊 **Real-time Updates**: WebSocket support for live workflow execution
- 🎭 **Workflow Engine**: Celery-based async task execution
- 📈 **Analytics System**: Comprehensive metrics and performance tracking
- 👥 **Multi-user Collaboration**: Role-based access control (RBAC)
- 🤖 **AI Integration**: Claude AI, image generation, web search
- 🔧 **MCP Support**: Model Context Protocol integration
- 📦 **Production Ready**: Docker, Kubernetes, monitoring, testing

---

## 🏗️ Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | FastAPI 0.109+ | High-performance async web framework |
| Language | Python 3.11+ | Modern Python with type hints |
| Database | PostgreSQL 15+ | Primary data store |
| ORM | SQLAlchemy 2.0+ | Database abstraction |
| Cache | Redis 7.2+ | Caching, sessions, pub/sub |
| Task Queue | Celery 5.3+ | Async workflow execution |
| AI | Anthropic Claude SDK | AI agent capabilities |
| Monitoring | Prometheus + Grafana | Performance monitoring |

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- Python 3.11 or higher
- PostgreSQL 15 or higher
- Redis 7.2 or higher
- Docker & Docker Compose (optional but recommended)
- Git

---

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

The easiest way to get started is using Docker Compose:

```bash
# 1. Clone the repository
git clone <repo-url>
cd Claude-Agent-Orchestration-Studio/backend

# 2. Copy environment file
cp .env.example .env

# 3. Edit .env with your API keys
nano .env  # or use your favorite editor

# 4. Start all services
docker-compose -f docker/docker-compose.yml up -d

# 5. Check status
docker-compose -f docker/docker-compose.yml ps

# 6. View logs
docker-compose -f docker/docker-compose.yml logs -f backend

# 7. Access the API
# http://localhost:8000
# API Docs: http://localhost:8000/docs
# Celery Monitor: http://localhost:5555
```

That's it! The backend is now running with PostgreSQL, Redis, Celery workers, and all dependencies.

### Option 2: Local Development

For local development without Docker:

```bash
# 1. Clone the repository
git clone <repo-url>
cd Claude-Agent-Orchestration-Studio/backend

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements-dev.txt

# 4. Copy environment file
cp .env.example .env

# 5. Edit .env with your configuration
nano .env

# 6. Start PostgreSQL and Redis (in separate terminals or use system services)
# PostgreSQL: pg_ctl start
# Redis: redis-server

# 7. Run database migrations
alembic upgrade head

# 8. Start the development server
uvicorn app.main:app --reload

# 9. In another terminal, start Celery worker
celery -A app.workers.celery_app worker --loglevel=info

# 10. Access the API
# http://localhost:8000
# API Docs: http://localhost:8000/docs
```

---

## 🔧 Configuration

### Environment Variables

All configuration is done through environment variables. Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

### Required Configuration

**Database**:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

**Redis**:
```env
REDIS_URL=redis://localhost:6379/0
```

**Security** (generate with `openssl rand -hex 32`):
```env
SECRET_KEY=your-super-secret-key-here
```

**Claude AI**:
```env
CLAUDE_API_KEY=your-claude-api-key
```

**Email** (SendGrid):
```env
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

### Optional Configuration

See `.env.example` for all available configuration options.

---

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI application entry point
│   ├── config.py               # Configuration management
│   ├── dependencies.py         # Dependency injection
│   ├── api/
│   │   └── v1/                # API version 1 routes
│   │       ├── auth.py         # Authentication endpoints
│   │       ├── workflows.py    # Workflow endpoints
│   │       ├── agents.py       # Agent endpoints
│   │       ├── execution.py    # Execution endpoints
│   │       └── ...
│   ├── core/                   # Core functionality
│   │   ├── security.py         # Security utilities
│   │   ├── auth.py             # Auth logic
│   │   ├── cache.py            # Redis cache manager
│   │   └── logging.py          # Logging configuration
│   ├── models/                 # SQLAlchemy models
│   │   ├── user.py
│   │   ├── workflow.py
│   │   ├── agent.py
│   │   └── ...
│   ├── schemas/                # Pydantic schemas
│   │   ├── user.py
│   │   ├── workflow.py
│   │   └── ...
│   ├── services/               # Business logic
│   │   ├── auth_service.py
│   │   ├── workflow_service.py
│   │   └── ...
│   ├── workers/                # Celery tasks
│   │   ├── celery_app.py
│   │   └── workflow_tasks.py
│   ├── db/                     # Database utilities
│   │   ├── session.py
│   │   └── base.py
│   ├── integrations/           # External integrations
│   │   ├── claude.py
│   │   ├── web_search.py
│   │   └── ...
│   └── middleware/             # Custom middleware
│       ├── error_handler.py
│       └── request_logger.py
├── alembic/                    # Database migrations
│   ├── versions/
│   └── env.py
├── tests/                      # Test suite
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docker/                     # Docker configuration
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── docker-compose.yml
├── requirements.txt            # Production dependencies
├── requirements-dev.txt        # Development dependencies
├── alembic.ini                # Alembic configuration
├── pytest.ini                 # Pytest configuration
└── README.md                  # This file
```

---

## 🗄️ Database Setup

### Using Alembic Migrations

```bash
# Generate a new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current version
alembic current

# Show migration history
alembic history
```

### Database Schema

The application uses the following main tables:

- `users` - User accounts and authentication
- `otp_codes` - OTP verification codes
- `sessions` - User sessions (JWT tokens)
- `workflows` - Workflow definitions
- `agents` - Agent configurations
- `workflow_executions` - Execution history
- `node_executions` - Node-level execution details
- `analytics_metrics` - Performance metrics
- `workspaces` - Team workspaces
- `workspace_members` - Team membership
- `invitations` - Team invitations
- `activity_logs` - Activity tracking
- `mcp_servers` - MCP server configurations
- `files` - File metadata

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/unit/test_config.py

# Run specific test
pytest tests/unit/test_config.py::test_settings_loaded

# Run tests by marker
pytest -m unit          # Unit tests only
pytest -m integration   # Integration tests only
pytest -m e2e          # End-to-end tests only

# Run tests in parallel
pytest -n auto
```

### Test Structure

- `tests/unit/` - Unit tests (fast, isolated)
- `tests/integration/` - Integration tests (database, APIs)
- `tests/e2e/` - End-to-end tests (full workflow)

### Test Coverage

Target: **80%+ code coverage**

```bash
# Generate coverage report
pytest --cov=app --cov-report=html

# View HTML report
open htmlcov/index.html
```

---

## 🔒 Security

### Authentication Flow

1. User requests OTP via email
2. System sends 6-digit OTP code (5-minute expiry)
3. User verifies OTP
4. System issues JWT access token (15 min) and refresh token (7 days)
5. Client uses access token for API requests
6. Client refreshes token when expired

### Security Features

- ✅ JWT authentication with short expiry
- ✅ OTP-based email verification
- ✅ Rate limiting (5 OTP requests per 15 min)
- ✅ Password hashing with Argon2
- ✅ HTTPS only (TLS 1.3)
- ✅ CORS configuration
- ✅ SQL injection prevention (ORM)
- ✅ XSS protection
- ✅ Security headers
- ✅ Input validation (Pydantic)

### API Rate Limits

- OTP requests: 5 per 15 minutes
- OTP verification: 10 per 15 minutes
- General API: 1000 requests per hour
- AI tools: 100 requests per hour

---

## 📊 API Documentation

### Interactive API Docs

When running in development mode, access interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

### API Endpoints

#### Authentication
- `POST /api/v1/auth/request-otp` - Request OTP code
- `POST /api/v1/auth/verify-otp` - Verify OTP and login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user
- `PATCH /api/v1/auth/me` - Update user profile

#### Workflows
- `GET /api/v1/workflows` - List workflows
- `POST /api/v1/workflows` - Create workflow
- `GET /api/v1/workflows/{id}` - Get workflow
- `PUT /api/v1/workflows/{id}` - Update workflow
- `DELETE /api/v1/workflows/{id}` - Delete workflow

#### Execution
- `POST /api/v1/executions` - Start workflow execution
- `GET /api/v1/executions` - List executions
- `GET /api/v1/executions/{id}` - Get execution details
- `POST /api/v1/executions/{id}/cancel` - Cancel execution

#### WebSocket
- `WS /api/v1/ws/executions/{id}` - Real-time execution updates

See full API documentation in [`FASTAPI_BACKEND_PLAN.md`](../FASTAPI_BACKEND_PLAN.md#api-endpoints).

---

## 🚀 Deployment

### Docker Production Build

```bash
# Build production image
docker build -f docker/Dockerfile -t claude-backend:latest .

# Run production container
docker run -d \
  --name claude-backend \
  -p 8000:8000 \
  --env-file .env \
  claude-backend:latest
```

### Kubernetes Deployment

See `k8s/` directory for Kubernetes manifests:

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods
kubectl get services
kubectl get ingress
```

### Health Checks

- Basic health: `GET /health`
- Readiness: `GET /health/ready`

---

## 📈 Monitoring

### Prometheus Metrics

Metrics are exposed at `/metrics` endpoint:

- HTTP request metrics
- Database query metrics
- Celery task metrics
- Custom business metrics

### Logging

Logs are written to:
- **Console**: All logs (development)
- **logs/app.log**: All logs (production)
- **logs/error.log**: Errors only (production)

View logs:
```bash
# Docker logs
docker-compose logs -f backend

# Local logs
tail -f logs/app.log
```

### Celery Monitoring

Access Flower dashboard at http://localhost:5555

---

## 🛠️ Development

### Code Quality Tools

```bash
# Format code with Black
black app/

# Lint with Ruff
ruff check app/

# Type check with MyPy
mypy app/

# Sort imports
isort app/

# Run all checks
black app/ && ruff check app/ && mypy app/ && isort app/
```

### Pre-commit Hooks

```bash
# Install pre-commit hooks
pre-commit install

# Run manually
pre-commit run --all-files
```

### Hot Reload

The development server automatically reloads on code changes:

```bash
uvicorn app.main:app --reload
```

---

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql $DATABASE_URL

# Check Docker container
docker-compose ps postgres
docker-compose logs postgres
```

### Redis Connection Error

```bash
# Check Redis is running
redis-cli ping

# Check Docker container
docker-compose ps redis
docker-compose logs redis
```

### Celery Worker Not Starting

```bash
# Check Redis connection
redis-cli ping

# Check Celery configuration
celery -A app.workers.celery_app inspect stats

# View worker logs
docker-compose logs -f celery_worker
```

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>

# Or use different port
uvicorn app.main:app --port 8001
```

---

## 📚 Additional Resources

- [Full Implementation Plan](../FASTAPI_BACKEND_PLAN.md)
- [Implementation Roadmap](../IMPLEMENTATION_ROADMAP.md)
- [Frontend Documentation](../README.md)
- [Workflow Guide](../WORKFLOW_GUIDE.md)

### External Documentation

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Celery Documentation](https://docs.celeryproject.org/)
- [Anthropic Claude API](https://docs.anthropic.com/)

---

## 🤝 Contributing

### Development Workflow

1. Create a feature branch
2. Make your changes
3. Write tests (maintain 80%+ coverage)
4. Run tests and linting
5. Create pull request
6. Wait for review and CI checks

### Code Standards

- Follow PEP 8 style guide
- Use type hints everywhere
- Write docstrings for all functions
- Keep functions small and focused
- Write tests for all new features

---

## 📄 License

[Your License Here]

---

## 👥 Support

For issues, questions, or contributions:

- GitHub Issues: [repo-url]/issues
- Email: support@yourdomain.com
- Documentation: [docs-url]

---

**Built with ❤️ using FastAPI and Claude AI**
