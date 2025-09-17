"""
Integration models
Models for external integrations, webhooks, and third-party services
"""

from sqlalchemy import Column, String, DateTime, Boolean, Integer, Text, JSON, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.core.database import Base

# Enums
class WebhookEventType(str, enum.Enum):
    PAYMENT_SUCCESS = "payment.success"
    PAYMENT_FAILED = "payment.failed"
    PAYMENT_CANCELLED = "payment.cancelled"
    PAYMENT_REFUNDED = "payment.refunded"
    SUBSCRIPTION_CREATED = "subscription.created"
    SUBSCRIPTION_UPDATED = "subscription.updated"
    SUBSCRIPTION_CANCELLED = "subscription.cancelled"
    WHATSAPP_MESSAGE = "whatsapp.message"
    WHATSAPP_STATUS = "whatsapp.status"

class WebhookStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"
    RETRYING = "retrying"

class IntegrationType(str, enum.Enum):
    PAYMENT = "payment"
    MESSAGING = "messaging"
    MAPS = "maps"
    ANALYTICS = "analytics"
    STORAGE = "storage"

class PaymentProvider(str, enum.Enum):
    STRIPE = "stripe"
    CULQI = "culqi"
    MERCADOPAGO = "mercadopago"
    PAYPAL = "paypal"

class GeocodeResultType(str, enum.Enum):
    ADDRESS = "address"
    BUSINESS = "business"
    LANDMARK = "landmark"
    APPROXIMATE = "approximate"

# Models
class WebhookEvent(Base):
    """Model for webhook events from external services"""
    __tablename__ = "webhook_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider = Column(String(50), nullable=False, index=True)  # stripe, culqi, etc.
    event_type = Column(Enum(WebhookEventType), nullable=False, index=True)
    event_id = Column(String(255), nullable=True, index=True)  # External event ID
    
    # Webhook data
    raw_payload = Column(JSON, nullable=False)
    headers = Column(JSON, nullable=True)
    signature = Column(String(500), nullable=True)
    
    # Processing info
    status = Column(Enum(WebhookStatus), default=WebhookStatus.PENDING, index=True)
    processed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    next_retry_at = Column(DateTime, nullable=True)
    
    # Related entities
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    payment_id = Column(String(100), nullable=True, index=True)  # External payment ID
    subscription_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="webhook_events")

    def __repr__(self):
        return f"<WebhookEvent {self.provider}:{self.event_type}>"

class IntegrationConfig(Base):
    """Model for integration configurations"""
    __tablename__ = "integration_configs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True, index=True)
    type = Column(Enum(IntegrationType), nullable=False, index=True)
    provider = Column(String(50), nullable=False, index=True)
    
    # Configuration
    is_active = Column(Boolean, default=True, index=True)
    config_data = Column(JSON, nullable=False)  # API keys, URLs, settings
    environment = Column(String(20), default="production")  # production, sandbox, test
    
    # API limits and quotas
    daily_quota = Column(Integer, nullable=True)
    monthly_quota = Column(Integer, nullable=True)
    rate_limit_per_minute = Column(Integer, nullable=True)
    
    # Usage tracking
    daily_usage = Column(Integer, default=0)
    monthly_usage = Column(Integer, default=0)
    last_used_at = Column(DateTime, nullable=True)
    
    # Monitoring
    success_rate = Column(Integer, default=100)  # Percentage
    avg_response_time = Column(Integer, nullable=True)  # Milliseconds
    last_health_check = Column(DateTime, nullable=True)
    is_healthy = Column(Boolean, default=True, index=True)
    
    # Metadata
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    creator = relationship("User")

    def __repr__(self):
        return f"<IntegrationConfig {self.name}:{self.provider}>"

class GeocodeCache(Base):
    """Model for caching geocoding results"""
    __tablename__ = "geocode_cache"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Query info
    query_type = Column(String(20), nullable=False, index=True)  # geocode, reverse_geocode
    query_hash = Column(String(64), nullable=False, unique=True, index=True)  # SHA256 of query
    original_query = Column(String(500), nullable=False)
    
    # Results
    latitude = Column(String(20), nullable=True)
    longitude = Column(String(20), nullable=True)
    formatted_address = Column(String(500), nullable=True)
    result_type = Column(Enum(GeocodeResultType), nullable=True)
    confidence_score = Column(Integer, nullable=True)  # 0-100
    
    # Location details
    country = Column(String(100), nullable=True)
    country_code = Column(String(3), nullable=True)
    state = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    postal_code = Column(String(20), nullable=True)
    
    # Metadata
    provider = Column(String(50), nullable=False)  # google, nominatim, etc.
    raw_response = Column(JSON, nullable=True)
    
    # Cache management
    hit_count = Column(Integer, default=0)
    expires_at = Column(DateTime, nullable=True, index=True)
    is_valid = Column(Boolean, default=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<GeocodeCache {self.query_type}:{self.formatted_address}>"

class ExternalApiLog(Base):
    """Model for logging external API calls"""
    __tablename__ = "external_api_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # API call info
    provider = Column(String(50), nullable=False, index=True)
    service = Column(String(50), nullable=False, index=True)  # maps, payments, messaging
    endpoint = Column(String(200), nullable=False)
    method = Column(String(10), nullable=False)
    
    # Request data
    request_headers = Column(JSON, nullable=True)
    request_body = Column(Text, nullable=True)
    request_size = Column(Integer, nullable=True)
    
    # Response data
    response_status = Column(Integer, nullable=True, index=True)
    response_headers = Column(JSON, nullable=True)
    response_body = Column(Text, nullable=True)
    response_size = Column(Integer, nullable=True)
    
    # Timing
    started_at = Column(DateTime, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, nullable=True, index=True)
    
    # Error handling
    error_code = Column(String(50), nullable=True)
    error_message = Column(Text, nullable=True)
    retry_attempt = Column(Integer, default=0)
    
    # Context
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    correlation_id = Column(String(100), nullable=True, index=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")

    def __repr__(self):
        return f"<ExternalApiLog {self.provider}:{self.service}>"

class NearbyPlace(Base):
    """Model for nearby places search results"""
    __tablename__ = "nearby_places"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Location
    search_latitude = Column(String(20), nullable=False, index=True)
    search_longitude = Column(String(20), nullable=False, index=True)
    search_radius = Column(Integer, nullable=False)
    place_type = Column(String(50), nullable=False, index=True)
    
    # Place details
    place_id = Column(String(200), nullable=True, index=True)  # External place ID
    name = Column(String(200), nullable=False)
    address = Column(String(500), nullable=True)
    latitude = Column(String(20), nullable=False)
    longitude = Column(String(20), nullable=False)
    
    # Additional info
    rating = Column(String(10), nullable=True)
    price_level = Column(String(10), nullable=True)
    phone_number = Column(String(50), nullable=True)
    website = Column(String(500), nullable=True)
    
    # Distance and relevance
    distance_meters = Column(Integer, nullable=True, index=True)
    relevance_score = Column(Integer, nullable=True)  # 0-100
    
    # Provider info
    provider = Column(String(50), nullable=False)
    raw_data = Column(JSON, nullable=True)
    
    # Cache management
    expires_at = Column(DateTime, nullable=True, index=True)
    is_active = Column(Boolean, default=True, index=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<NearbyPlace {self.name} ({self.place_type})>"