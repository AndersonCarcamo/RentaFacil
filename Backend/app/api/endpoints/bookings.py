"""
Endpoints para el sistema de reservas Airbnb
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from datetime import date, datetime
from uuid import UUID
import logging
from decimal import Decimal
import os
from pathlib import Path

from ...core.database import get_db
from ...api.deps import get_current_user
from ...models.auth import User
from ...models.booking import Booking, BookingPayment, BookingCalendar
from ...models.listing import Listing
from ...models.media import Image
from ...schemas.bookings import (
    CreateBookingDto,
    BookingResponse,
    BookingWithPaymentsResponse,
    AvailabilityCheckResult,
    DateAvailability,
    HostBookingsResponse
)
from ...services.email_service import EmailService

logger = logging.getLogger(__name__)

router = APIRouter()

# =====================================================
# CALENDAR ENDPOINTS
# =====================================================

@router.get("/calendar/{listing_id}",
    summary="Obtener calendario de disponibilidad",
    description="Devuelve la disponibilidad de fechas para un listing en un mes específico"
)
async def get_calendar(
    listing_id: str,
    year: int,
    month: int,
    db: Session = Depends(get_db)
):
    """
    Obtiene el calendario de disponibilidad para un mes específico.
    
    Parámetros:
    - listing_id: ID del listing
    - year: Año (ej: 2025)
    - month: Mes (1-12)
    
    Retorna lista de objetos con:
    - date: Fecha (YYYY-MM-DD)
    - is_available: true/false
    - price: Precio para esa fecha (puede ser override o precio base)
    - booking_id: ID de la reserva si está ocupada
    """
    try:
        listing_uuid = UUID(listing_id)
        
        # Verificar que el listing existe
        listing_exists = db.execute(
            text("SELECT id FROM core.listings WHERE id = :listing_id LIMIT 1"),
            {"listing_id": listing_uuid}
        ).fetchone()
        
        if not listing_exists:
            raise HTTPException(status_code=404, detail="Listing no encontrado")
        
        # Obtener el calendario del mes
        result = db.execute(text("""
            SELECT 
                c.date,
                c.is_available,
                COALESCE(c.price_override, l.price) as price,
                c.booking_id,
                c.notes
            FROM core.booking_calendar c
            JOIN core.listings l ON c.listing_id = l.id
            WHERE c.listing_id = :listing_id
                AND EXTRACT(YEAR FROM c.date) = :year
                AND EXTRACT(MONTH FROM c.date) = :month
            ORDER BY c.date
        """), {
            "listing_id": listing_uuid,
            "year": year,
            "month": month
        })
        
        calendar = []
        for row in result:
            calendar.append({
                "date": row.date.isoformat(),
                "is_available": row.is_available,
                "price": float(row.price) if row.price else None,
                "booking_id": str(row.booking_id) if row.booking_id else None,
                "notes": row.notes
            })
        
        # Si no hay datos en el calendario, generar fechas disponibles del mes
        if not calendar:
            # Obtener el precio base del listing
            listing_data = db.execute(
                text("SELECT price FROM core.listings WHERE id = :listing_id"),
                {"listing_id": listing_uuid}
            ).fetchone()
            
            base_price = float(listing_data.price) if listing_data else 0
            
            # Generar fechas del mes
            import calendar as cal
            _, last_day = cal.monthrange(year, month)
            
            for day in range(1, last_day + 1):
                date_obj = date(year, month, day)
                calendar.append({
                    "date": date_obj.isoformat(),
                    "is_available": True,
                    "price": base_price,
                    "booking_id": None,
                    "notes": None
                })
        
        return calendar
        
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de listing inválido")
    except Exception as e:
        logger.error(f"Error obteniendo calendario: {e}")
        raise HTTPException(status_code=500, detail=f"Error al obtener calendario: {str(e)}")


@router.get("/availability",
    summary="Verificar disponibilidad de fechas",
    description="Verifica si un rango de fechas está disponible para reservar"
)
async def check_availability(
    listingId: str,
    checkIn: str,
    checkOut: str,
    db: Session = Depends(get_db)
):
    """
    Verifica la disponibilidad de un rango de fechas.
    
    Parámetros:
    - listingId: ID del listing
    - checkIn: Fecha de check-in (YYYY-MM-DD)
    - checkOut: Fecha de check-out (YYYY-MM-DD)
    
    Retorna:
    - available: true/false
    - blocked_dates: Lista de fechas no disponibles
    - total_price: Precio total del período
    - nights: Número de noches
    """
    try:
        listing_uuid = UUID(listingId)
        check_in_date = datetime.strptime(checkIn, "%Y-%m-%d").date()
        check_out_date = datetime.strptime(checkOut, "%Y-%m-%d").date()
        
        # Validar fechas
        if check_out_date <= check_in_date:
            raise HTTPException(
                status_code=400, 
                detail="La fecha de check-out debe ser posterior a la de check-in"
            )
        
        # Usar la función SQL para verificar disponibilidad
        result = db.execute(text("""
            SELECT core.check_availability(:listing_id, :check_in, :check_out) as available
        """), {
            "listing_id": listing_uuid,
            "check_in": check_in_date,
            "check_out": check_out_date
        }).fetchone()
        
        is_available = result.available if result else False
        
        # Obtener fechas bloqueadas si no está disponible
        blocked_dates = []
        if not is_available:
            blocked_result = db.execute(text("""
                SELECT date
                FROM core.booking_calendar
                WHERE listing_id = :listing_id
                    AND date >= :check_in
                    AND date < :check_out
                    AND is_available = FALSE
                ORDER BY date
            """), {
                "listing_id": listing_uuid,
                "check_in": check_in_date,
                "check_out": check_out_date
            })
            
            blocked_dates = [row.date.isoformat() for row in blocked_result]
        
        # Calcular precio total
        nights = (check_out_date - check_in_date).days
        listing_data = db.execute(
            text("SELECT price FROM core.listings WHERE id = :listing_id"),
            {"listing_id": listing_uuid}
        ).fetchone()
        
        price_per_night = float(listing_data.price) if listing_data else 0
        total_price = price_per_night * nights
        
        return {
            "available": is_available,
            "listing_id": listingId,
            "check_in_date": checkIn,
            "check_out_date": checkOut,
            "nights": nights,
            "price_per_night": price_per_night,
            "total_price": total_price,
            "blocked_dates": blocked_dates
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Formato de datos inválido: {str(e)}")
    except Exception as e:
        logger.error(f"Error verificando disponibilidad: {e}")
        raise HTTPException(status_code=500, detail=f"Error al verificar disponibilidad: {str(e)}")


# =====================================================
# BOOKING ENDPOINTS
# =====================================================

@router.post("/",
    status_code=status.HTTP_201_CREATED,
    response_model=BookingResponse,
    summary="Crear nueva reserva"
)
async def create_booking(
    data: CreateBookingDto,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Crea una nueva reserva (pendiente de confirmación del host).
    
    El flujo es:
    1. Validar que el listing existe y está disponible para Airbnb
    2. Validar que las fechas están disponibles
    3. Calcular precios y crear la reserva en estado 'pending_confirmation'
    4. El host debe confirmar la reserva
    5. Una vez confirmada, el huésped paga el 50% (reserva)
    6. En el check-in, el huésped paga el 50% restante
    """
    try:
        logger.info(f"Usuario autenticado: {current_user.id}, Email: {current_user.email}")
        logger.info(f"Datos de reserva recibidos: listing_id={data.listing_id}, check_in={data.check_in_date}, check_out={data.check_out_date}")
        
        # 1. Verificar que el listing existe
        listing = db.query(Listing).filter(Listing.id == UUID(data.listing_id)).first()
        if not listing:
            raise HTTPException(status_code=404, detail="Propiedad no encontrada")
        
        # 2. Verificar que el listing es tipo Airbnb
        if listing.rental_term != 'daily':
            raise HTTPException(
                status_code=400,
                detail="Esta propiedad no está disponible para reservas tipo Airbnb"
            )
        
        # 3. Verificar que el usuario no esté reservando su propia propiedad
        if str(listing.owner_user_id) == str(current_user.id):
            raise HTTPException(
                status_code=400,
                detail="No puedes reservar tu propia propiedad"
            )
        
        # 4. Verificar número de huéspedes
        if listing.max_guests and data.number_of_guests > listing.max_guests:
            raise HTTPException(
                status_code=400,
                detail=f"El número de huéspedes excede el máximo permitido ({listing.max_guests})"
            )
        
        # 5. Calcular noches
        nights = (data.check_out_date - data.check_in_date).days
        if nights < 1:
            raise HTTPException(
                status_code=400,
                detail="La reserva debe ser de al menos 1 noche"
            )
        
        # 6. Verificar disponibilidad usando la función SQL
        availability_query = text("""
            SELECT core.check_availability(
                CAST(:listing_id AS uuid),
                CAST(:check_in AS date),
                CAST(:check_out AS date)
            ) as available
        """)
        
        result = db.execute(
            availability_query,
            {
                "listing_id": data.listing_id,
                "check_in": data.check_in_date.isoformat(),
                "check_out": data.check_out_date.isoformat()
            }
        ).first()
        
        if not result or not result.available:
            raise HTTPException(
                status_code=409,
                detail="Las fechas seleccionadas no están disponibles"
            )
        
        # 7. Calcular precios
        price_per_night = float(listing.price)
        total_price = Decimal(str(price_per_night * nights))
        reservation_amount = total_price / 2  # 50% inicial
        checkin_amount = total_price / 2      # 50% al check-in
        
        # 8. Crear la reserva
        booking = Booking(
            listing_id=UUID(data.listing_id),
            listing_created_at=listing.created_at,
            guest_user_id=current_user.id,
            host_user_id=listing.owner_user_id,
            check_in_date=data.check_in_date,
            check_out_date=data.check_out_date,
            nights=nights,
            price_per_night=Decimal(str(price_per_night)),
            total_price=total_price,
            reservation_amount=reservation_amount,
            checkin_amount=checkin_amount,
            service_fee=Decimal('0.00'),
            cleaning_fee=Decimal('0.00'),
            status='pending_confirmation',
            number_of_guests=data.number_of_guests,
            guest_message=data.guest_message
        )
        
        db.add(booking)
        db.commit()
        db.refresh(booking)
        
        logger.info(f"Reserva creada: {booking.id} para listing {data.listing_id}")
        
        # Enviar notificación por email al propietario
        try:
            # Obtener información del propietario
            owner = db.query(User).filter(User.id == listing.owner_user_id).first()
            
            if owner and owner.email:
                email_service = EmailService()
                
                # Formatear fechas para el email
                check_in_formatted = booking.check_in_date.strftime("%d/%m/%Y")
                check_out_formatted = booking.check_out_date.strftime("%d/%m/%Y")
                
                # Obtener nombre del huésped
                guest_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or current_user.email
                
                # Obtener nombre del propietario
                owner_name = f"{owner.first_name or ''} {owner.last_name or ''}".strip() or "Propietario"
                
                email_service.send_booking_request_notification(
                    owner_email=owner.email,
                    owner_name=owner_name,
                    guest_name=guest_name,
                    property_title=listing.title,
                    check_in=check_in_formatted,
                    check_out=check_out_formatted,
                    guests=booking.number_of_guests,
                    total_price=float(booking.total_price),
                    booking_id=str(booking.id),
                    message=booking.guest_message
                )
                
                logger.info(f"📧 Email enviado al propietario {owner.email} para reserva {booking.id}")
            else:
                logger.warning(f"⚠️ No se pudo enviar email: propietario sin email configurado")
        except Exception as email_error:
            # No fallar la reserva si el email falla
            logger.error(f"❌ Error enviando email de notificación: {email_error}")
        
        # Convertir a response DTO
        return BookingResponse(
            id=str(booking.id),
            listing_id=str(booking.listing_id),
            guest_user_id=str(booking.guest_user_id),
            host_user_id=str(booking.host_user_id),
            check_in_date=booking.check_in_date,
            check_out_date=booking.check_out_date,
            nights=booking.nights,
            price_per_night=booking.price_per_night,
            total_price=booking.total_price,
            reservation_amount=booking.reservation_amount,
            checkin_amount=booking.checkin_amount,
            service_fee=booking.service_fee,
            cleaning_fee=booking.cleaning_fee,
            status=booking.status,
            number_of_guests=booking.number_of_guests,
            guest_message=booking.guest_message,
            host_response=booking.host_response,
            cancellation_reason=booking.cancellation_reason,
            created_at=booking.created_at,
            updated_at=booking.updated_at,
            confirmed_at=booking.confirmed_at,
            reservation_paid_at=booking.reservation_paid_at,
            checked_in_at=booking.checked_in_at,
            completed_at=booking.completed_at,
            cancelled_at=booking.cancelled_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creando reserva: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al crear la reserva: {str(e)}"
        )


