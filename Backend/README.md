# 🏠 EasyRent API - Backend

Sistema completo de marketplace inmobiliario desarrollado con FastAPI, PostgreSQL y JWT Authentication.

## 🚀 Características

- ✅ **Autenticación JWT** completa (registro, login, logout, refresh tokens)
- ✅ **Verificación de email** con tokens seguros
- ✅ **Reset de contraseña** por email
- ✅ **Roles de usuario** (user, tenant, landlord, agent, admin)
- ✅ **Gestión de sesiones** con refresh tokens
- ✅ **Validación robusta** con Pydantic
- ✅ **Base de datos PostgreSQL** con SQLAlchemy
- ✅ **Migraciones** con Alembic
- ✅ **Documentación automática** con Swagger/OpenAPI
- ✅ **CORS configurado** para desarrollo

## 📋 Requisitos Previos

- **Python 3.11+**
- **PostgreSQL 17+** (con la base de datos configurada según `Base De Datos/`)
- **Git**

## 🛠️ Instalación Rápida

### 1. Configurar la Base de Datos

Primero, asegúrate de tener PostgreSQL instalado y configurado usando los scripts en `../Base De Datos/`:

```bash
# Navegar a la carpeta de base de datos
cd "../Base De Datos"

# Ejecutar scripts de instalación
psql -U postgres -f 00_master_install.sql
```

### 2. Configurar el Backend

```bash
# Clonar y navegar al directorio
cd Backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones
```

### 3. Configurar Base de Datos

```bash
# Generar migración inicial
alembic revision --autogenerate -m "Initial migration"

# Aplicar migraciones
alembic upgrade head
```

### 4. Ejecutar el Servidor

```bash
# Modo desarrollo
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# O usando Python directamente
python -m app.main
```

El servidor estará disponible en:
- **API**: http://localhost:8000
- **Documentación**: http://localhost:8000/docs
- **Redoc**: http://localhost:8000/redoc

## 🔧 Configuración

### Variables de Entorno (.env)

```bash
# Base de datos
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/easy_rent

# JWT
SECRET_KEY=tu-clave-super-secreta-cambiar-en-produccion
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Aplicación
APP_NAME=EasyRent API
DEBUG=True
ENVIRONMENT=development

# Email (opcional para desarrollo)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=tu-email@gmail.com
SMTP_PASSWORD=tu-app-password

# Frontend
FRONTEND_URL=http://localhost:3000
```

## 📚 Endpoints de Autenticación

### 🔐 Registro y Login

```bash
# Registrar usuario
POST /v1/auth/register
{
  "email": "usuario@ejemplo.com",
  "password": "password123",
  "first_name": "Juan",
  "last_name": "Pérez",
  "phone": "+51987654321",
  "role": "user"
}

# Iniciar sesión
POST /v1/auth/login
{
  "email": "usuario@ejemplo.com",
  "password": "password123",
  "remember_me": false
}

# Cerrar sesión
POST /v1/auth/logout
{
  "refresh_token": "token_de_refresh"
}
```

### 🔄 Gestión de Tokens

```bash
# Renovar token de acceso
POST /v1/auth/refresh
{
  "refresh_token": "token_de_refresh"
}
```

### 📧 Verificación y Reset

```bash
# Solicitar reset de contraseña
POST /v1/auth/forgot-password
{
  "email": "usuario@ejemplo.com"
}

# Resetear contraseña
POST /v1/auth/reset-password
{
  "token": "token_de_reset",
  "password": "nueva_password123"
}

# Verificar email
POST /v1/auth/verify-email
{
  "token": "token_de_verificacion"
}

# Reenviar verificación
POST /v1/auth/resend-verification
```

## 🏗️ Estructura del Proyecto

```
Backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app principal
│   ├── core/
│   │   ├── config.py           # Configuración
│   │   ├── database.py         # Conexión PostgreSQL
│   │   └── security.py         # JWT, hashing
│   ├── models/
│   │   └── auth.py             # SQLAlchemy models
│   ├── schemas/
│   │   └── auth.py             # Pydantic schemas
│   ├── api/
│   │   ├── deps.py             # Dependencies
│   │   └── endpoints/
│   │       └── auth.py         # Rutas /auth
│   └── services/
│       └── auth_service.py     # Lógica de negocio
├── alembic/                    # Migraciones
├── requirements.txt
├── .env.example
└── README.md
```

## 🧪 Testing

```bash
# Instalar dependencias de testing
pip install pytest pytest-asyncio httpx

# Ejecutar tests (cuando estén implementados)
pytest
```

## 📦 Comandos Útiles

```bash
# Crear nueva migración
alembic revision --autogenerate -m "Descripción del cambio"

# Aplicar migraciones
alembic upgrade head

# Revertir migración
alembic downgrade -1

# Ver historial de migraciones
alembic history

# Ver migración actual
alembic current
```

## 🔗 Integración con Frontend

El API está configurado para trabajar con un frontend en `http://localhost:3000`. Los endpoints devuelven:

```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "uuid",
    "email": "usuario@ejemplo.com",
    "first_name": "Juan",
    "last_name": "Pérez",
    "role": "user",
    "status": "active",
    "is_email_verified": true
  }
}
```

## 🐛 Solución de Problemas

### Error: "Import could not be resolved"
```bash
# Instalar dependencias
pip install -r requirements.txt

# Verificar que el entorno virtual esté activado
which python  # Linux/Mac
where python   # Windows
```

### Error: "Database connection failed"
```bash
# Verificar que PostgreSQL esté corriendo
pg_ctl status

# Verificar configuración en .env
echo $DATABASE_URL
```

### Error: "Alembic command not found"
```bash
# Instalar alembic
pip install alembic

# O reinstalar dependencias
pip install -r requirements.txt
```

## 🚀 Despliegue

### Desarrollo
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Producción
```bash
# Configurar variables de producción en .env
DEBUG=False
ENVIRONMENT=production
SECRET_KEY=clave-super-segura-de-produccion

# Ejecutar con Gunicorn
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

## 📞 Soporte

- **Documentación**: http://localhost:8000/docs
- **Estado de la API**: http://localhost:8000/health
- **Base de datos**: Revisar `../Base De Datos/README.md`

---

**Inmobiliaria Benites** - EasyRent Marketplace 🏠
