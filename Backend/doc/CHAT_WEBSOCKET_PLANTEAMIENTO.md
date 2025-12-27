# 💬 Sistema de Chat con WebSocket - Planteamiento Técnico
## EasyRent - Comunicación Cliente-Propietario

**Versión:** 1.0  
**Fecha:** Diciembre 2025  
**Tecnología:** FastAPI + WebSocket + Redis + PostgreSQL

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Modelo de Datos](#modelo-de-datos)
4. [Componentes Técnicos](#componentes-técnicos)
5. [Flujos de Comunicación](#flujos-de-comunicación)
6. [Implementación por Fases](#implementación-por-fases)
7. [Consideraciones de Seguridad](#consideraciones-de-seguridad)
8. [Escalabilidad](#escalabilidad)
9. [Monitoreo y Observabilidad](#monitoreo-y-observabilidad)

---

## 🎯 Resumen Ejecutivo

Sistema de mensajería en tiempo real que permite la comunicación bidireccional entre clientes (tenants) y propietarios (landlords/agents) dentro del contexto de una propiedad específica.

### **Características Principales**

- ✅ **Comunicación en tiempo real** vía WebSocket
- ✅ **Persistencia de mensajes** en PostgreSQL
- ✅ **Gestión de presencia** (usuario en línea/offline)
- ✅ **Notificaciones push** para mensajes no leídos
- ✅ **Historial completo** de conversaciones
- ✅ **Indicadores de estado** (enviado, entregado, leído)
- ✅ **Typing indicators** (usuario escribiendo...)
- ✅ **Soporte multimedia** (imágenes, documentos)
- ✅ **Seguridad end-to-end** con autenticación JWT
- ✅ **Escalabilidad horizontal** con Redis PubSub

### **Alcance Inicial (MVP)**

1. Chat 1-a-1 entre cliente y propietario
2. Mensajes de texto
3. Historial persistente
4. Estado de lectura
5. Notificaciones básicas

---

## 🏗️ Arquitectura del Sistema

### **Diagrama de Componentes**

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Frontend)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Chat UI     │  │  WebSocket   │  │  REST API    │          │
│  │  Component   │◄─┤  Client      │  │  Client      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │                  │
                    WebSocket │                  │ HTTP/REST
                              ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (FastAPI)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  WebSocket Manager                                       │   │
│  │  - Autenticación JWT                                     │   │
│  │  - Gestión de conexiones activas                        │   │
│  │  - Broadcast de mensajes                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  REST Endpoints                                          │   │
│  │  - POST /api/chat/conversations                          │   │
│  │  - GET /api/chat/conversations/{id}/messages             │   │
│  │  - POST /api/chat/messages/{id}/read                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │   Redis     │  │ PostgreSQL  │  │   Email     │
    │  PubSub     │  │  Database   │  │  Service    │
    │             │  │             │  │             │
    │ - Presencia │  │ - Mensajes  │  │ - Notif.    │
    │ - Broadcast │  │ - Convers.  │  │   Offline   │
    │ - Cache     │  │ - Usuarios  │  │             │
    └─────────────┘  └─────────────┘  └─────────────┘
```

### **Flujo de Datos**

```
Cliente A                    WebSocket Server              Redis              PostgreSQL           Cliente B
   │                              │                          │                     │                    │
   │─────Connect WS──────────────▶│                          │                     │                    │
   │                              │──────Subscribe───────────▶│                     │                    │
   │                              │◀─────Confirm─────────────│                     │                    │
   │◀────Connected─────────────────│                          │                     │                    │
   │                              │                          │                     │                    │
   │──Send Message────────────────▶│                          │                     │                    │
   │                              │──────Save Message────────────────────────────▶│                    │
   │                              │◀─────Message Saved───────────────────────────│                    │
   │                              │──────Publish─────────────▶│                     │                    │
   │◀────Message Sent─────────────│                          │                     │                    │
   │                              │                          │─────Broadcast──────────────────────────▶│
   │                              │                          │                     │                    │
```

---

## 💾 Modelo de Datos

### **Esquema SQL**

```sql
-- ========================================
-- CHAT SYSTEM SCHEMA
-- ========================================

-- Enum para tipo de mensaje
CREATE TYPE chat.message_type AS ENUM (
    'text',
    'image',
    'document',
    'system'
);

-- Enum para estado del mensaje
CREATE TYPE chat.message_status AS ENUM (
    'sent',
    'delivered',
    'read'
);

-- ========================================
-- Tabla: Conversaciones
-- ========================================
CREATE TABLE IF NOT EXISTS chat.conversations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id          UUID NOT NULL REFERENCES core.listings(id) ON DELETE CASCADE,
    
    -- Participantes
    client_user_id      UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    owner_user_id       UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    
    -- Metadata
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_message_at     TIMESTAMPTZ,
    
    -- Estado
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    archived_by_client  BOOLEAN NOT NULL DEFAULT FALSE,
    archived_by_owner   BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Índices únicos para evitar duplicados
    CONSTRAINT unique_conversation_per_listing UNIQUE (listing_id, client_user_id, owner_user_id),
    
    -- Validación: cliente y propietario deben ser diferentes
    CONSTRAINT different_users CHECK (client_user_id != owner_user_id)
);

-- Índices para optimización
CREATE INDEX idx_conversations_client ON chat.conversations(client_user_id, is_active);
CREATE INDEX idx_conversations_owner ON chat.conversations(owner_user_id, is_active);
CREATE INDEX idx_conversations_listing ON chat.conversations(listing_id);
CREATE INDEX idx_conversations_updated ON chat.conversations(updated_at DESC);

-- ========================================
-- Tabla: Mensajes
-- ========================================
CREATE TABLE IF NOT EXISTS chat.messages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id     UUID NOT NULL REFERENCES chat.conversations(id) ON DELETE CASCADE,
    
    -- Remitente
    sender_user_id      UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    
    -- Contenido
    message_type        chat.message_type NOT NULL DEFAULT 'text',
    content             TEXT NOT NULL,
    media_url           TEXT,
    
    -- Estado y lectura
    status              chat.message_status NOT NULL DEFAULT 'sent',
    read_at             TIMESTAMPTZ,
    delivered_at        TIMESTAMPTZ,
    
    -- Metadata
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Soft delete
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at          TIMESTAMPTZ,
    
    -- Validaciones
    CONSTRAINT content_not_empty CHECK (
        CASE 
            WHEN message_type = 'text' THEN LENGTH(TRIM(content)) > 0
            ELSE TRUE
        END
    )
) PARTITION BY RANGE (created_at);

-- Particiones mensuales para mensajes (mejora rendimiento)
CREATE TABLE chat.messages_2025_12 PARTITION OF chat.messages
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

CREATE TABLE chat.messages_2026_01 PARTITION OF chat.messages
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- Índices para mensajes
CREATE INDEX idx_messages_conversation ON chat.messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON chat.messages(sender_user_id);
CREATE INDEX idx_messages_unread ON chat.messages(conversation_id, status) 
    WHERE status != 'read' AND is_deleted = FALSE;

-- ========================================
-- Tabla: Presencia de usuarios
-- ========================================
CREATE TABLE IF NOT EXISTS chat.user_presence (
    user_id             UUID PRIMARY KEY REFERENCES core.users(id) ON DELETE CASCADE,
    is_online           BOOLEAN NOT NULL DEFAULT FALSE,
    last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    connection_count    INTEGER NOT NULL DEFAULT 0,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_presence_online ON chat.user_presence(is_online, last_seen_at);

-- ========================================
-- Tabla: Notificaciones push
-- ========================================
CREATE TABLE IF NOT EXISTS chat.push_notifications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES core.users(id) ON DELETE CASCADE,
    message_id          UUID NOT NULL REFERENCES chat.messages(id) ON DELETE CASCADE,
    
    -- Estado
    sent_at             TIMESTAMPTZ,
    delivered_at        TIMESTAMPTZ,
    failed_at           TIMESTAMPTZ,
    error_message       TEXT,
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_push_notifications_user ON chat.push_notifications(user_id, created_at DESC);

-- ========================================
-- Funciones y Triggers
-- ========================================

-- Actualizar timestamp de conversación cuando llega un mensaje
CREATE OR REPLACE FUNCTION chat.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat.conversations
    SET 
        last_message_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
    AFTER INSERT ON chat.messages
    FOR EACH ROW
    EXECUTE FUNCTION chat.update_conversation_timestamp();

-- Marcar mensaje como entregado automáticamente
CREATE OR REPLACE FUNCTION chat.auto_set_delivered()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'sent' THEN
        NEW.status := 'delivered';
        NEW.delivered_at := now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_set_delivered
    BEFORE INSERT ON chat.messages
    FOR EACH ROW
    EXECUTE FUNCTION chat.auto_set_delivered();

-- ========================================
-- Vista: Conversaciones con último mensaje
-- ========================================
CREATE OR REPLACE VIEW chat.conversations_with_last_message AS
SELECT 
    c.id,
    c.listing_id,
    c.client_user_id,
    c.owner_user_id,
    c.created_at,
    c.updated_at,
    c.last_message_at,
    c.is_active,
    c.archived_by_client,
    c.archived_by_owner,
    
    -- Datos del último mensaje
    lm.id AS last_message_id,
    lm.sender_user_id AS last_message_sender_id,
    lm.content AS last_message_content,
    lm.message_type AS last_message_type,
    lm.created_at AS last_message_created_at,
    
    -- Datos del listing
    l.title AS listing_title,
    l.price AS listing_price,
    l.currency AS listing_currency,
    
    -- Datos de usuarios
    client.first_name AS client_first_name,
    client.last_name AS client_last_name,
    client.profile_picture_url AS client_profile_picture,
    owner.first_name AS owner_first_name,
    owner.last_name AS owner_last_name,
    owner.profile_picture_url AS owner_profile_picture,
    
    -- Contador de mensajes no leídos
    (SELECT COUNT(*)
     FROM chat.messages m
     WHERE m.conversation_id = c.id
       AND m.status != 'read'
       AND m.is_deleted = FALSE
    ) AS unread_count
    
FROM chat.conversations c
LEFT JOIN LATERAL (
    SELECT *
    FROM chat.messages
    WHERE conversation_id = c.id
      AND is_deleted = FALSE
    ORDER BY created_at DESC
    LIMIT 1
) lm ON TRUE
LEFT JOIN core.listings l ON c.listing_id = l.id
LEFT JOIN core.users client ON c.client_user_id = client.id
LEFT JOIN core.users owner ON c.owner_user_id = owner.id;

-- ========================================
-- Función: Contar mensajes no leídos
-- ========================================
CREATE OR REPLACE FUNCTION chat.get_unread_count(
    p_user_id UUID,
    p_conversation_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    IF p_conversation_id IS NOT NULL THEN
        -- Contar no leídos en una conversación específica
        SELECT COUNT(*)
        INTO v_count
        FROM chat.messages m
        JOIN chat.conversations c ON m.conversation_id = c.id
        WHERE m.conversation_id = p_conversation_id
          AND m.sender_user_id != p_user_id
          AND m.status != 'read'
          AND m.is_deleted = FALSE;
    ELSE
        -- Contar no leídos en todas las conversaciones del usuario
        SELECT COUNT(*)
        INTO v_count
        FROM chat.messages m
        JOIN chat.conversations c ON m.conversation_id = c.id
        WHERE (c.client_user_id = p_user_id OR c.owner_user_id = p_user_id)
          AND m.sender_user_id != p_user_id
          AND m.status != 'read'
          AND m.is_deleted = FALSE;
    END IF;
    
    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- Permisos
-- ========================================
GRANT USAGE ON SCHEMA chat TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA chat TO app_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA chat TO app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA chat TO app_user;
```

---

## 🔧 Componentes Técnicos

### **1. WebSocket Manager (Backend)**

```python
# app/services/chat/websocket_manager.py

from typing import Dict, Set, Optional
from fastapi import WebSocket
from uuid import UUID
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Gestiona las conexiones WebSocket activas.
    Mantiene un registro de conexiones por usuario y conversación.
    """
    
    def __init__(self):
        # user_id -> Set[WebSocket]
        self.active_connections: Dict[UUID, Set[WebSocket]] = {}
        
        # conversation_id -> Set[user_id]
        self.conversation_participants: Dict[UUID, Set[UUID]] = {}
        
        # websocket -> user_id (para cleanup rápido)
        self.websocket_to_user: Dict[WebSocket, UUID] = {}
    
    async def connect(
        self, 
        websocket: WebSocket, 
        user_id: UUID,
        conversation_id: Optional[UUID] = None
    ):
        """Conectar un usuario vía WebSocket"""
        await websocket.accept()
        
        # Registrar conexión
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        self.websocket_to_user[websocket] = user_id
        
        # Registrar en conversación si se proporciona
        if conversation_id:
            if conversation_id not in self.conversation_participants:
                self.conversation_participants[conversation_id] = set()
            self.conversation_participants[conversation_id].add(user_id)
        
        # Actualizar presencia en BD
        await self._update_user_presence(user_id, is_online=True)
        
        logger.info(f"User {user_id} connected. Active connections: {len(self.active_connections[user_id])}")
    
    async def disconnect(self, websocket: WebSocket):
        """Desconectar un WebSocket"""
        user_id = self.websocket_to_user.get(websocket)
        
        if not user_id:
            return
        
        # Remover websocket
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            
            # Si no hay más conexiones, marcar como offline
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                await self._update_user_presence(user_id, is_online=False)
                
                # Limpiar de todas las conversaciones
                for participants in self.conversation_participants.values():
                    participants.discard(user_id)
        
        del self.websocket_to_user[websocket]
        
        logger.info(f"User {user_id} disconnected")
    
    async def send_personal_message(
        self, 
        message: dict, 
        user_id: UUID
    ):
        """Enviar mensaje a un usuario específico (todas sus conexiones)"""
        if user_id in self.active_connections:
            disconnected = set()
            
            for websocket in self.active_connections[user_id]:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to {user_id}: {e}")
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
        """Enviar mensaje a todos los participantes de una conversación"""
        if conversation_id not in self.conversation_participants:
            return
        
        participants = self.conversation_participants[conversation_id]
        
        for user_id in participants:
            if exclude_user_id and user_id == exclude_user_id:
                continue
            
            await self.send_personal_message(message, user_id)
    
    def is_user_online(self, user_id: UUID) -> bool:
        """Verificar si un usuario está online"""
        return user_id in self.active_connections
    
    async def _update_user_presence(self, user_id: UUID, is_online: bool):
        """Actualizar presencia del usuario en BD"""
        # Implementar con tu ORM/Database service
        pass


# Instancia global
manager = ConnectionManager()
```

### **2. WebSocket Endpoint**

```python
# app/api/endpoints/chat/websocket.py

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from uuid import UUID
from typing import Optional
import json
from app.services.chat.websocket_manager import manager
from app.services.chat.message_service import MessageService
from app.core.auth import get_current_user_websocket
from app.models.user import User

router = APIRouter()


@router.websocket("/ws/chat/{conversation_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    conversation_id: UUID,
    token: str,  # Query parameter: /ws/chat/{id}?token=jwt_token
):
    """
    WebSocket endpoint para chat en tiempo real
    
    Formato de mensajes:
    
    Cliente -> Servidor:
    {
        "type": "message",
        "content": "Hola, me interesa la propiedad",
        "message_type": "text"
    }
    
    {
        "type": "typing",
        "is_typing": true
    }
    
    {
        "type": "read",
        "message_id": "uuid"
    }
    
    Servidor -> Cliente:
    {
        "type": "message",
        "data": {
            "id": "uuid",
            "sender_id": "uuid",
            "content": "...",
            "created_at": "2025-12-12T10:00:00Z",
            "status": "delivered"
        }
    }
    
    {
        "type": "typing",
        "user_id": "uuid",
        "is_typing": true
    }
    
    {
        "type": "presence",
        "user_id": "uuid",
        "is_online": true
    }
    """
    
    try:
        # Autenticar usuario via token
        current_user = await get_current_user_websocket(token)
        
        # Verificar acceso a la conversación
        message_service = MessageService()
        conversation = await message_service.get_conversation(
            conversation_id, 
            current_user.id
        )
        
        if not conversation:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        # Conectar
        await manager.connect(websocket, current_user.id, conversation_id)
        
        # Notificar presencia
        await manager.broadcast_to_conversation(
            {
                "type": "presence",
                "user_id": str(current_user.id),
                "is_online": True,
                "timestamp": datetime.utcnow().isoformat()
            },
            conversation_id,
            exclude_user_id=current_user.id
        )
        
        try:
            while True:
                # Recibir mensaje del cliente
                data = await websocket.receive_json()
                
                message_type = data.get("type")
                
                if message_type == "message":
                    # Procesar y guardar mensaje
                    saved_message = await message_service.create_message(
                        conversation_id=conversation_id,
                        sender_id=current_user.id,
                        content=data.get("content"),
                        message_type=data.get("message_type", "text")
                    )
                    
                    # Broadcast a todos los participantes
                    await manager.broadcast_to_conversation(
                        {
                            "type": "message",
                            "data": saved_message.dict()
                        },
                        conversation_id
                    )
                    
                elif message_type == "typing":
                    # Broadcast typing indicator
                    await manager.broadcast_to_conversation(
                        {
                            "type": "typing",
                            "user_id": str(current_user.id),
                            "is_typing": data.get("is_typing", False),
                            "timestamp": datetime.utcnow().isoformat()
                        },
                        conversation_id,
                        exclude_user_id=current_user.id
                    )
                    
                elif message_type == "read":
                    # Marcar mensaje como leído
                    message_id = UUID(data.get("message_id"))
                    await message_service.mark_as_read(message_id, current_user.id)
                    
                    # Notificar al remitente
                    await manager.broadcast_to_conversation(
                        {
                            "type": "read_receipt",
                            "message_id": str(message_id),
                            "read_by": str(current_user.id),
                            "read_at": datetime.utcnow().isoformat()
                        },
                        conversation_id
                    )
                
        except WebSocketDisconnect:
            await manager.disconnect(websocket)
            
            # Notificar presencia offline
            await manager.broadcast_to_conversation(
                {
                    "type": "presence",
                    "user_id": str(current_user.id),
                    "is_online": False,
                    "timestamp": datetime.utcnow().isoformat()
                },
                conversation_id
            )
            
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
```

### **3. REST API Endpoints**

```python
# app/api/endpoints/chat/conversations.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from uuid import UUID
from typing import List, Optional
from app.schemas.chat import (
    ConversationCreate,
    ConversationResponse,
    MessageResponse,
    MessageCreate,
    ConversationListResponse
)
from app.services.chat.message_service import MessageService
from app.core.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/conversations", response_model=ConversationResponse)
async def create_conversation(
    conversation_data: ConversationCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Crear o recuperar una conversación existente para un listing.
    
    Si ya existe una conversación entre el usuario actual y el propietario
    del listing, se devuelve la existente.
    """
    service = MessageService()
    
    # Verificar que el listing existe y obtener owner
    listing = await service.get_listing(conversation_data.listing_id)
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found"
        )
    
    # El usuario actual es el cliente
    conversation = await service.get_or_create_conversation(
        listing_id=conversation_data.listing_id,
        client_user_id=current_user.id,
        owner_user_id=listing.owner_user_id
    )
    
    return conversation


@router.get("/conversations", response_model=List[ConversationListResponse])
async def list_conversations(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    archived: bool = Query(False),
    current_user: User = Depends(get_current_user)
):
    """
    Listar todas las conversaciones del usuario actual.
    """
    service = MessageService()
    
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
    current_user: User = Depends(get_current_user)
):
    """
    Obtener detalles de una conversación específica.
    """
    service = MessageService()
    
    conversation = await service.get_conversation(
        conversation_id=conversation_id,
        user_id=current_user.id
    )
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return conversation


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=List[MessageResponse]
)
async def get_messages(
    conversation_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    before: Optional[str] = Query(None),  # Timestamp for pagination
    current_user: User = Depends(get_current_user)
):
    """
    Obtener mensajes de una conversación con paginación.
    
    - `before`: Obtener mensajes anteriores a este timestamp (para scroll infinito)
    """
    service = MessageService()
    
    # Verificar acceso
    conversation = await service.get_conversation(conversation_id, current_user.id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
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
    current_user: User = Depends(get_current_user)
):
    """
    Enviar un mensaje a una conversación (vía REST, alternativa a WebSocket).
    
    Útil para:
    - Clientes que no soportan WebSocket
    - Envío de archivos/media
    - Integraciones externas
    """
    service = MessageService()
    
    # Verificar acceso
    conversation = await service.get_conversation(conversation_id, current_user.id)
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    message = await service.create_message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=message_data.content,
        message_type=message_data.message_type,
        media_url=message_data.media_url
    )
    
    # Notificar vía WebSocket si hay conexiones activas
    from app.services.chat.websocket_manager import manager
    await manager.broadcast_to_conversation(
        {
            "type": "message",
            "data": message.dict()
        },
        conversation_id
    )
    
    return message


@router.patch("/messages/{message_id}/read")
async def mark_message_as_read(
    message_id: UUID,
    current_user: User = Depends(get_current_user)
):
    """
    Marcar un mensaje como leído.
    """
    service = MessageService()
    
    await service.mark_as_read(message_id, current_user.id)
    
    return {"status": "success", "message_id": str(message_id)}


@router.patch("/conversations/{conversation_id}/archive")
async def archive_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user)
):
    """
    Archivar una conversación para el usuario actual.
    """
    service = MessageService()
    
    await service.archive_conversation(conversation_id, current_user.id)
    
    return {"status": "success"}


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user)
):
    """
    Obtener el número total de mensajes no leídos del usuario.
    """
    service = MessageService()
    
    count = await service.get_unread_count(current_user.id)
    
    return {"unread_count": count}
