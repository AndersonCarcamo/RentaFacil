"""
Webhook service for EasyRent API.
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid
import hmac
import hashlib
import httpx
import asyncio
from fastapi import HTTPException, status

from app.models.webhook import Webhook, WebhookDelivery, WebhookEvent, WebhookEventType, WebhookStatus
from app.schemas.webhooks import (
    WebhookCreate, WebhookUpdate, WebhookResponse, WebhookTestRequest,
    WebhookDeliveryResponse, WebhookPayloadBase
)
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class WebhookService:
    """Service for managing webhooks"""

    def __init__(self, db: Session):
        self.db = db

    def create_webhook(self, user_id: uuid.UUID, webhook_data: WebhookCreate) -> Webhook:
        """Create a new webhook"""
        try:
            # Validate events
            for event in webhook_data.events:
                if event not in WebhookEventType:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid event type: {event}"
                    )

            # Create webhook
            webhook = Webhook(
                user_id=user_id,
                url=str(webhook_data.url),
                events=webhook_data.events,
                secret=webhook_data.secret,
                active=webhook_data.active,
                name=webhook_data.name,
                description=webhook_data.description
            )

            self.db.add(webhook)
            self.db.commit()
            self.db.refresh(webhook)

            logger.info(f"Created webhook {webhook.id} for user {user_id}")
            return webhook

        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to create webhook for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create webhook"
            )

    def get_webhooks(
        self,
        user_id: uuid.UUID,
        active_only: bool = False,
        limit: int = 10,
        offset: int = 0
    ) -> tuple[List[Webhook], int]:
        """Get user's webhooks with pagination"""
        try:
            query = self.db.query(Webhook).filter(Webhook.user_id == user_id)

            if active_only:
                query = query.filter(Webhook.active == True)

            total = query.count()
            webhooks = query.offset(offset).limit(limit).all()

            return webhooks, total

        except Exception as e:
            logger.error(f"Failed to get webhooks for user {user_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve webhooks"
            )

    def get_webhook(self, user_id: uuid.UUID, webhook_id: uuid.UUID) -> Webhook:
        """Get a specific webhook"""
        webhook = self.db.query(Webhook).filter(
            and_(
                Webhook.id == webhook_id,
                Webhook.user_id == user_id
            )
        ).first()

        if not webhook:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Webhook not found"
            )

        return webhook

    def update_webhook(
        self,
        user_id: uuid.UUID,
        webhook_id: uuid.UUID,
        webhook_data: WebhookUpdate
    ) -> Webhook:
        """Update a webhook"""
        try:
            webhook = self.get_webhook(user_id, webhook_id)

            # Update fields
            for field, value in webhook_data.model_dump(exclude_unset=True).items():
                if field == "url" and value:
                    setattr(webhook, field, str(value))
                elif field == "events" and value:
                    # Validate events
                    for event in value:
                        if event not in WebhookEventType:
                            raise HTTPException(
                                status_code=status.HTTP_400_BAD_REQUEST,
                                detail=f"Invalid event type: {event}"
                            )
                    setattr(webhook, field, value)
                else:
                    setattr(webhook, field, value)

            webhook.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(webhook)

            logger.info(f"Updated webhook {webhook_id}")
            return webhook

        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to update webhook {webhook_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update webhook"
            )

    def delete_webhook(self, user_id: uuid.UUID, webhook_id: uuid.UUID) -> bool:
        """Delete a webhook"""
        try:
            webhook = self.get_webhook(user_id, webhook_id)
            
            self.db.delete(webhook)
            self.db.commit()

            logger.info(f"Deleted webhook {webhook_id}")
            return True

        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"Failed to delete webhook {webhook_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete webhook"
            )

    async def test_webhook(
        self,
        user_id: uuid.UUID,
        webhook_id: uuid.UUID,
        test_request: WebhookTestRequest
    ) -> WebhookDelivery:
        """Test a webhook by sending a test payload"""
        try:
            webhook = self.get_webhook(user_id, webhook_id)

            # Create test payload
            test_payload = {
                "event_type": test_request.event_type,
                "timestamp": datetime.utcnow().isoformat(),
                "data": test_request.test_data or {
                    "test": True,
                    "webhook_id": str(webhook_id),
                    "message": "This is a test webhook delivery"
                },
                "source": "easyrent-api-test"
            }

            # Create delivery record
            delivery = WebhookDelivery(
                webhook_id=webhook_id,
                event_type=test_request.event_type,
                payload=test_payload,
                status=WebhookStatus.PENDING
            )

            self.db.add(delivery)
            self.db.commit()
            self.db.refresh(delivery)

            # Send webhook
            await self._send_webhook(webhook, delivery)

            logger.info(f"Tested webhook {webhook_id}")
            return delivery

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to test webhook {webhook_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to test webhook"
            )

    async def _send_webhook(self, webhook: Webhook, delivery: WebhookDelivery) -> None:
        """Send webhook delivery"""
        try:
            # Prepare headers
            headers = {
                "Content-Type": "application/json",
                "User-Agent": f"EasyRent-Webhook/1.0",
                "X-EasyRent-Event": delivery.event_type.value,
                "X-EasyRent-Delivery": str(delivery.id),
                "X-EasyRent-Webhook-ID": str(webhook.id)
            }

            # Add signature if secret is provided
            if webhook.secret:
                payload_body = str(delivery.payload).encode('utf-8')
                signature = hmac.new(
                    webhook.secret.encode('utf-8'),
                    payload_body,
                    hashlib.sha256
                ).hexdigest()
                headers["X-EasyRent-Signature"] = f"sha256={signature}"

            # Send request
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    webhook.url,
                    json=delivery.payload,
                    headers=headers
                )

                # Update delivery with response
                delivery.response_status_code = response.status_code
                delivery.response_body = response.text[:1000]  # Limit response body
                delivery.delivered_at = datetime.utcnow()

                if 200 <= response.status_code < 300:
                    delivery.status = WebhookStatus.SUCCESSFUL
                    webhook.successful_deliveries += 1
                else:
                    delivery.status = WebhookStatus.FAILED
                    delivery.error_message = f"HTTP {response.status_code}: {response.text[:200]}"
                    webhook.failed_deliveries += 1

        except Exception as e:
            delivery.status = WebhookStatus.FAILED
            delivery.error_message = str(e)[:500]
            delivery.delivered_at = datetime.utcnow()
            webhook.failed_deliveries += 1
            logger.error(f"Failed to deliver webhook {delivery.id}: {str(e)}")

        finally:
            # Update webhook statistics
            webhook.total_deliveries += 1
            webhook.last_triggered_at = datetime.utcnow()
            
            # Schedule retry if failed and retries available
            if delivery.status == WebhookStatus.FAILED and delivery.attempt_count < delivery.max_retries:
                delivery.status = WebhookStatus.RETRYING
                delivery.next_retry_at = datetime.utcnow() + timedelta(minutes=5 * delivery.attempt_count)

            self.db.commit()

    def get_webhook_deliveries(
        self,
        user_id: uuid.UUID,
        webhook_id: uuid.UUID,
        status: Optional[WebhookStatus] = None,
        limit: int = 10,
        offset: int = 0
    ) -> tuple[List[WebhookDelivery], int]:
        """Get webhook deliveries"""
        try:
            # Verify webhook ownership
            self.get_webhook(user_id, webhook_id)

            query = self.db.query(WebhookDelivery).filter(
                WebhookDelivery.webhook_id == webhook_id
            )

            if status:
                query = query.filter(WebhookDelivery.status == status)

            total = query.count()
            deliveries = query.order_by(WebhookDelivery.created_at.desc()).offset(offset).limit(limit).all()

            return deliveries, total

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to get webhook deliveries for {webhook_id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve webhook deliveries"
            )

    async def trigger_event(
        self,
        event_type: WebhookEventType,
        resource_type: str,
        resource_id: uuid.UUID,
        event_data: Dict[str, Any],
        triggered_by_user_id: Optional[uuid.UUID] = None
    ) -> None:
        """Trigger webhooks for an event"""
        try:
            # Create event record
            event = WebhookEvent(
                event_type=event_type,
                resource_type=resource_type,
                resource_id=resource_id,
                event_data=event_data,
                triggered_by_user_id=triggered_by_user_id
            )

            self.db.add(event)
            self.db.commit()
            self.db.refresh(event)

            # Find matching webhooks
            webhooks = self.db.query(Webhook).filter(
                and_(
                    Webhook.active == True,
                    func.json_array_elements_text(Webhook.events).op("=")(event_type.value)
                )
            ).all()

            if not webhooks:
                event.processed = True
                event.processed_at = datetime.utcnow()
                self.db.commit()
                return

            # Create deliveries for matching webhooks
            deliveries = []
            for webhook in webhooks:
                # Prepare payload
                payload = {
                    "event_type": event_type.value,
                    "timestamp": datetime.utcnow().isoformat(),
                    "data": event_data,
                    "source": "easyrent-api"
                }

                delivery = WebhookDelivery(
                    webhook_id=webhook.id,
                    event_type=event_type,
                    payload=payload,
                    status=WebhookStatus.PENDING
                )

                deliveries.append((webhook, delivery))
                self.db.add(delivery)

            self.db.commit()

            # Send webhooks asynchronously
            tasks = [self._send_webhook(webhook, delivery) for webhook, delivery in deliveries]
            await asyncio.gather(*tasks, return_exceptions=True)

            # Update event as processed
            event.processed = True
            event.webhook_count = len(deliveries)
            event.processed_at = datetime.utcnow()
            self.db.commit()

            logger.info(f"Triggered {len(deliveries)} webhooks for event {event.id}")

        except Exception as e:
            logger.error(f"Failed to trigger webhooks for event {event_type}: {str(e)}")
            # Don't raise exception to avoid breaking the main flow

    def get_webhook_statistics(self, user_id: uuid.UUID) -> Dict[str, Any]:
        """Get webhook statistics for user"""
        try:
            stats = self.db.query(
                func.count(Webhook.id).label('total_webhooks'),
                func.count(Webhook.id).filter(Webhook.active == True).label('active_webhooks'),
                func.sum(Webhook.total_deliveries).label('total_deliveries'),
                func.sum(Webhook.successful_deliveries).label('successful_deliveries'),
                func.sum(Webhook.failed_deliveries).label('failed_deliveries')
            ).filter(Webhook.user_id == user_id).first()

            return {
                "total_webhooks": stats.total_webhooks or 0,
                "active_webhooks": stats.active_webhooks or 0,
                "total_deliveries": stats.total_deliveries or 0,
                "successful_deliveries": stats.successful_deliveries or 0,
                "failed_deliveries": stats.failed_deliveries or 0,
                "success_rate": (
                    round((stats.successful_deliveries or 0) / (stats.total_deliveries or 1) * 100, 2)
                    if stats.total_deliveries else 0
                )
            }

        except Exception as e:
            logger.error(f"Failed to get webhook statistics for user {user_id}: {str(e)}")
            return {
                "total_webhooks": 0,
                "active_webhooks": 0,
                "total_deliveries": 0,
                "successful_deliveries": 0,
                "failed_deliveries": 0,
                "success_rate": 0
            }