"""
Chat models for real-time messaging system.
Includes: Conversation, Message, UserPresence, PushNotification
"""
from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
import enum
from app.core.database import Base


class MessageType(str, enum.Enum):
    """Tipos de mensajes soportados"""
    TEXT = "text"
    IMAGE = "image"
    DOCUMENT = "document"
    SYSTEM = "system"


class MessageStatus(str, enum.Enum):
    """Estados de un mensaje"""
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"


class Conversation(Base):
    """
    Conversación entre un cliente y un propietario sobre un listing específico.
    Solo puede haber una conversación activa por cada combinación de listing + cliente + propietario.
    """
    __tablename__ = "conversations"
    __table_args__ = (
        CheckConstraint('client_user_id != owner_user_id', name='different_users'),
        {"schema": "chat"}
    )

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Referencias
    listing_id = Column(UUID(as_uuid=True), ForeignKey('core.listings.id', ondelete='CASCADE'), 
                       nullable=False, index=True)
    client_user_id = Column(UUID(as_uuid=True), ForeignKey('core.users.id', ondelete='CASCADE'), 
                           nullable=False, index=True)
    owner_user_id = Column(UUID(as_uuid=True), ForeignKey('core.users.id', ondelete='CASCADE'), 
                          nullable=False, index=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, 
                       server_default=func.now(), onupdate=func.now())
    last_message_at = Column(DateTime(timezone=True), nullable=True)
    
    # Estado
    is_active = Column(Boolean, nullable=False, default=True)
    archived_by_client = Column(Boolean, nullable=False, default=False)
    archived_by_owner = Column(Boolean, nullable=False, default=False)
    
    # Relationships (opcional, si necesitas lazy loading)
    # messages = relationship("Message", back_populates="conversation", lazy="dynamic")

    def __repr__(self):
        return f"<Conversation(id={self.id}, listing={self.listing_id})>"


class Message(Base):
    """
    Mensaje individual dentro de una conversación.
    Soporta texto, imágenes, documentos y mensajes del sistema.
    """
    __tablename__ = "messages"
    __table_args__ = (
        CheckConstraint(
            "(message_type = 'text' AND LENGTH(TRIM(content)) > 0) OR message_type != 'text'",
            name='content_not_empty'
        ),
        CheckConstraint('LENGTH(content) <= 5000', name='content_max_length'),
        {"schema": "chat"}
    )

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Referencias
    conversation_id = Column(UUID(as_uuid=True), 
                            ForeignKey('chat.conversations.id', ondelete='CASCADE'), 
                            nullable=False, index=True)
    sender_user_id = Column(UUID(as_uuid=True), 
                           ForeignKey('core.users.id', ondelete='CASCADE'), 
                           nullable=False, index=True)
    
    # Contenido
    message_type = Column(
        String(20),  # Usamos String en lugar de Enum para compatibilidad
        nullable=False,
        default=MessageType.TEXT.value
    )
    content = Column(Text, nullable=False)
    media_url = Column(Text, nullable=True)
    
    # Estado y lectura
    status = Column(
        String(20),
        nullable=False,
        default=MessageStatus.DELIVERED.value,  # Auto-delivered por trigger
        index=True
    )
    read_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), nullable=False, 
                       server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), nullable=False, 
                       server_default=func.now(), onupdate=func.now())
    
    # Soft delete
    is_deleted = Column(Boolean, nullable=False, default=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    # conversation = relationship("Conversation", back_populates="messages")

    def __repr__(self):
        return f"<Message(id={self.id}, type={self.message_type}, status={self.status})>"


class UserPresence(Base):
    """
    Estado de presencia de un usuario (online/offline).
    Mantiene el número de conexiones WebSocket activas.
    """
    __tablename__ = "user_presence"
    __table_args__ = {"schema": "chat"}

    # Primary key (también es FK)
    user_id = Column(UUID(as_uuid=True), 
                    ForeignKey('core.users.id', ondelete='CASCADE'), 
                    primary_key=True)
    
    # Estado
    is_online = Column(Boolean, nullable=False, default=False, index=True)
    last_seen_at = Column(DateTime(timezone=True), nullable=False, 
                         server_default=func.now(), index=True)
    connection_count = Column(Integer, nullable=False, default=0)
    updated_at = Column(DateTime(timezone=True), nullable=False, 
                       server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<UserPresence(user_id={self.user_id}, online={self.is_online}, connections={self.connection_count})>"


class PushNotification(Base):
    """
    Registro de notificaciones push enviadas para mensajes.
    Útil para tracking y retry de notificaciones fallidas.
    """
    __tablename__ = "push_notifications"
    __table_args__ = {"schema": "chat"}

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Referencias
    user_id = Column(UUID(as_uuid=True), 
                    ForeignKey('core.users.id', ondelete='CASCADE'), 
                    nullable=False, index=True)
    message_id = Column(UUID(as_uuid=True), 
                       ForeignKey('chat.messages.id', ondelete='CASCADE'), 
                       nullable=False)
    
    # Estado de envío
    sent_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    failed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime(timezone=True), nullable=False, 
                       server_default=func.now(), index=True)

    def __repr__(self):
        return f"<PushNotification(id={self.id}, user={self.user_id}, sent={bool(self.sent_at)})>"
