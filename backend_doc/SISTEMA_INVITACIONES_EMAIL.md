# 📧 Sistema de Invitaciones por Email - Agentes

## ✅ Implementación Completada

### 1. Plantilla HTML de Email

**Archivo:** `Backend/app/templates/email/agent_invitation.html`

La plantilla incluye:
- Diseño responsive y profesional
- Logo de EasyRent
- Información completa de la invitación (agencia, invitador, email, fecha de expiración)
- Botón CTA para aceptar la invitación
- Lista de beneficios al unirse
- Advertencia de expiración
- Extiende de `base.html` para mantener consistencia visual

### 2. Servicio de Email

**Archivo:** `Backend/app/services/email_service.py`

**Método agregado:** `send_agent_invitation()`

```python
def send_agent_invitation(
    to_email: str,
    first_name: str,
    last_name: str,
    agency_name: str,
    inviter_name: str,
    invitation_token: str,
    expires_at: str
) -> bool
```

**Características:**
- Renderiza la plantilla HTML con Jinja2
- Genera URL de invitación: `/agents/accept-invitation?token={token}`
- Incluye versión en texto plano como fallback
- Usa el servicio SMTP existente (no AWS)
- Logging completo de éxitos y errores

### 3. Servicio de Agentes (Actualizado)

**Archivo:** `Backend/app/services/agent_service.py`

**Cambios en `create_invitation()`:**

1. **Importación del servicio de email:**
   ```python
   from app.services.email_service import email_service
   ```

2. **Obtención de datos para el email:**
   - Consulta el nombre de la agencia
   - Consulta el nombre completo del invitador
   
3. **Envío automático del email:**
   - Se envía inmediatamente después de crear la invitación
   - Si falla el email, no se revierte la invitación (ya está creada)
   - Logs informativos del resultado del envío

4. **Response enriquecido:**
   ```json
   {
     "id": "uuid",
     "token": "secure_token",
     "expires_at": "2024-01-20 15:30",
     "created_at": "2024-01-13 15:30",
     "email": "agent@example.com",
     "first_name": "Juan",
     "last_name": "Pérez",
     "agency_name": "Agencia ABC",
     "inviter_name": "María García"
   }
   ```

---

## 🔐 Sistema de Permisos - Verificación

### Función de Verificación de Propietario

**Archivo:** `Backend/app/services/agent_service.py`

```python
def verify_agency_owner(self, user_id: UUID, agency_id: UUID) -> bool:
    """Verify if user is the owner of the agency"""
    # Verifica:
    # 1. Usuario tiene role='owner' en user_agency para esa agencia
    # 2. O el usuario es un admin de sistema (role='admin' en users)
```

### Protección de Endpoints

**Archivo:** `Backend/app/api/endpoints/agents.py`

**Helper:** `require_agency_owner()`
```python
def require_agency_owner(agency_id: UUID, current_user: dict, db: Session):
    """Verify that current user is owner of the agency"""
    service = AgentService(db)
    if not service.verify_agency_owner(UUID(current_user["user_id"]), agency_id):
        raise http_403_forbidden("You don't have permission to manage this agency")
```

### Endpoints Protegidos

1. **POST** `/{agency_id}/agents/invite` ✅
   - Solo owners pueden invitar agentes
   - Ahora envía email automáticamente

2. **PUT** `/{agency_id}/agents/{agent_id}` ✅
   - Solo owners pueden actualizar información de agentes

3. **DELETE** `/{agency_id}/agents/{agent_id}` ✅ (asumiendo que existe)
   - Solo owners pueden remover agentes

### Endpoints Públicos/Accesibles

1. **GET** `/{agency_id}/agents` 📖
   - Cualquier miembro de la agencia puede ver la lista
   - No requiere ser owner

2. **GET** `/{agency_id}/agents/{agent_id}` 📖
   - Cualquier miembro puede ver detalles de un agente

---

## 📊 Visualización de Badges de Rol

### Ubicación

Los badges se visualizan en: **`/dashboard/agents`**

**Componente:** `Frontend/web/components/agents/AgentCard.tsx`

### Tipos de Badges

```typescript
const getRoleBadge = (role: string) => {
  switch (role) {
    case 'owner':
      return (
        <span className="badge-owner">
          👑 Propietario
        </span>
      );
    case 'admin':
      return (
        <span className="badge-admin">
          ⚙️ Administrador
        </span>
      );
    case 'agent':
    default:
      return (
        <span className="badge-agent">
          👤 Agente
        </span>
      );
  }
};
```

### Estilos de Badges

```css
.badge-owner {
  background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%);
  color: white;
  /* Badge morado con ícono de corona */
}

.badge-admin {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  /* Badge azul con ícono de configuración */
}

.badge-agent {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  color: white;
  /* Badge gris con ícono de usuario */
}
```

---

## 🔄 Flujo Completo de Invitación

### 1. Owner invita a un agente

```
POST /api/v1/agents/{agency_id}/agents/invite
{
  "email": "nuevo@agente.com",
  "first_name": "Juan",
  "last_name": "Pérez",
  "phone": "+51999999999"
}
```

