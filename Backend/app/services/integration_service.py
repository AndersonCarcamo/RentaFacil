"""
Integration service
Business logic for external integrations, webhooks, and third-party services
"""

import hashlib
import hmac
import json
import logging
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func

from app.models.integration import (
    WebhookEvent, IntegrationConfig, GeocodeCache, 
    ExternalApiLog, NearbyPlace,
    WebhookEventType, WebhookStatus, IntegrationType,
    PaymentProvider, GeocodeResultType
)
from app.models.auth import User
from app.core.config import settings
from app.core.exceptions import IntegrationError, ValidationError
from app.core.logging import get_logger

logger = get_logger(__name__)

class IntegrationService:
    """Service for handling external integrations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.logger = logging.getLogger(__name__)
    
    # Webhook Processing
    async def process_webhook(
        self, 
        provider: str, 
        payload: Dict[str, Any], 
        headers: Optional[Dict[str, str]] = None,
        signature: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process incoming webhook from external service"""
        try:
            # Validate signature if provided
            if signature and not self._verify_webhook_signature(provider, payload, signature, headers):
                raise IntegrationError(f"Invalid webhook signature for {provider}")
            
            # Determine event type
            event_type = self._determine_event_type(provider, payload)
            
            # Create webhook event record
            webhook_event = WebhookEvent(
                provider=provider,
                event_type=event_type,
                event_id=self._extract_event_id(provider, payload),
                raw_payload=payload,
                headers=headers or {},
                signature=signature,
                status=WebhookStatus.PROCESSING
            )
            
            self.db.add(webhook_event)
            self.db.commit()
            self.db.refresh(webhook_event)
            
            # Process based on provider and event type
            result = await self._process_webhook_by_provider(provider, event_type, payload, webhook_event.id)
            
            # Update webhook status
            webhook_event.status = WebhookStatus.PROCESSED
            webhook_event.processed_at = datetime.utcnow()
            self.db.commit()
            
            return {
                "success": True,
                "webhook_id": str(webhook_event.id),
                "event_type": event_type,
                "processed_at": webhook_event.processed_at
            }
            
        except Exception as e:
            self.logger.error(f"Webhook processing failed for {provider}: {str(e)}")
            if 'webhook_event' in locals():
                webhook_event.status = WebhookStatus.FAILED
                webhook_event.error_message = str(e)
                webhook_event.retry_count += 1
                webhook_event.next_retry_at = datetime.utcnow() + timedelta(minutes=5 * webhook_event.retry_count)
                self.db.commit()
            
            raise IntegrationError(f"Webhook processing failed: {str(e)}")
    
    def _verify_webhook_signature(self, provider: str, payload: Dict[str, Any], signature: str, headers: Dict[str, str]) -> bool:
        """Verify webhook signature based on provider"""
        config = self._get_integration_config(provider)
        if not config:
            return False
        
        secret_key = config.config_data.get("webhook_secret")
        if not secret_key:
            return True  # Skip verification if no secret configured
        
        if provider == "stripe":
            return self._verify_stripe_signature(payload, signature, secret_key, headers.get("stripe-timestamp"))
        elif provider == "culqi":
            return self._verify_culqi_signature(payload, signature, secret_key)
        elif provider == "mercadopago":
            return self._verify_mercadopago_signature(payload, signature, secret_key)
        elif provider == "paypal":
            return self._verify_paypal_signature(payload, headers, config.config_data)
        
        return False
    
    def _verify_stripe_signature(self, payload: Dict[str, Any], signature: str, secret: str, timestamp: str) -> bool:
        """Verify Stripe webhook signature"""
        try:
            payload_str = json.dumps(payload, sort_keys=True)
            expected_sig = hmac.new(
                secret.encode('utf-8'),
                f"{timestamp}.{payload_str}".encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(f"sha256={expected_sig}", signature)
        except Exception:
            return False
    
    def _verify_culqi_signature(self, payload: Dict[str, Any], signature: str, secret: str) -> bool:
        """Verify Culqi webhook signature"""
        try:
            payload_str = json.dumps(payload, sort_keys=True)
            expected_sig = hmac.new(
                secret.encode('utf-8'),
                payload_str.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(expected_sig, signature)
        except Exception:
            return False
    
    def _determine_event_type(self, provider: str, payload: Dict[str, Any]) -> WebhookEventType:
        """Determine event type from payload"""
        if provider == "stripe":
            stripe_type = payload.get("type", "")
            if "payment_intent.succeeded" in stripe_type:
                return WebhookEventType.PAYMENT_SUCCESS
            elif "payment_intent.payment_failed" in stripe_type:
                return WebhookEventType.PAYMENT_FAILED
        
        elif provider == "culqi":
            event = payload.get("event", "")
            if event == "charge.succeeded":
                return WebhookEventType.PAYMENT_SUCCESS
            elif event == "charge.failed":
                return WebhookEventType.PAYMENT_FAILED
        
        elif provider == "whatsapp":
            return WebhookEventType.WHATSAPP_MESSAGE
        
        # Default fallback
        return WebhookEventType.PAYMENT_SUCCESS
    
    def _extract_event_id(self, provider: str, payload: Dict[str, Any]) -> Optional[str]:
        """Extract external event ID from payload"""
        if provider == "stripe":
            return payload.get("id")
        elif provider == "culqi":
            return payload.get("data", {}).get("id")
        elif provider == "mercadopago":
            return payload.get("id")
        elif provider == "paypal":
            return payload.get("id")
        return None
    
    async def _process_webhook_by_provider(
        self, 
        provider: str, 
        event_type: WebhookEventType, 
        payload: Dict[str, Any],
        webhook_id: str
    ) -> Dict[str, Any]:
        """Process webhook based on provider and event type"""
        if provider in ["stripe", "culqi", "mercadopago", "paypal"]:
            return await self._process_payment_webhook(provider, event_type, payload)
        elif provider == "whatsapp":
            return await self._process_whatsapp_webhook(payload)
        else:
            raise IntegrationError(f"Unknown provider: {provider}")
    
    async def _process_payment_webhook(self, provider: str, event_type: WebhookEventType, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Process payment-related webhook"""
        # Extract payment information
        payment_info = self._extract_payment_info(provider, payload)
        
        # Find related user and subscription
        user = None
        if payment_info.get("user_id"):
            user = self.db.query(User).filter(User.id == payment_info["user_id"]).first()
        
        # Update payment status, subscription, etc.
        # This would integrate with your payment/subscription service
        self.logger.info(f"Processed {event_type} webhook for {provider}: {payment_info}")
        
        return {"payment_processed": True, "payment_info": payment_info}
    
    async def _process_whatsapp_webhook(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Process WhatsApp webhook"""
        # Extract message information
        messages = payload.get("entry", [{}])[0].get("changes", [{}])[0].get("value", {}).get("messages", [])
        
        for message in messages:
            # Process each message
            self.logger.info(f"Received WhatsApp message: {message}")
        
        return {"messages_processed": len(messages)}
    
    def _extract_payment_info(self, provider: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Extract payment information from provider payload"""
        info = {}
        
        if provider == "stripe":
            data = payload.get("data", {}).get("object", {})
            info = {
                "payment_id": data.get("id"),
                "amount": data.get("amount", 0) / 100,  # Stripe amounts are in cents
                "currency": data.get("currency"),
                "status": data.get("status"),
                "user_id": data.get("metadata", {}).get("user_id")
            }
        
        elif provider == "culqi":
            data = payload.get("data", {})
            info = {
                "payment_id": data.get("id"),
                "amount": data.get("amount", 0) / 100,
                "currency": data.get("currency_code"),
                "status": "succeeded" if data.get("state") == "paid" else "failed",
                "user_id": data.get("metadata", {}).get("user_id")
            }
        
        return info
    
    # Geocoding Services
    async def geocode_address(self, address: str, country: Optional[str] = None) -> Dict[str, Any]:
        """Geocode an address to coordinates"""
        try:
            # Create query hash for caching
            query_data = f"{address}|{country or ''}"
            query_hash = hashlib.sha256(query_data.encode()).hexdigest()
            
            # Check cache first
            cached_result = self.db.query(GeocodeCache).filter(
                and_(
                    GeocodeCache.query_hash == query_hash,
                    GeocodeCache.query_type == "geocode",
                    GeocodeCache.is_valid == True,
                    or_(
                        GeocodeCache.expires_at.is_(None),
                        GeocodeCache.expires_at > datetime.utcnow()
                    )
                )
            ).first()
            
            if cached_result:
                cached_result.hit_count += 1
                cached_result.last_used_at = datetime.utcnow()
                self.db.commit()
                
                return {
                    "success": True,
                    "results": [{
                        "latitude": float(cached_result.latitude),
                        "longitude": float(cached_result.longitude),
                        "formatted_address": cached_result.formatted_address,
                        "result_type": cached_result.result_type,
                        "confidence_score": cached_result.confidence_score,
                        "country": cached_result.country,
                        "country_code": cached_result.country_code,
                        "state": cached_result.state,
                        "city": cached_result.city,
                        "district": cached_result.district,
                        "postal_code": cached_result.postal_code,
                        "provider": cached_result.provider,
                        "cached": True
                    }],
                    "query": address,
                    "total_results": 1,
                    "cached": True
                }
            
            # Get geocoding from external provider
            config = self._get_integration_config("maps")
            if not config:
                raise IntegrationError("Maps integration not configured")
            
            results = await self._external_geocode(address, country, config)
            
            # Cache the first result
            if results:
                result = results[0]
                cache_entry = GeocodeCache(
                    query_type="geocode",
                    query_hash=query_hash,
                    original_query=query_data,
                    latitude=str(result["latitude"]),
                    longitude=str(result["longitude"]),
                    formatted_address=result["formatted_address"],
                    result_type=GeocodeResultType.ADDRESS,
                    confidence_score=result.get("confidence_score"),
                    country=result.get("country"),
                    country_code=result.get("country_code"),
                    state=result.get("state"),
                    city=result.get("city"),
                    district=result.get("district"),
                    postal_code=result.get("postal_code"),
                    provider=result["provider"],
                    expires_at=datetime.utcnow() + timedelta(days=30)
                )
                self.db.add(cache_entry)
                self.db.commit()
            
            return {
                "success": True,
                "results": results,
                "query": address,
                "total_results": len(results),
                "cached": False
            }
            
        except Exception as e:
            self.logger.error(f"Geocoding failed for address '{address}': {str(e)}")
            raise IntegrationError(f"Geocoding failed: {str(e)}")
    
    async def reverse_geocode(self, lat: float, lng: float) -> Dict[str, Any]:
        """Reverse geocode coordinates to address"""
        try:
            # Create query hash for caching
            query_data = f"{lat},{lng}"
            query_hash = hashlib.sha256(query_data.encode()).hexdigest()
            
            # Check cache first
            cached_result = self.db.query(GeocodeCache).filter(
                and_(
                    GeocodeCache.query_hash == query_hash,
                    GeocodeCache.query_type == "reverse_geocode",
                    GeocodeCache.is_valid == True,
                    or_(
                        GeocodeCache.expires_at.is_(None),
                        GeocodeCache.expires_at > datetime.utcnow()
                    )
                )
            ).first()
            
            if cached_result:
                cached_result.hit_count += 1
                cached_result.last_used_at = datetime.utcnow()
                self.db.commit()
                
                return {
                    "success": True,
                    "results": [{
                        "latitude": lat,
                        "longitude": lng,
                        "formatted_address": cached_result.formatted_address,
                        "result_type": cached_result.result_type,
                        "confidence_score": cached_result.confidence_score,
                        "country": cached_result.country,
                        "country_code": cached_result.country_code,
                        "state": cached_result.state,
                        "city": cached_result.city,
                        "district": cached_result.district,
                        "postal_code": cached_result.postal_code,
                        "provider": cached_result.provider,
                        "cached": True
                    }],
                    "query": query_data,
                    "total_results": 1,
                    "cached": True
                }
            
            # Get reverse geocoding from external provider
            config = self._get_integration_config("maps")
            if not config:
                raise IntegrationError("Maps integration not configured")
            
            results = await self._external_reverse_geocode(lat, lng, config)
            
            # Cache the first result
            if results:
                result = results[0]
                cache_entry = GeocodeCache(
                    query_type="reverse_geocode",
                    query_hash=query_hash,
                    original_query=query_data,
                    latitude=str(lat),
                    longitude=str(lng),
                    formatted_address=result["formatted_address"],
                    result_type=GeocodeResultType.ADDRESS,
                    confidence_score=result.get("confidence_score"),
                    country=result.get("country"),
                    country_code=result.get("country_code"),
                    state=result.get("state"),
                    city=result.get("city"),
                    district=result.get("district"),
                    postal_code=result.get("postal_code"),
                    provider=result["provider"],
                    expires_at=datetime.utcnow() + timedelta(days=30)
                )
                self.db.add(cache_entry)
                self.db.commit()
            
            return {
                "success": True,
                "results": results,
                "query": query_data,
                "total_results": len(results),
                "cached": False
            }
            
        except Exception as e:
            self.logger.error(f"Reverse geocoding failed for {lat},{lng}: {str(e)}")
            raise IntegrationError(f"Reverse geocoding failed: {str(e)}")
    
    async def find_nearby_places(
        self, 
        lat: float, 
        lng: float, 
        radius: int, 
        place_type: str,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Find nearby places of specific type"""
        try:
            # Check for cached results
            cached_places = self.db.query(NearbyPlace).filter(
                and_(
                    NearbyPlace.search_latitude == str(lat),
                    NearbyPlace.search_longitude == str(lng),
                    NearbyPlace.search_radius == radius,
                    NearbyPlace.place_type == place_type,
                    NearbyPlace.is_active == True,
                    or_(
                        NearbyPlace.expires_at.is_(None),
                        NearbyPlace.expires_at > datetime.utcnow()
                    )
                )
            ).limit(limit).all()
            
            if cached_places:
                places = []
                for place in cached_places:
                    places.append({
                        "place_id": place.place_id,
                        "name": place.name,
                        "address": place.address,
                        "latitude": float(place.latitude),
                        "longitude": float(place.longitude),
                        "distance_meters": place.distance_meters,
                        "rating": float(place.rating) if place.rating else None,
                        "price_level": int(place.price_level) if place.price_level else None,
                        "phone_number": place.phone_number,
                        "website": place.website
                    })
                
                return {
                    "success": True,
                    "places": places,
                    "search_location": {"lat": lat, "lng": lng},
                    "search_radius": radius,
                    "place_type": place_type,
                    "total_found": len(places),
                    "cached": True
                }
            
            # Get places from external provider
            config = self._get_integration_config("maps")
            if not config:
                raise IntegrationError("Maps integration not configured")
            
            places = await self._external_nearby_search(lat, lng, radius, place_type, limit, config)
            
            # Cache the results
            for place in places:
                cache_entry = NearbyPlace(
                    search_latitude=str(lat),
                    search_longitude=str(lng),
                    search_radius=radius,
                    place_type=place_type,
                    place_id=place.get("place_id"),
                    name=place["name"],
                    address=place.get("address"),
                    latitude=str(place["latitude"]),
                    longitude=str(place["longitude"]),
                    distance_meters=place.get("distance_meters"),
                    rating=str(place["rating"]) if place.get("rating") else None,
                    price_level=str(place["price_level"]) if place.get("price_level") else None,
                    phone_number=place.get("phone_number"),
                    website=place.get("website"),
                    provider=place["provider"],
                    raw_data=place,
                    expires_at=datetime.utcnow() + timedelta(hours=24)
                )
                self.db.add(cache_entry)
            
            self.db.commit()
            
            return {
                "success": True,
                "places": places,
                "search_location": {"lat": lat, "lng": lng},
                "search_radius": radius,
                "place_type": place_type,
                "total_found": len(places),
                "cached": False
            }
            
        except Exception as e:
            self.logger.error(f"Nearby places search failed: {str(e)}")
            raise IntegrationError(f"Nearby places search failed: {str(e)}")
    
    # Helper methods
    def _get_integration_config(self, provider: str) -> Optional[IntegrationConfig]:
        """Get integration configuration by provider"""
        return self.db.query(IntegrationConfig).filter(
            and_(
                IntegrationConfig.provider == provider,
                IntegrationConfig.is_active == True
            )
        ).first()
    
    async def _external_geocode(self, address: str, country: Optional[str], config: IntegrationConfig) -> List[Dict[str, Any]]:
        """Perform external geocoding API call"""
        # This would implement actual API calls to Google Maps, Nominatim, etc.
        # For now, return mock data
        return [{
            "latitude": -12.0464,
            "longitude": -77.0428,
            "formatted_address": f"{address}, Lima, Peru",
            "result_type": "address",
            "confidence_score": 85,
            "country": "Peru",
            "country_code": "PE",
            "state": "Lima",
            "city": "Lima",
            "provider": config.provider
        }]
    
    async def _external_reverse_geocode(self, lat: float, lng: float, config: IntegrationConfig) -> List[Dict[str, Any]]:
        """Perform external reverse geocoding API call"""
        # Mock implementation
        return [{
            "latitude": lat,
            "longitude": lng,
            "formatted_address": "Sample Address, Lima, Peru",
            "result_type": "address",
            "confidence_score": 90,
            "country": "Peru",
            "country_code": "PE",
            "state": "Lima",
            "city": "Lima",
            "provider": config.provider
        }]
    
    async def _external_nearby_search(
        self, 
        lat: float, 
        lng: float, 
        radius: int, 
        place_type: str, 
        limit: int,
        config: IntegrationConfig
    ) -> List[Dict[str, Any]]:
        """Perform external nearby places search"""
        # Mock implementation
        return [{
            "place_id": "sample_place_1",
            "name": f"Sample {place_type.title()}",
            "address": "Sample Address, Lima, Peru",
            "latitude": lat + 0.001,
            "longitude": lng + 0.001,
            "distance_meters": 150,
            "rating": 4.2,
            "price_level": 2,
            "phone_number": "+51 1 234-5678",
            "website": "https://example.com",
            "provider": config.provider
        }]
    
    def _log_api_call(
        self, 
        provider: str, 
        service: str, 
        endpoint: str, 
        method: str,
        status: int,
        duration_ms: int,
        user_id: Optional[str] = None,
        error_message: Optional[str] = None
    ):
        """Log external API call for monitoring"""
        log_entry = ExternalApiLog(
            provider=provider,
            service=service,
            endpoint=endpoint,
            method=method,
            response_status=status,
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow(),
            duration_ms=duration_ms,
            user_id=user_id,
            error_message=error_message
        )
        self.db.add(log_entry)
        self.db.commit()