"""
Endpoints para el dashboard del agente inmobiliario
Dashboard para gestión de propiedades y reservas tipo Airbnb
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date, timedelta
from uuid import UUID
from decimal import Decimal
import logging

from ...core.database import get_db
from ...api.deps import get_current_user
from ...models.auth import User
from ...schemas.bookings import (
    AgentDashboardResponse,
    AgentDashboardStats,
    AgentBookingItem,
    BookingGuestInfo,
    BookingListingInfo,
    ApproveBookingDto,
    RejectBookingDto,
    BookingResponse
)

logger = logging.getLogger(__name__)

router = APIRouter()


# =====================================================
# MOCK DATA HELPERS
# =====================================================

def get_mock_guest_info(guest_id: int) -> BookingGuestInfo:
    """Genera información mockeada de huéspedes"""
    guests = [
        {
            "id": "guest-001",
            "name": "Carlos Mendoza",
            "email": "carlos.mendoza@email.com",
            "phone": "+51 987654321",
            "avatar_url": "https://i.pravatar.cc/150?img=12",
            "verified": True
        },
        {
            "id": "guest-002",
            "name": "María García",
            "email": "maria.garcia@email.com",
            "phone": "+51 987654322",
            "avatar_url": "https://i.pravatar.cc/150?img=45",
            "verified": True
        },
        {
            "id": "guest-003",
            "name": "Pedro Sánchez",
            "email": "pedro.sanchez@email.com",
            "phone": "+51 987654323",
            "avatar_url": "https://i.pravatar.cc/150?img=33",
            "verified": False
        },
        {
            "id": "guest-004",
            "name": "Ana Torres",
            "email": "ana.torres@email.com",
            "phone": "+51 987654324",
            "avatar_url": "https://i.pravatar.cc/150?img=47",
            "verified": True
        },
        {
            "id": "guest-005",
            "name": "Luis Ramírez",
            "email": "luis.ramirez@email.com",
            "phone": "+51 987654325",
            "avatar_url": "https://i.pravatar.cc/150?img=15",
            "verified": True
        }
    ]
    return BookingGuestInfo(**guests[guest_id % len(guests)])


def get_mock_listing_info(listing_id: int) -> BookingListingInfo:
    """Genera información mockeada de propiedades"""
    listings = [
        {
            "id": "listing-001",
            "title": "Departamento moderno en Miraflores",
            "address": "Av. Larco 1234, Miraflores, Lima",
            "property_type": "Departamento",
            "bedrooms": 2,
            "bathrooms": 2,
            "main_image_url": "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"
        },
        {
            "id": "listing-002",
            "title": "Casa acogedora en San Isidro",
            "address": "Calle Los Pinos 567, San Isidro, Lima",
            "property_type": "Casa",
            "bedrooms": 3,
            "bathrooms": 2,
            "main_image_url": "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800"
        },
        {
            "id": "listing-003",
            "title": "Loft minimalista en Barranco",
            "address": "Jr. Junín 890, Barranco, Lima",
            "property_type": "Loft",
            "bedrooms": 1,
            "bathrooms": 1,
            "main_image_url": "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"
        },
        {
            "id": "listing-004",
            "title": "Penthouse con vista al mar en La Punta",
            "address": "Malecón Figueredo 345, La Punta, Callao",
            "property_type": "Penthouse",
            "bedrooms": 3,
            "bathrooms": 3,
            "main_image_url": "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800"
        },
        {
            "id": "listing-005",
            "title": "Estudio acogedor en San Miguel",
            "address": "Av. La Marina 2345, San Miguel, Lima",
            "property_type": "Estudio",
            "bedrooms": 1,
            "bathrooms": 1,
            "main_image_url": "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"
        }
    ]
    return BookingListingInfo(**listings[listing_id % len(listings)])


def generate_mock_bookings() -> List[AgentBookingItem]:
    """Genera reservas mockeadas para el dashboard"""
    today = date.today()
    
    mock_bookings = [
        # Reservas pendientes de confirmación
        AgentBookingItem(
            id="booking-001",
            status="pending_confirmation",
            check_in_date=today + timedelta(days=15),
            check_out_date=today + timedelta(days=20),
            nights=5,
            number_of_guests=2,
            total_price=Decimal("1500.00"),
            guest=get_mock_guest_info(0),
            listing=get_mock_listing_info(0),
            guest_message="Hola! Me gustaría reservar este departamento para unas vacaciones con mi pareja. ¿Hay estacionamiento disponible?",
            created_at=datetime.now() - timedelta(hours=2),
            reservation_paid=True,
            checkin_paid=False
        ),
        AgentBookingItem(
            id="booking-002",
            status="pending_confirmation",
            check_in_date=today + timedelta(days=10),
            check_out_date=today + timedelta(days=14),
            nights=4,
            number_of_guests=4,
            total_price=Decimal("2400.00"),
            guest=get_mock_guest_info(1),
            listing=get_mock_listing_info(1),
            guest_message="Necesito un lugar cerca del aeropuerto para una reunión de negocios. ¿Tienen WiFi de alta velocidad?",
            created_at=datetime.now() - timedelta(hours=5),
            reservation_paid=True,
            checkin_paid=False
        ),
        AgentBookingItem(
            id="booking-003",
            status="pending_confirmation",
            check_in_date=today + timedelta(days=7),
            check_out_date=today + timedelta(days=10),
            nights=3,
            number_of_guests=1,
            total_price=Decimal("900.00"),
            guest=get_mock_guest_info(2),
            listing=get_mock_listing_info(2),
            guest_message="Soy estudiante y busco un lugar tranquilo para estudiar. ¿El loft tiene escritorio?",
            created_at=datetime.now() - timedelta(hours=12),
            reservation_paid=True,
            checkin_paid=False
        ),
        
        # Reservas confirmadas próximas
        AgentBookingItem(
            id="booking-004",
            status="confirmed",
            check_in_date=today + timedelta(days=5),
            check_out_date=today + timedelta(days=12),
            nights=7,
            number_of_guests=3,
            total_price=Decimal("4200.00"),
            guest=get_mock_guest_info(3),
            listing=get_mock_listing_info(3),
            guest_message="Vacaciones familiares! ¿Hay playa cerca?",
            host_response="¡Bienvenidos! La playa está a 2 minutos caminando. Les enviaré el código de acceso.",
            created_at=datetime.now() - timedelta(days=3),
            confirmed_at=datetime.now() - timedelta(days=2),
            reservation_paid=True,
            checkin_paid=False
        ),
        AgentBookingItem(
            id="booking-005",
            status="confirmed",
            check_in_date=today + timedelta(days=2),
            check_out_date=today + timedelta(days=5),
            nights=3,
            number_of_guests=2,
            total_price=Decimal("900.00"),
            guest=get_mock_guest_info(4),
            listing=get_mock_listing_info(4),
            guest_message="Fin de semana romántico :)",
            host_response="¡Perfecto! El estudio es ideal para parejas. Check-in a partir de las 3pm.",
            created_at=datetime.now() - timedelta(days=5),
            confirmed_at=datetime.now() - timedelta(days=4),
            reservation_paid=True,
            checkin_paid=True
        ),
        
        # Reservas recientes completadas
        AgentBookingItem(
            id="booking-006",
            status="completed",
            check_in_date=today - timedelta(days=10),
            check_out_date=today - timedelta(days=7),
            nights=3,
            number_of_guests=2,
            total_price=Decimal("900.00"),
            guest=get_mock_guest_info(0),
            listing=get_mock_listing_info(0),
            guest_message="Gracias por una estadía maravillosa!",
            host_response="Fue un placer hospedarlos. Bienvenidos de vuelta cuando quieran.",
            created_at=datetime.now() - timedelta(days=15),
            confirmed_at=datetime.now() - timedelta(days=14),
            reservation_paid=True,
            checkin_paid=True
        ),
        AgentBookingItem(
            id="booking-007",
            status="completed",
            check_in_date=today - timedelta(days=20),
            check_out_date=today - timedelta(days=15),
            nights=5,
            number_of_guests=4,
            total_price=Decimal("3000.00"),
            guest=get_mock_guest_info(1),
            listing=get_mock_listing_info(1),
            created_at=datetime.now() - timedelta(days=25),
            confirmed_at=datetime.now() - timedelta(days=24),
            reservation_paid=True,
            checkin_paid=True
        )
    ]
    
    return mock_bookings


def generate_mock_stats() -> AgentDashboardStats:
    """Genera estadísticas mockeadas del dashboard"""
    return AgentDashboardStats(
        total_properties=8,
        active_properties=5,
        pending_bookings=3,
        confirmed_bookings=2,
        completed_bookings=12,
        total_revenue_month=Decimal("8500.00"),
        total_revenue_year=Decimal("45000.00"),
        occupancy_rate=68.5
    )


# =====================================================
# DASHBOARD ENDPOINTS
# =====================================================

@router.get(
    "/",
    response_model=AgentDashboardResponse,
    summary="Obtener dashboard completo del agente",
    description="Retorna todas las estadísticas y reservas del agente inmobiliario"
)
async def get_agent_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Dashboard principal del agente con:
    - Estadísticas generales
    - Reservas pendientes de confirmación
    - Reservas confirmadas próximas
    - Reservas recientes completadas
    """
    try:
        # Verificar que el usuario sea agente o landlord
        if current_user.role not in ["agent", "landlord", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los agentes pueden acceder a este dashboard"
            )
        
        # Generar datos mockeados
        all_bookings = generate_mock_bookings()
        stats = generate_mock_stats()
        
        # Filtrar reservas por estado
        pending = [b for b in all_bookings if b.status == "pending_confirmation"]
        upcoming = [b for b in all_bookings if b.status == "confirmed" and b.check_in_date >= date.today()]
        recent = [b for b in all_bookings if b.status == "completed"]
        
        # Ordenar
        pending.sort(key=lambda x: x.created_at, reverse=True)
        upcoming.sort(key=lambda x: x.check_in_date)
        recent.sort(key=lambda x: x.check_out_date, reverse=True)
        
        return AgentDashboardResponse(
            stats=stats,
            pending_bookings=pending[:10],  # Máximo 10
            upcoming_bookings=upcoming[:10],
            recent_bookings=recent[:10]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo dashboard del agente: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener el dashboard: {str(e)}"
        )


