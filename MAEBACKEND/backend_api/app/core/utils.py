"""
Utility functions for EasyRent API.
"""

import secrets
import string
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from pathlib import Path
import hashlib
import re


def generate_random_string(length: int = 32, include_special: bool = False) -> str:
    """Generate a cryptographically secure random string."""
    alphabet = string.ascii_letters + string.digits
    if include_special:
        alphabet += "!@#$%^&*"
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def generate_uuid() -> str:
    """Generate a new UUID string."""
    return str(uuid.uuid4())


def utc_now() -> datetime:
    """Get current UTC datetime."""
    return datetime.now(timezone.utc)


def normalize_email(email: str) -> str:
    """Normalize email address."""
    return email.lower().strip()


def sanitize_string(text: str, max_length: Optional[int] = None) -> str:
    """Sanitize string input."""
    if not text:
        return ""
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text.strip())
    
    # Truncate if necessary
    if max_length and len(text) > max_length:
        text = text[:max_length]
    
    return text


def format_phone_number(phone: str) -> str:
    """Format phone number to E.164 format."""
    # Remove all non-digit characters
    digits = re.sub(r'\D', '', phone)
    
    # Add + if not present and ensure country code
    if not digits.startswith('+'):
        if len(digits) == 10:  # US number without country code
            digits = '1' + digits
        digits = '+' + digits
    
    return digits


def create_file_hash(file_content: bytes) -> str:
    """Create SHA-256 hash of file content."""
    return hashlib.sha256(file_content).hexdigest()


def get_file_extension(filename: str) -> str:
    """Get file extension from filename."""
    return Path(filename).suffix.lower()


def is_valid_image_type(filename: str) -> bool:
    """Check if file is a valid image type."""
    valid_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'}
    return get_file_extension(filename) in valid_extensions


def format_file_size(size_bytes: int) -> str:
    """Format file size in human readable format."""
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f} {size_names[i]}"


def clean_dict(data: Dict[str, Any], remove_none: bool = True, remove_empty: bool = False) -> Dict[str, Any]:
    """Clean dictionary by removing None or empty values."""
    cleaned = {}
    
    for key, value in data.items():
        if remove_none and value is None:
            continue
        if remove_empty and (value == "" or value == [] or value == {}):
            continue
        cleaned[key] = value
    
    return cleaned


def paginate_query_params(page: int = 1, limit: int = 20, max_limit: int = 100) -> Dict[str, int]:
    """Validate and normalize pagination parameters."""
    page = max(1, page)
    limit = max(1, min(limit, max_limit))
    offset = (page - 1) * limit
    
    return {
        "page": page,
        "limit": limit,
        "offset": offset
    }


def mask_email(email: str) -> str:
    """Mask email address for privacy."""
    if '@' not in email:
        return email
    
    local, domain = email.split('@', 1)
    
    if len(local) <= 2:
        masked_local = '*' * len(local)
    else:
        masked_local = local[0] + '*' * (len(local) - 2) + local[-1]
    
    return f"{masked_local}@{domain}"


def mask_phone(phone: str) -> str:
    """Mask phone number for privacy."""
    if len(phone) <= 4:
        return '*' * len(phone)
    
    return phone[:2] + '*' * (len(phone) - 4) + phone[-2:]


def extract_filename_from_path(file_path: str) -> str:
    """Extract filename from file path."""
    return Path(file_path).name


def is_development_mode() -> bool:
    """Check if application is running in development mode."""
    from app.core.config import settings
    return settings.debug and settings.environment == "development"


def truncate_string(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """Truncate string to specified length."""
    if len(text) <= max_length:
        return text
    
    return text[:max_length - len(suffix)] + suffix


def validate_url(url: str) -> bool:
    """Validate URL format."""
    url_pattern = re.compile(
        r'^https?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    
    return url_pattern.match(url) is not None


def get_client_ip(request) -> str:
    """Extract client IP address from request."""
    # Check for forwarded IP first (when behind proxy)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        # Get the first IP (client's real IP)
        return forwarded_for.split(",")[0].strip()
    
    # Check for real IP header
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fall back to client host
    return request.client.host if request.client else "unknown"
