# 💬 Sistema de Chat - Guía de Implementación

## ✅ Implementación Completada

Se ha implementado exitosamente el sistema de chat con WebSocket para comunicación en tiempo real entre clientes y propietarios.

---

## 📦 Archivos Creados

### **Base de Datos**
- [`backend_doc/25_chat_system.sql`](../../backend_doc/25_chat_system.sql) - Esquema completo de base de datos

### **Modelos**
- [`app/models/chat.py`](app/models/chat.py) - Modelos SQLAlchemy (Conversation, Message, UserPresence, PushNotification)

### **Schemas**
- [`app/schemas/chat.py`](app/schemas/chat.py) - Schemas Pydantic para validación y respuestas

### **Servicios**
- [`app/services/message_service.py`](app/services/message_service.py) - Lógica de negocio para mensajes y conversaciones
- [`app/services/chat/websocket_manager.py`](app/services/chat/websocket_manager.py) - Gestor de conexiones WebSocket

### **Endpoints**
- [`app/api/endpoints/chat/websocket.py`](app/api/endpoints/chat/websocket.py) - Endpoint WebSocket para tiempo real
- [`app/api/endpoints/chat/conversations.py`](app/api/endpoints/chat/conversations.py) - REST API para conversaciones

### **Documentación**
- [`CHAT_WEBSOCKET_PLANTEAMIENTO.md`](CHAT_WEBSOCKET_PLANTEAMIENTO.md) - Planteamiento técnico completo

---

## 🚀 Pasos de Instalación

### 1. Instalar Dependencias

```bash
cd Backend
pip install -r requirements.txt
```

Esto instalará:
- `websockets==12.0` - Para soporte de WebSocket

### 2. Ejecutar Migraciones de Base de Datos

```bash
# Conectar a PostgreSQL
psql -U postgres -d easyrent

# Ejecutar script de creación
\i backend_doc/25_chat_system.sql
```

O manualmente:

```bash
psql -U postgres -d easyrent -f backend_doc/25_chat_system.sql
```

### 3. Verificar Tablas Creadas

```sql
-- Verificar que el schema chat existe
\dn

-- Verificar tablas
\dt chat.*

-- Deberías ver:
-- chat.conversations
-- chat.messages
-- chat.user_presence
-- chat.push_notifications
```

### 4. Iniciar el Servidor

```bash
# Modo desarrollo
uvicorn app.main:app --reload

# O con Python
python app/main.py
```

El servidor estará disponible en `http://localhost:8000`

---

## 📖 Documentación de la API

Una vez iniciado el servidor, accede a:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

Busca la sección **Chat** para ver todos los endpoints disponibles.

---

## 🔌 Uso de la API

### **REST API Endpoints**

#### 1. Crear o Recuperar Conversación

```bash
POST /v1/chat/conversations
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "listing_id": "uuid-del-listing"
}
```

**Respuesta:**
```json
{
  "id": "uuid-conversacion",
  "listing_id": "uuid-del-listing",
  "client_user_id": "uuid-cliente",
  "owner_user_id": "uuid-propietario",
  "created_at": "2025-12-12T10:00:00Z",
  "updated_at": "2025-12-12T10:00:00Z",
  "last_message_at": null,
  "is_active": true,
  "archived_by_client": false,
  "archived_by_owner": false
}
```

#### 2. Listar Conversaciones del Usuario

```bash
GET /v1/chat/conversations?skip=0&limit=20
Authorization: Bearer {jwt_token}
```

#### 3. Obtener Mensajes de una Conversación

```bash
GET /v1/chat/conversations/{conversation_id}/messages?limit=50
Authorization: Bearer {jwt_token}
```

#### 4. Enviar Mensaje (REST - alternativa a WebSocket)

```bash
POST /v1/chat/conversations/{conversation_id}/messages
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "content": "Hola, me interesa tu propiedad",
  "message_type": "text"
}
```

#### 5. Marcar Conversación como Leída

```bash
PATCH /v1/chat/conversations/{conversation_id}/read
Authorization: Bearer {jwt_token}
```

#### 6. Obtener Contador de No Leídos

```bash
GET /v1/chat/unread-count
Authorization: Bearer {jwt_token}
```