```

---

## 🔐 Consideraciones de Seguridad

### **1. Autenticación**

- ✅ **JWT en WebSocket**: Token enviado como query parameter
- ✅ **Validación de tokens**: Verificar expiración y firma
- ✅ **Permisos granulares**: Usuario solo accede a sus conversaciones

### **2. Autorización**

```python
# Verificar que el usuario tiene acceso a la conversación
async def verify_conversation_access(
    conversation_id: UUID,
    user_id: UUID
) -> bool:
    """
    El usuario tiene acceso si es:
    - El cliente (client_user_id)
    - El propietario (owner_user_id)
    """
    conversation = await db.get_conversation(conversation_id)
    
    return (
        conversation.client_user_id == user_id or
        conversation.owner_user_id == user_id
    )
```

### **3. Rate Limiting**

```python
# Límite de mensajes por minuto
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/conversations/{conversation_id}/messages")
@limiter.limit("60/minute")
async def send_message(...):
    ...
```

### **4. Validación de Contenido**

- ✅ Sanitización de HTML
- ✅ Límite de tamaño de mensajes (5000 caracteres)
- ✅ Detección de spam
- ✅ Filtrado de contenido ofensivo

---

## 📊 Escalabilidad

### **Estrategia de Escalado con Redis PubSub**

Para múltiples instancias de FastAPI:

```python
# app/services/chat/redis_pubsub.py