@router.get("/my-bookings",
    summary="Mis reservas como huésped"
)
async def get_my_bookings(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista todas las reservas del usuario actual como huésped.
    Incluye información del deadline de pago y estado.
    """
    try:
        query = db.query(Booking).filter(Booking.guest_user_id == current_user.id)
        
        if status:
            query = query.filter(Booking.status == status)
        
        bookings = query.order_by(Booking.created_at.desc()).all()
        
        result = []
        for booking in bookings:
            # Obtener info del listing
            listing = db.query(Listing).filter(Listing.id == booking.listing_id).first()
            # Obtener info del host
            host = db.query(User).filter(User.id == booking.host_user_id).first()
            
            # Obtener primera imagen del listing
            first_image = db.query(Image).filter(
                Image.listing_id == booking.listing_id
            ).order_by(Image.display_order, Image.created_at).first()
            
            # Calcular tiempo restante para pago
            hours_remaining = None
            payment_status = None
            if booking.status == 'confirmed' and booking.payment_deadline:
                from datetime import datetime, timezone
                now = datetime.now(timezone.utc)
                deadline = booking.payment_deadline
                if deadline.tzinfo is None:
                    from datetime import timezone as tz
                    deadline = deadline.replace(tzinfo=tz.utc)
                
                if booking.reservation_paid_at:
                    payment_status = 'paid'
                elif deadline > now:
                    payment_status = 'pending'
                    hours_remaining = (deadline - now).total_seconds() / 3600
                else:
                    payment_status = 'expired'
            
            result.append({
                "id": str(booking.id),
                "listing_id": str(booking.listing_id),
                "listing_title": listing.title if listing else "N/A",
                "listing_image": first_image.medium_url if first_image else None,
                "host_name": f"{host.first_name or ''} {host.last_name or ''}".strip() if host else "N/A",
                "host_email": host.email if host else None,
                "host_phone": host.phone if host else None,
                "host_profile_picture": host.profile_picture_url if host else None,
                "check_in_date": booking.check_in_date.isoformat(),
                "check_out_date": booking.check_out_date.isoformat(),
                "nights": booking.nights,
                "number_of_guests": booking.number_of_guests,
                "total_price": float(booking.total_price),
                "reservation_amount": float(booking.reservation_amount),
                "status": booking.status,
                "payment_deadline": booking.payment_deadline.isoformat() if booking.payment_deadline else None,
                "hours_remaining": hours_remaining,
                "payment_status": payment_status,
                "payment_proof_url": booking.payment_proof_url,
                "payment_proof_uploaded_at": booking.payment_proof_uploaded_at.isoformat() if booking.payment_proof_uploaded_at else None,
                "created_at": booking.created_at.isoformat()
            })
        
        return {"bookings": result, "total": len(result)}
        
    except Exception as e:
        logger.error(f"Error obteniendo reservas del huésped: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener reservas: {str(e)}"
        )


@router.get("/host-bookings",
    response_model=HostBookingsResponse,
    summary="Mis reservas como anfitrión"
)
async def get_host_bookings(
    status: Optional[List[str]] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lista todas las reservas de las propiedades del usuario como anfitrión.
    Filtra por status si se proporciona.
    """
    try:
        print(f"🔍 DEBUG get_host_bookings - INICIO")
        print(f"🔍 DEBUG get_host_bookings - user_id: {current_user.id}")
        print(f"🔍 DEBUG get_host_bookings - status filter: {status}")
        print(f"🔍 DEBUG get_host_bookings - status type: {type(status)}")
        
        # Buscar directamente por host_user_id (más eficiente)
        query = db.query(Booking).filter(Booking.host_user_id == current_user.id)
        print(f"🔍 DEBUG get_host_bookings - Query creada")
        
        if status and len(status) > 0:
            print(f"🔍 DEBUG get_host_bookings - Aplicando filtro de status")
            query = query.filter(Booking.status.in_(status))
        
        print(f"🔍 DEBUG get_host_bookings - Ejecutando query...")
        bookings = query.order_by(Booking.created_at.desc()).all()
        
        print(f"🔍 DEBUG get_host_bookings - bookings count: {len(bookings)}")
        
        result = []
        for booking in bookings:
            # Obtener info del listing
            listing = db.query(Listing).filter(Listing.id == booking.listing_id).first()
            # Obtener info del huésped
            guest = db.query(User).filter(User.id == booking.guest_user_id).first()
            
            result.append({
                "id": str(booking.id),
                "listing_id": str(booking.listing_id),
                "listing_title": listing.title if listing else "N/A",
                "guest_name": f"{guest.first_name or ''} {guest.last_name or ''}".strip() if guest else "N/A",
                "guest_email": guest.email if guest else None,
                "check_in_date": booking.check_in_date.isoformat(),
                "check_out_date": booking.check_out_date.isoformat(),
                "nights": booking.nights,
                "number_of_guests": booking.number_of_guests,
                "total_price": float(booking.total_price),
                "status": booking.status,
                "guest_message": booking.guest_message,
                "created_at": booking.created_at.isoformat()
            })
        
        return {"bookings": result, "total": len(result)}
        
    except Exception as e:
        print(f"❌ ERROR en get_host_bookings: {e}")
        print(f"❌ ERROR type: {type(e)}")
        import traceback
        traceback.print_exc()
        logger.error(f"Error obteniendo reservas del host: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener reservas: {str(e)}"
        )


@router.get("/{booking_id}",
    summary="Obtener detalles de una reserva"
)
async def get_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene los detalles completos de una reserva.
    """
    raise HTTPException(
        status_code=501,
        detail="Endpoint en desarrollo. Próximamente disponible."
    )


@router.patch("/{booking_id}/confirm",
    summary="Confirmar una reserva (solo host)"
)
async def confirm_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    El host confirma una reserva pendiente.
    Cambia el status de 'pending_confirmation' a 'confirmed'.
    Envía email al huésped solicitando pago del 50% en 6 horas.
    """
    try:
        booking = db.query(Booking).filter(Booking.id == UUID(booking_id)).first()
        
        if not booking:
            raise HTTPException(status_code=404, detail="Reserva no encontrada")
        
        # Verificar que el usuario actual es el host
        if booking.host_user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="No tienes permiso para confirmar esta reserva"
            )
        
        # Verificar que está en estado correcto
        if booking.status != 'pending_confirmation':
            raise HTTPException(
                status_code=400,
                detail=f"La reserva no puede ser confirmada. Estado actual: {booking.status}"
            )
        
        # Actualizar estado y timestamps
        booking.status = 'confirmed'
        booking.confirmed_at = datetime.utcnow()
        
        # Establecer deadline de pago: 6 horas desde ahora
        from datetime import timedelta
        payment_deadline = datetime.utcnow() + timedelta(hours=6)
        booking.payment_deadline = payment_deadline
        
        db.commit()
        db.refresh(booking)
        
        logger.info(f"Reserva {booking_id} confirmada por host {current_user.id}")
        
        # Obtener información del huésped y la propiedad para el email
        guest = db.query(User).filter(User.id == booking.guest_user_id).first()
        listing = db.query(Listing).filter(Listing.id == booking.listing_id).first()
        
        email_status = "no enviado"
        if guest and listing:
            try:
                logger.info(f"📧 Preparando email de confirmación para {guest.email}")
                
                # Calcular monto de reserva (50% del total)
                reservation_amount = float(booking.reservation_amount)
                
                # Formatear la fecha límite
                payment_deadline_str = payment_deadline.strftime("%d/%m/%Y %H:%M")
                
                # Enviar email al huésped
                email_service = EmailService()
                
                guest_name = f"{guest.first_name or ''} {guest.last_name or ''}".strip() or "Huésped"
                owner_name = f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or "Anfitrión"
                
                logger.info(f"📧 Enviando email a: {guest.email}")
                logger.info(f"📧 Huésped: {guest_name}, Anfitrión: {owner_name}")
                logger.info(f"📧 Propiedad: {listing.title}")
                logger.info(f"📧 Monto de reserva: S/ {reservation_amount:.2f}")
                logger.info(f"📧 Fecha límite: {payment_deadline_str}")
                
                email_sent = email_service.send_payment_request_email(
                    guest_email=guest.email,
                    guest_name=guest_name,
                    property_title=listing.title,
                    check_in=booking.check_in_date.strftime("%d/%m/%Y"),
                    check_out=booking.check_out_date.strftime("%d/%m/%Y"),
                    nights=booking.nights,
                    guests=booking.number_of_guests,
                    total_price=float(booking.total_price),
                    reservation_amount=reservation_amount,
                    booking_id=str(booking.id),
                    payment_deadline=payment_deadline_str,
                    owner_name=owner_name
                )
                
                if email_sent:
                    logger.info(f"✅ Email de solicitud de pago enviado exitosamente a {guest.email}")
                    email_status = "enviado exitosamente"
                else:
                    logger.warning(f"⚠️ No se pudo enviar email a {guest.email}")
                    email_status = "falló al enviar"
                    
            except Exception as e:
                logger.error(f"❌ Error al enviar email de confirmación: {e}")
                import traceback
                traceback.print_exc()
                email_status = f"error: {str(e)}"
        else:
            if not guest:
                logger.error(f"❌ No se encontró el huésped con ID: {booking.guest_user_id}")
            if not listing:
                logger.error(f"❌ No se encontró el listing con ID: {booking.listing_id}")
        
        return {
            "message": f"Reserva confirmada exitosamente. Email {email_status}.",
            "booking_id": str(booking.id),
            "status": booking.status,
            "payment_deadline": payment_deadline.isoformat(),
            "email_status": email_status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error confirmando reserva: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al confirmar reserva: {str(e)}"
        )


