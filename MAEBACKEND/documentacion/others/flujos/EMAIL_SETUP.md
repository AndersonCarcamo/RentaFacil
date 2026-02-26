# 📧 Configuración del Sistema de Emails

## ❗ IMPORTANTE - Modelo de Funcionamiento

**Este sistema usa un servidor SMTP CENTRALIZADO:**
- ✅ **TÚ (administrador)** configuras el email UNA SOLA VEZ
- ✅ **Los propietarios** solo necesitan tener su email registrado en el sistema
- ✅ **NO requiere** que cada propietario configure app passwords
- ✅ Funciona como Airbnb, Booking.com, etc.

## 🎯 ¿Cómo funciona?

1. EasyRent tiene una cuenta de email: `easyrent.notificaciones@gmail.com`
2. Esta cuenta envía emails a todos los propietarios
3. Los propietarios solo reciben los emails en su bandeja normal
4. **NO necesitan configurar nada**

## 🔧 Configuración (Solo Administrador)

### Paso 1: Crear cuenta de Gmail para EasyRent

1. **Crear una cuenta Gmail nueva:**
   - Email sugerido: `easyrent.notificaciones@gmail.com`
   - O usar: `tu-empresa@gmail.com`
   - Esta será la cuenta que envía TODOS los emails

### Paso 2: Activar App Password en esa cuenta

1. Ve a https://myaccount.google.com/security
2. Activa "Verificación en dos pasos"
3. Ve a "Contraseñas de aplicaciones"
4. Genera una contraseña para "Correo"
5. Copia la contraseña de 16 caracteres

### Paso 3: Configurar .env

```env
# Email Configuration
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=easyrent.notificaciones@gmail.com
SMTP_PASSWORD=abcdefghijklmnop  # App password (sin espacios)
EMAIL_FROM=noreply@easyrent.pe
EMAIL_FROM_NAME=EasyRent
FRONTEND_URL=http://localhost:3000
```

### Paso 4: ¡Listo!

Ahora el sistema enviará automáticamente emails a cualquier propietario que tenga su email registrado en el perfil.

## 📨 Flujo de Emails

```
Huésped solicita reserva
        ↓
Sistema crea reserva en BD
        ↓
Sistema obtiene email del propietario desde su perfil
        ↓
Servidor SMTP de EasyRent envía email
        ↓
Propietario recibe email en su bandeja normal
```

**El propietario NO necesita:**
- ❌ Configurar app passwords
- ❌ Dar acceso a su cuenta
- ❌ Configurar SMTP
- ❌ Instalar nada

**El propietario SOLO necesita:**
- ✅ Tener su email registrado en su perfil de usuario
- ✅ Revisar su bandeja de entrada

## 🌐 Opciones de Servidor SMTP

### Opción 1: Gmail (Gratis, 500 emails/día)

**Pros:**
- ✅ Gratis
- ✅ Fácil de configurar
- ✅ Suficiente para empezar

**Contras:**
- ⚠️ Límite de 500 emails/día
- ⚠️ Puede ir a SPAM si no tienes dominio verificado

**Configuración:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=easyrent.notificaciones@gmail.com
SMTP_PASSWORD=tu-app-password
```

### Opción 2: SendGrid (Gratis hasta 100/día) ⭐ RECOMENDADO

**Pros:**
- ✅ 100 emails gratis/día (permanente)
- ✅ No va a SPAM
- ✅ Excelentes métricas
- ✅ API simple

**Pasos:**
1. Regístrate en https://sendgrid.com/
2. Verifica tu email
3. Ve a Settings → API Keys
4. Crea un API Key
5. Configura:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.tu-api-key-aqui
EMAIL_FROM=noreply@easyrent.pe
```

### Opción 3: Brevo (ex-Sendinblue) - 300 emails gratis/día

**Pros:**
- ✅ 300 emails gratis/día
- ✅ Interfaz en español
- ✅ Fácil de usar

**Pasos:**
1. Regístrate en https://www.brevo.com/es/
2. Ve a SMTP & API → SMTP
3. Copia las credenciales

```env
SMTP_HOST=smtp-relay.sendinblue.com
SMTP_PORT=587
SMTP_USER=tu-email@example.com
SMTP_PASSWORD=tu-smtp-key
EMAIL_FROM=noreply@easyrent.pe
```

### Opción 4: Mailgun - 5000 emails gratis/mes

**Configuración:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@tu-dominio.mailgun.org
SMTP_PASSWORD=tu-password
EMAIL_FROM=noreply@easyrent.pe
```

## 🧪 Probar el Sistema

### Método 1: Script de prueba

```bash
cd Backend
python test_email.py

# Opción 1: Test de notificación completa
# Ingresa el email donde quieres recibir el test
```

### Método 2: Crear reserva real

1. Asegúrate de que el propietario tenga email en su perfil
2. Crea una reserva desde el frontend
3. El propietario recibirá el email automáticamente

### Método 3: Test directo con Python

```python
from app.services.email_service import EmailService

email_service = EmailService()

