import base64
import logging
from datetime import datetime

from app.core.celery_app import celery_app
from app.core.database import SessionLocal
from app.services.media_service import MediaService

logger = logging.getLogger(__name__)


@celery_app.task(name="media.process_image_upload")
def process_image_upload_task(
    listing_id: str,
    listing_created_at: str,
    filename: str,
    file_data_b64: str,
    alt_text: str | None = None,
) -> dict:
    """Process and persist an uploaded image asynchronously."""
    db = SessionLocal()
    try:
        service = MediaService(db)
        file_data = base64.b64decode(file_data_b64)
        created_at = datetime.fromisoformat(listing_created_at)

        image = service.create_image(
            listing_id=listing_id,
            listing_created_at=created_at,
            file_data=file_data,
            filename=filename,
            alt_text=alt_text,
        )

        return {
            "success": True,
            "image_id": str(image.id),
            "listing_id": str(image.listing_id),
            "filename": image.filename,
        }
    except Exception as exc:
        logger.exception("Error processing image upload task for listing %s", listing_id)
        return {
            "success": False,
            "listing_id": listing_id,
            "filename": filename,
            "error": str(exc),
        }
    finally:
        db.close()
