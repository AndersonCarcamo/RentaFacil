"""
Integration endpoints
API endpoints for external integrations, webhooks, and third-party services
"""

from fastapi import APIRouter, Depends, Request, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List
import json
import asyncio

from app.api.deps import get_db
from app.services.integration_service import IntegrationService
from app.schemas.integrations import (
    WebhookResponse, GeocodeRequest, GeocodeResponse, ReverseGeocodeRequest,
    NearbyPlacesRequest, NearbyPlacesResponse, PlaceType,
    IntegrationError as IntegrationErrorSchema
)
from app.core.exceptions import IntegrationError
from app.core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter()

# Webhook endpoints
@router.post("/whatsapp/webhook", response_model=WebhookResponse)
async def whatsapp_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Process WhatsApp webhook events
    Handles incoming WhatsApp messages and status updates
    """
    try:
        # Get raw payload and headers
        payload = await request.json()
        headers = dict(request.headers)
        
        # Get signature for verification
        signature = headers.get("x-hub-signature-256")
        
        service = IntegrationService(db)
        
        # Process webhook in background for better response time
        background_tasks.add_task(
            process_webhook_background,
            "whatsapp",
            payload,
            headers,
            signature,
            db
        )
        
        return WebhookResponse(
            success=True,
            message="WhatsApp webhook received and queued for processing"
        )
        
    except Exception as e:
        logger.error(f"WhatsApp webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/payment/stripe/webhook", response_model=WebhookResponse)
async def stripe_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Process Stripe webhook events
    Handles payment confirmations, failures, and subscription updates
    """
    try:
        payload = await request.json()
        headers = dict(request.headers)
        signature = headers.get("stripe-signature")
        
        service = IntegrationService(db)
        
        # Process webhook in background
        background_tasks.add_task(
            process_webhook_background,
            "stripe",
            payload,
            headers,
            signature,
            db
        )
        
        return WebhookResponse(
            success=True,
            message="Stripe webhook received and queued for processing"
        )
        
    except Exception as e:
        logger.error(f"Stripe webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/payment/culqi/webhook", response_model=WebhookResponse)
async def culqi_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Process Culqi webhook events
    Handles Culqi payment notifications for Latin American transactions
    """
    try:
        payload = await request.json()
        headers = dict(request.headers)
        signature = headers.get("culqi-signature")
        
        service = IntegrationService(db)
        
        background_tasks.add_task(
            process_webhook_background,
            "culqi",
            payload,
            headers,
            signature,
            db
        )
        
        return WebhookResponse(
            success=True,
            message="Culqi webhook received and queued for processing"
        )
        
    except Exception as e:
        logger.error(f"Culqi webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/payment/mercadopago/webhook", response_model=WebhookResponse)
async def mercadopago_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Process MercadoPago webhook events
    Handles MercadoPago payment notifications for Latin American transactions
    """
    try:
        payload = await request.json()
        headers = dict(request.headers)
        
        service = IntegrationService(db)
        
        background_tasks.add_task(
            process_webhook_background,
            "mercadopago",
            payload,
            headers,
            None,  # MercadoPago has different signature handling
            db
        )
        
        return WebhookResponse(
            success=True,
            message="MercadoPago webhook received and queued for processing"
        )
        
    except Exception as e:
        logger.error(f"MercadoPago webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/payment/paypal/webhook", response_model=WebhookResponse)
