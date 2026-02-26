# 📧 GUÍA RÁPIDA - Email Notifications

## ✅ ¿Qué Configurar?

**TÚ (Administrador) - UNA SOLA VEZ:**
1. Crear cuenta Gmail: `easyrent.notificaciones@gmail.com`
2. Obtener App Password
3. Configurar en `.env`

**PROPIETARIOS - NADA:**
- Solo necesitan tener su email registrado en el sistema
- NO necesitan configurar nada técnico

## 🚀 Setup en 3 Pasos

### 1. Crear cuenta Gmail de EasyRent
```
Email: easyrent.notificaciones@gmail.com
Contraseña: Tu contraseña segura
```

### 2. Obtener App Password
1. https://myaccount.google.com/security
2. Activar verificación en 2 pasos
3. "Contraseñas de aplicaciones"
4. Generar → Correo → Copiar password

### 3. Configurar .env
```env
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=easyrent.notificaciones@gmail.com
SMTP_PASSWORD=abcdefghijklmnop
EMAIL_FROM=noreply@easyrent.pe
```

## ✅ Probar

```bash
cd Backend
python test_email.py
```

## 🎯 ¿Cómo Funciona?

```
Huésped solicita reserva
      ↓
Backend crea reserva
      ↓
Backend obtiene email del propietario (de su perfil)
      ↓
Backend envía email usando SMTP de EasyRent
      ↓
Propietario recibe email (sin configurar nada)
```

## 📊 Alternativa Recomendada: SendGrid

**Mejor para producción:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.tu-api-key
```

**Ventajas:**
- ✅ 100 emails/día GRATIS
- ✅ NO va a SPAM
- ✅ Setup en 5 minutos

**Registro:** https://sendgrid.com/

## ❌ Error Común

**INCORRECTO:**
```
Cada propietario configura su SMTP ❌
```

**CORRECTO:**
```
EasyRent tiene UN servidor SMTP ✅
Todos los propietarios reciben emails ✅
```

## 📧 Lo que ve el propietario

```
De: EasyRent <noreply@easyrent.pe>
Para: propietario@gmail.com
Asunto: 🏠 Nueva Solicitud de Reserva

[Email bonito con todos los detalles]
[Botón para ver y responder]
```

El propietario solo hace click y responde. **NO configuró nada.**
