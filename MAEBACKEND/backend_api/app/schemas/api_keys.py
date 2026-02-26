"""
API Key schemas for EasyRent API.
"""

from pydantic import BaseModel, Field, validator, HttpUrl
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
from enum import Enum


class ApiKeyScope(str, Enum):
    """API Key scopes for permissions."""
    READ = "read"
    WRITE = "write"  
    ADMIN = "admin"


class ApiKeyStatus(str, Enum):
    """API Key status."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    REVOKED = "revoked"
    EXPIRED = "expired"


class AppType(str, Enum):
    """Developer application types."""
    WEB = "web"
    MOBILE = "mobile"
    SERVER = "server"
    DESKTOP = "desktop"
    OTHER = "other"


# API Key schemas

class ApiKeyCreate(BaseModel):
    """Schema for creating API keys."""
    name: str = Field(..., min_length=3, max_length=255, description="API key name")
    description: Optional[str] = Field(None, max_length=1000, description="API key description")
    scopes: List[ApiKeyScope] = Field(default=[ApiKeyScope.READ], description="API key permissions")
    rate_limit: int = Field(default=1000, ge=1, le=100000, description="Requests per hour limit")
    expires_at: Optional[datetime] = Field(None, description="Expiration date (optional)")
    application_id: Optional[uuid.UUID] = Field(None, description="Associated application ID")
    
    @validator('name')
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()
    
    @validator('scopes')
    def validate_scopes(cls, v):
        if not v:
            raise ValueError('At least one scope is required')
        # Remove duplicates while preserving order
        seen = set()
        unique_scopes = []
        for scope in v:
            if scope not in seen:
                seen.add(scope)
                unique_scopes.append(scope)
        return unique_scopes

    class Config:
        json_schema_extra = {
            "example": {
                "name": "My App API Key",
                "description": "API key for my mobile application",
                "scopes": ["read", "write"],
                "rate_limit": 5000,
                "expires_at": "2024-12-31T23:59:59"
            }
        }


class ApiKeyUpdate(BaseModel):
    """Schema for updating API keys."""
    name: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    scopes: Optional[List[ApiKeyScope]] = Field(None)
    rate_limit: Optional[int] = Field(None, ge=1, le=100000)
    is_active: Optional[bool] = Field(None, description="Enable/disable the API key")
    expires_at: Optional[datetime] = Field(None)
    
    @validator('name')
    def validate_name(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip() if v else v
    
    @validator('scopes')
    def validate_scopes(cls, v):
        if v is not None and not v:
            raise ValueError('At least one scope is required')
        if v:
            # Remove duplicates while preserving order
            seen = set()
            unique_scopes = []
            for scope in v:
                if scope not in seen:
                    seen.add(scope)
                    unique_scopes.append(scope)
            return unique_scopes
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Updated API Key Name",
                "scopes": ["read", "write", "admin"],
                "rate_limit": 10000,
                "is_active": True
            }
        }


class ApiKeyResponse(BaseModel):
    """Schema for API key responses."""
    id: uuid.UUID
    name: str
    key_prefix: str
    display_key: str
    description: Optional[str]
    scopes: List[str]
    rate_limit: int
    status: str
    is_active: bool
    expires_at: Optional[datetime]
    last_used_at: Optional[datetime]
    usage_count: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "My App API Key",
                "key_prefix": "pk_live_",
                "display_key": "pk_live_********************",
                "description": "API key for my mobile application",
                "scopes": ["read", "write"],
                "rate_limit": 5000,
                "status": "active",
                "is_active": True,
                "expires_at": "2024-12-31T23:59:59",
                "last_used_at": "2023-10-15T10:30:00",
                "usage_count": 1543,
                "created_at": "2023-09-01T12:00:00",
                "updated_at": "2023-10-15T10:30:00"
            }
        }


class ApiKeyCreateResponse(BaseModel):
    """Schema for API key creation response with full key."""
    id: uuid.UUID
    name: str
    key: str = Field(..., description="Full API key (only shown once)")
    key_prefix: str
    description: Optional[str]
    scopes: List[str]
    rate_limit: int
    status: str
    expires_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class ApiKeyListResponse(BaseModel):
    """Schema for API key list response."""
    data: List[ApiKeyResponse]
    total: int
    page: int
    limit: int

    class Config:
        json_schema_extra = {
            "example": {
                "data": [
                    {
                        "id": "550e8400-e29b-41d4-a716-446655440000",
                        "name": "Production API Key",
                        "display_key": "pk_live_********************",
                        "scopes": ["read", "write"],
                        "status": "active"
                    }
                ],
                "total": 1,
                "page": 1,
                "limit": 10
            }
        }


class ApiKeyRegenerateResponse(BaseModel):
    """Schema for API key regeneration response."""
    key: str = Field(..., description="New API key")
    key_prefix: str
    updated_at: datetime

    class Config:
        json_schema_extra = {
            "example": {
                "key": "pk_live_abcdef1234567890abcdef1234567890",
                "key_prefix": "pk_live_",
                "updated_at": "2023-10-15T10:30:00"
            }
        }


# Usage Log schemas

class ApiKeyUsageLogResponse(BaseModel):
    """Schema for API key usage log response."""
    id: uuid.UUID
    endpoint: str
    method: str
    status_code: int
    response_time_ms: Optional[int]
    ip_address: Optional[str]
    user_agent: Optional[str]
    error_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ApiKeyUsageStatsResponse(BaseModel):
    """Schema for API key usage statistics."""
    total_requests: int
    requests_last_24h: int
    requests_last_7d: int
    requests_last_30d: int
    avg_response_time_ms: Optional[float]
    success_rate: float
    most_used_endpoints: List[Dict[str, Any]]
    error_distribution: Dict[str, int]
    hourly_usage: List[Dict[str, Any]]

    class Config:
        json_schema_extra = {
            "example": {
                "total_requests": 15430,
                "requests_last_24h": 243,
                "requests_last_7d": 1820,
                "requests_last_30d": 7650,
                "avg_response_time_ms": 145.3,
                "success_rate": 98.7,
                "most_used_endpoints": [
                    {"endpoint": "/v1/listings", "count": 5430},
                    {"endpoint": "/v1/search", "count": 3210}
                ],
                "error_distribution": {
                    "400": 45,
                    "401": 12,
                    "500": 3
                },
                "hourly_usage": [
                    {"hour": "2023-10-15T10:00:00", "requests": 23}
                ]
            }
        }


# Developer Application schemas

class DeveloperApplicationCreate(BaseModel):
    """Schema for creating developer applications."""
    name: str = Field(..., min_length=3, max_length=255, description="Application name")
    description: Optional[str] = Field(None, max_length=2000, description="Application description")
    website_url: Optional[HttpUrl] = Field(None, description="Application website")
    callback_urls: List[str] = Field(default=[], description="OAuth callback URLs")
    app_type: AppType = Field(default=AppType.WEB, description="Application type")
    category: Optional[str] = Field(None, max_length=100, description="Application category")
    
    @validator('name')
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()
    
    @validator('callback_urls')
    def validate_callback_urls(cls, v):
        if v:
            for url in v:
                if not url.startswith(('http://', 'https://')):
                    raise ValueError(f'Invalid callback URL: {url}')
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "name": "My Real Estate App",
                "description": "A mobile app for property listings",
                "website_url": "https://myapp.com",
                "callback_urls": ["https://myapp.com/callback"],
                "app_type": "mobile",
                "category": "Real Estate"
            }
        }


class DeveloperApplicationUpdate(BaseModel):
    """Schema for updating developer applications."""
    name: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, max_length=2000)
    website_url: Optional[HttpUrl] = Field(None)
    callback_urls: Optional[List[str]] = Field(None)
    app_type: Optional[AppType] = Field(None)
    category: Optional[str] = Field(None, max_length=100)
    
    @validator('name')
    def validate_name(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip() if v else v
    
    @validator('callback_urls')
    def validate_callback_urls(cls, v):
        if v:
            for url in v:
                if not url.startswith(('http://', 'https://')):
                    raise ValueError(f'Invalid callback URL: {url}')
        return v


class DeveloperApplicationResponse(BaseModel):
    """Schema for developer application response."""
    id: uuid.UUID
    name: str
    description: Optional[str]
    website_url: Optional[str]
    callback_urls: List[str]
    app_type: str
    category: Optional[str]
    status: str
    is_approved: bool
    created_at: datetime
    updated_at: datetime
    api_keys_count: Optional[int] = 0

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "name": "My Real Estate App",
                "description": "A mobile app for property listings",
                "website_url": "https://myapp.com",
                "callback_urls": ["https://myapp.com/callback"],
                "app_type": "mobile",
                "category": "Real Estate",
                "status": "active",
                "is_approved": True,
                "api_keys_count": 2,
                "created_at": "2023-09-01T12:00:00",
                "updated_at": "2023-10-15T10:30:00"
            }
        }


class DeveloperApplicationListResponse(BaseModel):
    """Schema for developer application list response."""
    data: List[DeveloperApplicationResponse]
    total: int
    page: int
    limit: int


# Error schemas

class ApiKeyError(BaseModel):
    """Schema for API key errors."""
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "error": "api_key_not_found",
                "message": "The specified API key was not found",
                "details": {
                    "key_id": "550e8400-e29b-41d4-a716-446655440000"
                }
            }
        }