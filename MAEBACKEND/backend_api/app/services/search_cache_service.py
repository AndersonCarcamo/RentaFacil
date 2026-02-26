import logging
from typing import Dict, List

from redis.exceptions import RedisError

from app.core.config import settings
from app.core.redis_client import get_redis_client
from app.services.api_cache_service import api_cache_service

logger = logging.getLogger(__name__)


class SearchCacheService:
    def __init__(self):
        self.version_key = settings.search_cache_version_key

    def get_cache_version(self) -> int:
        """Get current global cache version for search keys."""
        client = get_redis_client()
        if not client:
            return 1

        try:
            value = client.get(self.version_key)
            if value is None:
                client.set(self.version_key, 1)
                return 1
            return int(value)
        except (RedisError, ValueError) as exc:
            logger.warning("Unable to read search cache version: %s", exc)
            return 1

    def invalidate_on_listing_change(self, reason: str, schedule_prewarm: bool = True) -> None:
        """Invalidate all cached search results by bumping global version."""
        client = get_redis_client()
        if not client:
            return

        try:
            new_version = client.incr(self.version_key)
            logger.info("Search cache invalidated (reason=%s, version=%s)", reason, new_version)
        except RedisError as exc:
            logger.warning("Unable to invalidate search cache: %s", exc)
            return

        api_cache_service.invalidate_static_namespace("search-filters")

        if schedule_prewarm and settings.search_cache_prewarm_enabled:
            self._schedule_default_prewarm()

    def _schedule_default_prewarm(self) -> None:
        """Queue a small set of common searches after invalidation."""
        try:
            from app.tasks.search_cache_tasks import warm_search_cache

            default_searches: List[Dict] = [
                {"page": 1, "limit": 20, "sort_by": "published_at", "sort_order": "desc"},
                {"operation": "rent", "page": 1, "limit": 20, "sort_by": "published_at", "sort_order": "desc"},
                {"operation": "sale", "page": 1, "limit": 20, "sort_by": "published_at", "sort_order": "desc"},
            ]

            for filters in default_searches:
                warm_search_cache.delay(filters)
        except Exception as exc:
            logger.warning("Failed to enqueue search prewarm tasks: %s", exc)


search_cache_service = SearchCacheService()