import redis.asyncio as redis
import json
from app.core.config import settings

class RedisPubSubManager:
    """
    Gestiona la sincronización de mensajes entre múltiples instancias
    de servidores FastAPI usando Redis PubSub.
    """
    
    def __init__(self):
        self.redis_client = redis.from_url(settings.REDIS_URL)
        self.pubsub = self.redis_client.pubsub()
    
    async def publish_message(self, conversation_id: str, message: dict):
        """Publicar mensaje a todas las instancias"""
        channel = f"chat:conversation:{conversation_id}"
        
        await self.redis_client.publish(
            channel,
            json.dumps(message)
        )
    
    async def subscribe_to_conversation(self, conversation_id: str):
        """Suscribirse a una conversación"""
        channel = f"chat:conversation:{conversation_id}"
        await self.pubsub.subscribe(channel)
    
    async def listen(self):
        """Escuchar mensajes entrantes"""
        async for message in self.pubsub.listen():
            if message['type'] == 'message':
                data = json.loads(message['data'])
                yield data
```

### **Diagrama de Escalado**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Cliente A  │     │  Cliente B  │     │  Cliente C  │
└─────┬───────┘     └─────┬───────┘     └─────┬───────┘
      │                   │                   │
      │ WebSocket         │ WebSocket         │ WebSocket
      ▼                   ▼                   ▼
┌──────────────────────────────────────────────────────┐
│              Load Balancer (Sticky Session)          │
└──────┬──────────────────┬──────────────────┬─────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  FastAPI 1  │    │  FastAPI 2  │    │  FastAPI 3  │
│  Instance   │    │  Instance   │    │  Instance   │
└─────┬───────┘    └─────┬───────┘    └─────┬───────┘
      │                  │                  │
      └──────────────────┼──────────────────┘
                         ▼
                  ┌─────────────┐
                  │Redis PubSub │
                  │             │
                  │ - Broadcast │
                  │ - Presencia │
                  └─────────────┘
```