**Backend:**
1. ✅ Verifica que el usuario es owner (`require_agency_owner`)
2. ✅ Valida que el email no exista como usuario
3. ✅ Valida que no haya invitación pendiente
4. ✅ Genera token seguro (32 bytes urlsafe)
5. ✅ Crea registro en `agent_invitations` con expiración de 7 días
6. ✅ Consulta nombre de agencia y nombre del invitador
7. ✅ **Envía email con plantilla profesional**
8. ✅ Retorna datos completos de la invitación

### 2. Agente recibe email

**Contenido del email:**
- 📧 Asunto: "🏢 Invitación para Unirte a {agency_name} - EasyRent"
- 👤 Saludo personalizado con nombre
- 🏢 Nombre de la agencia
- 👥 Nombre de quien invita
- 📅 Fecha de expiración
- 📋 Lista de beneficios
- ✅ Botón CTA: "Aceptar Invitación"
- ⚠️ Advertencia de expiración

**URL del botón:**
```
https://easyrent.com/agents/accept-invitation?token=SECURE_TOKEN_32_BYTES
```

### 3. Agente acepta invitación

```
POST /api/v1/agents/accept-invitation
{
  "token": "SECURE_TOKEN_32_BYTES",
  "password": "secure_password"
}
```

**Backend:**
1. Valida token y que no esté expirado
2. Crea usuario con datos de la invitación
3. Asigna role='AGENT'
4. Crea relación en `user_agency` con role='agent'
5. Marca invitación como 'accepted'
6. Retorna access_token para login automático

### 4. Agente aparece en lista

**Frontend:** `/dashboard/agents`

El AgentCard muestra:
- 👤 Foto de perfil
- 📛 Nombre completo
- 📧 Email
- 📞 Teléfono
- 👤 Badge gris: "Agente" (vs 👑 morado "Propietario")
- 🏘️ Cantidad de propiedades asignadas
- ✅ Estado activo/inactivo

---

## 🎯 Casos de Uso Cubiertos

### ✅ Caso 1: Owner crea agencia
- Al registrarse como AGENT, se crea automáticamente la agencia
- Se crea registro en `user_agency` con role='owner'
- Badge morado (👑 Propietario) aparece en su perfil

### ✅ Caso 2: Owner invita a agente
- Endpoint protegido: solo owners pueden invitar
- Se envía email profesional automáticamente
- Token seguro con expiración de 7 días

### ✅ Caso 3: Agente acepta invitación
- Crea cuenta con datos pre-llenados del email
- Asignado automáticamente a la agencia
- Role='agent' en user_agency
- Badge gris (👤 Agente) en su perfil

### ✅ Caso 4: Owner gestiona agentes
- Ver lista de todos los agentes (/dashboard/agents)
- Badges visuales distinguen roles (morado vs gris)
- Permisos para actualizar/remover agentes

### ✅ Caso 5: Agente sin permisos intenta invitar
- `require_agency_owner()` bloquea el request
- HTTP 403 Forbidden
- Mensaje: "You don't have permission to manage this agency"

---

## 🔧 Configuración Requerida

### Variables de Entorno

```env
# Email Service (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@easyrent.com
EMAIL_FROM_NAME=EasyRent
EMAIL_ENABLED=true

# Frontend URL (para links en emails)
FRONTEND_URL=https://easyrent.com
```

---

## 📝 TODO / Mejoras Futuras

### Funcionalidades Adicionales

1. **Reenviar invitación** (si expira)
   - Endpoint: `POST /{agency_id}/agents/invite/{invitation_id}/resend`
   
2. **Cancelar invitación** (antes de aceptar)
   - Endpoint: `DELETE /{agency_id}/agents/invite/{invitation_id}`
   
3. **Roles adicionales**
   - Implementar role='admin' (permisos intermedios)
   - UI para cambiar roles de agentes existentes

4. **Notificaciones**
   - Notificar al owner cuando un agente acepta
   - Dashboard de invitaciones pendientes

5. **Analytics**
   - Tasa de aceptación de invitaciones
   - Tiempo promedio de aceptación

---

## 🐛 Testing

### Pruebas Manuales

1. **Crear invitación:**
   ```bash
   curl -X POST "http://localhost:8000/api/v1/agents/{agency_id}/agents/invite" \
     -H "Authorization: Bearer {owner_token}" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@agent.com",
       "first_name": "Test",
       "last_name": "Agent"
     }'
   ```

2. **Verificar email:**
   - Revisar logs del backend para ver si se envió
   - Verificar bandeja de entrada del email invitado
   - Verificar que el link del email funciona

3. **Aceptar invitación:**
   - Copiar token del email
   - Navegar a `/agents/accept-invitation?token={token}`
   - Completar registro
   - Verificar que aparece en `/dashboard/agents` con badge gris

4. **Verificar permisos:**
   - Intentar invitar con usuario 'agent' (debe fallar con 403)
   - Intentar invitar con usuario 'owner' (debe funcionar)

---

## 📚 Referencias

- Sistema de emails: `Backend/app/services/email_service.py`
- Templates: `Backend/app/templates/email/`
- Servicio de agentes: `Backend/app/services/agent_service.py`
- Endpoints: `Backend/app/api/endpoints/agents.py`
- UI de badges: `Frontend/web/components/agents/AgentCard.tsx`
- Documentación completa: `backend_doc/MEJORAS_AGENCIAS_IMPLEMENTADAS.md`
