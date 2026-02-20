"""
WebSocket endpoint for real-time chat.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, status
from uuid import UUID
from typing import Optional
import json
import logging
from datetime import datetime

from app.services.chat.websocket_manager import manager
from app.services.message_service import MessageService
from app.core.database import get_db
from app.core.security import verify_token
from sqlalchemy.orm import Session

router = APIRouter()
logger = logging.getLogger(__name__)


async def get_current_user_websocket(token: str, db: Session):
    """
    Autenticar usuario desde WebSocket usando JWT token.
    
    Args:
        token: JWT token del usuario
        db: Sesión de base de datos
        
    Returns:
        User object si es válido
        
    Raises:
        Exception si el token es inválido
    """
    # Verificar token
    payload = verify_token(token, "access")
    if not payload:
        raise Exception("Token inválido")
    
    user_id = payload.get("sub")
    if not user_id:
        raise Exception("Token inválido")
    
    # Importar User aquí para evitar importación circular
    from app.models.auth import User
    import uuid
    
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise Exception("ID de usuario inválido")
    
    user = db.query(User).filter(User.id == user_uuid).first()
    
    if not user or not user.is_active:
        raise Exception("Usuario no encontrado o inactivo")
    
    return user


@router.websocket("/ws/chat/{conversation_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    conversation_id: UUID,
    token: str = Query(..., description="JWT access token"),
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint para chat en tiempo real.
    
    **URL**: `ws://localhost:8000/api/chat/ws/chat/{conversation_id}?token=your_jwt_token`
    
    **Mensajes del Cliente -> Servidor:**
    
    ```json
    // Enviar mensaje de texto
    {
        "type": "message",
        "content": "Hola, me interesa la propiedad",
        "message_type": "text"
    }
    
    // Indicador de escritura
    {
        "type": "typing",
        "is_typing": true
    }
    
    // Marcar mensaje como leído
    {
        "type": "read",
        "message_id": "uuid-del-mensaje"
    }
    
    // Ping (mantener conexión viva)
    {
        "type": "ping"
    }
    ```
    
    **Mensajes del Servidor -> Cliente:**
    
    ```json
    // Nuevo mensaje
    {
        "type": "message",
        "data": {
            "id": "uuid",
            "sender_id": "uuid",
            "content": "...",
            "created_at": "2025-12-12T10:00:00Z",
            "status": "delivered"
        },
        "timestamp": "2025-12-12T10:00:00Z"
    }
    
    // Indicador de escritura
    {
        "type": "typing",
        "user_id": "uuid",
        "is_typing": true,
        "timestamp": "2025-12-12T10:00:00Z"
    }
    
    // Cambio de presencia
    {
        "type": "presence",
        "user_id": "uuid",
        "is_online": true,
        "timestamp": "2025-12-12T10:00:00Z"
    }
    
    // Confirmación de lectura
    {
        "type": "read_receipt",
        "message_id": "uuid",
        "read_by": "uuid",
        "read_at": "2025-12-12T10:00:00Z"
    }
    
    // Error
    {
        "type": "error",
        "message": "descripción del error",
        "timestamp": "2025-12-12T10:00:00Z"
    }
    ```
    """
    
    try:
        # Autenticar usuario
        logger.info(f"[WS] Authenticating WebSocket connection for conversation {conversation_id}")
        current_user = await get_current_user_websocket(token, db)
        logger.info(f"[WS] User authenticated: {current_user.id}")
        
        # Verificar acceso a la conversación
        message_service = MessageService(db)
        logger.info(f"[WS] Checking conversation access for user {current_user.id}")
        conversation = await message_service.get_conversation(
            conversation_id, 
            current_user.id
        )
        
        if not conversation:
            logger.warning(f"[WS] User {current_user.id} has no access to conversation {conversation_id}")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        logger.info(f"[WS] Conversation access granted, connecting WebSocket")
        
        # Conectar al WebSocket manager
        await manager.connect(websocket, current_user.id, conversation_id)
        logger.info(f"[WS] WebSocket connected to manager")
        
        # Actualizar presencia del usuario
        try:
            await message_service.update_user_presence(
                current_user.id,
                is_online=True,
                increment_connections=1
            )
            logger.info(f"[WS] User presence updated")
        except Exception as e:
            logger.error(f"[WS] Error updating presence: {e}", exc_info=True)
        
        # Notificar a otros participantes que el usuario está online
        try:
            await manager.broadcast_presence(
                conversation_id,
                current_user.id,
                is_online=True
            )
            logger.info(f"[WS] Presence broadcasted")
        except Exception as e:
            logger.error(f"[WS] Error broadcasting presence: {e}", exc_info=True)
        
        logger.info(
            f"[WS] ✅ User {current_user.id} fully connected to conversation {conversation_id}"
        )
        
        try:
            # Loop principal: escuchar mensajes del cliente
            while True:
                # Recibir mensaje del cliente
                try:
                    data = await websocket.receive_json()
                except json.JSONDecodeError:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Formato JSON inválido",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                    continue
                
                message_type = data.get("type")
                
                # ===== ENVIAR MENSAJE =====
                if message_type == "message":
                    try:
                        content = data.get("content", "").strip()
                        msg_type = data.get("message_type", "text")
                        
                        if not content:
                            await websocket.send_json({
                                "type": "error",
                                "message": "El contenido del mensaje no puede estar vacío",
                                "timestamp": datetime.utcnow().isoformat()
                            })
                            continue
                        
                        # Guardar mensaje en BD
                        saved_message = await message_service.create_message(
                            conversation_id=conversation_id,
                            sender_id=current_user.id,
                            content=content,
                            message_type=msg_type
                        )
                        
                        # Broadcast a todos los participantes de la conversación
                        await manager.broadcast_to_conversation(
                            {
                                "type": "message",
                                "data": {
                                    "id": str(saved_message.id),
                                    "conversation_id": str(saved_message.conversation_id),
                                    "sender_user_id": str(saved_message.sender_user_id),
                                    "content": saved_message.content,
                                    "message_type": saved_message.message_type,
                                    "status": saved_message.status,
                                    "created_at": saved_message.created_at.isoformat(),
                                    "updated_at": saved_message.updated_at.isoformat()
                                },
                                "timestamp": datetime.utcnow().isoformat()
                            },
                            conversation_id
                        )
                        
                        logger.info(
                            f"Message sent in conversation {conversation_id} by user {current_user.id}"
                        )
                        
                    except Exception as e:
                        logger.error(f"Error creating message: {e}")
                        await websocket.send_json({
                            "type": "error",
                            "message": "Error al enviar mensaje",
                            "timestamp": datetime.utcnow().isoformat()
                        })
                
                # ===== INDICADOR DE ESCRITURA =====
                elif message_type == "typing":
                    is_typing = data.get("is_typing", False)
                    
                    await manager.broadcast_typing_indicator(
                        conversation_id,
                        current_user.id,
                        is_typing
                    )
                
                # ===== MARCAR MENSAJE COMO LEÍDO =====
                elif message_type == "read":
                    try:
                        message_id = UUID(data.get("message_id"))
                        
                        # Marcar como leído en BD
                        await message_service.mark_as_read(message_id, current_user.id)
                        
                        # Broadcast confirmación de lectura
                        await manager.broadcast_read_receipt(
                            conversation_id,
                            message_id,
                            current_user.id
                        )
                        
                    except (ValueError, TypeError) as e:
                        await websocket.send_json({
                            "type": "error",
                            "message": "ID de mensaje inválido",
                            "timestamp": datetime.utcnow().isoformat()
                        })
                    except Exception as e:
                        logger.error(f"Error marking message as read: {e}")
                
                # ===== PING (mantener vivo) =====
                elif message_type == "ping":
                    await websocket.send_json({
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                
                # ===== TIPO DESCONOCIDO =====
                else:
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Tipo de mensaje no reconocido: {message_type}",
                        "timestamp": datetime.utcnow().isoformat()
                    })
                    
        except WebSocketDisconnect:
            logger.info(
                f"User {current_user.id} disconnected from conversation {conversation_id}"
            )
        finally:
            # Desconectar del manager
            await manager.disconnect(websocket)
            
            # Actualizar presencia
            await message_service.update_user_presence(
                current_user.id,
                is_online=False,
                increment_connections=-1
            )
            
            # Verificar si el usuario sigue online en otras conexiones
            is_still_online = manager.is_user_online(current_user.id)
            
            # Notificar cambio de presencia solo si no hay más conexiones
            if not is_still_online:
                await manager.broadcast_presence(
                    conversation_id,
                    current_user.id,
                    is_online=False
                )
            
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except:
            pass