@router.patch("/{booking_id}/reject",
    summary="Rechazar una reserva (solo host)"
)
async def reject_booking(
    booking_id: str,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    El host rechaza una reserva pendiente.
    Cambia el status a 'cancelled_by_host'.
    """
    try:
        booking = db.query(Booking).filter(Booking.id == UUID(booking_id)).first()
        
        if not booking:
            raise HTTPException(status_code=404, detail="Reserva no encontrada")
        
        # Verificar que el usuario actual es el host
        if booking.host_user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="No tienes permiso para rechazar esta reserva"
            )
        
        # Verificar que está en estado correcto
        if booking.status != 'pending_confirmation':
            raise HTTPException(
                status_code=400,
                detail=f"La reserva no puede ser rechazada. Estado actual: {booking.status}"
            )
        
        booking.status = 'cancelled_by_host'
        booking.cancelled_at = datetime.utcnow()
        if reason:
            booking.cancellation_reason = reason
        db.commit()
        
        logger.info(f"Reserva {booking_id} rechazada por host {current_user.id}")
        
        return {
            "message": "Reserva rechazada",
            "booking_id": str(booking.id),
            "status": booking.status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rechazando reserva: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al rechazar reserva: {str(e)}"
        )


@router.post("/{booking_id}/upload-payment-proof",
    summary="Subir comprobante de pago (solo huésped)"
)
async def upload_payment_proof(
    booking_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    El huésped sube el comprobante de pago (voucher/screenshot de transferencia).
    Formatos aceptados: JPG, PNG, PDF
    """
    try:
        booking = db.query(Booking).filter(Booking.id == UUID(booking_id)).first()
        
        if not booking:
            raise HTTPException(status_code=404, detail="Reserva no encontrada")
        
        # Verificar que el usuario actual es el huésped
        if booking.guest_user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="No tienes permiso para subir comprobante en esta reserva"
            )
        
        # Verificar que está en estado confirmed
        if booking.status != 'confirmed':
            raise HTTPException(
                status_code=400,
                detail=f"Solo puedes subir comprobante en reservas confirmadas. Estado actual: {booking.status}"
            )
        
        # Validar tipo de archivo
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.pdf']
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Formato no permitido. Use: {', '.join(allowed_extensions)}"
            )
        
        # Crear directorio si no existe
        uploads_dir = Path(__file__).parent.parent.parent.parent / "uploads" / "payment_proofs"
        uploads_dir.mkdir(parents=True, exist_ok=True)
        
        # Generar nombre único de archivo
        import uuid
        filename = f"{uuid.uuid4()}{file_extension}"
        file_path = uploads_dir / filename
        
        # Guardar archivo
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Actualizar booking
        booking.payment_proof_url = f"/uploads/payment_proofs/{filename}"
        booking.payment_proof_uploaded_at = datetime.utcnow()
        db.commit()
        
        logger.info(f"Comprobante de pago subido para reserva {booking_id} por huésped {current_user.id}")
        
        # TODO: Enviar notificación al host y admin
        
        return {
            "message": "Comprobante de pago subido exitosamente. Será verificado pronto.",
            "booking_id": str(booking.id),
            "payment_proof_url": booking.payment_proof_url,
            "uploaded_at": booking.payment_proof_uploaded_at.isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error subiendo comprobante: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al subir comprobante: {str(e)}"
        )


