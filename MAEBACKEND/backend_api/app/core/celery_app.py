from celery import Celery
from celery.schedules import schedule

from app.core.config import settings

broker_url = settings.celery_broker_url or settings.redis_url
result_backend = settings.celery_result_backend or settings.redis_url

celery_app = Celery(
    "easyrent",
    broker=broker_url,
    backend=result_backend,
    include=[
        "app.tasks.search_cache_tasks",
        "app.tasks.media_tasks",
        "app.tasks.email_tasks",
        "app.tasks.notification_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    beat_schedule={
        "notifications-drain-queue": {
            "task": "notifications.process_queue",
            "schedule": schedule(run_every=max(5, settings.notification_queue_drain_interval_seconds)),
            "kwargs": {"batch_size": 50},
        }
    },
)
