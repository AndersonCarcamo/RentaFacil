from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import declarative_base
from .config import settings
import logging
import os
from typing import Dict, Any

# Set up logging for SQLAlchemy
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO if settings.debug else logging.WARNING)


def _normalize_environment_name(value: str) -> str:
    env = (value or "development").strip().lower()
    aliases = {
        "dev": "development",
        "local": "development",
        "prod": "production",
    }
    return aliases.get(env, env)


def _build_pool_profile_defaults() -> Dict[str, Any]:
    normalized_environment = _normalize_environment_name(settings.environment)
    profile = (settings.db_pool_profile or "").strip().lower()

    if not profile:
        profile = "throughput" if normalized_environment in {"staging", "production"} else "conservative"

    if profile == "throughput":
        workers = max(1, int(os.getenv("WEB_CONCURRENCY", "4")))
        per_worker_target = max(2, settings.db_pool_per_worker)
        available_budget = max(10, settings.db_postgres_connection_budget - settings.db_reserved_connections)
        per_worker_budget = max(2, available_budget // workers)
        calculated_pool_size = min(per_worker_target, per_worker_budget)
        calculated_overflow = max(2, min(calculated_pool_size // 2, per_worker_budget - calculated_pool_size))

        return {
            "profile": profile,
            "pool_size": calculated_pool_size,
            "max_overflow": calculated_overflow,
            "pool_timeout": 30,
            "pool_recycle": 1800,
            "pool_pre_ping": True,
            "workers": workers,
            "available_budget": available_budget,
            "per_worker_budget": per_worker_budget,
        }

    return {
        "profile": "conservative",
        "pool_size": 10,
        "max_overflow": 20,
        "pool_timeout": 30,
        "pool_recycle": 1800,
        "pool_pre_ping": True,
        "workers": max(1, int(os.getenv("WEB_CONCURRENCY", "2"))),
        "available_budget": max(10, settings.db_postgres_connection_budget - settings.db_reserved_connections),
        "per_worker_budget": None,
    }


def get_effective_db_pool_config() -> Dict[str, Any]:
    defaults = _build_pool_profile_defaults()
    effective_pool_size = settings.db_pool_size if settings.db_pool_size is not None else defaults["pool_size"]
    effective_max_overflow = settings.db_max_overflow if settings.db_max_overflow is not None else defaults["max_overflow"]
    workers = defaults["workers"]
    return {
        "profile": defaults["profile"],
        "pool_size": effective_pool_size,
        "max_overflow": effective_max_overflow,
        "pool_timeout": settings.db_pool_timeout if settings.db_pool_timeout is not None else defaults["pool_timeout"],
        "pool_recycle": settings.db_pool_recycle if settings.db_pool_recycle is not None else defaults["pool_recycle"],
        "pool_pre_ping": settings.db_pool_pre_ping if settings.db_pool_pre_ping is not None else defaults["pool_pre_ping"],
        "workers": workers,
        "available_budget": defaults["available_budget"],
        "per_worker_budget": defaults.get("per_worker_budget"),
        "total_potential_connections": workers * (effective_pool_size + effective_max_overflow),
    }


EFFECTIVE_DB_POOL_CONFIG = get_effective_db_pool_config()

# Create database engine with optimized configuration
engine = create_engine(
    settings.database_url,
    pool_pre_ping=EFFECTIVE_DB_POOL_CONFIG["pool_pre_ping"],
    pool_recycle=EFFECTIVE_DB_POOL_CONFIG["pool_recycle"],
    pool_size=EFFECTIVE_DB_POOL_CONFIG["pool_size"],
    max_overflow=EFFECTIVE_DB_POOL_CONFIG["max_overflow"],
    pool_timeout=EFFECTIVE_DB_POOL_CONFIG["pool_timeout"],
    echo=settings.debug,
    future=True,  # Use SQLAlchemy 2.0 style
    connect_args={
        "client_encoding": "utf8",
        "options": "-c timezone=UTC"
    }
)

# Create SessionLocal class
SessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine,
    future=True  # Use SQLAlchemy 2.0 style
)

# Base class for models with consistent metadata
Base = declarative_base(
    metadata=MetaData(
        naming_convention={
            "ix": "ix_%(column_0_label)s",
            "uq": "uq_%(table_name)s_%(column_0_name)s",
            "ck": "ck_%(table_name)s_%(constraint_name)s",
            "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
            "pk": "pk_%(table_name)s"
        }
    )
)


def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all tables defined in models."""
    Base.metadata.create_all(bind=engine)


def drop_tables():
    """Drop all tables - use with caution!"""
    Base.metadata.drop_all(bind=engine)


def get_db_pool_diagnostics() -> Dict[str, Any]:
    """Return SQLAlchemy pool runtime diagnostics to validate saturation/leaks."""
    pool = engine.pool

    diagnostics: Dict[str, Any] = {
        "pool_class": pool.__class__.__name__,
        "status": pool.status() if hasattr(pool, "status") else "unknown",
        "configured": EFFECTIVE_DB_POOL_CONFIG,
    }

    for metric_name in ("size", "checkedin", "checkedout", "overflow", "timeout"):
        metric_func = getattr(pool, metric_name, None)
        if callable(metric_func):
            try:
                diagnostics[metric_name] = metric_func()
            except Exception:
                diagnostics[metric_name] = None

    checked_out = diagnostics.get("checkedout")
    diagnostics["possible_leak"] = bool(checked_out and checked_out > 0)

    return diagnostics
