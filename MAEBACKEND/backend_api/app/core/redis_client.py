import logging
from typing import Optional

import redis
from redis import Redis
from redis.exceptions import RedisError

from app.core.config import settings

logger = logging.getLogger(__name__)


_redis_client: Optional[Redis] = None


def get_redis_client() -> Optional[Redis]:
    """Return a shared Redis client instance if available."""
    global _redis_client

    if _redis_client is not None:
        return _redis_client

    try:
        redis_url = settings.redis_url
        if redis_url and redis_url.startswith("redis://"):
            client = redis.from_url(redis_url, decode_responses=True)
        else:
            client = redis.Redis(
                host=settings.redis_host,
                port=settings.redis_port,
                db=settings.redis_db,
                password=settings.redis_password,
                decode_responses=True,
            )

        client.ping()
        _redis_client = client
        logger.info("Redis client initialized successfully")
    except RedisError as exc:
        logger.warning("Redis unavailable, cache disabled: %s", exc)
        _redis_client = None

    return _redis_client
