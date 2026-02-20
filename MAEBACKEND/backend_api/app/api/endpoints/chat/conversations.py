"""
REST API endpoints for chat conversations and messages.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from uuid import UUID
from typing import List, Optional
from sqlalchemy.orm import Session

from app.schemas.chat import (
    ConversationCreate,
    ConversationResponse,
    MessageResponse,
    MessageCreate,
    ConversationListResponse,
    UnreadCountResponse
)
from app.services.message_service import MessageService
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.auth import User

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/conversations", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    conversation_data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Crear o recuperar una conversación existente para un listing.
    
    **Funcionamiento:**
    - Si ya existe una conversación entre el usuario actual y el propietario del listing, se devuelve la existente
    - Si no existe, se crea una nueva conversación
    - El usuario actual automáticamente se convierte en el cliente (client_user_id)
    - El propietario del listing se convierte en owner_user_id
    
    **Requiere autenticación.**
    """
    service = MessageService(db)
    
    # Obtener el listing y su propietario
    listing = await service.get_listing(conversation_data.listing_id)
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing no encontrado"
        )
    
    # Verificar que el usuario no intente crear conversación con su propio listing
    if listing.owner_user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No puedes crear una conversación sobre tu propio listing"
        )
    
    # Crear o recuperar conversación
    conversation = await service.get_or_create_conversation(
        listing_id=conversation_data.listing_id,
        client_user_id=current_user.id,
        owner_user_id=listing.owner_user_id
    )
    
    return conversation