---

## 🚀 Implementación por Fases

### **Fase 1: MVP (2-3 semanas)**

✅ **Semana 1**
- [ ] Crear esquema de base de datos
- [ ] Implementar modelos SQLAlchemy
- [ ] Crear schemas Pydantic
- [ ] Desarrollar MessageService básico

✅ **Semana 2**
- [ ] Implementar WebSocket Manager
- [ ] Crear endpoint WebSocket
- [ ] Implementar REST API endpoints
- [ ] Testing unitario

✅ **Semana 3**
- [ ] Integración con frontend
- [ ] Testing end-to-end
- [ ] Deployment a staging
- [ ] Documentación

### **Fase 2: Mejoras (2 semanas)**

- [ ] Notificaciones push
- [ ] Indicadores de "escribiendo..."
- [ ] Estado de presencia
- [ ] Soporte para imágenes
- [ ] Búsqueda en conversaciones

### **Fase 3: Escalado (1-2 semanas)**

- [ ] Implementar Redis PubSub
- [ ] Optimizar queries de BD
- [ ] Agregar caching
- [ ] Load testing
- [ ] Monitoreo y alertas

---

## 📈 Monitoreo y Observabilidad

### **Métricas Clave**

```python
# app/core/metrics.py

from prometheus_client import Counter, Histogram, Gauge

# Conexiones
websocket_connections = Gauge(
    'websocket_connections_total',
    'Total active WebSocket connections',
    ['user_role']
)

# Mensajes
messages_sent = Counter(
    'chat_messages_sent_total',
    'Total messages sent',
    ['message_type']
)

messages_delivery_time = Histogram(
    'chat_message_delivery_seconds',
    'Message delivery time',
    buckets=[0.01, 0.05, 0.1, 0.5, 1.0, 2.0]
)

# Errores
websocket_errors = Counter(
    'websocket_errors_total',
    'Total WebSocket errors',
    ['error_type']
)
```

