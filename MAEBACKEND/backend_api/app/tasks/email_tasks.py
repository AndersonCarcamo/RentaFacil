import logging

from app.core.celery_app import celery_app
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)


@celery_app.task(name="email.send_booking_request")
def send_booking_request_email_task(payload: dict) -> bool:
    service = EmailService()
    return service.send_booking_request_notification(**payload)


@celery_app.task(name="email.send_payment_request")
def send_payment_request_email_task(payload: dict) -> bool:
    service = EmailService()
    return service.send_payment_request_email(**payload)


@celery_app.task(name="email.send_payment_expired")
def send_payment_expired_email_task(payload: dict) -> bool:
    service = EmailService()
    return service.send_payment_expired_notification(**payload)


@celery_app.task(name="email.send_payment_deadline_reminder")
def send_payment_deadline_reminder_email_task(payload: dict) -> bool:
    service = EmailService()
    return service.send_payment_deadline_reminder(**payload)


@celery_app.task(name="email.send_generic_notification")
def send_generic_notification_email_task(payload: dict) -> bool:
    service = EmailService()
    to_email = payload.get("to_email")
    subject = payload.get("subject")
    html_content = payload.get("html_content")
    text_content = payload.get("text_content")

    if not to_email or not subject or not html_content:
        logger.warning("Invalid generic email payload: missing to_email/subject/html_content")
        return False

    return service.send_email(
        to_email=to_email,
        subject=subject,
        html_content=html_content,
        text_content=text_content,
    )
