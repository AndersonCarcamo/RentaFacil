"""
Custom validators for Pydantic models.
"""

import re
from typing import Any
from pydantic import validator
from app.core.constants import VALIDATION_MESSAGES


def validate_password(password: str) -> str:
    """Validate password strength."""
    if len(password) < 8:
        raise ValueError(VALIDATION_MESSAGES["PASSWORD_MIN_LENGTH"])
    
    if not re.search(r"[A-Za-z]", password):
        raise ValueError(VALIDATION_MESSAGES["PASSWORD_REQUIRE_LETTER"])
    
    if not re.search(r"\d", password):
        raise ValueError(VALIDATION_MESSAGES["PASSWORD_REQUIRE_NUMBER"])
    
    # Optional: Check for special characters
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        # This is optional, so we'll just log it or make it a warning
        pass
    
    return password


def validate_phone(phone: str) -> str:
    """Validate phone number in E.164 format."""
    if phone and not re.match(r'^\+[1-9]\d{1,14}$', phone):
        raise ValueError(VALIDATION_MESSAGES["PHONE_INVALID_FORMAT"])
    return phone


def validate_email_domain(email: str) -> str:
    """Validate email domain (optional additional validation)."""
    # Add any specific domain validations here
    # For example, blocking certain domains
    blocked_domains = ["tempmail.com", "10minutemail.com", "guerrillamail.com"]
    domain = email.split("@")[1].lower() if "@" in email else ""
    
    if domain in blocked_domains:
        raise ValueError("Email domain is not allowed")
    
    return email.lower()


def validate_name(name: str) -> str:
    """Validate name fields."""
    # Remove extra whitespace
    name = name.strip()
    
    # Check for minimum length
    if len(name) < 1:
        raise ValueError("Name cannot be empty")
    
    # Check for maximum length
    if len(name) > 100:
        raise ValueError("Name cannot exceed 100 characters")
    
    # Check for valid characters (letters, spaces, hyphens, apostrophes)
    if not re.match(r"^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s\-']+$", name):
        raise ValueError("Name contains invalid characters")
    
    return name


def validate_uuid_string(uuid_string: str) -> str:
    """Validate UUID string format."""
    uuid_pattern = re.compile(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
        re.IGNORECASE
    )
    
    if not uuid_pattern.match(uuid_string):
        raise ValueError("Invalid UUID format")
    
    return uuid_string


class ValidationMixin:
    """Mixin class for common validations."""
    
    @validator('email', pre=True)
    def validate_email(cls, v):
        """Validate and normalize email."""
        if v:
            return validate_email_domain(v)
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
        if v:
            return validate_phone(v)
        return v