**Respuesta:**
```json
{
  "unread_count": 5
}
```

---

### **WebSocket Connection**

#### Conectar a WebSocket

```javascript
// JavaScript/TypeScript
const token = "tu_jwt_token";
const conversationId = "uuid-conversacion";

const ws = new WebSocket(
  `ws://localhost:8000/v1/ws/chat/${conversationId}?token=${token}`
);

ws.onopen = () => {
  console.log("Conectado al chat");
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Mensaje recibido:", data);
  
  switch(data.type) {
    case 'message':
      // Nuevo mensaje
      console.log("Nuevo mensaje:", data.data);
      break;
    case 'typing':
      // Usuario escribiendo
      console.log("Usuario escribiendo:", data.user_id);
      break;
    case 'presence':
      // Cambio de presencia
      console.log("Presencia actualizada:", data.user_id, data.is_online);
      break;
    case 'read_receipt':
      // Mensaje leído
      console.log("Mensaje leído:", data.message_id);
      break;
  }
};

ws.onerror = (error) => {
  console.error("Error:", error);
};

ws.onclose = () => {
  console.log("Desconectado del chat");
};
```

#### Enviar Mensajes

```javascript
// Enviar mensaje de texto
ws.send(JSON.stringify({
  type: "message",
  content: "Hola, ¿está disponible la propiedad?",
  message_type: "text"
}));

// Indicador de escritura
ws.send(JSON.stringify({
  type: "typing",
  is_typing: true
}));

// Marcar mensaje como leído
ws.send(JSON.stringify({
  type: "read",
  message_id: "uuid-del-mensaje"
}));

// Mantener conexión viva (ping)
ws.send(JSON.stringify({
  type: "ping"
}));
```

---

## 🧪 Testing

### Test Manual con Swagger

1. Ve a http://localhost:8000/docs
2. Autentícate usando el endpoint `/v1/auth/login`
3. Copia el token JWT
4. Usa el botón "Authorize" y pega el token
5. Prueba los endpoints de chat

### Test de WebSocket

Puedes usar herramientas como:
- **Postman** (soporta WebSocket)
- **wscat** (CLI tool)
- **websocat** (CLI tool)

Ejemplo con wscat:

```bash
# Instalar wscat
npm install -g wscat

# Conectar
wscat -c "ws://localhost:8000/v1/ws/chat/{conversation_id}?token={jwt_token}"

# Enviar mensaje
{"type": "message", "content": "Hola desde wscat!", "message_type": "text"}
```

---

## 🎨 Ejemplo de Cliente React

```typescript
// hooks/useChat.ts
import { useEffect, useState, useCallback } from 'react';

interface Message {
  id: string;
  sender_user_id: string;
  content: string;
  created_at: string;
  status: 'sent' | 'delivered' | 'read';
}

export const useChat = (conversationId: string, token: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  useEffect(() => {
    const websocket = new WebSocket(
      `ws://localhost:8000/v1/ws/chat/${conversationId}?token=${token}`
    );

    websocket.onopen = () => {
      console.log('Connected');
      setIsConnected(true);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch(data.type) {
        case 'message':
          setMessages(prev => [...prev, data.data]);
          break;
        case 'typing':
          setOtherUserTyping(data.is_typing);
          break;
        case 'presence':
          // Actualizar estado de presencia
          console.log('User presence:', data.user_id, data.is_online);
          break;
        case 'read_receipt':
          // Actualizar estado de mensaje a leído
          setMessages(prev => prev.map(msg => 
            msg.id === data.message_id 
              ? { ...msg, status: 'read' }
              : msg
          ));
          break;
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

  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'typing',
        is_typing: isTyping
      }));
    }
  }, [ws]);

  return {
    messages,
    isConnected,
    otherUserTyping,
    sendMessage,
    sendTypingIndicator
  };
};
```

**Componente de Chat:**

```typescript
// components/Chat.tsx
import { useChat } from '../hooks/useChat';
import { useState } from 'react';

