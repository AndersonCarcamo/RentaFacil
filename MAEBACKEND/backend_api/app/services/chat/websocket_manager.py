"""
WebSocket Connection Manager for Chat System.
Manages active WebSocket connections, broadcasting, and presence.
"""
from typing import Dict, Set, Optional
from fastapi import WebSocket
from uuid import UUID
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Gestiona las conexiones WebSocket activas del chat.
    
    Funcionalidades:
    - Registro de conexiones por usuario
    - Tracking de participantes por conversación
    - Broadcast de mensajes
    - Gestión de presencia
    """
    
    def __init__(self):
        # user_id -> Set[WebSocket]
        self.active_connections: Dict[UUID, Set[WebSocket]] = {}
        
        # conversation_id -> Set[user_id]
        self.conversation_participants: Dict[UUID, Set[UUID]] = {}
        
        # websocket -> user_id (para cleanup rápido)
        self.websocket_to_user: Dict[WebSocket, UUID] = {}
        
        # websocket -> conversation_id
        self.websocket_to_conversation: Dict[WebSocket, UUID] = {}
    
    async def connect(
        self, 
        websocket: WebSocket, 
        user_id: UUID,
        conversation_id: UUID
    ):
        """
        Conectar un usuario vía WebSocket a una conversación.
        
        Args:
            websocket: Conexión WebSocket
            user_id: ID del usuario
            conversation_id: ID de la conversación
        """
        await websocket.accept()
        
        # Registrar conexión por usuario
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        
        # Mapear websocket -> user
        self.websocket_to_user[websocket] = user_id
        self.websocket_to_conversation[websocket] = conversation_id
        
        # Registrar participante en conversación
        if conversation_id not in self.conversation_participants:
            self.conversation_participants[conversation_id] = set()
        self.conversation_participants[conversation_id].add(user_id)
        
        logger.info(
            f"User {user_id} connected to conversation {conversation_id}. "
            f"Active connections for user: {len(self.active_connections[user_id])}"
        )
    
    async def disconnect(self, websocket: WebSocket):
        """
        Desconectar un WebSocket y limpiar referencias.
        
        Args:
            websocket: Conexión a desconectar
        """
        user_id = self.websocket_to_user.get(websocket)
        conversation_id = self.websocket_to_conversation.get(websocket)
        
        if not user_id:
            return
        
        # Remover websocket del usuario
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            
            # Si no hay más conexiones del usuario, limpiarlo
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                
                # Limpiar de todas las conversaciones
                for conv_id, participants in list(self.conversation_participants.items()):
                    participants.discard(user_id)
                    if not participants:
                        del self.conversation_participants[conv_id]
        
        # Limpiar mapeos
        if websocket in self.websocket_to_user:
            del self.websocket_to_user[websocket]
        if websocket in self.websocket_to_conversation:
            del self.websocket_to_conversation[websocket]
        
        logger.info(
            f"User {user_id} disconnected from conversation {conversation_id}"
        )
    
    async def send_personal_message(
        self, 
        message: dict, 
        user_id: UUID
    ):
        """
        Enviar un mensaje a todas las conexiones activas de un usuario.
        
        Args:
            message: Diccionario con el mensaje a enviar
            user_id: ID del usuario destinatario
        """
        if user_id not in self.active_connections:
            logger.debug(f"User {user_id} is not connected")
            return
        
        disconnected = set()
        
        for websocket in self.active_connections[user_id]:
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message to {user_id}: {e}")
                disconnected.add(websocket)
        
        # Cleanup de conexiones muertas
        for ws in disconnected:
            await self.disconnect(ws)
    
    async def broadcast_to_conversation(
        self, 
        message: dict, 
        conversation_id: UUID,
        exclude_user_id: Optional[UUID] = None
    ):
        """
        Enviar un mensaje a todos los participantes activos de una conversación.
        
        Args:
            message: Diccionario con el mensaje a broadcast
            conversation_id: ID de la conversación
            exclude_user_id: ID de usuario a excluir (opcional, ej: el remitente)
        """
        if conversation_id not in self.conversation_participants:
            logger.debug(f"No active participants in conversation {conversation_id}")
            return
        
        participants = self.conversation_participants[conversation_id].copy()
        
        for user_id in participants:
            # Excluir usuario si se especifica
            if exclude_user_id and user_id == exclude_user_id:
                continue
            
            await self.send_personal_message(message, user_id)
    
    async def broadcast_typing_indicator(
        self,
        conversation_id: UUID,
        user_id: UUID,
        is_typing: bool
    ):
        """
        Broadcast de indicador de "escribiendo..." a una conversación.
        
        Args:
            conversation_id: ID de la conversación
            user_id: ID del usuario que está escribiendo
            is_typing: True si está escribiendo, False si dejó de escribir
        """
        message = {
            "type": "typing",
            "user_id": str(user_id),
            "is_typing": is_typing,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast_to_conversation(
            message,
            conversation_id,
            exclude_user_id=user_id  # No enviar al que escribe
        )
    
    async def broadcast_presence(
        self,
        conversation_id: UUID,
        user_id: UUID,
        is_online: bool
    ):
        """
        Broadcast de cambio de presencia (online/offline) a una conversación.
        
        Args:
            conversation_id: ID de la conversación
            user_id: ID del usuario
            is_online: True si está online, False si está offline
        """
        message = {
            "type": "presence",
            "user_id": str(user_id),
            "is_online": is_online,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast_to_conversation(
            message,
            conversation_id,
            exclude_user_id=user_id  # Opcional: el usuario ya sabe su estado
        )
    
    async def broadcast_read_receipt(
        self,
        conversation_id: UUID,
        message_id: UUID,
        user_id: UUID
    ):
        """
        Broadcast de confirmación de lectura de mensaje.
        
        Args:
            conversation_id: ID de la conversación
            message_id: ID del mensaje leído
            user_id: ID del usuario que leyó el mensaje
        """
        message = {
            "type": "read_receipt",
            "message_id": str(message_id),
            "read_by": str(user_id),
            "read_at": datetime.utcnow().isoformat()
        }
        
        await self.broadcast_to_conversation(
            message,
            conversation_id
        )
    
    def is_user_online(self, user_id: UUID) -> bool:
        """
        Verificar si un usuario tiene al menos una conexión activa.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            True si el usuario está online (tiene conexiones activas)
        """
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0
    
    def get_user_connection_count(self, user_id: UUID) -> int:
        """
        Obtener el número de conexiones activas de un usuario.
        
        Args:
            user_id: ID del usuario
            
        Returns:
            Número de conexiones activas
        """
        if user_id not in self.active_connections:
            return 0
        return len(self.active_connections[user_id])
    
    def get_conversation_online_users(self, conversation_id: UUID) -> Set[UUID]:
        """
        Obtener los IDs de usuarios online en una conversación.
        
        Args:
            conversation_id: ID de la conversación
            
        Returns:
            Set de UUIDs de usuarios online
        """
        if conversation_id not in self.conversation_participants:
            return set()
        
        return self.conversation_participants[conversation_id].copy()
    
    def get_stats(self) -> dict:
        """
        Obtener estadísticas del manager para monitoreo.
        
        Returns:
            Diccionario con estadísticas
        """
        total_connections = sum(
            len(connections) 
            for connections in self.active_connections.values()
        )
        
        return {
            "total_connections": total_connections,
            "unique_users_online": len(self.active_connections),
            "active_conversations": len(self.conversation_participants),
            "timestamp": datetime.utcnow().isoformat()
        }


# Instancia global del manager
manager = ConnectionManager()
