from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import declarative_base
from .config import settings
import logging

# Set up logging for SQLAlchemy
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO if settings.debug else logging.WARNING)

# Create database engine with optimized configuration
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=50,  # 🚀 Aumentado de 10 a 50 para soportar más conexiones concurrentes
    max_overflow=100,  # 🚀 Aumentado de 20 a 100 para picos de tráfico
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
