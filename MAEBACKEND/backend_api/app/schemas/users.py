"""
User management schemas for EasyRent API.
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
import re
from app.schemas.auth import UserRole
from app.core.validators import validate_name


class UserPreferences(BaseModel):
    """User preferences schema."""
    language: str = Field(default="es", description="Preferred language")
    currency: str = Field(default="PEN", description="Preferred currency")
    notifications_email: bool = Field(default=True)
    notifications_sms: bool = Field(default=False)
    notifications_push: bool = Field(default=True)
    newsletter_subscription: bool = Field(default=False)
    search_alerts: bool = Field(default=True)
    
    @validator('language')
    def validate_language(cls, v):
        allowed_languages = ['es', 'en', 'pt']
        if v not in allowed_languages:
            raise ValueError(f'Language must be one of: {allowed_languages}')
        return v
    
    @validator('currency')
    def validate_currency(cls, v):
        allowed_currencies = ['PEN', 'USD', 'EUR']
        if v not in allowed_currencies:
            raise ValueError(f'Currency must be one of: {allowed_currencies}')
        return v


class PrivacySettings(BaseModel):
    """User privacy settings schema."""
    profile_visible: bool = Field(default=True, description="Profile visible to other users")
    show_phone: bool = Field(default=True, description="Show phone number")
    show_email: bool = Field(default=False, description="Show email address")
    allow_contact: bool = Field(default=True, description="Allow other users to contact")
    show_last_active: bool = Field(default=True, description="Show last activity")
    analytics_tracking: bool = Field(default=True, description="Allow analytics tracking")


class UpdateUserRequest(BaseModel):
    """Update user request schema."""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    bio: Optional[str] = Field(None, max_length=500)
    # Role upgrade fields
    role: Optional[UserRole] = Field(None, description="User role")
    national_id: Optional[str] = Field(None, max_length=20, description="National ID number")
    national_id_type: Optional[str] = Field(None, max_length=10, description="National ID type")
    agency_name: Optional[str] = Field(None, max_length=100, description="Agency name for agents")

    @validator('first_name', 'last_name', pre=True)
    def validate_names(cls, v):
        """Validate name fields."""
        if v:
            return validate_name(v)
        return v
    
    @validator('phone', pre=True)
    def validate_phone_number(cls, v):
        """Validate phone number."""
        if v and not re.match(r'^\+[1-9]\d{1,14}$', v):
            raise ValueError('Phone must be in E.164 format (+1234567890)')
        return v


class CreateUserRequest(BaseModel):
    """Create user request schema (for admin)."""
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    role: UserRole = UserRole.USER
    
    @validator('email', pre=True)
    def validate_email(cls, v):
        """Validate and normalize email."""
        if v:
            return v.lower().strip()
        return v
    
    @validator('first_name', 'last_name', pre=True)
    def validate_names(cls, v):
        """Validate name fields."""
        if v:
            return validate_name(v)
        return v
    
    @validator('phone', pre=True)
    def validate_phone_number(cls, v):
        """Validate phone number."""
        if v and not re.match(r'^\+[1-9]\d{1,14}$', v):
            raise ValueError('Phone must be in E.164 format (+1234567890)')
        return v


class UserListFilters(BaseModel):
    """Filters for user listing."""
    role: Optional[UserRole] = None
    search: Optional[str] = Field(None, max_length=100)
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)


class DeleteAccountRequest(BaseModel):
    """Delete account request schema."""
    reason: Optional[str] = Field(None, max_length=500, description="Reason for deletion")


# Response schemas
class UserDetailResponse(BaseModel):
    """Detailed user response schema."""
    id: str
    email: str
    first_name: str
    last_name: str
    phone: Optional[str]
    bio: Optional[str]
    profile_picture_url: Optional[str] = Field(None, alias="avatar_url")
    role: UserRole
    is_verified: bool
    is_active: bool
    national_id: Optional[str]
    national_id_type: Optional[str]
    last_login_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    @validator('id', pre=True)
    def convert_uuid_to_string(cls, v):
        """Convert UUID to string."""
        if hasattr(v, '__str__'):
            return str(v)
        return v

    class Config:
        from_attributes = True
        populate_by_name = True


class UserPublicResponse(BaseModel):
    """Public user response schema (limited information)."""
    id: str
    first_name: str
    last_name: str
    profile_picture_url: Optional[str] = Field(None, alias="avatar_url")
    role: UserRole
    is_verified: bool
    created_at: datetime

    @validator('id', pre=True)
    def convert_uuid_to_string(cls, v):
        """Convert UUID to string."""
        if hasattr(v, '__str__'):
            return str(v)
        return v

    class Config:
        from_attributes = True
        populate_by_name = True


class PaginatedUsers(BaseModel):
    """Paginated users response."""
    data: List[UserDetailResponse]
    total: int
    page: int
    limit: int
    pages: int
    has_next: bool
    has_prev: bool


class MessageResponse(BaseModel):
    """Generic message response."""
    message: str


class AvatarUploadResponse(BaseModel):
    """Avatar upload response."""
    message: str
    avatar_url: str
