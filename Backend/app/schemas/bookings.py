"""
Schemas para el sistema de reservas Airbnb
"""
from pydantic import BaseModel, Field, validator, ConfigDict
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal


# =====================================================
# REQUEST SCHEMAS
# =====================================================

class CreateBookingDto(BaseModel):
    """Crear nueva reserva"""
    model_config = ConfigDict(populate_by_name=True)
    
    listing_id: str = Field(..., alias="listingId", description="ID del listing")
    check_in_date: date = Field(..., alias="checkInDate", description="Fecha de check-in")
    check_out_date: date = Field(..., alias="checkOutDate", description="Fecha de check-out")
    number_of_guests: int = Field(..., alias="numberOfGuests", ge=1, description="Número de huéspedes")
    guest_message: Optional[str] = Field(None, alias="guestMessage", max_length=1000, description="Mensaje para el anfitrión")
    
    @validator('check_out_date')
    def check_out_after_check_in(cls, v, values):
        if 'check_in_date' in values and v <= values['check_in_date']:
            raise ValueError('La fecha de check-out debe ser posterior a la de check-in')
        return v


class ConfirmBookingDto(BaseModel):
    """Confirmar reserva (usado por el host)"""
    host_response: Optional[str] = Field(None, max_length=500, description="Mensaje de confirmación")


class CancelBookingDto(BaseModel):
    """Cancelar reserva"""
    cancellation_reason: str = Field(..., max_length=500, description="Razón de cancelación")


class ProcessPaymentDto(BaseModel):
    """Procesar pago de reserva"""
    payment_method_id: str = Field(..., description="ID del método de pago de Stripe")
    payment_type: str = Field(..., description="Tipo de pago: 'reservation' o 'checkin'")
    
    @validator('payment_type')
    def validate_payment_type(cls, v):
        if v not in ['reservation', 'checkin', 'full']:
            raise ValueError("payment_type debe ser 'reservation', 'checkin' o 'full'")
        return v


# =====================================================
# RESPONSE SCHEMAS
# =====================================================

class BookingPaymentResponse(BaseModel):
    """Respuesta de pago de reserva"""
    id: str
    booking_id: str
    payment_type: str
    amount: Decimal
    status: str
    stripe_payment_intent_id: Optional[str]
    paid_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class BookingResponse(BaseModel):
    """Respuesta de reserva"""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    listing_id: str
    guest_user_id: str
    host_user_id: str
    check_in_date: date
    check_out_date: date
    nights: int
    price_per_night: Decimal
    total_price: Decimal
    reservation_amount: Decimal
    checkin_amount: Decimal
    service_fee: Decimal
    cleaning_fee: Decimal
    status: str
    number_of_guests: int
    guest_message: Optional[str]
    host_response: Optional[str]
    cancellation_reason: Optional[str]
    created_at: datetime
    updated_at: datetime
    confirmed_at: Optional[datetime]
    reservation_paid_at: Optional[datetime]
    checked_in_at: Optional[datetime]
    completed_at: Optional[datetime]
    cancelled_at: Optional[datetime]


class BookingWithPaymentsResponse(BookingResponse):
    """Respuesta de reserva con historial de pagos"""
    payments: List[BookingPaymentResponse] = []
    
    class Config:
        from_attributes = True


class DateAvailability(BaseModel):
    """Disponibilidad de una fecha específica"""
    date: date
    is_available: bool
    price: Optional[Decimal] = None
    booking_id: Optional[str] = None
    notes: Optional[str] = None


class AvailabilityCheckResult(BaseModel):
    """Resultado de verificación de disponibilidad"""
    available: bool
    nights: Optional[int] = None
    price_per_night: Optional[Decimal] = None
    total_price: Optional[Decimal] = None
    blocked_dates: List[date] = []
    message: Optional[str] = None


# =====================================================
# AGENT DASHBOARD SCHEMAS
# =====================================================

class BookingGuestInfo(BaseModel):
    """Información del huésped"""
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    verified: bool = False


class BookingListingInfo(BaseModel):
    """Información de la propiedad"""
    id: str
    title: str
    address: str
    property_type: str
    bedrooms: int
    bathrooms: int
    main_image_url: Optional[str] = None


class AgentBookingItem(BaseModel):
    """Item de reserva para el dashboard del agente"""
    # Información de la reserva
    id: str
    status: str
    check_in_date: date
    check_out_date: date
    nights: int
    number_of_guests: int
    total_price: Decimal
    
    # Información del huésped
    guest: BookingGuestInfo
    
    # Información de la propiedad
    listing: BookingListingInfo
    
    # Mensajes y comunicación
    guest_message: Optional[str] = None
    host_response: Optional[str] = None
    
    # Fechas importantes
    created_at: datetime
    confirmed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    
    # Estado de pago
    reservation_paid: bool = False
    checkin_paid: bool = False


class AgentDashboardStats(BaseModel):
    """Estadísticas del dashboard del agente"""
    total_properties: int
    active_properties: int
    pending_bookings: int
    confirmed_bookings: int
    completed_bookings: int
    total_revenue_month: Decimal
    total_revenue_year: Decimal
    occupancy_rate: float  # Porcentaje de ocupación


class ApproveBookingDto(BaseModel):
    """Aprobar una reserva"""
    host_response: Optional[str] = Field(None, max_length=500, description="Mensaje de bienvenida para el huésped")


class RejectBookingDto(BaseModel):
    """Rechazar una reserva"""
    rejection_reason: str = Field(..., max_length=500, description="Razón del rechazo")


class AgentDashboardResponse(BaseModel):
    """Respuesta completa del dashboard del agente"""
    stats: AgentDashboardStats
    pending_bookings: List[AgentBookingItem]
    upcoming_bookings: List[AgentBookingItem]
    recent_bookings: List[AgentBookingItem]


class HostBookingsResponse(BaseModel):
    """Respuesta para lista de reservas del host"""
    bookings: List[dict]
    total: int

