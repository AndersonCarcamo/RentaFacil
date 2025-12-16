"""
Pydantic schemas for Chat system.
Includes: Conversation, Message, Presence, Notifications
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum


# ========================================
# ENUMS
# ========================================

class MessageType(str, Enum):
    """Tipos de mensajes soportados"""
    TEXT = "text"
    IMAGE = "image"
    DOCUMENT = "document"
    SYSTEM = "system"


class MessageStatus(str, Enum):
    """Estados de un mensaje"""
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"


# ========================================
# MESSAGE SCHEMAS
# ========================================

class MessageCreate(BaseModel):
    """Schema para crear un nuevo mensaje"""
    content: str = Field(..., min_length=1, max_length=5000, description="Contenido del mensaje")
    message_type: MessageType = Field(default=MessageType.TEXT, description="Tipo de mensaje")
    media_url: Optional[str] = Field(None, description="URL del archivo multimedia si aplica")

    @field_validator('content')
    @classmethod
    def validate_content(cls, v: str) -> str:
        """Validar que el contenido no esté vacío"""
        if not v or not v.strip():
            raise ValueError('El contenido del mensaje no puede estar vacío')
        return v.strip()


class MessageResponse(BaseModel):
    """Schema de respuesta para un mensaje"""
    id: UUID
    conversation_id: UUID
    sender_user_id: UUID
    message_type: MessageType
    content: str
    media_url: Optional[str] = None
    status: MessageStatus
    read_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    is_deleted: bool = False

    class Config:
        from_attributes = True


class MessageUpdate(BaseModel):
    """Schema para actualizar un mensaje (soft delete)"""
    is_deleted: bool = Field(..., description="Marcar mensaje como eliminado")


# ========================================
# CONVERSATION SCHEMAS
# ========================================

class ConversationCreate(BaseModel):
    """Schema para crear o recuperar una conversación"""
    listing_id: UUID = Field(..., description="ID del listing sobre el que se conversa")

    class Config:
        json_schema_extra = {
            "example": {
                "listing_id": "123e4567-e89b-12d3-a456-426614174000"
            }
        }


class ConversationResponse(BaseModel):
    """Schema de respuesta básico para una conversación"""
    id: UUID
    listing_id: UUID
    client_user_id: UUID
    owner_user_id: UUID
    created_at: datetime
    updated_at: datetime
    last_message_at: Optional[datetime] = None
    is_active: bool
    archived_by_client: bool = False
    archived_by_owner: bool = False

    class Config:
        from_attributes = True


class UserInfo(BaseModel):
    """Información básica de usuario para conversaciones"""
    id: UUID
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: str
    profile_picture_url: Optional[str] = None
    is_online: bool = False
    last_seen_at: Optional[datetime] = None


class ListingInfo(BaseModel):
    """Información básica del listing en conversaciones"""
    id: UUID
    title: str
    price: float
    currency: str = "PEN"
    property_type: str
    operation: str


class ConversationWithDetails(ConversationResponse):
    """
    Schema de conversación con detalles completos:
    - Información del cliente
    - Información del propietario
    - Información del listing
    - Último mensaje
    """
    # Información de usuarios
    client: UserInfo
    owner: UserInfo
    
    # Información del listing
    listing: ListingInfo
    
    # Último mensaje
    last_message: Optional[MessageResponse] = None
    
    # Contador de mensajes no leídos (para el usuario actual)
    unread_count: int = 0


class ConversationListResponse(BaseModel):
    """Schema simplificado para lista de conversaciones"""
    id: UUID
    listing_id: UUID
    
    # Info del otro participante (relativo al usuario actual)
    other_user_id: UUID
    other_user_name: str
    other_user_picture: Optional[str] = None
    other_user_online: bool = False
    
    # Info del listing
    listing_title: str
    listing_price: float
    listing_currency: str = "PEN"
    
    # Último mensaje
    last_message_content: Optional[str] = None
    last_message_at: Optional[datetime] = None
    last_message_sender_id: Optional[UUID] = None
    
    # Estado
    unread_count: int = 0
    is_archived: bool = False
    updated_at: datetime


class ConversationArchive(BaseModel):
    """Schema para archivar/desarchivar conversación"""
    archived: bool = Field(..., description="True para archivar, False para desarchivar")


# ========================================
# PRESENCE SCHEMAS
# ========================================

class UserPresenceResponse(BaseModel):
    """Schema de respuesta para presencia de usuario"""
    user_id: UUID
    is_online: bool
    last_seen_at: datetime
    connection_count: int = 0

    class Config:
        from_attributes = True


class PresenceUpdate(BaseModel):
    """Schema para actualizar presencia (uso interno)"""
    is_online: bool
    connection_count: int = 0


# ========================================
# WEBSOCKET MESSAGE SCHEMAS
# ========================================

class WSMessageSend(BaseModel):
    """Schema para mensaje enviado desde cliente WebSocket"""
    type: str = Field(..., description="Tipo de acción: message, typing, read")
    content: Optional[str] = Field(None, description="Contenido del mensaje")
    message_type: Optional[MessageType] = Field(MessageType.TEXT, description="Tipo de mensaje")
    message_id: Optional[UUID] = Field(None, description="ID del mensaje (para marcar como leído)")
    is_typing: Optional[bool] = Field(None, description="Indicador de escritura")

    @field_validator('type')
    @classmethod
    def validate_type(cls, v: str) -> str:
        """Validar tipo de mensaje WebSocket"""
        allowed_types = ['message', 'typing', 'read', 'ping']
        if v not in allowed_types:
            raise ValueError(f'Tipo debe ser uno de: {allowed_types}')
        return v


class WSMessageReceive(BaseModel):
    """Schema para mensaje enviado desde servidor WebSocket a cliente"""
    type: str = Field(..., description="Tipo de evento: message, typing, presence, read_receipt, error")
    data: Optional[dict] = Field(None, description="Datos del evento")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp del evento")
    
    class Config:
        json_schema_extra = {
            "examples": [
                {
                    "type": "message",
                    "data": {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "sender_id": "123e4567-e89b-12d3-a456-426614174001",
                        "content": "Hola, me interesa la propiedad",
                        "created_at": "2025-12-12T10:00:00Z"
                    },
                    "timestamp": "2025-12-12T10:00:00Z"
                },
                {
                    "type": "typing",
                    "data": {
                        "user_id": "123e4567-e89b-12d3-a456-426614174001",
                        "is_typing": True
                    },
                    "timestamp": "2025-12-12T10:00:01Z"
                },
                {
                    "type": "presence",
                    "data": {
                        "user_id": "123e4567-e89b-12d3-a456-426614174001",
                        "is_online": True
                    },
                    "timestamp": "2025-12-12T10:00:02Z"
                }
            ]
        }


# ========================================
# STATISTICS & ANALYTICS
# ========================================

class UnreadCountResponse(BaseModel):
    """Schema para contador de mensajes no leídos"""
    unread_count: int = Field(..., description="Total de mensajes no leídos")
    conversation_counts: Optional[List[dict]] = Field(
        None, 
        description="Desglose por conversación"
    )


class ConversationStats(BaseModel):
    """Estadísticas de una conversación"""
    conversation_id: UUID
    total_messages: int = 0
    unread_messages: int = 0
    messages_by_client: int = 0
    messages_by_owner: int = 0
    first_message_at: Optional[datetime] = None
    last_message_at: Optional[datetime] = None
    avg_response_time_minutes: Optional[float] = None


# ========================================
# PAGINATION
# ========================================

class MessageListResponse(BaseModel):
    """Lista paginada de mensajes"""
    messages: List[MessageResponse]
    total: int
    has_more: bool = False
    next_cursor: Optional[str] = None  # Timestamp para paginación


class ConversationListPaginatedResponse(BaseModel):
    """Lista paginada de conversaciones"""
    conversations: List[ConversationListResponse]
    total: int
    skip: int
    limit: int
    has_more: bool = False
