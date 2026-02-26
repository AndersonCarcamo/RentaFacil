"""
System utilities schemas for EasyRent API.
"""

from pydantic import BaseModel, Field
from typing import Dict, Optional, Any
from datetime import datetime
from enum import Enum


class ServiceStatus(str, Enum):
    """Service status enum."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


class SystemStatus(str, Enum):
    """Overall system status enum."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


class ServiceHealthResponse(BaseModel):
    """Schema for individual service health."""
    status: ServiceStatus
    response_time_ms: Optional[float] = Field(None, description="Response time in milliseconds")
    error: Optional[str] = Field(None, description="Error message if unhealthy")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional service details")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "response_time_ms": 12.5,
                "error": None,
                "details": {
                    "version": "14.9",
                    "connections": 5
                }
            }
        }


class HealthCheckResponse(BaseModel):
    """Schema for system health check response."""
    status: SystemStatus
    timestamp: datetime
    version: str
    services: Dict[str, ServiceHealthResponse]
    uptime_seconds: Optional[float] = Field(None, description="System uptime in seconds")
    request_count: Optional[int] = Field(None, description="Total requests processed")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "timestamp": "2023-10-15T10:30:00Z",
                "version": "1.0.0",
                "services": {
                    "database": {
                        "status": "healthy",
                        "response_time_ms": 12.5,
                        "details": {
                            "version": "14.9",
                            "connections": 5
                        }
                    },
                    "redis": {
                        "status": "healthy",
                        "response_time_ms": 3.2
                    }
                },
                "uptime_seconds": 86400,
                "request_count": 15430
            }
        }


class VersionResponse(BaseModel):
    """Schema for version information response."""
    version: str = Field(..., description="Application version")
    build: Optional[str] = Field(None, description="Build number or identifier")
    commit: Optional[str] = Field(None, description="Git commit hash")
    build_date: Optional[datetime] = Field(None, description="Build timestamp")
    environment: Optional[str] = Field(None, description="Environment name")
    python_version: Optional[str] = Field(None, description="Python runtime version")
    dependencies: Optional[Dict[str, str]] = Field(None, description="Key dependency versions")

    class Config:
        json_schema_extra = {
            "example": {
                "version": "1.2.3",
                "build": "build-456",
                "commit": "abc123def456",
                "build_date": "2023-10-15T08:00:00Z",
                "environment": "production",
                "python_version": "3.13.0",
                "dependencies": {
                    "fastapi": "0.104.1",
                    "sqlalchemy": "2.0.23",
                    "pydantic": "2.4.2"
                }
            }
        }


class SystemStatsResponse(BaseModel):
    """Schema for system statistics."""
    uptime_seconds: float
    memory_usage: Dict[str, Any]
    cpu_usage: Optional[float] = Field(None, description="CPU usage percentage")
    disk_usage: Optional[Dict[str, Any]] = Field(None, description="Disk usage information")
    network_stats: Optional[Dict[str, Any]] = Field(None, description="Network statistics")
    active_connections: Optional[int] = Field(None, description="Active database connections")
    cache_stats: Optional[Dict[str, Any]] = Field(None, description="Cache statistics")

    class Config:
        json_schema_extra = {
            "example": {
                "uptime_seconds": 86400,
                "memory_usage": {
                    "used_mb": 512,
                    "available_mb": 2048,
                    "percentage": 25.0
                },
                "cpu_usage": 15.5,
                "disk_usage": {
                    "used_gb": 45.2,
                    "total_gb": 100.0,
                    "percentage": 45.2
                },
                "active_connections": 12,
                "cache_stats": {
                    "hits": 1547,
                    "misses": 234,
                    "hit_rate": 86.9
                }
            }
        }


class DocumentationResponse(BaseModel):
    """Schema for API documentation information."""
    title: str
    version: str
    description: str
    docs_url: Optional[str] = Field(None, description="Swagger UI URL")
    redoc_url: Optional[str] = Field(None, description="ReDoc URL")
    openapi_url: Optional[str] = Field(None, description="OpenAPI JSON URL")
    endpoints_count: Optional[int] = Field(None, description="Total number of endpoints")
    tags: Optional[list] = Field(None, description="Available endpoint tags")

    class Config:
        json_schema_extra = {
            "example": {
                "title": "EasyRent API",
                "version": "1.0.0",
                "description": "Complete Real Estate Marketplace API",
                "docs_url": "/docs",
                "redoc_url": "/redoc",
                "openapi_url": "/openapi.json",
                "endpoints_count": 127,
                "tags": [
                    "Authentication",
                    "Users", 
                    "Listings",
                    "Search",
                    "System"
                ]
            }
        }


class SystemError(BaseModel):
    """Schema for system errors."""
    error: str
    message: str
    timestamp: datetime
    details: Optional[Dict[str, Any]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "error": "database_connection_failed",
                "message": "Unable to connect to the database",
                "timestamp": "2023-10-15T10:30:00Z",
                "details": {
                    "host": "localhost",
                    "port": 5432,
                    "database": "easyrent"
                }
            }
        }