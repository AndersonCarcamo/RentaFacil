from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
from enum import Enum
import re


class UserRole(str, Enum):
    USER = "user"
    TENANT = "tenant"
    LANDLORD = "landlord"
    AGENT = "agent"
    ADMIN = "admin"


class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"


# Request schemas
class UserRegisterRequest(BaseModel):
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    firebase_uid: Optional[str] = None
    role: UserRole = UserRole.USER
    national_id: Optional[str] = None
    national_id_type: str = "DNI"

    @validator('phone')
    def validate_phone(cls, v):
        if v and not re.match(r'^\+[1-9]\d{1,14}$', v):
            raise ValueError('Phone must be in E.164 format (+1234567890)')
        return v


class UserLoginRequest(BaseModel):
    firebase_token: str = Field(..., description="Firebase ID token")
    
    @validator('firebase_token')
    def validate_firebase_token(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Firebase token cannot be empty')
        return v.strip()


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# Response schemas
class UserResponse(BaseModel):
    id: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    phone: Optional[str]
    profile_picture_url: Optional[str]
    national_id: Optional[str]
    national_id_type: Optional[str]
    role: UserRole
    is_verified: bool
    is_active: bool
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


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


# Base response schemas
class MessageResponse(BaseModel):
    message: str


class ErrorResponse(BaseModel):
    detail: str


class ValidationErrorResponse(BaseModel):
    detail: list
    message: str = "Validation error"


class ValidationMixin:
    """Mixin class for common validations."""
    
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
            # Remove extra whitespace
            v = v.strip()
            # Check for minimum length
            if len(v) < 1:
                raise ValueError("Name cannot be empty")
            # Check for maximum length
            if len(v) > 100:
                raise ValueError("Name cannot exceed 100 characters")
            return v
        return v
    
    @validator('phone', pre=True)
    def validate_phone_number(cls, v):
        """Validate phone number."""
        if v and not re.match(r'^\+[1-9]\d{1,14}$', v):
            raise ValueError('Phone must be in E.164 format (+1234567890)')
        return v