### **Logging**

```python
logger.info(
    "Message sent",
    extra={
        "conversation_id": str(conversation_id),
        "sender_id": str(sender_id),
        "message_type": message_type,
        "message_length": len(content)
    }
)
```

---

## 🧪 Testing

### **Test de WebSocket**

```python
# tests/test_chat_websocket.py

from fastapi.testclient import TestClient

def test_websocket_connection(client: TestClient, auth_token: str):
    """Test conexión WebSocket exitosa"""
    
    with client.websocket_connect(
        f"/ws/chat/{conversation_id}?token={auth_token}"
    ) as websocket:
        
        # Enviar mensaje
        websocket.send_json({
            "type": "message",
            "content": "Hola!",
            "message_type": "text"
        })
        
        # Recibir confirmación
        data = websocket.receive_json()
        
        assert data["type"] == "message"
        assert data["data"]["content"] == "Hola!"
```

---

## 📦 Dependencias Adicionales

```txt
# requirements.txt - Agregar:

# WebSocket support
websockets==12.0

# Redis para PubSub y cache
redis==5.0.1
hiredis==2.3.2  # Parser C para mejor performance

# Prometheus metrics
prometheus-client==0.19.0

# Rate limiting
slowapi==0.1.9
```

---

## 🎨 Frontend (Ejemplo con React)

