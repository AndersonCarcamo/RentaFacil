"""
Webhook schemas for EasyRent API.
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid


class WebhookEventType(str, Enum):
    """Supported webhook event types"""
    LISTING_CREATED = "listing.created"
    LISTING_UPDATED = "listing.updated"
    LISTING_DELETED = "listing.deleted"
    USER_REGISTERED = "user.registered"
    PAYMENT_COMPLETED = "payment.completed"
    LEAD_CREATED = "lead.created"


class WebhookStatus(str, Enum):
    """Webhook delivery status"""
    PENDING = "pending"
    SUCCESSFUL = "successful"
    FAILED = "failed"
    RETRYING = "retrying"


# Webhook creation and update schemas
class WebhookCreate(BaseModel):
    """Schema for creating a new webhook"""
    url: HttpUrl = Field(..., description="The URL to send webhook requests to")
    events: List[WebhookEventType] = Field(..., description="List of events to subscribe to")
    secret: Optional[str] = Field(None, description="Secret key for signature verification")
    active: bool = Field(True, description="Whether the webhook is active")
    name: Optional[str] = Field(None, max_length=255, description="Optional webhook name")
    description: Optional[str] = Field(None, description="Optional webhook description")

    model_config = {
        "json_schema_extra": {
            "example": {
                "url": "https://api.example.com/webhooks/easyfent",
                "events": ["listing.created", "listing.updated"],
                "secret": "my-secret-key",
                "active": True,
                "name": "Main API Webhook",
                "description": "Webhook for listing updates"
            }
        }
    }


class WebhookUpdate(BaseModel):
    """Schema for updating a webhook"""
    url: Optional[HttpUrl] = Field(None, description="The URL to send webhook requests to")
    events: Optional[List[WebhookEventType]] = Field(None, description="List of events to subscribe to")
    secret: Optional[str] = Field(None, description="Secret key for signature verification")
    active: Optional[bool] = Field(None, description="Whether the webhook is active")
    name: Optional[str] = Field(None, max_length=255, description="Optional webhook name")
    description: Optional[str] = Field(None, description="Optional webhook description")

    model_config = {
        "json_schema_extra": {
            "example": {
                "active": False,
                "events": ["listing.created", "listing.updated", "listing.deleted"]
            }
        }
    }


# Response schemas
class WebhookResponse(BaseModel):
    """Schema for webhook response"""
    id: uuid.UUID
    user_id: uuid.UUID
    url: str
    events: List[str]
    active: bool
    name: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    last_triggered_at: Optional[datetime] = None
    total_deliveries: int
    successful_deliveries: int
    failed_deliveries: int

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "user_id": "123e4567-e89b-12d3-a456-426614174001",
                "url": "https://api.example.com/webhooks/easyrent",
                "events": ["listing.created", "listing.updated"],
                "active": True,
                "name": "Main API Webhook",
                "description": "Webhook for listing updates",
                "created_at": "2024-01-01T00:00:00Z",
                "total_deliveries": 150,
                "successful_deliveries": 145,
                "failed_deliveries": 5
            }
        }
    }


class WebhookListResponse(BaseModel):
    """Schema for webhook list response"""
    success: bool = True
    data: List[WebhookResponse]
    total: int
    page: int
    limit: int

    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "data": [
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "url": "https://api.example.com/webhooks/easyrent",
                        "events": ["listing.created"],
                        "active": True,
                        "total_deliveries": 50
                    }
                ],
                "total": 1,
                "page": 1,
                "limit": 10
            }
        }
    }


# Webhook delivery schemas
class WebhookDeliveryResponse(BaseModel):
    """Schema for webhook delivery response"""
    id: uuid.UUID
    webhook_id: uuid.UUID
    event_type: WebhookEventType
    status: WebhookStatus
    payload: Dict[str, Any]
    response_status_code: Optional[int] = None
    response_body: Optional[str] = None
    error_message: Optional[str] = None
    attempt_count: int
    max_retries: int
    next_retry_at: Optional[datetime] = None
    created_at: datetime
    delivered_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }


class WebhookDeliveryListResponse(BaseModel):
    """Schema for webhook delivery list response"""
    success: bool = True
    data: List[WebhookDeliveryResponse]
    total: int
    page: int
    limit: int


# Webhook testing schemas
class WebhookTestRequest(BaseModel):
    """Schema for testing a webhook"""
    event_type: Optional[WebhookEventType] = Field(
        WebhookEventType.LISTING_CREATED,
        description="Event type to test with"
    )
    test_data: Optional[Dict[str, Any]] = Field(
        None,
        description="Custom test data to send"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "event_type": "listing.created",
                "test_data": {
                    "listing_id": "123e4567-e89b-12d3-a456-426614174000",
                    "title": "Test Listing"
                }
            }
        }
    }


class WebhookTestResponse(BaseModel):
    """Schema for webhook test response"""
    success: bool
    message: str
    delivery_id: Optional[uuid.UUID] = None
    status_code: Optional[int] = None
    response_body: Optional[str] = None
    error: Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Webhook test sent successfully",
                "delivery_id": "123e4567-e89b-12d3-a456-426614174000",
                "status_code": 200,
                "response_body": '{"received": true}'
            }
        }
    }


# Webhook event schemas for payloads
class WebhookPayloadBase(BaseModel):
    """Base webhook payload schema"""
    event_type: WebhookEventType
    timestamp: datetime
    data: Dict[str, Any]
    source: str = "easyrent-api"

    model_config = {
        "json_schema_extra": {
            "example": {
                "event_type": "listing.created",
                "timestamp": "2024-01-01T00:00:00Z",
                "data": {
                    "listing_id": "123e4567-e89b-12d3-a456-426614174000",
                    "title": "Beautiful Apartment"
                },
                "source": "easyrent-api"
            }
        }
    }


class ListingWebhookPayload(WebhookPayloadBase):
    """Webhook payload for listing events"""
    pass


class UserWebhookPayload(WebhookPayloadBase):
    """Webhook payload for user events"""
    pass


class PaymentWebhookPayload(WebhookPayloadBase):
    """Webhook payload for payment events"""
    pass


class LeadWebhookPayload(WebhookPayloadBase):
    """Webhook payload for lead events"""
    pass


# Error responses
class WebhookError(BaseModel):
    """Schema for webhook error responses"""
    success: bool = False
    error_code: str
    error_message: str
    details: Optional[Dict[str, Any]] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "success": False,
                "error_code": "WEBHOOK_NOT_FOUND",
                "error_message": "Webhook not found",
                "details": {
                    "webhook_id": "123e4567-e89b-12d3-a456-426614174000"
                }
            }
        }
    }