# Email de prueba
email_service.send_email(
    to_email="destinatario@gmail.com",
    subject="Test de Email",
    html_content="<h1>¡Funciona!</h1>"
)
```

## 📋 Checklist de Configuración

- [ ] Crear cuenta Gmail para EasyRent (o usar SendGrid)
- [ ] Activar verificación en dos pasos
- [ ] Generar App Password
- [ ] Copiar credenciales a `.env`
- [ ] Configurar `EMAIL_ENABLED=true`
- [ ] Configurar `FRONTEND_URL`
- [ ] Ejecutar `python test_email.py`
- [ ] Verificar que llegue el email
- [ ] Probar con una reserva real

## 🔍 Verificar Configuración

Cuando se crea una reserva, deberías ver en los logs:

```
INFO: Reserva creada: abc-123 para listing xyz-456
INFO: 📧 Email enviado al propietario owner@example.com para reserva abc-123
```

Si hay error:
```
ERROR: ❌ Error enviando email de notificación: [mensaje de error]
WARNING: ⚠️ No se pudo enviar email: propietario sin email configurado
```

## 🎨 Template del Email

El email incluye:
- ✅ Nombre del propietario
- ✅ Título de la propiedad
- ✅ Información del huésped (nombre)
- ✅ Fechas de check-in y check-out
- ✅ Número de huéspedes
- ✅ Precio total
- ✅ Mensaje del huésped (si lo dejó)
- ✅ Botón para ver y responder la solicitud
- ✅ Diseño responsive con colores corporativos

## 🚫 Deshabilitar emails (para desarrollo)

Si no quieres configurar email durante el desarrollo:

```env
EMAIL_ENABLED=false
```

Los logs mostrarán:
```
INFO: 📧 Email disabled - Would send to owner@example.com: 🏠 Nueva Solicitud de Reserva
```

## ⚠️ Troubleshooting

### Error: "SMTPAuthenticationError"
- Verifica que la contraseña de aplicación sea correcta
- Asegúrate de que la verificación en dos pasos esté activada
- Intenta generar una nueva contraseña de aplicación

### Error: "SMTPServerDisconnected"
- Verifica el SMTP_HOST y SMTP_PORT
- Gmail: `smtp.gmail.com:587`
- Outlook: `smtp-mail.outlook.com:587`

### Error: "Connection refused"
- Verifica tu firewall
- Verifica que el puerto 587 no esté bloqueado
- Intenta con puerto 465 (SSL)

### El email no llega
- Revisa la carpeta de SPAM
- Verifica que EMAIL_FROM tenga un dominio válido
- Verifica los logs del backend

## 📊 Monitoreo en Producción

Para producción, considera:

1. **SendGrid** - 100 emails gratis/día
   - https://sendgrid.com/
   - Fácil de configurar
   - Excelentes métricas

2. **AWS SES** - $0.10 por 1000 emails
   - Más económico para gran volumen
   - Requiere verificación de dominio

3. **Mailgun** - 5000 emails gratis/mes
   - Buena opción intermedia

## 🔐 Seguridad

⚠️ **IMPORTANTE:**
- Nunca subas el archivo `.env` a Git
- Usa contraseñas de aplicación, no tu contraseña real
- En producción, usa servicios dedicados (SendGrid, SES)
- Rota las credenciales periódicamente

## 📞 Soporte

Si necesitas ayuda:
1. Revisa los logs del backend
2. Verifica la configuración del `.env`
3. Prueba con el script `test_email.py`
4. Verifica que el propietario tenga email configurado en su perfil

---

## 🎯 RESUMEN IMPORTANTE

### ✅ Modelo Correcto (Como funciona este sistema)

**EasyRent Backend → Servidor SMTP → Propietarios**

```
1. TÚ (admin) configuras UNA cuenta SMTP una sola vez
2. El sistema usa ESA cuenta para enviar a TODOS
3. Los propietarios SOLO necesitan su email registrado
```

**El propietario NO necesita:**
- ❌ Configurar app passwords
- ❌ Dar acceso a su Gmail
- ❌ Configurar SMTP
- ❌ Nada técnico

**El propietario SOLO necesita:**
- ✅ Tener su email en el campo `user.email`
- ✅ Revisar su bandeja de entrada

### 📧 Ejemplo Real

```
Usuario propietario:
{
  "email": "juan.propietario@gmail.com",
  "first_name": "Juan",
  "last_name": "Pérez"
}

Cuando alguien reserva su propiedad:
→ Backend obtiene "juan.propietario@gmail.com"
→ Backend usa SMTP de EasyRent (easyrent.notificaciones@gmail.com)
→ Envía email a "juan.propietario@gmail.com"
→ Juan recibe el email en su bandeja normal
```

**Juan NO tuvo que configurar nada. Solo registró su email al crear cuenta.**

### 🚀 Configuración Recomendada para Producción

**SendGrid (100 emails/día gratis):**
```env
EMAIL_ENABLED=true
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.tu-api-key
EMAIL_FROM=noreply@easyrent.pe
```

Regístrate en: https://sendgrid.com/
- ✅ Gratis para siempre
- ✅ No va a SPAM
- ✅ Métricas incluidas
