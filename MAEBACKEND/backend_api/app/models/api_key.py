"""
API Key models for EasyRent application.
"""

from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Text, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum
from datetime import datetime, timedelta

from app.core.database import Base


class ApiKeyScope(enum.Enum):
    """API Key scopes for permissions."""
    READ = "read"
    WRITE = "write"  
    ADMIN = "admin"


class ApiKeyStatus(enum.Enum):
    """API Key status."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    REVOKED = "revoked"
    EXPIRED = "expired"


class ApiKey(Base):
    """
    API Key model for developer access.
    """
    __tablename__ = "api_keys"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # User relationship
    user_id = Column(UUID(as_uuid=True), ForeignKey("core.users.id", ondelete="CASCADE"), nullable=False)
    
    # API key details
    name = Column(String(255), nullable=False)
    key_hash = Column(String(255), nullable=False, unique=True, index=True)
    key_prefix = Column(String(20), nullable=False)  # First 8 chars for display
    
    # Permissions and limits
    scopes = Column(ARRAY(String), nullable=False, default=list)
    rate_limit = Column(Integer, nullable=False, default=1000)  # requests per hour
    
    # Status and lifecycle
    status = Column(String(20), nullable=False, default=ApiKeyStatus.ACTIVE.value)
    is_active = Column(Boolean, nullable=False, default=True)
    
    # Expiration
    expires_at = Column(DateTime, nullable=True)
    
    # Usage tracking
    last_used_at = Column(DateTime, nullable=True)
    usage_count = Column(Integer, nullable=False, default=0)
    
    # Metadata
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    revoked_at = Column(DateTime, nullable=True)
    revoked_by = Column(UUID(as_uuid=True), ForeignKey("core.users.id"), nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="api_keys")
    revoker = relationship("User", foreign_keys=[revoked_by])
    usage_logs = relationship("ApiKeyUsageLog", back_populates="api_key", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<ApiKey(id={self.id}, name='{self.name}', user_id={self.user_id})>"
    
    @property
    def is_expired(self) -> bool:
        """Check if API key is expired."""
        if not self.expires_at:
            return False
        return datetime.utcnow() > self.expires_at
    
    @property
    def display_key(self) -> str:
        """Return masked key for display."""
        return f"{self.key_prefix}{'*' * 20}"
    
    def has_scope(self, scope: str) -> bool:
        """Check if API key has specific scope."""
        return scope in self.scopes
    
    def can_access(self) -> bool:
        """Check if API key can be used."""
        return (
            self.is_active and 
            self.status == ApiKeyStatus.ACTIVE.value and 
            not self.is_expired
        )


class ApiKeyUsageLog(Base):
    """
    API Key usage logging for analytics and rate limiting.
    """
    __tablename__ = "api_key_usage_logs"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # API key relationship
    api_key_id = Column(UUID(as_uuid=True), ForeignKey("api_keys.id", ondelete="CASCADE"), nullable=False)
    
    # Request details
    endpoint = Column(String(500), nullable=False)
    method = Column(String(10), nullable=False)
    status_code = Column(Integer, nullable=False)
    response_time_ms = Column(Integer, nullable=True)
    
    # Request metadata
    ip_address = Column(String(45), nullable=True)  # IPv6 support
    user_agent = Column(Text, nullable=True)
    request_size = Column(Integer, nullable=True)
    response_size = Column(Integer, nullable=True)
    
    # Error tracking
    error_message = Column(Text, nullable=True)
    
    # Timestamp
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    api_key = relationship("ApiKey", back_populates="usage_logs")
    
    def __repr__(self):
        return f"<ApiKeyUsageLog(id={self.id}, api_key_id={self.api_key_id}, endpoint='{self.endpoint}')>"


class DeveloperApplication(Base):
    """
    Developer application for organizing API keys and projects.
    """
    __tablename__ = "developer_applications"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # User relationship
    user_id = Column(UUID(as_uuid=True), ForeignKey("core.users.id", ondelete="CASCADE"), nullable=False)
    
    # Application details
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    website_url = Column(String(2048), nullable=True)
    callback_urls = Column(ARRAY(String), nullable=False, default=list)
    
    # Application type and category
    app_type = Column(String(50), nullable=False, default="web")  # web, mobile, server, etc.
    category = Column(String(100), nullable=True)
    
    # Status
    status = Column(String(20), nullable=False, default="active")
    is_approved = Column(Boolean, nullable=False, default=True)
    
    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="developer_applications")
    api_keys = relationship("ApiKey", secondary="application_api_keys", back_populates="applications")
    
    def __repr__(self):
        return f"<DeveloperApplication(id={self.id}, name='{self.name}', user_id={self.user_id})>"


# Association table for many-to-many relationship between applications and API keys
from sqlalchemy import Table

application_api_keys = Table(
    'application_api_keys',
    Base.metadata,
    Column('application_id', UUID(as_uuid=True), ForeignKey('developer_applications.id', ondelete='CASCADE')),
    Column('api_key_id', UUID(as_uuid=True), ForeignKey('api_keys.id', ondelete='CASCADE')),
    Column('created_at', DateTime, default=datetime.utcnow)
)


# Add relationship to ApiKey model for applications
ApiKey.applications = relationship("DeveloperApplication", secondary="application_api_keys", back_populates="api_keys")