import json
import logging
from typing import Any, Optional

from redis.exceptions import RedisError

from app.core.config import settings
from app.core.redis_client import get_redis_client

logger = logging.getLogger(__name__)


class ApiCacheService:
    def __init__(self):
        self.listing_ttl = settings.listing_detail_cache_ttl_seconds
        self.static_ttl = settings.static_cache_ttl_seconds

    def _get_json(self, key: str) -> Optional[Any]:
        client = get_redis_client()
        if not client:
            return None

        try:
            payload = client.get(key)
            if not payload:
                return None
            return json.loads(payload)
        except (RedisError, json.JSONDecodeError) as exc:
            logger.warning("Cache read failed for %s: %s", key, exc)
            return None

    def _set_json(self, key: str, data: Any, ttl: int) -> None:
        client = get_redis_client()
        if not client:
            return

        try:
            serialized = json.dumps(data, default=str, ensure_ascii=False)
            client.setex(key, ttl, serialized)
        except (RedisError, TypeError, ValueError) as exc:
            logger.warning("Cache write failed for %s: %s", key, exc)

    def _delete_key(self, key: str) -> None:
        client = get_redis_client()
        if not client:
            return

        try:
            client.delete(key)
        except RedisError as exc:
            logger.warning("Cache delete failed for %s: %s", key, exc)

    def _get_static_version(self, namespace: str) -> int:
        client = get_redis_client()
        if not client:
            return 1

        version_key = f"static:{namespace}:version"

        try:
            value = client.get(version_key)
            if value is None:
                client.set(version_key, 1)
                return 1
            return int(value)
        except (RedisError, ValueError) as exc:
            logger.warning("Static cache version read failed for %s: %s", namespace, exc)
            return 1

    def _get_static_cache_key(self, namespace: str, suffix: str) -> str:
        version = self._get_static_version(namespace)
        return f"static:{namespace}:v{version}:{suffix}"

    def invalidate_static_namespace(self, namespace: str) -> None:
        client = get_redis_client()
        if not client:
            return

        version_key = f"static:{namespace}:version"

        try:
            client.incr(version_key)
        except RedisError as exc:
            logger.warning("Static cache invalidation failed for %s: %s", namespace, exc)

    def get_static_data(self, namespace: str, suffix: str = "default") -> Optional[Any]:
        cache_key = self._get_static_cache_key(namespace, suffix)
        return self._get_json(cache_key)

    def set_static_data(self, namespace: str, suffix: str, data: Any, ttl: Optional[int] = None) -> None:
        cache_key = self._get_static_cache_key(namespace, suffix)
        self._set_json(cache_key, data, ttl or self.static_ttl)

    def get_listing_detail_by_id(self, listing_id: str) -> Optional[Any]:
        cache_key = f"listing:detail:id:{listing_id}"
        return self._get_json(cache_key)

    def get_listing_detail_by_slug(self, slug: str) -> Optional[Any]:
        cache_key = f"listing:detail:slug:{slug}"
        return self._get_json(cache_key)

    def set_listing_detail(self, listing_id: str, slug: Optional[str], data: Any) -> None:
        id_key = f"listing:detail:id:{listing_id}"
        self._set_json(id_key, data, self.listing_ttl)

        if slug:
            slug_key = f"listing:detail:slug:{slug}"
            self._set_json(slug_key, data, self.listing_ttl)

    def invalidate_listing_detail(
        self,
        listing_id: Optional[str] = None,
        slug: Optional[str] = None,
        old_slug: Optional[str] = None,
    ) -> None:
        if listing_id:
            self._delete_key(f"listing:detail:id:{listing_id}")
        if slug:
            self._delete_key(f"listing:detail:slug:{slug}")
        if old_slug and old_slug != slug:
            self._delete_key(f"listing:detail:slug:{old_slug}")


api_cache_service = ApiCacheService()
