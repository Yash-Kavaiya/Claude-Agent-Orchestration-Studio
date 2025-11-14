"""
Redis Cache Manager
Manages Redis connections and caching operations
"""
import json
from typing import Any, Optional
import redis.asyncio as redis
from loguru import logger

from app.config import settings


class RedisManager:
    """
    Redis connection and cache manager
    """

    def __init__(self):
        self.redis_url = settings.REDIS_URL
        self.pool: Optional[redis.ConnectionPool] = None
        self.client: Optional[redis.Redis] = None

    async def connect(self):
        """
        Initialize Redis connection pool
        """
        try:
            self.pool = redis.ConnectionPool.from_url(
                self.redis_url,
                max_connections=settings.REDIS_POOL_SIZE,
                decode_responses=True,
            )
            self.client = redis.Redis(connection_pool=self.pool)

            # Test connection
            await self.client.ping()
            logger.info("✅ Redis connected successfully")

        except Exception as e:
            logger.error(f"❌ Failed to connect to Redis: {e}")
            raise

    async def disconnect(self):
        """
        Close Redis connections
        """
        if self.client:
            await self.client.close()
        if self.pool:
            await self.pool.disconnect()
        logger.info("Redis disconnected")

    async def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache
        """
        try:
            value = await self.client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Redis GET error for key {key}: {e}")
            return None

    async def set(
        self, key: str, value: Any, expire: Optional[int] = None
    ) -> bool:
        """
        Set value in cache with optional expiration (seconds)
        """
        try:
            serialized = json.dumps(value)
            if expire:
                await self.client.setex(key, expire, serialized)
            else:
                await self.client.set(key, serialized)
            return True
        except Exception as e:
            logger.error(f"Redis SET error for key {key}: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """
        Delete key from cache
        """
        try:
            await self.client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Redis DELETE error for key {key}: {e}")
            return False

    async def exists(self, key: str) -> bool:
        """
        Check if key exists in cache
        """
        try:
            return await self.client.exists(key) > 0
        except Exception as e:
            logger.error(f"Redis EXISTS error for key {key}: {e}")
            return False

    async def increment(self, key: str, amount: int = 1) -> int:
        """
        Increment counter
        """
        try:
            return await self.client.incrby(key, amount)
        except Exception as e:
            logger.error(f"Redis INCR error for key {key}: {e}")
            return 0

    async def expire(self, key: str, seconds: int) -> bool:
        """
        Set expiration on existing key
        """
        try:
            return await self.client.expire(key, seconds)
        except Exception as e:
            logger.error(f"Redis EXPIRE error for key {key}: {e}")
            return False

    async def ttl(self, key: str) -> int:
        """
        Get time to live for key
        Returns -1 if key has no expiry, -2 if key doesn't exist
        """
        try:
            return await self.client.ttl(key)
        except Exception as e:
            logger.error(f"Redis TTL error for key {key}: {e}")
            return -2

    async def publish(self, channel: str, message: dict):
        """
        Publish message to Redis pub/sub channel
        """
        try:
            serialized = json.dumps(message)
            await self.client.publish(channel, serialized)
        except Exception as e:
            logger.error(f"Redis PUBLISH error for channel {channel}: {e}")

    async def subscribe(self, channel: str):
        """
        Subscribe to Redis pub/sub channel
        Returns async generator of messages
        """
        pubsub = self.client.pubsub()
        await pubsub.subscribe(channel)

        try:
            async for message in pubsub.listen():
                if message["type"] == "message":
                    try:
                        data = json.loads(message["data"])
                        yield data
                    except json.JSONDecodeError:
                        yield message["data"]
        finally:
            await pubsub.unsubscribe(channel)
            await pubsub.close()


# Global Redis manager instance
redis_manager = RedisManager()


# Helper functions
async def get_cache(key: str) -> Optional[Any]:
    """Get value from cache"""
    return await redis_manager.get(key)


async def set_cache(key: str, value: Any, expire: Optional[int] = None) -> bool:
    """Set value in cache"""
    return await redis_manager.set(key, value, expire)


async def delete_cache(key: str) -> bool:
    """Delete key from cache"""
    return await redis_manager.delete(key)


async def clear_cache_pattern(pattern: str):
    """
    Delete all keys matching pattern
    Example: clear_cache_pattern("user:*")
    """
    try:
        cursor = 0
        while True:
            cursor, keys = await redis_manager.client.scan(
                cursor, match=pattern, count=100
            )
            if keys:
                await redis_manager.client.delete(*keys)
            if cursor == 0:
                break
    except Exception as e:
        logger.error(f"Error clearing cache pattern {pattern}: {e}")
