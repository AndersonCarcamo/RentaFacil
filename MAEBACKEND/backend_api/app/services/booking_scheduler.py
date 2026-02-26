"""
Servicio de tareas programadas para gestión de bookings
"""
from sqlalchemy import text
from sqlalchemy.orm import Session
from datetime import datetime
import logging

from ..core.database import get_db
from ..tasks.email_tasks import (
    send_payment_deadline_reminder_email_task,
    send_payment_expired_email_task,
)

logger = logging.getLogger(__name__)


class BookingScheduledTasks:
    """
    Tareas programadas para gestión de reservas
    """
    
    @staticmethod
    def cancel_expired_payment_bookings(db: Session) -> dict:
        """
        Cancela reservas cuyo plazo de pago (6 horas) ha expirado.
        Retorna información de las reservas canceladas.
        """
        try:
            result = db.execute(text("""
                SELECT * FROM core.cancel_expired_payment_bookings()
            """))
            
            cancelled_bookings = result.fetchall()
            
            if cancelled_bookings:
                logger.info(f"🔴 Canceladas {len(cancelled_bookings)} reservas por pago expirado")
                
                # Encolar emails de notificación
                for booking in cancelled_bookings:
                    try:
                        send_payment_expired_email_task.delay(
                            {
                                "guest_email": booking.guest_email,
                                "listing_title": booking.listing_title,
                                "deadline": booking.deadline.strftime("%d/%m/%Y %H:%M"),
                            }
                        )
                    except Exception as e:
                        logger.error(f"Error enviando email de cancelación: {e}")
                
                return {
                    "success": True,
                    "cancelled_count": len(cancelled_bookings),
                    "bookings": [
                        {
                            "booking_id": str(row.cancelled_booking_id),
                            "guest_email": row.guest_email,
                            "listing_title": row.listing_title,
                            "deadline": row.deadline.isoformat()
                        }
                        for row in cancelled_bookings
                    ]
                }
            else:
                logger.info("✅ No hay reservas con pago expirado")
                return {
                    "success": True,
                    "cancelled_count": 0,
                    "bookings": []
                }
                
        except Exception as e:
            logger.error(f"❌ Error cancelando reservas expiradas: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    def send_payment_deadline_warnings(db: Session) -> dict:
        """
        Envía recordatorios a huéspedes con deadline próximo a vencer (30 min)
        """
        try:
            result = db.execute(text("""
                SELECT * FROM core.get_payment_deadline_warnings()
            """))
            
            warnings = result.fetchall()
            
            if warnings:
                logger.info(f"⚠️ Enviando {len(warnings)} recordatorios de pago")

                sent_count = 0
                
                for warning in warnings:
                    try:
                        send_payment_deadline_reminder_email_task.delay(
                            {
                                "guest_email": warning.guest_email,
                                "guest_name": warning.guest_name,
                                "listing_title": warning.listing_title,
                                "deadline": warning.deadline.strftime("%d/%m/%Y %H:%M"),
                                "minutes_remaining": int(warning.minutes_remaining),
                                "booking_id": str(warning.booking_id),
                            }
                        )
                        sent_count += 1
                    except Exception as e:
                        logger.error(f"Error enviando recordatorio: {e}")
                
                return {
                    "success": True,
                    "warnings_count": len(warnings),
                    "sent_count": sent_count
                }
            else:
                logger.info("✅ No hay deadlines próximos a vencer")
                return {
                    "success": True,
                    "warnings_count": 0,
                    "sent_count": 0
                }
                
        except Exception as e:
            logger.error(f"❌ Error enviando recordatorios: {e}")
            return {
                "success": False,
                "error": str(e)
            }
