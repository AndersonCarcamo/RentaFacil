"""
API Key service for EasyRent API.
"""

from sqlalchemy.orm import Session
from sqlalchemy import desc, func, and_, or_
from fastapi import HTTPException, status
from typing import List, Optional, Tuple, Dict, Any
import uuid
import secrets
import hashlib
import hmac
from datetime import datetime, timedelta

from app.models.api_key import (
    ApiKey, ApiKeyUsageLog, DeveloperApplication, 
    ApiKeyScope, ApiKeyStatus
)
from app.models.auth import User
from app.schemas.api_keys import (
    ApiKeyCreate, ApiKeyUpdate, DeveloperApplicationCreate, 
    DeveloperApplicationUpdate
)
from app.core.logging import get_logger

logger = get_logger(__name__)


class ApiKeyService:
    """Service for managing API keys and developer applications."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_api_key(self, environment: str = "live") -> Tuple[str, str, str]:
        """
        Generate a new API key with prefix and hash.
        
        Returns:
            Tuple of (full_key, key_hash, key_prefix)
        """
        # Generate random key
        random_part = secrets.token_urlsafe(32)
        
        # Create key with prefix
        prefix = f"pk_{environment}_"
        full_key = f"{prefix}{random_part}"
        
        # Create hash for storage
        key_hash = hashlib.sha256(full_key.encode()).hexdigest()
        
        return full_key, key_hash, prefix
    
    def verify_api_key(self, api_key: str) -> Optional[ApiKey]:
        """
        Verify and return API key if valid.
        
        Args:
            api_key: The API key string to verify
            
        Returns:
            ApiKey instance if valid, None otherwise
        """
        if not api_key:
            return None
        
        # Hash the provided key
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        # Find in database
        db_api_key = self.db.query(ApiKey).filter(
            ApiKey.key_hash == key_hash
        ).first()
        
        if not db_api_key:
            return None
        
        # Check if key can be used
        if not db_api_key.can_access():
            return None
        
        # Update last used
        db_api_key.last_used_at = datetime.utcnow()
        db_api_key.usage_count += 1
        self.db.commit()
        
        return db_api_key
    
    def create_api_key(self, user_id: uuid.UUID, api_key_data: ApiKeyCreate) -> Tuple[ApiKey, str]:
        """
        Create a new API key.
        
        Args:
            user_id: User ID who owns the key
            api_key_data: API key creation data
            
        Returns:
            Tuple of (ApiKey instance, full_key_string)
        """
        # Check if user exists
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check user's API key limits (optional business rule)
        existing_keys = self.db.query(ApiKey).filter(
            ApiKey.user_id == user_id,
            ApiKey.status == ApiKeyStatus.ACTIVE.value
        ).count()
        
        if existing_keys >= 10:  # Limit to 10 active keys per user
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum number of API keys reached (10)"
            )
        
        # Check for duplicate names
        existing_name = self.db.query(ApiKey).filter(
            ApiKey.user_id == user_id,
            ApiKey.name == api_key_data.name,
            ApiKey.status != ApiKeyStatus.REVOKED.value
        ).first()
        
        if existing_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="API key name already exists"
            )
        
        # Generate key
        full_key, key_hash, key_prefix = self.generate_api_key()
        
        # Create API key record
        db_api_key = ApiKey(
            user_id=user_id,
            name=api_key_data.name,
            key_hash=key_hash,
            key_prefix=key_prefix,
            scopes=[scope.value for scope in api_key_data.scopes],
            rate_limit=api_key_data.rate_limit,
            expires_at=api_key_data.expires_at,
            description=api_key_data.description,
            status=ApiKeyStatus.ACTIVE.value,
            is_active=True
        )
        
        self.db.add(db_api_key)
        self.db.commit()
        self.db.refresh(db_api_key)
        
        logger.info(f"Created API key {db_api_key.id} for user {user_id}")
        
        return db_api_key, full_key
    
    def get_api_keys(
        self, 
        user_id: uuid.UUID, 
        active_only: bool = False,
        limit: int = 10, 
        offset: int = 0
    ) -> Tuple[List[ApiKey], int]:
        """
        Get user's API keys with pagination.
        
        Args:
            user_id: User ID
            active_only: Filter to only active keys
            limit: Number of keys to return
            offset: Pagination offset
            
        Returns:
            Tuple of (api_keys_list, total_count)
        """
        query = self.db.query(ApiKey).filter(ApiKey.user_id == user_id)
        
        if active_only:
            query = query.filter(
                ApiKey.is_active == True,
                ApiKey.status == ApiKeyStatus.ACTIVE.value
            )
        
        total = query.count()
        api_keys = query.order_by(desc(ApiKey.created_at)).offset(offset).limit(limit).all()
        
        return api_keys, total
    
    def get_api_key(self, user_id: uuid.UUID, api_key_id: uuid.UUID) -> ApiKey:
        """
        Get a specific API key.
        
        Args:
            user_id: User ID
            api_key_id: API key ID
            
        Returns:
            ApiKey instance
        """
        api_key = self.db.query(ApiKey).filter(
            ApiKey.id == api_key_id,
            ApiKey.user_id == user_id
        ).first()
        
        if not api_key:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="API key not found"
            )
        
        return api_key
    
    def update_api_key(
        self, 
        user_id: uuid.UUID, 
        api_key_id: uuid.UUID, 
        api_key_data: ApiKeyUpdate
    ) -> ApiKey:
        """
        Update an existing API key.
        
        Args:
            user_id: User ID
            api_key_id: API key ID
            api_key_data: Update data
            
        Returns:
            Updated ApiKey instance
        """
        api_key = self.get_api_key(user_id, api_key_id)
        
        # Check if trying to update name to existing name
        if api_key_data.name and api_key_data.name != api_key.name:
            existing_name = self.db.query(ApiKey).filter(
                ApiKey.user_id == user_id,
                ApiKey.name == api_key_data.name,
                ApiKey.id != api_key_id,
                ApiKey.status != ApiKeyStatus.REVOKED.value
            ).first()
            
            if existing_name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="API key name already exists"
                )
        
        # Update fields
        for field, value in api_key_data.dict(exclude_unset=True).items():
            if field == "scopes" and value is not None:
                value = [scope.value if hasattr(scope, 'value') else scope for scope in value]
            setattr(api_key, field, value)
        
        api_key.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(api_key)
        
        logger.info(f"Updated API key {api_key_id} for user {user_id}")
        
        return api_key
    
    def regenerate_api_key(self, user_id: uuid.UUID, api_key_id: uuid.UUID) -> Tuple[ApiKey, str]:
        """
        Regenerate an API key (create new key string).
        
        Args:
            user_id: User ID
            api_key_id: API key ID
            
        Returns:
            Tuple of (ApiKey instance, new_full_key)
        """
        api_key = self.get_api_key(user_id, api_key_id)
        
        if api_key.status == ApiKeyStatus.REVOKED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot regenerate revoked API key"
            )
        
        # Generate new key
        full_key, key_hash, key_prefix = self.generate_api_key()
        
        # Update the key
        api_key.key_hash = key_hash
        api_key.key_prefix = key_prefix
        api_key.updated_at = datetime.utcnow()
        api_key.last_used_at = None  # Reset usage
        api_key.usage_count = 0
        
        self.db.commit()
        self.db.refresh(api_key)
        
        logger.info(f"Regenerated API key {api_key_id} for user {user_id}")
        
        return api_key, full_key
    
    def revoke_api_key(self, user_id: uuid.UUID, api_key_id: uuid.UUID, revoked_by: uuid.UUID = None) -> ApiKey:
        """
        Revoke an API key.
        
        Args:
            user_id: User ID
            api_key_id: API key ID
            revoked_by: User ID who revoked the key (for audit)
            
        Returns:
            Revoked ApiKey instance
        """
        api_key = self.get_api_key(user_id, api_key_id)
        
        api_key.status = ApiKeyStatus.REVOKED.value
        api_key.is_active = False
        api_key.revoked_at = datetime.utcnow()
        api_key.revoked_by = revoked_by or user_id
        api_key.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(api_key)
        
        logger.info(f"Revoked API key {api_key_id} for user {user_id}")
        
        return api_key
    
    def delete_api_key(self, user_id: uuid.UUID, api_key_id: uuid.UUID) -> None:
        """
        Permanently delete an API key.
        
        Args:
            user_id: User ID
            api_key_id: API key ID
        """
        api_key = self.get_api_key(user_id, api_key_id)
        
        self.db.delete(api_key)
        self.db.commit()
        
        logger.info(f"Deleted API key {api_key_id} for user {user_id}")
    
    def log_api_key_usage(
        self, 
        api_key_id: uuid.UUID, 
        endpoint: str, 
        method: str, 
        status_code: int,
        response_time_ms: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        error_message: Optional[str] = None,
        request_size: Optional[int] = None,
        response_size: Optional[int] = None
    ) -> None:
        """
        Log API key usage for analytics and rate limiting.
        
        Args:
            api_key_id: API key ID
            endpoint: Request endpoint
            method: HTTP method
            status_code: Response status code
            response_time_ms: Response time in milliseconds
            ip_address: Client IP address
            user_agent: Client user agent
            error_message: Error message if any
            request_size: Request size in bytes
            response_size: Response size in bytes
        """
        usage_log = ApiKeyUsageLog(
            api_key_id=api_key_id,
            endpoint=endpoint,
            method=method,
            status_code=status_code,
            response_time_ms=response_time_ms,
            ip_address=ip_address,
            user_agent=user_agent,
            error_message=error_message,
            request_size=request_size,
            response_size=response_size
        )
        
        self.db.add(usage_log)
        self.db.commit()
    
    def get_api_key_usage_stats(self, user_id: uuid.UUID, api_key_id: uuid.UUID) -> Dict[str, Any]:
        """
        Get usage statistics for an API key.
        
        Args:
            user_id: User ID
            api_key_id: API key ID
            
        Returns:
            Dictionary with usage statistics
        """
        # Verify ownership
        api_key = self.get_api_key(user_id, api_key_id)
        
        # Base query
        base_query = self.db.query(ApiKeyUsageLog).filter(
            ApiKeyUsageLog.api_key_id == api_key_id
        )
        
        # Time ranges
        now = datetime.utcnow()
        day_ago = now - timedelta(days=1)
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        
        # Basic counts
        total_requests = base_query.count()
        requests_24h = base_query.filter(ApiKeyUsageLog.created_at >= day_ago).count()
        requests_7d = base_query.filter(ApiKeyUsageLog.created_at >= week_ago).count()
        requests_30d = base_query.filter(ApiKeyUsageLog.created_at >= month_ago).count()
        
        # Average response time
        avg_response_time = self.db.query(func.avg(ApiKeyUsageLog.response_time_ms)).filter(
            ApiKeyUsageLog.api_key_id == api_key_id,
            ApiKeyUsageLog.response_time_ms.isnot(None)
        ).scalar()
        
        # Success rate
        successful_requests = base_query.filter(
            ApiKeyUsageLog.status_code >= 200,
            ApiKeyUsageLog.status_code < 400
        ).count()
        success_rate = (successful_requests / total_requests * 100) if total_requests > 0 else 0
        
        # Most used endpoints
        most_used = self.db.query(
            ApiKeyUsageLog.endpoint,
            func.count(ApiKeyUsageLog.id).label('count')
        ).filter(
            ApiKeyUsageLog.api_key_id == api_key_id
        ).group_by(ApiKeyUsageLog.endpoint).order_by(desc('count')).limit(10).all()
        
        most_used_endpoints = [{"endpoint": endpoint, "count": count} for endpoint, count in most_used]
        
        # Error distribution
        error_dist = self.db.query(
            func.cast(ApiKeyUsageLog.status_code, String).label('status_code'),
            func.count(ApiKeyUsageLog.id).label('count')
        ).filter(
            ApiKeyUsageLog.api_key_id == api_key_id,
            ApiKeyUsageLog.status_code >= 400
        ).group_by(ApiKeyUsageLog.status_code).all()
        
        error_distribution = {str(status_code): count for status_code, count in error_dist}
        
        # Hourly usage for last 24 hours
        hourly_usage = []
        for i in range(24):
            hour_start = now - timedelta(hours=i+1)
            hour_end = now - timedelta(hours=i)
            count = base_query.filter(
                ApiKeyUsageLog.created_at >= hour_start,
                ApiKeyUsageLog.created_at < hour_end
            ).count()
            hourly_usage.append({
                "hour": hour_start.isoformat(),
                "requests": count
            })
        
        return {
            "total_requests": total_requests,
            "requests_last_24h": requests_24h,
            "requests_last_7d": requests_7d,
            "requests_last_30d": requests_30d,
            "avg_response_time_ms": float(avg_response_time) if avg_response_time else None,
            "success_rate": round(success_rate, 2),
            "most_used_endpoints": most_used_endpoints,
            "error_distribution": error_distribution,
            "hourly_usage": list(reversed(hourly_usage))  # Most recent first
        }
    
    # Developer Application methods
    
    def create_developer_application(
        self, 
        user_id: uuid.UUID, 
        app_data: DeveloperApplicationCreate
    ) -> DeveloperApplication:
        """
        Create a new developer application.
        
        Args:
            user_id: User ID
            app_data: Application data
            
        Returns:
            DeveloperApplication instance
        """
        # Check if user exists
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check for duplicate names
        existing_name = self.db.query(DeveloperApplication).filter(
            DeveloperApplication.user_id == user_id,
            DeveloperApplication.name == app_data.name
        ).first()
        
        if existing_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Application name already exists"
            )
        
        # Create application
        db_app = DeveloperApplication(
            user_id=user_id,
            name=app_data.name,
            description=app_data.description,
            website_url=str(app_data.website_url) if app_data.website_url else None,
            callback_urls=app_data.callback_urls,
            app_type=app_data.app_type.value,
            category=app_data.category
        )
        
        self.db.add(db_app)
        self.db.commit()
        self.db.refresh(db_app)
        
        logger.info(f"Created developer application {db_app.id} for user {user_id}")
        
        return db_app
    
    def get_developer_applications(
        self, 
        user_id: uuid.UUID, 
        limit: int = 10, 
        offset: int = 0
    ) -> Tuple[List[DeveloperApplication], int]:
        """
        Get user's developer applications.
        
        Args:
            user_id: User ID
            limit: Number of applications to return
            offset: Pagination offset
            
        Returns:
            Tuple of (applications_list, total_count)
        """
        query = self.db.query(DeveloperApplication).filter(
            DeveloperApplication.user_id == user_id
        )
        
        total = query.count()
        apps = query.order_by(desc(DeveloperApplication.created_at)).offset(offset).limit(limit).all()
        
        return apps, total
    
    def get_developer_application(self, user_id: uuid.UUID, app_id: uuid.UUID) -> DeveloperApplication:
        """
        Get a specific developer application.
        
        Args:
            user_id: User ID
            app_id: Application ID
            
        Returns:
            DeveloperApplication instance
        """
        app = self.db.query(DeveloperApplication).filter(
            DeveloperApplication.id == app_id,
            DeveloperApplication.user_id == user_id
        ).first()
        
        if not app:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Developer application not found"
            )
        
        return app
    
    def update_developer_application(
        self, 
        user_id: uuid.UUID, 
        app_id: uuid.UUID, 
        app_data: DeveloperApplicationUpdate
    ) -> DeveloperApplication:
        """
        Update a developer application.
        
        Args:
            user_id: User ID
            app_id: Application ID
            app_data: Update data
            
        Returns:
            Updated DeveloperApplication instance
        """
        app = self.get_developer_application(user_id, app_id)
        
        # Check for duplicate names
        if app_data.name and app_data.name != app.name:
            existing_name = self.db.query(DeveloperApplication).filter(
                DeveloperApplication.user_id == user_id,
                DeveloperApplication.name == app_data.name,
                DeveloperApplication.id != app_id
            ).first()
            
            if existing_name:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Application name already exists"
                )
        
        # Update fields
        for field, value in app_data.dict(exclude_unset=True).items():
            if field == "website_url" and value is not None:
                value = str(value)
            elif field == "app_type" and value is not None:
                value = value.value if hasattr(value, 'value') else value
            setattr(app, field, value)
        
        app.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(app)
        
        logger.info(f"Updated developer application {app_id} for user {user_id}")
        
        return app
    
    def delete_developer_application(self, user_id: uuid.UUID, app_id: uuid.UUID) -> None:
        """
        Delete a developer application.
        
        Args:
            user_id: User ID
            app_id: Application ID
        """
        app = self.get_developer_application(user_id, app_id)
        
        self.db.delete(app)
        self.db.commit()
        
        logger.info(f"Deleted developer application {app_id} for user {user_id}")