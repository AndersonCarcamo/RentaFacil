"""
Webhook models for EasyRent API.
"""

from sqlalchemy import Column, String, Text, Boolean, DateTime, JSON, ForeignKey, Enum, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.core.database import Base


class WebhookEventType(str, enum.Enum):
    """Supported webhook event types"""
    LISTING_CREATED = "listing.created"
    LISTING_UPDATED = "listing.updated"
    LISTING_DELETED = "listing.deleted"
    USER_REGISTERED = "user.registered"
    PAYMENT_COMPLETED = "payment.completed"
    LEAD_CREATED = "lead.created"


class WebhookStatus(str, enum.Enum):
    """Webhook delivery status"""
    PENDING = "pending"
    SUCCESSFUL = "successful"
    FAILED = "failed"
    RETRYING = "retrying"


class Webhook(Base):
    """Webhook configuration model"""
    __tablename__ = "webhooks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Webhook configuration
    url = Column(String(2048), nullable=False)
    events = Column(JSON, nullable=False)  # List of event types
    secret = Column(String(255), nullable=True)  # For signature verification
    active = Column(Boolean, default=True, nullable=False)
    
    # Metadata
    name = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_triggered_at = Column(DateTime(timezone=True), nullable=True)
    
    # Statistics
    total_deliveries = Column(Integer, default=0)
    successful_deliveries = Column(Integer, default=0)
    failed_deliveries = Column(Integer, default=0)
    
    # Relationships
    user = relationship("User", back_populates="webhooks")
    deliveries = relationship("WebhookDelivery", back_populates="webhook", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Webhook(id={self.id}, url={self.url}, active={self.active})>"


class WebhookDelivery(Base):
    """Webhook delivery attempt model"""
    __tablename__ = "webhook_deliveries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    webhook_id = Column(UUID(as_uuid=True), ForeignKey("webhooks.id"), nullable=False)
    
    # Delivery details
    event_type = Column(Enum(WebhookEventType), nullable=False)
    status = Column(Enum(WebhookStatus), default=WebhookStatus.PENDING, nullable=False)
    
    # Request/Response data
    payload = Column(JSON, nullable=False)
    response_status_code = Column(Integer, nullable=True)
    response_body = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Retry information
    attempt_count = Column(Integer, default=1)
    max_retries = Column(Integer, default=3)
    next_retry_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    webhook = relationship("Webhook", back_populates="deliveries")

    def __repr__(self):
        return f"<WebhookDelivery(id={self.id}, webhook_id={self.webhook_id}, status={self.status})>"


class WebhookEvent(Base):
    """Webhook event log model"""
    __tablename__ = "webhook_event_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Event details
    event_type = Column(Enum(WebhookEventType), nullable=False)
    resource_type = Column(String(100), nullable=False)  # listing, user, payment, etc.
    resource_id = Column(UUID(as_uuid=True), nullable=False)
    
    # Event data
    event_data = Column(JSON, nullable=False)
    triggered_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Processing status
    processed = Column(Boolean, default=False)
    webhook_count = Column(Integer, default=0)  # Number of webhooks triggered
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    triggered_by = relationship("User")

    def __repr__(self):
        return f"<WebhookEvent(id={self.id}, event_type={self.event_type}, resource_type={self.resource_type})>"