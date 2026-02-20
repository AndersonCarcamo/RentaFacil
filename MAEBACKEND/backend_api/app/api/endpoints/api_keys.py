"""
API Keys endpoints for EasyRent API.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.auth import User
from app.schemas.api_keys import (
    ApiKeyCreate, ApiKeyUpdate, ApiKeyResponse, ApiKeyListResponse,
    ApiKeyCreateResponse, ApiKeyRegenerateResponse, ApiKeyUsageStatsResponse,
    DeveloperApplicationCreate, DeveloperApplicationUpdate, 
    DeveloperApplicationResponse, DeveloperApplicationListResponse,
    ApiKeyError
)
from app.services.api_key_service import ApiKeyService
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()

# API Keys CRUD endpoints

@router.post("/", response_model=ApiKeyCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    api_key_data: ApiKeyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new API key
    
    Creates a new API key with specified permissions and rate limits.
    The full API key is only returned once during creation.
    """
    service = ApiKeyService(db)
    api_key, full_key = service.create_api_key(current_user.id, api_key_data)
    
    response_data = ApiKeyCreateResponse.model_validate(api_key)
    response_data.key = full_key
    
    return response_data


@router.get("/", response_model=ApiKeyListResponse)
async def list_api_keys(
    active_only: bool = Query(False, description="Filter to only active API keys"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List user's API keys
    
    Get a paginated list of API keys created by the current user.
    """
    service = ApiKeyService(db)
    offset = (page - 1) * limit
    
    api_keys, total = service.get_api_keys(
        user_id=current_user.id,
        active_only=active_only,
        limit=limit,
        offset=offset
    )
    
    api_key_responses = [ApiKeyResponse.model_validate(api_key) for api_key in api_keys]
    
    return ApiKeyListResponse(
        data=api_key_responses,
        total=total,
        page=page,
        limit=limit
    )


@router.get("/{key_id}", response_model=ApiKeyResponse)
async def get_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get API key by ID
    
    Retrieve detailed information about a specific API key.
    """
    service = ApiKeyService(db)
    api_key = service.get_api_key(current_user.id, key_id)
    return ApiKeyResponse.model_validate(api_key)


@router.put("/{key_id}", response_model=ApiKeyResponse)
async def update_api_key(
    key_id: uuid.UUID,
    api_key_data: ApiKeyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update API key
    
    Update the configuration of an existing API key.
    """
    service = ApiKeyService(db)
    api_key = service.update_api_key(current_user.id, key_id, api_key_data)
    return ApiKeyResponse.model_validate(api_key)


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete API key
    
    Permanently delete an API key. This action cannot be undone.
    """
    service = ApiKeyService(db)
    service.delete_api_key(current_user.id, key_id)


@router.post("/{key_id}/regenerate", response_model=ApiKeyRegenerateResponse)
async def regenerate_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Regenerate API key
    
    Generate a new key string for an existing API key.
    The old key will no longer work after regeneration.
    """
    service = ApiKeyService(db)
    api_key, new_key = service.regenerate_api_key(current_user.id, key_id)
    
    return ApiKeyRegenerateResponse(
        key=new_key,
        key_prefix=api_key.key_prefix,
        updated_at=api_key.updated_at
    )


@router.post("/{key_id}/revoke", response_model=ApiKeyResponse)
async def revoke_api_key(
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Revoke API key
    
    Revoke an API key making it unusable. This is reversible by reactivating.
    """
    service = ApiKeyService(db)
    api_key = service.revoke_api_key(current_user.id, key_id, current_user.id)
    return ApiKeyResponse.model_validate(api_key)


# API Key Usage and Statistics

@router.get("/{key_id}/stats", response_model=ApiKeyUsageStatsResponse)
async def get_api_key_statistics(
    key_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get API key usage statistics
    
    Get comprehensive usage statistics for a specific API key including
    request counts, response times, error rates, and usage patterns.
    """
    service = ApiKeyService(db)
    stats = service.get_api_key_usage_stats(current_user.id, key_id)
    return ApiKeyUsageStatsResponse(**stats)


# Bulk operations

@router.post("/bulk/revoke")
async def bulk_revoke_api_keys(
    key_ids: List[uuid.UUID],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Bulk revoke API keys
    
    Revoke multiple API keys at once.
    """
    service = ApiKeyService(db)
    results = []
    
    for key_id in key_ids:
        try:
            api_key = service.revoke_api_key(current_user.id, key_id, current_user.id)
            results.append({
                "key_id": str(key_id),
                "success": True,
                "message": "API key revoked",
                "status": api_key.status
            })
        except HTTPException as e:
            results.append({
                "key_id": str(key_id),
                "success": False,
                "error": e.detail
            })
        except Exception as e:
            results.append({
                "key_id": str(key_id),
                "success": False,
                "error": str(e)
            })
    
    return {
        "success": True,
        "results": results
    }


@router.post("/bulk/activate")
async def bulk_activate_api_keys(
    key_ids: List[uuid.UUID],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Bulk activate API keys
    
    Activate multiple API keys at once.
    """
    service = ApiKeyService(db)
    results = []
    
    for key_id in key_ids:
        try:
            # Get the key first to check if it can be activated
            api_key = service.get_api_key(current_user.id, key_id)
            
            if api_key.status == "revoked":
                results.append({
                    "key_id": str(key_id),
                    "success": False,
                    "error": "Cannot activate revoked API key"
                })
                continue
            
            # Update to active
            from app.schemas.api_keys import ApiKeyUpdate
            updated_key = service.update_api_key(
                current_user.id, 
                key_id, 
                ApiKeyUpdate(is_active=True)
            )
            
            results.append({
                "key_id": str(key_id),
                "success": True,
                "message": "API key activated",
                "status": updated_key.status
            })
            
        except HTTPException as e:
            results.append({
                "key_id": str(key_id),
                "success": False,
                "error": e.detail
            })
        except Exception as e:
            results.append({
                "key_id": str(key_id),
                "success": False,
                "error": str(e)
            })
    
    return {
        "success": True,
        "results": results
    }


# Developer Applications endpoints

@router.post("/apps", response_model=DeveloperApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_developer_application(
    app_data: DeveloperApplicationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new developer application
    
    Create a developer application to organize your API keys and projects.
    """
    service = ApiKeyService(db)
    app = service.create_developer_application(current_user.id, app_data)
    
    response_data = DeveloperApplicationResponse.model_validate(app)
    response_data.api_keys_count = len(app.api_keys) if hasattr(app, 'api_keys') else 0
    
    return response_data


@router.get("/apps", response_model=DeveloperApplicationListResponse)
async def list_developer_applications(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List developer applications
    
    Get a paginated list of developer applications created by the current user.
    """
    service = ApiKeyService(db)
    offset = (page - 1) * limit
    
    apps, total = service.get_developer_applications(
        user_id=current_user.id,
        limit=limit,
        offset=offset
    )
    
    app_responses = []
    for app in apps:
        app_data = DeveloperApplicationResponse.model_validate(app)
        app_data.api_keys_count = len(app.api_keys) if hasattr(app, 'api_keys') else 0
        app_responses.append(app_data)
    
    return DeveloperApplicationListResponse(
        data=app_responses,
        total=total,
        page=page,
        limit=limit
    )


@router.get("/apps/{app_id}", response_model=DeveloperApplicationResponse)
async def get_developer_application(
    app_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get developer application by ID
    
    Retrieve detailed information about a specific developer application.
    """
    service = ApiKeyService(db)
    app = service.get_developer_application(current_user.id, app_id)
    
    response_data = DeveloperApplicationResponse.model_validate(app)
    response_data.api_keys_count = len(app.api_keys) if hasattr(app, 'api_keys') else 0
    
    return response_data


@router.put("/apps/{app_id}", response_model=DeveloperApplicationResponse)
async def update_developer_application(
    app_id: uuid.UUID,
    app_data: DeveloperApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update developer application
    
    Update the configuration of an existing developer application.
    """
    service = ApiKeyService(db)
    app = service.update_developer_application(current_user.id, app_id, app_data)
    
    response_data = DeveloperApplicationResponse.model_validate(app)
    response_data.api_keys_count = len(app.api_keys) if hasattr(app, 'api_keys') else 0
    
    return response_data


@router.delete("/apps/{app_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_developer_application(
    app_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete developer application
    
    Permanently delete a developer application and all associated API keys.
    """
    service = ApiKeyService(db)
    service.delete_developer_application(current_user.id, app_id)


# System utilities for API key validation (internal use)

@router.post("/validate")
async def validate_api_key(
    api_key: str,
    db: Session = Depends(get_db)
):
    """
    Validate API key (internal endpoint)
    
    This endpoint is used internally by the API gateway or middleware
    to validate API keys. It should be protected or rate-limited.
    """
    service = ApiKeyService(db)
    db_api_key = service.verify_api_key(api_key)
    
    if not db_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    return {
        "valid": True,
        "key_id": str(db_api_key.id),
        "user_id": str(db_api_key.user_id),
        "scopes": db_api_key.scopes,
        "rate_limit": db_api_key.rate_limit
    }


# Developer tools and utilities

@router.get("/docs/guide")
async def get_api_documentation():
    """
    Get API integration guide
    
    Returns comprehensive documentation for API integration including
    authentication, endpoints, rate limits, and best practices.
    """
    return {
        "title": "EasyRent API Integration Guide",
        "version": "1.0.0",
        "sections": {
            "authentication": {
                "title": "Authentication",
                "description": "How to authenticate your API requests",
                "methods": [
                    {
                        "name": "API Key Authentication",
                        "description": "Include your API key in the Authorization header",
                        "example": "Authorization: Bearer pk_live_your_api_key_here",
                        "header_name": "Authorization",
                        "header_value": "Bearer {api_key}"
                    }
                ]
            },
            "rate_limits": {
                "title": "Rate Limits",
                "description": "API request rate limits and quotas",
                "default_limit": 1000,
                "period": "per hour",
                "headers": [
                    "X-RateLimit-Limit",
                    "X-RateLimit-Remaining",
                    "X-RateLimit-Reset"
                ]
            },
            "endpoints": {
                "title": "Available Endpoints",
                "base_url": "https://api.easyrent.com/v1",
                "categories": [
                    {"name": "Listings", "path": "/listings", "description": "Property listings management"},
                    {"name": "Search", "path": "/search", "description": "Property search functionality"},
                    {"name": "Users", "path": "/users", "description": "User management"},
                    {"name": "Agencies", "path": "/agencies", "description": "Agency management"}
                ]
            },
            "scopes": {
                "title": "API Scopes",
                "description": "Available permission scopes for API keys",
                "scopes": [
                    {"name": "read", "description": "Read access to resources"},
                    {"name": "write", "description": "Create and update resources"},
                    {"name": "admin", "description": "Full administrative access"}
                ]
            },
            "best_practices": {
                "title": "Best Practices",
                "recommendations": [
                    "Store API keys securely and never expose them in client-side code",
                    "Use different API keys for different environments (development, staging, production)",
                    "Implement proper error handling for rate limits and authentication failures",
                    "Monitor your API usage through the developer dashboard",
                    "Regenerate API keys regularly for security"
                ]
            }
        }
    }


@router.get("/stats/summary")
async def get_user_api_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get API usage summary for user
    
    Get a high-level summary of API key usage and statistics for the current user.
    """
    service = ApiKeyService(db)
    
    # Get all user's API keys
    api_keys, total_keys = service.get_api_keys(current_user.id, limit=100)
    
    # Count active keys
    active_keys = sum(1 for key in api_keys if key.can_access())
    
    # Get recent usage (simplified)
    total_requests = sum(key.usage_count for key in api_keys)
    
    # Get applications
    apps, total_apps = service.get_developer_applications(current_user.id, limit=100)
    
    return {
        "success": True,
        "data": {
            "total_api_keys": total_keys,
            "active_api_keys": active_keys,
            "total_applications": total_apps,
            "total_requests": total_requests,
            "last_activity": max([key.last_used_at for key in api_keys if key.last_used_at], default=None)
        }
    }