@router.post("/{booking_id}/process-payment",
    summary="Procesar pago con Culqi"
)
async def process_payment(
    booking_id: str,
    payment_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Procesa el pago de la reserva usando Culqi.
    Requiere el token generado por Culqi en el frontend.
    """
    try:
        booking = db.query(Booking).filter(Booking.id == UUID(booking_id)).first()
        
        if not booking:
            raise HTTPException(status_code=404, detail="Reserva no encontrada")
        
        if booking.guest_user_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="No tienes permiso para realizar esta acción"
            )
        
        if booking.status != 'confirmed':
            raise HTTPException(
                status_code=400,
                detail=f"No se puede procesar pago para estado: {booking.status}"
            )
        
        # Obtener el token de Culqi del frontend
        culqi_token = payment_data.get('token')
        if not culqi_token:
            raise HTTPException(status_code=400, detail="Token de Culqi no proporcionado")
        
        # Configuración de Culqi
        import requests
        
        # Llave privada de Culqi (debe estar en variables de entorno en producción)
        culqi_secret_key = 'sk_test_yrsjDrloVOls3E62'
        amount_in_cents = int(booking.reservation_amount * 100)
        
        logger.info(f"🔑 Procesando pago Culqi - Booking: {booking_id}, Monto: {amount_in_cents} centavos")
        
        # Crear cargo en Culqi
        headers = {
            'Authorization': f'Bearer {culqi_secret_key}',
            'Content-Type': 'application/json'
        }
        
        charge_data = {
            'amount': amount_in_cents,
            'currency_code': 'PEN',
            'email': current_user.email,
            'source_id': culqi_token,
            'description': f'Reserva de propiedad - {booking.listing_id}'
        }
        
        response = requests.post(
            'https://api.culqi.com/v2/charges',
            json=charge_data,
            headers=headers
        )
        
        logger.info(f"📡 Respuesta de Culqi - Status: {response.status_code}")
        logger.info(f"📡 Respuesta de Culqi - Body: {response.text}")
        
        if response.status_code != 201:
            error_data = response.json()
            logger.error(f"❌ Error en Culqi: {error_data}")
            
            # Mensaje más específico según el tipo de error
            error_message = error_data.get('user_message') or error_data.get('merchant_message') or 'Error al procesar el pago'
            
            raise HTTPException(
                status_code=400,
                detail=error_message
            )
        
        charge_result = response.json()
        
        # Actualizar booking
        booking.status = 'reservation_paid'
        booking.reservation_paid_at = datetime.utcnow()
        booking.payment_proof_url = f"culqi_charge_{charge_result['id']}"
        booking.payment_verified_at = datetime.utcnow()
        booking.payment_verified_by = current_user.id
        
        db.commit()
        
        logger.info(f"Pago procesado exitosamente para reserva {booking_id} con Culqi charge {charge_result['id']}")
        
        # TODO: Enviar email de confirmación de pago
        
        return {
            "message": "Pago procesado exitosamente",
            "booking_id": str(booking.id),
            "charge_id": charge_result['id'],
            "amount": float(booking.reservation_amount),
            "status": booking.status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error procesando pago: {e}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar el pago: {str(e)}"
        )


@router.patch("/{booking_id}/verify-payment",
    summary="Verificar pago (solo admin/host)"
)
async def verify_payment(
    booking_id: str,
    approved: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Admin o host verifica el pago y cambia estado a 'reservation_paid'.
    Si se rechaza, se puede solicitar nuevo comprobante.
    """
    try:
        booking = db.query(Booking).filter(Booking.id == UUID(booking_id)).first()
        
        if not booking:
            raise HTTPException(status_code=404, detail="Reserva no encontrada")
        
        # Verificar que el usuario es admin o el host
        is_admin = current_user.role == 'admin'
        is_host = booking.host_user_id == current_user.id
        
        if not (is_admin or is_host):
            raise HTTPException(
                status_code=403,
                detail="Solo administradores o el anfitrión pueden verificar pagos"
            )
        
        # Verificar que hay un comprobante subido
        if not booking.payment_proof_url:
            raise HTTPException(
                status_code=400,
                detail="No hay comprobante de pago subido"
            )
        
        if approved:
            # Aprobar pago
            booking.status = 'reservation_paid'
            booking.reservation_paid_at = datetime.utcnow()
            booking.payment_verified_by = current_user.id
            booking.payment_verified_at = datetime.utcnow()
            
            logger.info(f"Pago verificado y aprobado para reserva {booking_id} por {current_user.id}")
            message = "Pago verificado y aprobado. Reserva confirmada."
            
            # TODO: Enviar email de confirmación al huésped
            
        else:
            # Rechazar pago - resetear para que suba otro comprobante
            booking.payment_proof_url = None
            booking.payment_proof_uploaded_at = None
            
            logger.info(f"Pago rechazado para reserva {booking_id} por {current_user.id}")
            message = "Pago rechazado. El huésped debe subir un nuevo comprobante."
            
            # TODO: Enviar email al huésped informando del rechazo
        
        db.commit()
        
        return {
            "message": message,
            "booking_id": str(booking.id),
            "status": booking.status,
            "approved": approved
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verificando pago: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al verificar pago: {str(e)}"
        )
