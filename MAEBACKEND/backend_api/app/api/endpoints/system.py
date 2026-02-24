"""
System utilities endpoints for EasyRent API.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import HTMLResponse, JSONResponse
from sqlalchemy.orm import Session
from typing import Optional
import time
from datetime import datetime, timezone

from app.core.database import get_db
from app.schemas.system import (
    HealthCheckResponse, VersionResponse, SystemStatsResponse,
    DocumentationResponse, SystemError
)
from app.services.system_service import SystemService
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()

# Global request counter (in production, this would be in Redis or database)
request_counter = {"count": 0}


# Health check endpoint

@router.get("/health", response_model=HealthCheckResponse, status_code=status.HTTP_200_OK)
async def health_check(
    db: Session = Depends(get_db)
):
    """
    System health check
    
    Comprehensive health check that tests connectivity to all critical services
    including database, Redis, and Kafka. Returns overall system status and
    individual service health information.
    
    This endpoint does not require authentication and can be used by load
    balancers and monitoring systems.
    """
    try:
        service = SystemService()
        health_result = await service.get_health_check(db, request_counter["count"])
        
        # Set appropriate HTTP status based on health
        if health_result.status == "unhealthy":
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content=health_result.model_dump(mode="json")
            )
        elif health_result.status == "degraded":
            return JSONResponse(
                status_code=status.HTTP_200_OK,
                content=health_result.model_dump(mode="json")
            )
        else:
            return health_result
            
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        error_response = SystemError(
            error="health_check_failed",
            message="Unable to perform health check",
            timestamp=datetime.now(timezone.utc),
            details={"error": str(e)}
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response.model_dump(mode="json")
        )


# Version information endpoint

@router.get("/version", response_model=VersionResponse, status_code=status.HTTP_200_OK)
async def get_version():
    """
    Get version information
    
    Returns detailed version information including application version,
    build details, Git commit information, and environment details.
    
    This endpoint does not require authentication.
    """
    try:
        service = SystemService()
        version_info = service.get_version_info()
        return version_info
        
    except Exception as e:
        logger.error(f"Version check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve version information"
        )


# Documentation endpoint

@router.get("/docs", response_class=HTMLResponse)
async def get_interactive_docs():
    """
    Interactive API documentation
    
    Returns the Swagger UI interface for exploring and testing the API.
    Only available in development and staging environments.
    """
    if not settings.debug:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documentation not available in production"
        )
    
    # In a real implementation, this would return the actual Swagger UI HTML
    # For now, we'll redirect to the standard /docs endpoint
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/docs")


@router.get("/docs/info", response_model=DocumentationResponse)
async def get_documentation_info():
    """
    Get API documentation information
    
    Returns metadata about the API documentation including available
    endpoints, tags, and documentation URLs.
    """
    try:
        service = SystemService()
        doc_info = service.get_documentation_info()
        
        return DocumentationResponse(
            title=doc_info["title"],
            version=doc_info["version"], 
            description=doc_info["description"],
            docs_url=doc_info["docs_url"],
            redoc_url=doc_info["redoc_url"],
            openapi_url=doc_info["openapi_url"],
            endpoints_count=doc_info.get("endpoints_count"),
            tags=doc_info["tags"]
        )
        
    except Exception as e:
        logger.error(f"Documentation info failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve documentation information"
        )


# System statistics endpoints

@router.get("/stats", response_model=SystemStatsResponse)
async def get_system_stats():
    """
    Get system statistics
    
    Returns detailed system performance metrics including memory usage,
    CPU usage, disk usage, and network statistics.
    
    This endpoint can be used for monitoring and alerting purposes.
    """
    try:
        service = SystemService()
        stats = service.get_system_stats()
        return stats
        
    except Exception as e:
        logger.error(f"System stats failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve system statistics"
        )


@router.get("/stats/database")
async def get_database_stats(
    db: Session = Depends(get_db)
):
    """
    Get database statistics
    
    Returns detailed database performance metrics including connection
    counts, database size, and table information.
    """
    try:
        service = SystemService()
        db_stats = await service.get_database_stats(db)
        
        return {
            "success": True,
            "data": db_stats
        }
        
    except Exception as e:
        logger.error(f"Database stats failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve database statistics"
        )


# Monitoring and diagnostics endpoints

@router.get("/ping")
async def ping():
    """
    Simple ping endpoint
    
    Basic connectivity test that returns immediately.
    Useful for basic uptime monitoring.
    """
    return {
        "status": "ok",
        "timestamp": time.time(),
        "message": "pong"
    }


@router.get("/ready")
async def readiness_check(
    db: Session = Depends(get_db)
):
    """
    Readiness check
    
    Checks if the application is ready to serve traffic.
    Tests critical dependencies like database connectivity.
    """
    try:
        service = SystemService()
        db_health = await service.check_database_health(db)
        
        if db_health.status == "healthy":
            return {
                "status": "ready",
                "timestamp": time.time(),
                "checks": {
                    "database": "ok"
                }
            }
        else:
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={
                    "status": "not_ready",
                    "timestamp": time.time(),
                    "checks": {
                        "database": "failed"
                    },
                    "error": db_health.error
                }
            )
            
    except Exception as e:
        logger.error(f"Readiness check failed: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "not_ready", 
                "timestamp": time.time(),
                "error": str(e)
            }
        )


@router.get("/metrics")
async def get_metrics(
    db: Session = Depends(get_db)
):
    """
    Get application metrics
    
    Returns application metrics in a format suitable for monitoring
    systems like Prometheus.
    """
    try:
        service = SystemService()
        
        # Get basic stats
        stats = service.get_system_stats()
        health = await service.get_health_check(db, request_counter["count"])
        
        # Format as simple key-value metrics
        metrics = {
            "easyrent_uptime_seconds": stats.uptime_seconds,
            "easyrent_memory_used_mb": stats.memory_usage["used_mb"],
            "easyrent_memory_percentage": stats.memory_usage["percentage"],
            "easyrent_cpu_usage_percentage": stats.cpu_usage,
            "easyrent_requests_total": request_counter["count"],
            "easyrent_health_status": 1 if health.status == "healthy" else 0,
            "easyrent_database_response_time_ms": health.services["database"].response_time_ms or 0,
        }
        
        return {
            "success": True,
            "metrics": metrics,
            "timestamp": time.time()
        }
        
    except Exception as e:
        logger.error(f"Metrics collection failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to collect metrics"
        )


# Configuration and environment info

@router.get("/config")
async def get_configuration():
    """
    Get application configuration
    
    Returns non-sensitive configuration information that can be
    useful for debugging and verification.
    """
    try:
        config = {
            "app_name": settings.app_name,
            "app_version": settings.app_version,
            "environment": settings.environment,
            "debug": settings.debug,
            "timezone": "UTC",
            "features": {
                "documentation": settings.debug,
                "monitoring": True,
                "health_checks": True,
                "metrics": True
            },
            "api": {
                "rate_limiting": True,
                "cors_enabled": True,
                "authentication": "JWT Bearer Token"
            }
        }
        
        return {
            "success": True,
            "config": config
        }
        
    except Exception as e:
        logger.error(f"Configuration retrieval failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to retrieve configuration"
        )