export const Chat = ({ conversationId, token }: Props) => {
  const [inputValue, setInputValue] = useState('');
  const { messages, isConnected, otherUserTyping, sendMessage, sendTypingIndicator } = useChat(
    conversationId,
    token
  );

  const handleSend = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue);
      setInputValue('');
      sendTypingIndicator(false);
    }
  };

  const handleTyping = (value: string) => {
    setInputValue(value);
    sendTypingIndicator(value.length > 0);
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
      </div>

      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className="message">
            <p>{msg.content}</p>
            <span className="status">{msg.status}</span>
          </div>
        ))}
        
        {otherUserTyping && (
          <div className="typing-indicator">
            El usuario está escribiendo...
          </div>
        )}
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Escribe un mensaje..."
        />
        <button onClick={handleSend}>Enviar</button>
      </div>
    </div>
  );
};
```

---

## 🔒 Seguridad

### Autenticación
- ✅ JWT token requerido para WebSocket y REST
- ✅ Validación de permisos por conversación
- ✅ Solo participantes pueden acceder a mensajes

### Validaciones
- ✅ Mensajes limitados a 5000 caracteres
- ✅ Contenido no vacío obligatorio
- ✅ Rate limiting recomendado (implementar si es necesario)

---

## 📊 Monitoreo

### Health Check

```bash
GET /v1/chat/health
```

**Respuesta:**
```json
{
  "status": "healthy",
  "service": "chat",
  "websocket_stats": {
    "total_connections": 15,
    "unique_users_online": 10,
    "active_conversations": 8,
    "timestamp": "2025-12-12T10:00:00Z"
  }
}
```

---

## 🐛 Troubleshooting

### WebSocket no conecta

1. **Verificar CORS**: Asegúrate de que el origen del frontend esté en la lista de `allow_origins` en `main.py`
2. **Verificar token**: El JWT debe ser válido y no estar expirado
3. **Verificar permisos**: El usuario debe ser participante de la conversación

### Mensajes no se guardan

1. **Verificar BD**: Asegúrate de que las tablas del schema `chat` existen
2. **Verificar triggers**: Los triggers automáticos deben estar creados
3. **Logs**: Revisa los logs del servidor para errores

### Usuario siempre aparece offline

1. **Verificar tabla user_presence**: Debe existir y tener los triggers
2. **Verificar actualizaciones**: El servicio debe actualizar la presencia en connect/disconnect

---

## 📈 Próximos Pasos (Opcional)

### Mejoras Sugeridas

1. **Notificaciones Push**
   - Implementar envío de notificaciones cuando el usuario está offline
   - Usar Firebase Cloud Messaging o similar

2. **Soporte Multimedia**
   - Permitir envío de imágenes
   - Permitir envío de documentos
   - Integrar con el servicio de media existente

3. **Búsqueda en Mensajes**
   - Implementar búsqueda full-text en mensajes
   - Usar índice GIN en PostgreSQL

4. **Escalabilidad**
   - Implementar Redis PubSub para múltiples instancias
   - Ver [`CHAT_WEBSOCKET_PLANTEAMIENTO.md`](CHAT_WEBSOCKET_PLANTEAMIENTO.md) sección de escalabilidad

5. **Analytics**
   - Métricas de uso del chat
   - Tiempo promedio de respuesta
   - Conversaciones más activas

---

## 📚 Referencias

- [Planteamiento Técnico Completo](CHAT_WEBSOCKET_PLANTEAMIENTO.md)
- [FastAPI WebSocket Documentation](https://fastapi.tiangolo.com/advanced/websockets/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)

---

## ✅ Checklist de Implementación

- [x] ✅ Esquema SQL creado
- [x] ✅ Modelos SQLAlchemy implementados
- [x] ✅ Schemas Pydantic creados
- [x] ✅ MessageService implementado
- [x] ✅ WebSocket Manager implementado
- [x] ✅ Endpoint WebSocket creado
- [x] ✅ REST API endpoints creados
- [x] ✅ Integración en main.py
- [x] ✅ Dependencias actualizadas
- [ ] ⏳ Ejecutar migraciones en base de datos
- [ ] ⏳ Testing manual con Swagger/Postman
- [ ] ⏳ Implementación de frontend
- [ ] ⏳ Testing end-to-end

---

**¡El sistema de chat está listo para usar!** 🎉

Para cualquier duda, consulta el [planteamiento técnico completo](CHAT_WEBSOCKET_PLANTEAMIENTO.md).