```typescript
// hooks/useChat.ts

import { useEffect, useState, useCallback } from 'react';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  status: 'sent' | 'delivered' | 'read';
}

export const useChat = (conversationId: string, token: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Conectar WebSocket
    const websocket = new WebSocket(
      `ws://localhost:8000/ws/chat/${conversationId}?token=${token}`
    );

    websocket.onopen = () => {
      console.log('Connected');
      setIsConnected(true);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'message') {
        setMessages(prev => [...prev, data.data]);
      } else if (data.type === 'typing') {
        // Handle typing indicator
      } else if (data.type === 'presence') {
        // Handle presence update
      }
    };

    websocket.onclose = () => {
      console.log('Disconnected');
      setIsConnected(false);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [conversationId, token]);

  const sendMessage = useCallback((content: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'message',
        content,
        message_type: 'text'
      }));
    }
  }, [ws]);

  return {
    messages,
    isConnected,
    sendMessage
  };
};
```

---

## 📝 Conclusiones

### **Ventajas de esta Arquitectura**

✅ **Tiempo real** con WebSocket  
✅ **Escalable** horizontalmente con Redis PubSub  
✅ **Persistente** con PostgreSQL  
✅ **Seguro** con autenticación JWT  
✅ **Robusto** con fallback a REST API  
✅ **Observable** con métricas y logs

### **Próximos Pasos**

1. Revisar y aprobar el diseño
2. Crear migraciones de base de datos
3. Implementar backend (Fase 1)
4. Desarrollar componentes de frontend
5. Testing integral
6. Deployment gradual

---

**¿Dudas o ajustes necesarios en el diseño?**
