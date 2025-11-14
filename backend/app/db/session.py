"""
Database Session Management
Configures SQLAlchemy async engine and session
"""
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    create_async_engine,
    async_sessionmaker,
)
from sqlalchemy.pool import NullPool, QueuePool

from app.config import settings


# Create async engine
# For PostgreSQL, replace postgresql:// with postgresql+asyncpg://
database_url = settings.DATABASE_URL.replace(
    "postgresql://", "postgresql+asyncpg://"
).replace("postgres://", "postgresql+asyncpg://")


# Configure engine based on environment
if settings.DEBUG:
    # Development: More verbose, no connection pooling
    engine = create_async_engine(
        database_url,
        echo=settings.DATABASE_ECHO,
        poolclass=NullPool,
        future=True,
    )
else:
    # Production: Connection pooling, less verbose
    engine = create_async_engine(
        database_url,
        echo=False,
        pool_size=settings.DATABASE_POOL_SIZE,
        max_overflow=settings.DATABASE_MAX_OVERFLOW,
        pool_pre_ping=True,  # Verify connections before using
        pool_recycle=3600,  # Recycle connections after 1 hour
        poolclass=QueuePool,
        future=True,
    )


# Create async session factory
async_session_maker = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_session() -> AsyncSession:
    """
    Get database session
    Alternative to using async_session_maker directly
    """
    async with async_session_maker() as session:
        yield session


async def init_db():
    """
    Initialize database
    Create all tables if they don't exist
    Only for development - use Alembic migrations in production
    """
    from app.db.base import Base

    async with engine.begin() as conn:
        # await conn.run_sync(Base.metadata.drop_all)  # Uncomment to drop all tables
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """
    Close database connections
    Call on application shutdown
    """
    await engine.dispose()