@router.get(
    "/pending",
    response_model=List[AgentBookingItem],
    summary="Obtener solo reservas pendientes",
    description="Lista todas las reservas pendientes de confirmación"
)
async def get_pending_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtiene solo las reservas pendientes de confirmación"""
    try:
        if current_user.role not in ["agent", "landlord", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los agentes pueden acceder a estas reservas"
            )
        
        all_bookings = generate_mock_bookings()
        pending = [b for b in all_bookings if b.status == "pending_confirmation"]
        pending.sort(key=lambda x: x.created_at, reverse=True)
        
        return pending
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo reservas pendientes: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener reservas pendientes: {str(e)}"
        )


@router.post(
    "/{booking_id}/approve",
    response_model=BookingResponse,
    summary="Aprobar una reserva",
    description="El agente aprueba una reserva pendiente"
)
async def approve_booking(
    booking_id: str,
    data: ApproveBookingDto,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Aprueba una reserva pendiente.
    La reserva cambia de estado 'pending_confirmation' a 'confirmed'.
    """
    try:
        if current_user.role not in ["agent", "landlord", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los agentes pueden aprobar reservas"
            )
        
        # Buscar la reserva mockeada
        all_bookings = generate_mock_bookings()
        booking = next((b for b in all_bookings if b.id == booking_id), None)
        
        if not booking:
            raise HTTPException(
                status_code=404,
                detail=f"Reserva {booking_id} no encontrada"
            )
        
        if booking.status != "pending_confirmation":
            raise HTTPException(
                status_code=400,
                detail=f"La reserva está en estado '{booking.status}' y no puede ser aprobada"
            )
        
        # Simular aprobación (en producción esto actualizaría la BD)
        logger.info(f"Reserva {booking_id} aprobada por {current_user.email}")
        
        # Retornar respuesta simulada
        return BookingResponse(
            id=booking.id,
            listing_id=booking.listing.id,
            guest_user_id=booking.guest.id,
            host_user_id=str(current_user.id),
            check_in_date=booking.check_in_date,
            check_out_date=booking.check_out_date,
            nights=booking.nights,
            price_per_night=booking.total_price / booking.nights,
            total_price=booking.total_price,
            reservation_amount=booking.total_price / 2,
            checkin_amount=booking.total_price / 2,
            service_fee=Decimal("0.00"),
            cleaning_fee=Decimal("0.00"),
            status="confirmed",
            number_of_guests=booking.number_of_guests,
            guest_message=booking.guest_message,
            host_response=data.host_response or "Reserva confirmada. ¡Bienvenido!",
            cancellation_reason=None,
            created_at=booking.created_at,
            updated_at=datetime.now(),
            confirmed_at=datetime.now(),
            reservation_paid_at=booking.created_at if booking.reservation_paid else None,
            checked_in_at=None,
            completed_at=None,
            cancelled_at=None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error aprobando reserva: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al aprobar la reserva: {str(e)}"
        )


