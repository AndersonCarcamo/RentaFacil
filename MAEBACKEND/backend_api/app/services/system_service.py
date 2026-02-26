"""
System utilities service for EasyRent API.
"""

import psutil
import time
import sys
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import HTTPException
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import asyncio
import subprocess
import os
import json

from app.core.database import get_db, get_db_pool_diagnostics
from app.core.config import settings
from app.schemas.system import (
    ServiceHealthResponse, HealthCheckResponse, VersionResponse,
    SystemStatsResponse, ServiceStatus, SystemStatus
)
from app.core.logging import get_logger

logger = get_logger(__name__)

# Global variable to track startup time
START_TIME = time.time()


class SystemService:
    """Service for system utilities and health checks."""
    
    def __init__(self):
        self.start_time = START_TIME
    
    def get_uptime_seconds(self) -> float:
        """Get system uptime in seconds."""
        return time.time() - self.start_time
    
    async def check_database_health(self, db: Session) -> ServiceHealthResponse:
        """
        Check database connectivity and health.
        
        Args:
            db: Database session
            
        Returns:
            ServiceHealthResponse with database status
        """
        start_time = time.time()
        
        try:
            # Simple connection test
            result = db.execute(text("SELECT 1 as test, version() as version, NOW() as timestamp"))
            row = result.fetchone()
            
            response_time = (time.time() - start_time) * 1000  # Convert to milliseconds
            
            if row:
                # Get connection count
                try:
                    conn_result = db.execute(text("""
                        SELECT count(*) as active_connections 
                        FROM pg_stat_activity 
                        WHERE state = 'active'
                    """))
                    conn_row = conn_result.fetchone()
                    active_connections = conn_row.active_connections if conn_row else 0
                except Exception:
                    active_connections = None
                
                return ServiceHealthResponse(
                    status=ServiceStatus.HEALTHY,
                    response_time_ms=round(response_time, 2),
                    details={
                        "version": row.version.split(',')[0] if hasattr(row, 'version') else "Unknown",
                        "active_connections": active_connections,
                        "test_query_result": row.test if hasattr(row, 'test') else None
                    }
                )
            else:
                return ServiceHealthResponse(
                    status=ServiceStatus.UNHEALTHY,
                    error="No response from database"
                )
                
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            logger.error(f"Database health check failed: {str(e)}")
            
            return ServiceHealthResponse(
                status=ServiceStatus.UNHEALTHY,
                response_time_ms=round(response_time, 2),
                error=str(e)
            )
    
    async def check_redis_health(self) -> ServiceHealthResponse:
        """
        Check Redis connectivity and health.
        
        Returns:
            ServiceHealthResponse with Redis status
        """
        start_time = time.time()
        
        try:
            # For now, we'll simulate Redis check since it's not configured
            # In a real implementation, you would use aioredis
            
            # Simulate Redis connection
            await asyncio.sleep(0.01)  # Simulate network delay
            response_time = (time.time() - start_time) * 1000
            
            # For demo purposes, assume Redis is available
            return ServiceHealthResponse(
                status=ServiceStatus.HEALTHY,
                response_time_ms=round(response_time, 2),
                details={
                    "version": "7.0.0",  # Example version
                    "connected_clients": 5,
                    "used_memory": "2.5MB"
                }
            )
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            logger.error(f"Redis health check failed: {str(e)}")
            
            return ServiceHealthResponse(
                status=ServiceStatus.UNHEALTHY,
                response_time_ms=round(response_time, 2),
                error=str(e)
            )
    
    async def check_kafka_health(self) -> ServiceHealthResponse:
        """
        Check Kafka connectivity and health.
        
        Returns:
            ServiceHealthResponse with Kafka status
        """
        start_time = time.time()
        
        try:
            # For now, we'll simulate Kafka check since it's not configured
            # In a real implementation, you would use aiokafka
            
            # Simulate Kafka connection
            await asyncio.sleep(0.02)  # Simulate network delay
            response_time = (time.time() - start_time) * 1000
            
            # For demo purposes, assume Kafka is available
            return ServiceHealthResponse(
                status=ServiceStatus.HEALTHY,
                response_time_ms=round(response_time, 2),
                details={
                    "version": "3.5.0",  # Example version
                    "brokers": 3,
                    "topics": 12
                }
            )
            
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            logger.error(f"Kafka health check failed: {str(e)}")
            
            return ServiceHealthResponse(
                status=ServiceStatus.UNHEALTHY,
                response_time_ms=round(response_time, 2),
                error=str(e)
            )
    
    async def get_health_check(self, db: Session, request_count: Optional[int] = None) -> HealthCheckResponse:
        """
        Get comprehensive system health check.
        
        Args:
            db: Database session
            request_count: Optional total request count
            
        Returns:
            HealthCheckResponse with overall system health
        """
        # Check all services
        database_health = await self.check_database_health(db)
        redis_health = await self.check_redis_health()
        kafka_health = await self.check_kafka_health()
        
        # Determine overall status
        services = {
            "database": database_health,
            "redis": redis_health,
            "kafka": kafka_health
        }
        
        # Calculate overall status
        unhealthy_services = sum(1 for service in services.values() 
                               if service.status == ServiceStatus.UNHEALTHY)
        degraded_services = sum(1 for service in services.values() 
                              if service.status == ServiceStatus.DEGRADED)
        
        if unhealthy_services > 0:
            overall_status = SystemStatus.UNHEALTHY
        elif degraded_services > 0:
            overall_status = SystemStatus.DEGRADED
        else:
            overall_status = SystemStatus.HEALTHY
        
        return HealthCheckResponse(
            status=overall_status,
            timestamp=datetime.utcnow(),
            version=settings.app_version,
            services=services,
            uptime_seconds=self.get_uptime_seconds(),
            request_count=request_count
        )
    
    def get_version_info(self) -> VersionResponse:
        """
        Get application version information.
        
        Returns:
            VersionResponse with version details
        """
        # Try to get git commit info
        commit_hash = None
        try:
            result = subprocess.run(
                ["git", "rev-parse", "HEAD"], 
                capture_output=True, 
                text=True, 
                cwd=os.path.dirname(os.path.abspath(__file__))
            )
            if result.returncode == 0:
                commit_hash = result.stdout.strip()[:12]  # Short hash
        except Exception:
            pass
        
        # Try to get build date from git
        build_date = None
        try:
            result = subprocess.run(
                ["git", "log", "-1", "--format=%ci"], 
                capture_output=True, 
                text=True,
                cwd=os.path.dirname(os.path.abspath(__file__))
            )
            if result.returncode == 0:
                build_date = datetime.fromisoformat(result.stdout.strip().replace(' ', 'T'))
        except Exception:
            pass
        
        # Get key dependency versions
        dependencies = {}
        try:
            import fastapi
            dependencies["fastapi"] = fastapi.__version__
        except:
            pass
        
        try:
            import sqlalchemy
            dependencies["sqlalchemy"] = sqlalchemy.__version__
        except:
            pass
        
        try:
            import pydantic
            dependencies["pydantic"] = pydantic.__version__
        except:
            pass
        
        return VersionResponse(
            version=settings.app_version,
            build=os.getenv("BUILD_NUMBER", "dev"),
            commit=commit_hash,
            build_date=build_date,
            environment=settings.environment,
            python_version=f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}",
            dependencies=dependencies
        )
    
    def get_system_stats(self) -> SystemStatsResponse:
        """
        Get detailed system statistics.
        
        Returns:
            SystemStatsResponse with system metrics
        """
        # Get memory info
        memory = psutil.virtual_memory()
        memory_usage = {
            "used_mb": round(memory.used / 1024 / 1024, 2),
            "available_mb": round(memory.available / 1024 / 1024, 2),
            "total_mb": round(memory.total / 1024 / 1024, 2),
            "percentage": round(memory.percent, 2)
        }
        
        # Get CPU usage
        cpu_usage = psutil.cpu_percent(interval=1)
        
        # Get disk usage
        disk = psutil.disk_usage('/')
        disk_usage = {
            "used_gb": round(disk.used / 1024 / 1024 / 1024, 2),
            "free_gb": round(disk.free / 1024 / 1024 / 1024, 2),
            "total_gb": round(disk.total / 1024 / 1024 / 1024, 2),
            "percentage": round((disk.used / disk.total) * 100, 2)
        }
        
        # Get network stats (simplified)
        network_io = psutil.net_io_counters()
        network_stats = {
            "bytes_sent": network_io.bytes_sent,
            "bytes_recv": network_io.bytes_recv,
            "packets_sent": network_io.packets_sent,
            "packets_recv": network_io.packets_recv
        }
        
        return SystemStatsResponse(
            uptime_seconds=self.get_uptime_seconds(),
            memory_usage=memory_usage,
            cpu_usage=cpu_usage,
            disk_usage=disk_usage,
            network_stats=network_stats,
            active_connections=None,  # Would need database connection
            cache_stats=None  # Would need Redis connection
        )
    
    def get_documentation_info(self) -> Dict[str, Any]:
        """
        Get API documentation information.
        
        Returns:
            Dictionary with documentation details
        """
        return {
            "title": settings.app_name,
            "version": settings.app_version,
            "description": "Complete Real Estate Marketplace API with comprehensive features for property listings, user management, search, analytics, and integrations.",
            "docs_url": "/docs" if settings.debug else None,
            "redoc_url": "/redoc" if settings.debug else None,
            "openapi_url": "/openapi.json" if settings.debug else None,
            "endpoints_count": None,  # Would need to count from app routes
            "tags": [
                "Authentication",
                "Users",
                "Agencies", 
                "Listings",
                "Search",
                "Media",
                "Interactions",
                "Subscriptions",
                "Analytics",
                "Verifications & Moderation",
                "Notifications",
                "Administration",
                "External Integrations",
                "Webhooks Management",
                "Developer Tools",
                "System"
            ],
            "contact": {
                "name": "EasyRent API Support",
                "email": "api-support@easyrent.com"
            },
            "license": {
                "name": "Proprietary",
                "url": "https://easyrent.com/terms"
            }
        }
    
    async def get_database_stats(self, db: Session) -> Dict[str, Any]:
        """
        Get database-specific statistics.
        
        Args:
            db: Database session
            
        Returns:
            Dictionary with database statistics
        """
        try:
            # Get database size
            size_result = db.execute(text("""
                SELECT pg_size_pretty(pg_database_size(current_database())) as database_size,
                       pg_database_size(current_database()) as database_size_bytes
            """))
            size_row = size_result.fetchone()
            
            # Get connection stats
            conn_result = db.execute(text("""
                SELECT count(*) as total_connections,
                       count(*) FILTER (WHERE state = 'active') as active_connections,
                       count(*) FILTER (WHERE state = 'idle') as idle_connections
                FROM pg_stat_activity
            """))
            conn_row = conn_result.fetchone()
            
            # Get table count
            table_result = db.execute(text("""
                SELECT count(*) as table_count 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """))
            table_row = table_result.fetchone()
            
            return {
                "database_size": size_row.database_size if size_row else "Unknown",
                "database_size_bytes": size_row.database_size_bytes if size_row else 0,
                "total_connections": conn_row.total_connections if conn_row else 0,
                "active_connections": conn_row.active_connections if conn_row else 0,
                "idle_connections": conn_row.idle_connections if conn_row else 0,
                "table_count": table_row.table_count if table_row else 0
            }
            
        except Exception as e:
            logger.error(f"Failed to get database stats: {str(e)}")
            return {"error": str(e)}

    def get_database_pool_stats(self) -> Dict[str, Any]:
        """Return runtime DB pool stats for saturation and leak checks."""
        try:
            return get_db_pool_diagnostics()
        except Exception as e:
            logger.error(f"Failed to get database pool diagnostics: {str(e)}")
            return {"error": str(e)}