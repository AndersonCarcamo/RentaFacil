"""
Endpoints para tareas programadas (scheduled tasks)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ...core.database import get_db
from ...api.deps import get_current_user
from ...models.auth import User
from ...services.booking_scheduler import BookingScheduledTasks

router = APIRouter()


@router.post("/cancel-expired-payments",
    summary="Cancelar reservas con pago expirado (Admin)",
    description="Ejecuta la tarea de cancelar reservas cuyo plazo de 6 horas ha expirado"
)
async def cancel_expired_payments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cancela reservas cuyo plazo de pago ha expirado.
    Solo ejecutable por administradores.
    En producción, esta tarea debería ejecutarse automáticamente cada 15 minutos.
    """
    # Verificar que el usuario es admin
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=403,
            detail="Solo administradores pueden ejecutar tareas programadas"
        )
    
    result = BookingScheduledTasks.cancel_expired_payment_bookings(db)
    
    return result


@router.post("/send-payment-reminders",
    summary="Enviar recordatorios de pago (Admin)",
    description="Envía recordatorios a huéspedes con deadline próximo a vencer"
)
async def send_payment_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Envía recordatorios a huéspedes cuyo plazo de pago está próximo a vencer.
    Solo ejecutable por administradores.
    En producción, esta tarea debería ejecutarse automáticamente cada 10 minutos.
    """
    # Verificar que el usuario es admin
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=403,
            detail="Solo administradores pueden ejecutar tareas programadas"
        )
    
    result = BookingScheduledTasks.send_payment_deadline_warnings(db)
    
    return result


@router.get("/booking-payment-status",
    summary="Ver estado de pagos de reservas (Admin)",
    description="Consulta el estado de pago de todas las reservas confirmadas"
)
async def get_booking_payment_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retorna el estado de pago de todas las reservas.
    """
    if current_user.role != 'admin':
        raise HTTPException(
            status_code=403,
            detail="Solo administradores pueden ver esta información"
        )
    
    from sqlalchemy import text
    
    result = db.execute(text("""
        SELECT 
            id,
            status,
            payment_status,
            hours_remaining,
            confirmed_at,
            payment_deadline,
            reservation_paid_at
        FROM core.bookings_payment_status
        WHERE status IN ('confirmed', 'reservation_paid')
        ORDER BY 
            CASE 
                WHEN payment_status = 'expired' THEN 1
                WHEN payment_status = 'pending' THEN 2
                ELSE 3
            END,
            hours_remaining ASC NULLS LAST
        LIMIT 100
    """))
    
    bookings = []
    for row in result:
        bookings.append({
            "booking_id": str(row.id),
            "status": row.status,
            "payment_status": row.payment_status,
            "hours_remaining": float(row.hours_remaining) if row.hours_remaining else None,
            "confirmed_at": row.confirmed_at.isoformat() if row.confirmed_at else None,
            "payment_deadline": row.payment_deadline.isoformat() if row.payment_deadline else None,
            "reservation_paid_at": row.reservation_paid_at.isoformat() if row.reservation_paid_at else None
        })
    
    return {
        "total": len(bookings),
        "bookings": bookings
    }
