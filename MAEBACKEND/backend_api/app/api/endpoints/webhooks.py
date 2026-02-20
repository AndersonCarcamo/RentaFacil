"""
Webhook endpoints for EasyRent API.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.auth import User
from app.models.webhook import WebhookStatus
from app.schemas.webhooks import (
    WebhookCreate, WebhookUpdate, WebhookResponse, WebhookListResponse,
    WebhookTestRequest, WebhookTestResponse, WebhookDeliveryResponse,
    WebhookDeliveryListResponse, WebhookError
)
from app.services.webhook_service import WebhookService
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter()

# Webhook CRUD endpoints

@router.post("/", response_model=WebhookResponse, status_code=status.HTTP_201_CREATED)
async def create_webhook(
    webhook_data: WebhookCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new webhook
    
    Creates a webhook configuration that will receive events for the specified event types.
    """
    service = WebhookService(db)
    webhook = service.create_webhook(current_user.id, webhook_data)
    return WebhookResponse.model_validate(webhook)


@router.get("/", response_model=WebhookListResponse)
async def list_webhooks(
    active_only: bool = Query(False, description="Filter to only active webhooks"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List user's webhooks
    
    Get a paginated list of webhooks configured by the current user.
    """
    service = WebhookService(db)
    offset = (page - 1) * limit
    
    webhooks, total = service.get_webhooks(
        user_id=current_user.id,
        active_only=active_only,
        limit=limit,
        offset=offset
    )
    
    webhook_responses = [WebhookResponse.model_validate(webhook) for webhook in webhooks]
    
    return WebhookListResponse(
        data=webhook_responses,
        total=total,
        page=page,
        limit=limit
    )


@router.get("/{webhook_id}", response_model=WebhookResponse)
async def get_webhook(
    webhook_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get webhook by ID
    
    Retrieve detailed information about a specific webhook.
    """
    service = WebhookService(db)
    webhook = service.get_webhook(current_user.id, webhook_id)
    return WebhookResponse.model_validate(webhook)


@router.put("/{webhook_id}", response_model=WebhookResponse)
async def update_webhook(
    webhook_id: uuid.UUID,
    webhook_data: WebhookUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update webhook
    
    Update the configuration of an existing webhook.
    """
    service = WebhookService(db)
    webhook = service.update_webhook(current_user.id, webhook_id, webhook_data)
    return WebhookResponse.model_validate(webhook)


@router.delete("/{webhook_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_webhook(
    webhook_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete webhook
    
    Permanently delete a webhook configuration and all its delivery history.
    """
    service = WebhookService(db)
    service.delete_webhook(current_user.id, webhook_id)


# Webhook testing endpoint

@router.post("/{webhook_id}/test", response_model=WebhookTestResponse)
async def test_webhook(
    webhook_id: uuid.UUID,
    test_request: Optional[WebhookTestRequest] = None,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Test webhook
    
    Send a test payload to the webhook URL to verify it's working correctly.
    """
    service = WebhookService(db)
    
    if not test_request:
        test_request = WebhookTestRequest()
    
    try:
        delivery = await service.test_webhook(current_user.id, webhook_id, test_request)
        
        return WebhookTestResponse(
            success=delivery.status == WebhookStatus.SUCCESSFUL,
            message="Webhook test completed" if delivery.status == WebhookStatus.SUCCESSFUL else "Webhook test failed",
            delivery_id=delivery.id,
            status_code=delivery.response_status_code,
            response_body=delivery.response_body,
            error=delivery.error_message if delivery.status == WebhookStatus.FAILED else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to test webhook {webhook_id}: {str(e)}")
        return WebhookTestResponse(
            success=False,
            message="Failed to test webhook",
            error=str(e)
        )


# Webhook deliveries endpoints

@router.get("/{webhook_id}/deliveries", response_model=WebhookDeliveryListResponse)
async def get_webhook_deliveries(
    webhook_id: uuid.UUID,
    status_filter: Optional[WebhookStatus] = Query(None, alias="status", description="Filter by delivery status"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get webhook deliveries
    
    Get the delivery history for a specific webhook with optional status filtering.
    """
    service = WebhookService(db)
    offset = (page - 1) * limit
    
    deliveries, total = service.get_webhook_deliveries(
        user_id=current_user.id,
        webhook_id=webhook_id,
        status=status_filter,
        limit=limit,
        offset=offset
    )
    
    delivery_responses = [WebhookDeliveryResponse.model_validate(delivery) for delivery in deliveries]
    
    return WebhookDeliveryListResponse(
        data=delivery_responses,
        total=total,
        page=page,
        limit=limit
    )


# Webhook statistics endpoint

@router.get("/stats/summary")
async def get_webhook_statistics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get webhook statistics
    
    Get summary statistics for all webhooks belonging to the current user.
    """
    service = WebhookService(db)
    stats = service.get_webhook_statistics(current_user.id)
    
    return {
        "success": True,
        "data": stats
    }


# Bulk operations

@router.post("/bulk/enable")
async def bulk_enable_webhooks(
    webhook_ids: List[uuid.UUID],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Bulk enable webhooks
    
    Enable multiple webhooks at once.
    """
    service = WebhookService(db)
    results = []
    
    for webhook_id in webhook_ids:
        try:
            webhook = service.update_webhook(
                user_id=current_user.id,
                webhook_id=webhook_id,
                webhook_data=WebhookUpdate(active=True)
            )
            results.append({
                "webhook_id": str(webhook_id),
                "success": True,
                "message": "Webhook enabled"
            })
        except Exception as e:
            results.append({
                "webhook_id": str(webhook_id),
                "success": False,
                "error": str(e)
            })
    
    return {
        "success": True,
        "results": results
    }


@router.post("/bulk/disable")
async def bulk_disable_webhooks(
    webhook_ids: List[uuid.UUID],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Bulk disable webhooks
    
    Disable multiple webhooks at once.
    """
    service = WebhookService(db)
    results = []
    
    for webhook_id in webhook_ids:
        try:
            webhook = service.update_webhook(
                user_id=current_user.id,
                webhook_id=webhook_id,
                webhook_data=WebhookUpdate(active=False)
            )
            results.append({
                "webhook_id": str(webhook_id),
                "success": True,
                "message": "Webhook disabled"
            })
        except Exception as e:
            results.append({
                "webhook_id": str(webhook_id),
                "success": False,
                "error": str(e)
            })
    
    return {
        "success": True,
        "results": results
    }


# Webhook events endpoint (for debugging/monitoring)

@router.get("/events/recent")
async def get_recent_webhook_events(
    limit: int = Query(20, ge=1, le=100, description="Number of events to retrieve"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get recent webhook events
    
    Get recent webhook events triggered by the current user's actions.
    This is useful for debugging and monitoring webhook activity.
    """
    try:
        # Note: This would need to be implemented with proper filtering
        # based on user's resources and permissions
        from app.models.webhook import WebhookEvent
        
        events = db.query(WebhookEvent).filter(
            WebhookEvent.triggered_by_user_id == current_user.id
        ).order_by(WebhookEvent.created_at.desc()).limit(limit).all()
        
        event_data = []
        for event in events:
            event_data.append({
                "id": str(event.id),
                "event_type": event.event_type.value,
                "resource_type": event.resource_type,
                "resource_id": str(event.resource_id),
                "processed": event.processed,
                "webhook_count": event.webhook_count,
                "created_at": event.created_at.isoformat(),
                "processed_at": event.processed_at.isoformat() if event.processed_at else None
            })
        
        return {
            "success": True,
            "data": event_data,
            "total": len(event_data)
        }
        
    except Exception as e:
        logger.error(f"Failed to get recent webhook events for user {current_user.id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve webhook events"
        )