@router.post(
    "/{booking_id}/reject",
    response_model=BookingResponse,
    summary="Rechazar una reserva",
    description="El agente rechaza una reserva pendiente"
)
async def reject_booking(
    booking_id: str,
    data: RejectBookingDto,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Rechaza una reserva pendiente.
    La reserva cambia de estado 'pending_confirmation' a 'cancelled'.
    """
    try:
        if current_user.role not in ["agent", "landlord", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los agentes pueden rechazar reservas"
            )
        
        # Buscar la reserva mockeada
        all_bookings = generate_mock_bookings()
        booking = next((b for b in all_bookings if b.id == booking_id), None)
        
        if not booking:
            raise HTTPException(
                status_code=404,
                detail=f"Reserva {booking_id} no encontrada"
            )
        
        if booking.status != "pending_confirmation":
            raise HTTPException(
                status_code=400,
                detail=f"La reserva está en estado '{booking.status}' y no puede ser rechazada"
            )
        
        # Simular rechazo (en producción esto actualizaría la BD y devolvería el pago)
        logger.info(f"Reserva {booking_id} rechazada por {current_user.email}. Razón: {data.rejection_reason}")
        
        # Retornar respuesta simulada
        return BookingResponse(
            id=booking.id,
            listing_id=booking.listing.id,
            guest_user_id=booking.guest.id,
            host_user_id=str(current_user.id),
            check_in_date=booking.check_in_date,
            check_out_date=booking.check_out_date,
            nights=booking.nights,
            price_per_night=booking.total_price / booking.nights,
            total_price=booking.total_price,
            reservation_amount=booking.total_price / 2,
            checkin_amount=booking.total_price / 2,
            service_fee=Decimal("0.00"),
            cleaning_fee=Decimal("0.00"),
            status="cancelled",
            number_of_guests=booking.number_of_guests,
            guest_message=booking.guest_message,
            host_response=None,
            cancellation_reason=data.rejection_reason,
            created_at=booking.created_at,
            updated_at=datetime.now(),
            confirmed_at=None,
            reservation_paid_at=booking.created_at if booking.reservation_paid else None,
            checked_in_at=None,
            completed_at=None,
            cancelled_at=datetime.now()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rechazando reserva: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al rechazar la reserva: {str(e)}"
        )


@router.get(
    "/stats",
    response_model=AgentDashboardStats,
    summary="Obtener estadísticas del agente",
    description="Retorna métricas y estadísticas del negocio"
)
async def get_agent_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtiene las estadísticas del agente"""
    try:
        if current_user.role not in ["agent", "landlord", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los agentes pueden acceder a estas estadísticas"
            )
        
        return generate_mock_stats()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo estadísticas: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al obtener estadísticas: {str(e)}"
        )
