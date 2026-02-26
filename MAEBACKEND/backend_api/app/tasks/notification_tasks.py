import logging
import socket
from datetime import datetime

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.models.auth import User
from app.models.notification import DeliveryMethod, Notification
from app.tasks.email_tasks import send_generic_notification_email_task

logger = logging.getLogger(__name__)


def _normalize_delivery_methods(raw_methods: list | None) -> list[str]:
    if not raw_methods:
        return [DeliveryMethod.IN_APP.value]

    methods: list[str] = []
    for method in raw_methods:
        if isinstance(method, DeliveryMethod):
            methods.append(method.value)
        else:
            methods.append(str(method))
    return methods


@celery_app.task(name="notifications.process_queue")
def process_notification_queue_task(batch_size: int = 50) -> dict:
    """Process pending items from notification_queue asynchronously."""
    db = SessionLocal()
    worker_id = f"celery@{socket.gethostname()}"

    processed = 0
    delivered = 0
    failed = 0

    try:
        from app.services.notification_service import NotificationService

        notification_service = NotificationService(db)
        queue_items = notification_service.claim_notification_queue_items(
            worker_id=worker_id,
            batch_size=batch_size,
        )

        for queue_item in queue_items:
            processed += 1
            try:
                notification = (
                    db.query(Notification)
                    .filter(Notification.id == queue_item.notification_id)
                    .first()
                )
                if not notification:
                    notification_service.complete_notification_queue_item(queue_item.id)
                    continue

                methods = _normalize_delivery_methods(notification.delivery_methods)
                user = db.query(User).filter(User.id == notification.user_id).first()

                method_results: list[dict] = []
                all_ok = True

                for method in methods:
                    if method == DeliveryMethod.IN_APP.value:
                        method_results.append({"method": method, "ok": True})
                        continue

                    if method == DeliveryMethod.EMAIL.value:
                        if not user or not user.email:
                            method_results.append({"method": method, "ok": False, "reason": "missing_user_email"})
                            all_ok = False
                            continue

                        email_ok = send_generic_notification_email_task.run(
                            {
                                "to_email": user.email,
                                "subject": notification.title,
                                "html_content": f"<p>{notification.message}</p>",
                                "text_content": notification.message,
                            }
                        )
                        method_results.append({"method": method, "ok": bool(email_ok)})
                        if not email_ok:
                            all_ok = False
                        continue

                    if method == DeliveryMethod.PUSH.value:
                        method_results.append({"method": method, "ok": True, "reason": "push_queued_no_provider"})
                        continue

                    method_results.append({"method": method, "ok": False, "reason": "unsupported_method"})
                    all_ok = False

                if all_ok:
                    delivered += 1
                    notification.delivered_via = methods
                    notification.sent_at = notification.sent_at or datetime.utcnow()
                    notification.delivered_at = datetime.utcnow()
                    db.commit()
                    notification_service.complete_notification_queue_item(queue_item.id)
                else:
                    failed += 1
                    notification.failed_deliveries = method_results
                    db.commit()
                    notification_service.fail_notification_queue_item(
                        queue_item.id,
                        error_message="one_or_more_delivery_methods_failed",
                    )
            except Exception as exc:
                failed += 1
                logger.exception("Error processing notification queue item %s", queue_item.id)
                notification_service.fail_notification_queue_item(queue_item.id, error_message=str(exc))

        return {
            "worker_id": worker_id,
            "processed": processed,
            "delivered": delivered,
            "failed": failed,
        }
    finally:
        db.close()