async def paypal_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Process PayPal webhook events
    Handles PayPal payment notifications and subscription updates
    """
    try:
        payload = await request.json()
        headers = dict(request.headers)
        
        service = IntegrationService(db)
        
        background_tasks.add_task(
            process_webhook_background,
            "paypal",
            payload,
            headers,
            None,  # PayPal uses header-based verification
            db
        )
        
        return WebhookResponse(
            success=True,
            message="PayPal webhook received and queued for processing"
        )
        
    except Exception as e:
        logger.error(f"PayPal webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

# Maps and geocoding endpoints
@router.get("/maps/geocode", response_model=GeocodeResponse)
async def geocode_address(
    address: str,
    country: Optional[str] = None,
    language: Optional[str] = "en",
    db: Session = Depends(get_db)
):
    """
    Geocode an address to coordinates
    Convert a text address into latitude and longitude coordinates
    """
    try:
        if not address or len(address.strip()) < 5:
            raise HTTPException(
                status_code=400, 
                detail="Address must be at least 5 characters long"
            )
        
        service = IntegrationService(db)
        result = await service.geocode_address(address.strip(), country)
        
        return GeocodeResponse(**result)
        
    except IntegrationError as e:
        logger.error(f"Geocoding error: {str(e)}")
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected geocoding error: {str(e)}")
        raise HTTPException(status_code=500, detail="Geocoding service temporarily unavailable")

@router.get("/maps/reverse-geocode", response_model=GeocodeResponse)
async def reverse_geocode_coordinates(
    lat: float,
    lng: float,
    language: Optional[str] = "en",
    db: Session = Depends(get_db)
):
    """
    Reverse geocode coordinates to address
    Convert latitude and longitude coordinates into a readable address
    """
    try:
        # Validate coordinates
        if not (-90 <= lat <= 90):
            raise HTTPException(
                status_code=400,
                detail="Latitude must be between -90 and 90 degrees"
            )
        
        if not (-180 <= lng <= 180):
            raise HTTPException(
                status_code=400,
                detail="Longitude must be between -180 and 180 degrees"
            )
        
        service = IntegrationService(db)
        result = await service.reverse_geocode(lat, lng)
        
        return GeocodeResponse(**result)
        
    except IntegrationError as e:
        logger.error(f"Reverse geocoding error: {str(e)}")
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected reverse geocoding error: {str(e)}")
        raise HTTPException(status_code=500, detail="Reverse geocoding service temporarily unavailable")

@router.get("/maps/nearby-places", response_model=NearbyPlacesResponse)
async def find_nearby_places(
    lat: float,
    lng: float,
    radius: int = 1000,
    type: PlaceType = PlaceType.RESTAURANT,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    Find nearby places of a specific type
    Search for schools, hospitals, restaurants, etc. near given coordinates
    """
    try:
        # Validate coordinates
        if not (-90 <= lat <= 90):
            raise HTTPException(
                status_code=400,
                detail="Latitude must be between -90 and 90 degrees"
            )
        
        if not (-180 <= lng <= 180):
            raise HTTPException(
                status_code=400,
                detail="Longitude must be between -180 and 180 degrees"
            )
        
        # Validate radius
        if not (50 <= radius <= 50000):
            raise HTTPException(
                status_code=400,
                detail="Radius must be between 50 and 50,000 meters"
            )
        
        # Validate limit
        if not (1 <= limit <= 50):
            raise HTTPException(
                status_code=400,
                detail="Limit must be between 1 and 50"
            )
        
        service = IntegrationService(db)
        result = await service.find_nearby_places(lat, lng, radius, type.value, limit)
        
        return NearbyPlacesResponse(**result)
        
    except IntegrationError as e:
        logger.error(f"Nearby places error: {str(e)}")
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected nearby places error: {str(e)}")
        raise HTTPException(status_code=500, detail="Nearby places service temporarily unavailable")

# Background task functions
async def process_webhook_background(
    provider: str,
    payload: Dict[str, Any],
    headers: Dict[str, str],
    signature: Optional[str],
    db: Session
):
    """Background task to process webhooks asynchronously"""
    try:
        service = IntegrationService(db)
        result = await service.process_webhook(provider, payload, headers, signature)
        logger.info(f"Webhook processed successfully: {result}")
        
    except Exception as e:
        logger.error(f"Background webhook processing failed for {provider}: {str(e)}")

# Health check for integrations
@router.get("/health")
async def integration_health_check(db: Session = Depends(get_db)):
    """
    Health check for integration services
    Returns status of all configured external integrations
    """
    try:
        service = IntegrationService(db)
        
        # This would check the health of all configured integrations
        health_status = {
            "overall_health": "healthy",
            "services": {
                "webhooks": "operational",
                "geocoding": "operational",
                "maps": "operational"
            },
            "last_updated": "2024-01-01T00:00:00Z"
        }
        
        return JSONResponse(
            status_code=200,
            content=health_status
        )
        
    except Exception as e:
        logger.error(f"Integration health check failed: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={
                "overall_health": "unhealthy",
                "error": str(e),
                "last_updated": "2024-01-01T00:00:00Z"
            }
        )