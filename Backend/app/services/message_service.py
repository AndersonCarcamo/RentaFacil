"""
Message Service - Business logic for chat system
Handles conversations, messages, and related operations.
"""
from typing import List, Optional, Dict
from uuid import UUID
from datetime import datetime
from sqlalchemy import select, and_, or_, func, desc
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.chat import Conversation, Message, UserPresence, MessageStatus, MessageType
from app.models.listing import Listing
from app.models.auth import User
from app.schemas.chat import (
    ConversationResponse, MessageResponse, ConversationWithDetails,
    ConversationListResponse, UserInfo, ListingInfo, UnreadCountResponse
)


class MessageService:
    """
    Servicio para gestionar conversaciones y mensajes del chat.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    # ========================================
    # CONVERSATIONS
    # ========================================
    
    async def get_or_create_conversation(
        self,
        listing_id: UUID,
        client_user_id: UUID,
        owner_user_id: UUID
    ) -> ConversationResponse:
        """
        Obtener una conversación existente o crear una nueva.
        
        Args:
            listing_id: ID del listing
            client_user_id: ID del cliente interesado
            owner_user_id: ID del propietario
            
        Returns:
            ConversationResponse con la conversación
            
        Raises:
            HTTPException: Si los usuarios son iguales o si hay error
        """
        # Validar que sean usuarios diferentes
        if client_user_id == owner_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El cliente y el propietario deben ser usuarios diferentes"
            )
        
        # Verificar que el listing existe
        listing = self.db.query(Listing).filter(Listing.id == listing_id).first()
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Listing no encontrado"
            )
        
        # Buscar conversación existente
        conversation = self.db.query(Conversation).filter(
            and_(
                Conversation.listing_id == listing_id,
                Conversation.client_user_id == client_user_id,
                Conversation.owner_user_id == owner_user_id
            )
        ).first()
        
        # Si no existe, crear una nueva
        if not conversation:
            conversation = Conversation(
                listing_id=listing_id,
                client_user_id=client_user_id,
                owner_user_id=owner_user_id,
                is_active=True
            )
            self.db.add(conversation)
            self.db.commit()
            self.db.refresh(conversation)
        
        return ConversationResponse.model_validate(conversation)
    
    async def get_conversation(
        self,
        conversation_id: UUID,
        user_id: UUID
    ) -> Optional[ConversationResponse]:
        """
        Obtener una conversación por ID.
        Verifica que el usuario tenga acceso.
        
        Args:
            conversation_id: ID de la conversación
            user_id: ID del usuario solicitante
            
        Returns:
            ConversationResponse o None si no existe o no tiene acceso
        """
        conversation = self.db.query(Conversation).filter(
            and_(
                Conversation.id == conversation_id,
                or_(
                    Conversation.client_user_id == user_id,
                    Conversation.owner_user_id == user_id
                )
            )
        ).first()
        
        if not conversation:
            return None
        
        return ConversationResponse.model_validate(conversation)
    
    async def get_user_conversations(
        self,
        user_id: UUID,
        skip: int = 0,
        limit: int = 20,
        include_archived: bool = False
    ) -> List[ConversationListResponse]:
        """
        Obtener todas las conversaciones de un usuario.
        
        Args:
            user_id: ID del usuario
            skip: Número de conversaciones a saltar (paginación)
            limit: Número máximo de conversaciones a retornar
            include_archived: Si incluir conversaciones archivadas
            
        Returns:
            Lista de ConversationListResponse
        """
        # Query base
        query = self.db.query(Conversation).filter(
            or_(
                Conversation.client_user_id == user_id,
                Conversation.owner_user_id == user_id
            )
        )
        
        # Filtrar archivadas
        if not include_archived:
            query = query.filter(
                or_(
                    and_(
                        Conversation.client_user_id == user_id,
                        Conversation.archived_by_client == False
                    ),
                    and_(
                        Conversation.owner_user_id == user_id,
                        Conversation.archived_by_owner == False
                    )
                )
            )
        
        # Ordenar por última actividad
        query = query.order_by(desc(Conversation.updated_at))
        
        # Paginación
        conversations = query.offset(skip).limit(limit).all()
        
        # Construir respuesta
        result = []
        for conv in conversations:
            # Determinar el "otro usuario"
            is_client = conv.client_user_id == user_id
            other_user_id = conv.owner_user_id if is_client else conv.client_user_id
            
            # Obtener info del otro usuario
            other_user = self.db.query(User).filter(User.id == other_user_id).first()
            
            # Obtener info del listing
            listing = self.db.query(Listing).filter(Listing.id == conv.listing_id).first()
            
            # Obtener último mensaje
            last_message = self.db.query(Message).filter(
                and_(
                    Message.conversation_id == conv.id,
                    Message.is_deleted == False
                )
            ).order_by(desc(Message.created_at)).first()
            
            # Contar no leídos
            unread_count = self.db.query(func.count(Message.id)).filter(
                and_(
                    Message.conversation_id == conv.id,
                    Message.sender_user_id != user_id,
                    Message.status != MessageStatus.READ.value,
                    Message.is_deleted == False
                )
            ).scalar() or 0
            
            # Verificar si está archivada para este usuario
            is_archived = (
                conv.archived_by_client if is_client else conv.archived_by_owner
            )
            
            # Construir respuesta
            result.append(ConversationListResponse(
                id=conv.id,
                listing_id=conv.listing_id,
                other_user_id=other_user_id,
                other_user_name=f"{other_user.first_name or ''} {other_user.last_name or ''}".strip() or other_user.email,
                other_user_picture=other_user.profile_picture_url,
                other_user_online=self._is_user_online(other_user_id),
                listing_title=listing.title if listing else "Listing no disponible",
                listing_price=float(listing.price) if listing else 0.0,
                listing_currency=listing.currency if listing else "PEN",
                last_message_content=last_message.content if last_message else None,
                last_message_at=last_message.created_at if last_message else None,
                last_message_sender_id=last_message.sender_user_id if last_message else None,
                unread_count=unread_count,
                is_archived=is_archived,
                updated_at=conv.updated_at
            ))
        
        return result
    
    async def archive_conversation(
        self,
        conversation_id: UUID,
        user_id: UUID,
        archived: bool = True
    ) -> bool:
        """
        Archivar o desarchivar una conversación para un usuario.
        
        Args:
            conversation_id: ID de la conversación
            user_id: ID del usuario
            archived: True para archivar, False para desarchivar
            
        Returns:
            True si se actualizó correctamente
        """
        conversation = self.db.query(Conversation).filter(
            and_(
                Conversation.id == conversation_id,
                or_(
                    Conversation.client_user_id == user_id,
                    Conversation.owner_user_id == user_id
                )
            )
        ).first()
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversación no encontrada"
            )
        
        # Actualizar campo correspondiente
        if conversation.client_user_id == user_id:
            conversation.archived_by_client = archived
        else:
            conversation.archived_by_owner = archived
        
        self.db.commit()
        return True
    
    # ========================================
    # MESSAGES
    # ========================================
    
    async def create_message(
        self,
        conversation_id: UUID,
        sender_id: UUID,
        content: str,
        message_type: str = "text",
        media_url: Optional[str] = None
    ) -> MessageResponse:
        """
        Crear un nuevo mensaje en una conversación.
        
        Args:
            conversation_id: ID de la conversación
            sender_id: ID del remitente
            content: Contenido del mensaje
            message_type: Tipo de mensaje (text, image, document)
            media_url: URL del archivo multimedia (opcional)
            
        Returns:
            MessageResponse con el mensaje creado
        """
        # Verificar que la conversación existe y el usuario tiene acceso
        conversation = await self.get_conversation(conversation_id, sender_id)
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversación no encontrada o sin acceso"
            )
        
        # Crear mensaje
        message = Message(
            conversation_id=conversation_id,
            sender_user_id=sender_id,
            content=content,
            message_type=message_type,
            media_url=media_url,
            status=MessageStatus.SENT.value  # El trigger lo cambiará a DELIVERED
        )
        
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        
        return MessageResponse.model_validate(message)
    
    async def get_messages(
        self,
        conversation_id: UUID,
        skip: int = 0,
        limit: int = 50,
        before: Optional[str] = None
    ) -> List[MessageResponse]:
        """
        Obtener mensajes de una conversación con paginación.
        
        Args:
            conversation_id: ID de la conversación
            skip: Número de mensajes a saltar
            limit: Número máximo de mensajes
            before: Timestamp ISO para paginación (mensajes anteriores a este)
            
        Returns:
            Lista de MessageResponse ordenada por fecha descendente
        """
        query = self.db.query(Message).filter(
            and_(
                Message.conversation_id == conversation_id,
                Message.is_deleted == False
            )
        )
        
        # Filtrar por timestamp si se proporciona
        if before:
            try:
                before_dt = datetime.fromisoformat(before.replace('Z', '+00:00'))
                query = query.filter(Message.created_at < before_dt)
            except ValueError:
                pass  # Ignorar si el formato es inválido
        
        # Ordenar y paginar
        messages = query.order_by(desc(Message.created_at)).offset(skip).limit(limit).all()
        
        return [MessageResponse.model_validate(msg) for msg in messages]
    
    async def mark_as_read(
        self,
        message_id: UUID,
        user_id: UUID
    ) -> bool:
        """
        Marcar un mensaje como leído.
        Solo el receptor puede marcar como leído.
        
        Args:
            message_id: ID del mensaje
            user_id: ID del usuario que marca como leído
            
        Returns:
            True si se marcó correctamente
        """
        message = self.db.query(Message).filter(Message.id == message_id).first()
        
        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mensaje no encontrado"
            )
        
        # Verificar que el usuario no es el remitente
        if message.sender_user_id == user_id:
            return False
        
        # Verificar acceso a la conversación
        conversation = await self.get_conversation(message.conversation_id, user_id)
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Sin acceso a esta conversación"
            )
        
        # Marcar como leído
        if message.status != MessageStatus.READ.value:
            message.status = MessageStatus.READ.value
            message.read_at = datetime.utcnow()
            self.db.commit()
        
        return True
    
    async def mark_conversation_as_read(
        self,
        conversation_id: UUID,
        user_id: UUID
    ) -> int:
        """
        Marcar todos los mensajes de una conversación como leídos.
        
        Args:
            conversation_id: ID de la conversación
            user_id: ID del usuario
            
        Returns:
            Número de mensajes marcados como leídos
        """
        # Verificar acceso
        conversation = await self.get_conversation(conversation_id, user_id)
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversación no encontrada"
            )
        
        # Actualizar mensajes
        result = self.db.query(Message).filter(
            and_(
                Message.conversation_id == conversation_id,
                Message.sender_user_id != user_id,
                Message.status != MessageStatus.READ.value,
                Message.is_deleted == False
            )
        ).update(
            {
                "status": MessageStatus.READ.value,
                "read_at": datetime.utcnow()
            },
            synchronize_session=False
        )
        
        self.db.commit()
        return result
    
    async def delete_message(
        self,
        message_id: UUID,
        user_id: UUID
    ) -> bool:
        """
        Soft delete de un mensaje.
        Solo el remitente puede eliminar.
        
        Args:
            message_id: ID del mensaje
            user_id: ID del usuario
            
        Returns:
            True si se eliminó correctamente
        """
        message = self.db.query(Message).filter(
            and_(
                Message.id == message_id,
                Message.sender_user_id == user_id
            )
        ).first()
        
        if not message:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Mensaje no encontrado"
            )
        
        message.is_deleted = True
        message.deleted_at = datetime.utcnow()
        self.db.commit()
        
        return True
    
    # ========================================
    # PRESENCE & UTILITIES
    # ========================================
    
    async def get_unread_count(
        self,
        user_id: UUID,
        conversation_id: Optional[UUID] = None
    ) -> int:
        """
        Obtener el número de mensajes no leídos.
        
        Args:
            user_id: ID del usuario
            conversation_id: ID de conversación específica (opcional)
            
        Returns:
            Número de mensajes no leídos
        """
        query = self.db.query(func.count(Message.id)).join(
            Conversation, Message.conversation_id == Conversation.id
        ).filter(
            and_(
                or_(
                    Conversation.client_user_id == user_id,
                    Conversation.owner_user_id == user_id
                ),
                Message.sender_user_id != user_id,
                Message.status != MessageStatus.READ.value,
                Message.is_deleted == False
            )
        )
        
        if conversation_id:
            query = query.filter(Message.conversation_id == conversation_id)
        
        return query.scalar() or 0
    
    def _is_user_online(self, user_id: UUID) -> bool:
        """
        Verificar si un usuario está online.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            True si está online
        """
        presence = self.db.query(UserPresence).filter(
            UserPresence.user_id == user_id
        ).first()
        
        return presence.is_online if presence else False
    
    async def update_user_presence(
        self,
        user_id: UUID,
        is_online: bool,
        increment_connections: int = 0
    ):
        """
        Actualizar el estado de presencia de un usuario.
        
        Args:
            user_id: ID del usuario
            is_online: Estado online/offline
            increment_connections: +1 para conectar, -1 para desconectar, 0 para no cambiar
        """
        presence = self.db.query(UserPresence).filter(
            UserPresence.user_id == user_id
        ).first()
        
        if not presence:
            # Crear nuevo registro de presencia
            presence = UserPresence(
                user_id=user_id,
                is_online=is_online,
                connection_count=max(0, increment_connections)
            )
            self.db.add(presence)
        else:
            # Actualizar existente
            if increment_connections != 0:
                presence.connection_count = max(0, presence.connection_count + increment_connections)
            
            # Solo está online si hay conexiones activas
            presence.is_online = presence.connection_count > 0
            presence.last_seen_at = datetime.utcnow()
        
        self.db.commit()
    
    async def get_listing(self, listing_id: UUID) -> Optional[Listing]:
        """
        Obtener un listing por ID.
        
        Args:
            listing_id: ID del listing
            
        Returns:
            Listing o None
        """
        return self.db.query(Listing).filter(Listing.id == listing_id).first()
