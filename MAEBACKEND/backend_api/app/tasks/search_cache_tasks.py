from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.schemas.search import SearchFilters
from app.services.search_service import SearchService


@celery_app.task(name="search.warm_cache")
def warm_search_cache(filters: dict) -> dict:
    """Warm the Redis cache for a search filter set."""
    db = SessionLocal()
    try:
        service = SearchService(db)
        parsed_filters = SearchFilters(**filters)
        result = service.search_listings(parsed_filters)
        return {
            "cached": True,
            "total_results": result.meta.total_results,
            "page": result.meta.page,
            "limit": result.meta.limit,
        }
    finally:
        db.close()
