"""
Constants for the EasyRent API application.
"""

# HTTP Status Messages
STATUS_MESSAGES = {
    "USER_CREATED": "User created successfully",
    "LOGIN_SUCCESS": "Login successful",
    "LOGOUT_SUCCESS": "Successfully logged out",
    "TOKEN_REFRESHED": "Token refreshed successfully",
    "PASSWORD_RESET_SENT": "If the email exists, a password reset link has been sent",
    "PASSWORD_RESET_SUCCESS": "Password has been reset successfully",
    "EMAIL_VERIFIED": "Email has been verified successfully",
    "EMAIL_ALREADY_VERIFIED": "Email is already verified",
    "VERIFICATION_SENT": "Verification email has been sent",
    "PROFILE_UPDATED": "Profile updated successfully",
    "ACCOUNT_DELETED": "Account deleted successfully",
}

# Error Messages
ERROR_MESSAGES = {
    "EMAIL_EXISTS": "Email already registered",
    "INVALID_CREDENTIALS": "Incorrect email or password",
    "ACCOUNT_SUSPENDED": "Account is suspended",
    "INVALID_TOKEN": "Invalid or expired token",
    "USER_NOT_FOUND": "User not found",
    "INVALID_REFRESH_TOKEN": "Invalid refresh token",
    "EMAIL_NOT_VERIFIED": "Email not verified",
    "ACCOUNT_INACTIVE": "User account is not active",
    "INVALID_PASSWORD": "Current password is incorrect",
    "TOKEN_EXPIRED": "Token has expired",
    "VERIFICATION_FAILED": "Email verification failed",
}

# Validation Messages
VALIDATION_MESSAGES = {
    "PASSWORD_MIN_LENGTH": "Password must be at least 8 characters long",
    "PASSWORD_REQUIRE_LETTER": "Password must contain at least one letter",
    "PASSWORD_REQUIRE_NUMBER": "Password must contain at least one number",
    "PHONE_INVALID_FORMAT": "Phone must be in E.164 format (+1234567890)",
    "EMAIL_INVALID": "Invalid email format",
}

# User Roles and Permissions
USER_PERMISSIONS = {
    "user": ["read:own_profile", "update:own_profile"],
    "tenant": ["read:own_profile", "update:own_profile", "create:rental_requests"],
    "landlord": ["read:own_profile", "update:own_profile", "create:listings", "manage:own_listings"],
    "agent": ["read:own_profile", "update:own_profile", "create:listings", "manage:assigned_listings"],
    "admin": ["*"],  # All permissions
}

# Rate Limiting
RATE_LIMITS = {
    "auth_endpoints": "5/minute",
    "general_endpoints": "60/minute",
    "upload_endpoints": "10/minute",
}

# File Upload
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".wmv", ".mkv"}
ALLOWED_DOCUMENT_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt"}

MAX_FILE_SIZES = {
    "image": 10 * 1024 * 1024,  # 10MB
    "video": 100 * 1024 * 1024,  # 100MB
    "document": 5 * 1024 * 1024,  # 5MB
}

# Cache Keys
CACHE_KEYS = {
    "user_session": "user_session:{user_id}",
    "email_verification": "email_verification:{email}",
    "password_reset": "password_reset:{email}",
    "rate_limit": "rate_limit:{endpoint}:{ip}",
}

# Email Templates
EMAIL_TEMPLATES = {
    "verification": "email_verification.html",
    "password_reset": "password_reset.html",
    "welcome": "welcome.html",
    "account_suspended": "account_suspended.html",
}