@router.get("/conversations", response_model=List[ConversationListResponse])
async def list_conversations(
    skip: int = Query(0, ge=0, description="Número de conversaciones a saltar"),
    limit: int = Query(20, ge=1, le=100, description="Número máximo de conversaciones"),
    archived: bool = Query(False, description="Incluir conversaciones archivadas"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Listar todas las conversaciones del usuario actual.
    
    **Retorna:**
    - Lista de conversaciones ordenadas por actividad (última actualización)
    - Información del otro participante
    - Último mensaje de cada conversación
    - Contador de mensajes no leídos
    
    **Requiere autenticación.**
    """
    service = MessageService(db)
    
    conversations = await service.get_user_conversations(
        user_id=current_user.id,
        skip=skip,
        limit=limit,
        include_archived=archived
    )
    
    return conversations


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtener detalles de una conversación específica.
    
    **Requiere:**
    - Ser participante de la conversación (cliente o propietario)
    
    **Requiere autenticación.**
    """
    service = MessageService(db)
    
    conversation = await service.get_conversation(
        conversation_id=conversation_id,
        user_id=current_user.id
    )
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversación no encontrada o sin acceso"
        )
    
    return conversation


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=List[MessageResponse]
)
async def get_messages(
    conversation_id: UUID,
    skip: int = Query(0, ge=0, description="Número de mensajes a saltar"),
    limit: int = Query(50, ge=1, le=100, description="Número máximo de mensajes"),
    before: Optional[str] = Query(None, description="Timestamp ISO para paginación (mensajes anteriores)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtener mensajes de una conversación con paginación.
    
    **Paginación:**
    - Los mensajes se retornan en orden descendente (más recientes primero)
    - Usa `before` con el timestamp del último mensaje para cargar mensajes anteriores (scroll infinito)
    
    **Ejemplo de uso:**
    ```
    GET /chat/conversations/{id}/messages?limit=50
    # Para cargar más mensajes antiguos:
    GET /chat/conversations/{id}/messages?limit=50&before=2025-12-12T10:00:00Z
    ```
    
    **Requiere autenticación y acceso a la conversación.**
    """
    service = MessageService(db)
    
    # Verificar acceso
    conversation = await service.get_conversation(conversation_id, current_user.id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversación no encontrada o sin acceso"
        )
    
    messages = await service.get_messages(
        conversation_id=conversation_id,
        skip=skip,
        limit=limit,
        before=before
    )
    
    return messages


@router.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
async def send_message(
    conversation_id: UUID,
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Enviar un mensaje a una conversación (alternativa REST a WebSocket).
    
    **Casos de uso:**
    - Clientes que no soportan WebSocket
    - Envío de archivos/media
    - Integraciones externas
    - Bots o automatizaciones
    
    **Nota:** Para chat en tiempo real, se recomienda usar WebSocket en su lugar.
    
    **Requiere autenticación y acceso a la conversación.**
    """
    service = MessageService(db)
    
    # Verificar acceso
    conversation = await service.get_conversation(conversation_id, current_user.id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversación no encontrada o sin acceso"
        )
    
    # Crear mensaje
    message = await service.create_message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=message_data.content,
        message_type=message_data.message_type.value,
        media_url=message_data.media_url
    )
    
    # Notificar vía WebSocket si hay conexiones activas
    from app.services.chat.websocket_manager import manager
    await manager.broadcast_to_conversation(
        {
            "type": "message",
            "data": {
                "id": str(message.id),
                "conversation_id": str(message.conversation_id),
                "sender_user_id": str(message.sender_user_id),
                "content": message.content,
                "message_type": message.message_type,
                "status": message.status,
                "created_at": message.created_at.isoformat(),
                "updated_at": message.updated_at.isoformat()
            }
        },
        conversation_id
    )
    
    return message


@router.patch("/messages/{message_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_message_as_read(
    message_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Marcar un mensaje como leído.
    
    **Nota:** 
    - Solo el receptor puede marcar un mensaje como leído
    - El remitente no puede marcar sus propios mensajes
    
    **Requiere autenticación.**
    """
    service = MessageService(db)
    
    await service.mark_as_read(message_id, current_user.id)
    
    return None


@router.patch("/conversations/{conversation_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_conversation_as_read(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Marcar todos los mensajes de una conversación como leídos.
    
    **Útil para:**
    - Cuando el usuario abre una conversación
    - Limpiar todas las notificaciones de una conversación de una vez
    
    **Requiere autenticación y acceso a la conversación.**
    """
    service = MessageService(db)
    
    await service.mark_conversation_as_read(conversation_id, current_user.id)
    
    return None


@router.patch("/conversations/{conversation_id}/archive")
async def archive_conversation(
    conversation_id: UUID,
    archived: bool = Query(True, description="True para archivar, False para desarchivar"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Archivar o desarchivar una conversación para el usuario actual.
    
    **Nota:**
    - El archivado es individual por usuario
    - La conversación sigue existiendo para el otro participante
    - Las conversaciones archivadas no aparecen en el listado por defecto
    
    **Requiere autenticación.**
    """
    service = MessageService(db)
    
    await service.archive_conversation(conversation_id, current_user.id, archived)
    
    return {
        "status": "success",
        "conversation_id": str(conversation_id),
        "archived": archived
    }


@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    message_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Eliminar un mensaje (soft delete).
    
    **Nota:**
    - Solo el remitente puede eliminar su propio mensaje
    - El mensaje se marca como eliminado pero no se borra de la base de datos
    - Los otros participantes verán que el mensaje fue eliminado
    
    **Requiere autenticación.**
    """
    service = MessageService(db)
    
    await service.delete_message(message_id, current_user.id)
    
    return None


@router.get("/unread-count", response_model=UnreadCountResponse)
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtener el número total de mensajes no leídos del usuario.
    
    **Útil para:**
    - Badge de notificaciones en el frontend
    - Indicador de mensajes pendientes
    
    **Requiere autenticación.**
    """
    service = MessageService(db)
    
    count = await service.get_unread_count(current_user.id)
    
    return UnreadCountResponse(unread_count=count)


@router.get("/health")
async def chat_health_check():
    """
    Health check del sistema de chat.
    
    **Retorna:**
    - Estadísticas de conexiones WebSocket activas
    - Estado del servicio
    """
    from app.services.chat.websocket_manager import manager
    
    stats = manager.get_stats()
    
    return {
        "status": "healthy",
        "service": "chat",
        "websocket_stats": stats
    }
