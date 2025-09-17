"""
Integration schemas
Pydantic schemas for external integrations, webhooks, and third-party services
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum

from app.models.integration import (
    WebhookEventType, WebhookStatus, IntegrationType, 
    PaymentProvider, GeocodeResultType
)

# Base schemas
class WebhookPayloadBase(BaseModel):
    """Base schema for webhook payloads"""
    event_type: str
    data: Dict[str, Any]
    timestamp: Optional[datetime] = None
    signature: Optional[str] = None

# Webhook Schemas
class WhatsAppWebhookData(BaseModel):
    """WhatsApp webhook data structure"""
    id: str
    from_: str = Field(alias="from")
    to: Optional[str] = None
    type: str  # text, image, audio, etc.
    text: Optional[str] = None
    media_url: Optional[str] = None
    status: Optional[str] = None

class PaymentWebhookData(BaseModel):
    """Payment webhook data structure"""
    payment_id: str
    transaction_id: Optional[str] = None
    amount: float
    currency: str
    status: str
    user_id: Optional[str] = None
    subscription_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class StripeWebhookPayload(WebhookPayloadBase):
    """Stripe webhook payload"""
    id: str
    object: str
    api_version: Optional[str] = None
    created: int
    livemode: bool
    pending_webhooks: int
    request: Optional[Dict[str, Any]] = None

class CulqiWebhookPayload(WebhookPayloadBase):
    """Culqi webhook payload"""
    object: str
    id: str
    creation_date: int
    reference_code: Optional[str] = None

class MercadoPagoWebhookPayload(WebhookPayloadBase):
    """MercadoPago webhook payload"""
    id: str
    live_mode: bool
    type: str
    date_created: datetime
    application_id: str
    user_id: Optional[str] = None
    version: Optional[str] = None
    api_version: Optional[str] = None
    action: str

class PayPalWebhookPayload(WebhookPayloadBase):
    """PayPal webhook payload"""
    id: str
    event_version: str
    create_time: datetime
    resource_type: str
    event_type: str
    summary: str
    resource: Dict[str, Any]
    links: Optional[List[Dict[str, str]]] = None

# Response schemas
class WebhookResponse(BaseModel):
    """Response for webhook processing"""
    success: bool
    message: str = "Webhook processed successfully"
    webhook_id: Optional[str] = None
    processed_at: datetime = Field(default_factory=datetime.utcnow)

# Geocoding schemas
class GeocodeRequest(BaseModel):
    """Request for geocoding an address"""
    address: str = Field(..., min_length=5, max_length=500)
    country: Optional[str] = Field(None, max_length=2, description="ISO country code")
    language: Optional[str] = Field("en", max_length=5, description="Response language")

class ReverseGeocodeRequest(BaseModel):
    """Request for reverse geocoding coordinates"""
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    language: Optional[str] = Field("en", max_length=5)

class GeocodeResult(BaseModel):
    """Geocoding result"""
    latitude: float
    longitude: float
    formatted_address: str
    result_type: GeocodeResultType
    confidence_score: Optional[int] = Field(None, ge=0, le=100)
    
    # Address components
    country: Optional[str] = None
    country_code: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    postal_code: Optional[str] = None
    
    # Metadata
    provider: str
    cached: bool = False

class GeocodeResponse(BaseModel):
    """Response for geocoding requests"""
    success: bool
    results: List[GeocodeResult]
    query: str
    total_results: int
    cached: bool = False
    processing_time_ms: Optional[int] = None

# Maps and Places schemas
class PlaceType(str, Enum):
    SCHOOL = "school"
    HOSPITAL = "hospital"
    BANK = "bank"
    SUPERMARKET = "supermarket"
    RESTAURANT = "restaurant"
    METRO = "metro"
    BUS_STATION = "bus_station"

class NearbyPlacesRequest(BaseModel):
    """Request for nearby places search"""
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    radius: int = Field(1000, ge=50, le=50000, description="Search radius in meters")
    type: PlaceType
    limit: Optional[int] = Field(20, ge=1, le=50)
    language: Optional[str] = Field("en", max_length=5)

class PlaceDetails(BaseModel):
    """Details of a nearby place"""
    place_id: Optional[str] = None
    name: str
    address: Optional[str] = None
    latitude: float
    longitude: float
    distance_meters: Optional[int] = None
    rating: Optional[float] = Field(None, ge=0, le=5)
    price_level: Optional[int] = Field(None, ge=0, le=4)
    phone_number: Optional[str] = None
    website: Optional[str] = None
    is_open_now: Optional[bool] = None

class NearbyPlacesResponse(BaseModel):
    """Response for nearby places search"""
    success: bool
    places: List[PlaceDetails]
    search_location: Dict[str, float]
    search_radius: int
    place_type: PlaceType
    total_found: int
    cached: bool = False
    processing_time_ms: Optional[int] = None

# Integration configuration schemas
class IntegrationConfigCreate(BaseModel):
    """Schema for creating integration configuration"""
    name: str = Field(..., min_length=3, max_length=100)
    type: IntegrationType
    provider: str = Field(..., min_length=2, max_length=50)
    config_data: Dict[str, Any] = Field(..., description="Configuration parameters")
    environment: str = Field("production", pattern=r"^(production|sandbox|test)$")
    daily_quota: Optional[int] = Field(None, gt=0)
    monthly_quota: Optional[int] = Field(None, gt=0)
    rate_limit_per_minute: Optional[int] = Field(None, gt=0)

class IntegrationConfigUpdate(BaseModel):
    """Schema for updating integration configuration"""
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    config_data: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    daily_quota: Optional[int] = Field(None, gt=0)
    monthly_quota: Optional[int] = Field(None, gt=0)
    rate_limit_per_minute: Optional[int] = Field(None, gt=0)

class IntegrationConfigResponse(BaseModel):
    """Response schema for integration configuration"""
    id: str
    name: str
    type: IntegrationType
    provider: str
    is_active: bool
    environment: str
    
    # Usage stats (sensitive config data excluded)
    daily_usage: int
    monthly_usage: int
    daily_quota: Optional[int]
    monthly_quota: Optional[int]
    rate_limit_per_minute: Optional[int]
    
    # Health status
    success_rate: int
    avg_response_time: Optional[int]
    is_healthy: bool
    last_used_at: Optional[datetime]
    last_health_check: Optional[datetime]
    
    # Metadata
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

# Webhook management schemas
class WebhookEventCreate(BaseModel):
    """Schema for creating webhook event"""
    provider: str = Field(..., min_length=2, max_length=50)
    event_type: WebhookEventType
    event_id: Optional[str] = Field(None, max_length=255)
    raw_payload: Dict[str, Any]
    headers: Optional[Dict[str, str]] = None
    signature: Optional[str] = Field(None, max_length=500)
    user_id: Optional[str] = None
    payment_id: Optional[str] = Field(None, max_length=100)
    subscription_id: Optional[str] = None

class WebhookEventResponse(BaseModel):
    """Response schema for webhook event"""
    id: str
    provider: str
    event_type: WebhookEventType
    event_id: Optional[str]
    status: WebhookStatus
    processed_at: Optional[datetime]
    error_message: Optional[str]
    retry_count: int
    next_retry_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

# API usage and monitoring schemas
class ApiUsageStats(BaseModel):
    """API usage statistics"""
    provider: str
    service: str
    total_calls: int
    successful_calls: int
    failed_calls: int
    avg_response_time: float
    success_rate: float
    daily_usage: int
    monthly_usage: int
    last_call_at: Optional[datetime]

class IntegrationHealthCheck(BaseModel):
    """Integration health check response"""
    provider: str
    service: str
    is_healthy: bool
    response_time_ms: Optional[int]
    last_check: datetime
    error_message: Optional[str]
    status_code: Optional[int]

class IntegrationHealthResponse(BaseModel):
    """Overall integration health response"""
    overall_health: str = Field(..., pattern=r"^(healthy|degraded|unhealthy)$")
    total_integrations: int
    healthy_count: int
    unhealthy_count: int
    checks: List[IntegrationHealthCheck]
    last_updated: datetime = Field(default_factory=datetime.utcnow)

# Error schemas
class IntegrationError(BaseModel):
    """Integration error response"""
    success: bool = False
    error_code: str
    error_message: str
    provider: Optional[str] = None
    service: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    correlation_id: Optional[str] = None

# Validation schemas
class WebhookSignatureValidation(BaseModel):
    """Webhook signature validation"""
    provider: PaymentProvider
    signature: str
    payload: str
    timestamp: Optional[str] = None

    @field_validator('signature')
    @classmethod
    def validate_signature(cls, v):
        if not v or len(v) < 10:
            raise ValueError('Invalid signature format')
        return v

# Bulk operation schemas
class BulkWebhookProcess(BaseModel):
    """Schema for bulk webhook processing"""
    provider: str
    webhooks: List[Dict[str, Any]] = Field(..., min_length=1, max_length=100)
    process_async: bool = Field(True, description="Process webhooks asynchronously")

class BulkProcessResponse(BaseModel):
    """Response for bulk processing"""
    job_id: str
    total_webhooks: int
    accepted: int
    rejected: int
    processing_started: bool
    estimated_completion: Optional[datetime] = None