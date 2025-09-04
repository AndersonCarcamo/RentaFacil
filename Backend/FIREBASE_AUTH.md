# EasyRent API - Firebase Authentication

## Resumen

EasyRent API utiliza Firebase Authentication como sistema principal de autenticación, siguiendo las mejores prácticas de seguridad y delegando la gestión de credenciales a Google Firebase.

## Arquitectura de Autenticación

### Flujo Completo
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Firebase  │    │  Backend    │    │ PostgreSQL  │
│             │    │             │    │    API      │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │                   │
       │ 1. Authenticate   │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │ 2. ID Token       │                   │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
       │ 3. POST /auth/login (firebase_token)  │                   │
       │─────────────────────────────────────▶│                   │
       │                   │                   │                   │
       │                   │ 4. Verify Token   │                   │
       │                   │◀──────────────────│                   │
       │                   │                   │                   │
       │                   │ 5. Token Claims   │                   │
       │                   │──────────────────▶│                   │
       │                   │                   │                   │
       │                   │                   │ 6. Find/Create User│
       │                   │                   │──────────────────▶│
       │                   │                   │                   │
       │                   │                   │ 7. User Data      │
       │                   │                   │◀──────────────────│
       │                   │                   │                   │
       │ 8. JWT Tokens + User Info             │                   │
       │◀─────────────────────────────────────│                   │
```

### Componentes

1. **Frontend**: Maneja autenticación Firebase (JS SDK)
2. **Firebase**: Proveedor de autenticación (Google, email/password, redes sociales)
3. **Backend API**: Verifica tokens Firebase y genera JWT internos
4. **PostgreSQL**: Almacena datos de usuario vinculados por `firebase_uid`

## Configuración

### 1. Configuración Firebase (Producción)

#### Crear Proyecto Firebase
1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Crear nuevo proyecto
3. Activar Authentication
4. Configurar métodos de autenticación (Email/Password, Google, etc.)

#### Generar Service Account
1. Ir a Project Settings → Service Accounts
2. Generar nueva clave privada
3. Descargar archivo JSON

#### Variables de Entorno
```env
# Opción 1: Archivo de credenciales
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccount.json
FIREBASE_PROJECT_ID=your-firebase-project-id

# Opción 2: JSON en variable de entorno
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}
FIREBASE_PROJECT_ID=your-firebase-project-id
```

### 2. Configuración Desarrollo (Sin Firebase)

El sistema funciona en modo mock para desarrollo local:

```env
# No configurar variables Firebase
# El sistema automáticamente entrará en modo mock
```

En modo desarrollo:
- Tokens que empiecen con `mock_token_` serán aceptados
- Se generarán usuarios mock automáticamente
- Útil para testing y desarrollo sin dependencias externas

## Implementación Frontend

### Ejemplo JavaScript/React
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Configuración Firebase
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  // ...
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Función de login
async function loginUser(email, password) {
  try {
    // 1. Autenticar con Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // 2. Obtener ID token
    const idToken = await userCredential.user.getIdToken();
    
    // 3. Enviar a backend
    const response = await fetch('/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firebase_token: idToken
      })
    });
    
    const data = await response.json();
    
    // 4. Guardar JWT tokens para uso posterior
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    
    return data.user;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}
```

### Ejemplo cURL (Testing)
```bash
# Modo desarrollo con token mock
curl -X POST http://localhost:8000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "firebase_token": "mock_token_testuser123"
  }'

# Con token Firebase real
curl -X POST http://localhost:8000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "firebase_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

## Endpoints API

### POST /auth/register
Registra un nuevo usuario (opcional con Firebase UID)

**Request:**
```json
{
  "email": "usuario@ejemplo.com",
  "first_name": "Juan",
  "last_name": "Pérez",
  "phone": "+51987654321",
  "firebase_uid": "firebase_user_id_123",  // Opcional
  "role": "user"
}
```

**Response:**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "email": "usuario@ejemplo.com",
  "first_name": "Juan",
  "last_name": "Pérez",
  "phone": "+51987654321",
  "role": "user",
  "is_verified": false,
  "is_active": true,
  "created_at": "2025-09-04T01:00:00Z"
}
```

### POST /auth/login
Autenticación con Firebase token

**Request:**
```json
{
  "firebase_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "usuario@ejemplo.com",
    "first_name": "Juan",
    "last_name": "Pérez",
    "role": "user"
  }
}
```

## Base de Datos

### Tabla Users
```sql
CREATE TABLE core.users (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firebase_uid            TEXT UNIQUE,              -- ✅ Link con Firebase
    email                   CITEXT UNIQUE NOT NULL,   -- ✅ Email principal
    phone                   TEXT,
    first_name              TEXT,
    last_name               TEXT,
    profile_picture_url     TEXT,
    national_id             TEXT,
    national_id_type        TEXT DEFAULT 'DNI',
    is_verified             BOOLEAN NOT NULL DEFAULT FALSE,
    role                    core.user_role NOT NULL DEFAULT 'user',
    is_active               BOOLEAN NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_login_at           TIMESTAMPTZ,
    login_count             INTEGER NOT NULL DEFAULT 0
);
```

### Proceso de Registro
1. Usuario se registra en Firebase (frontend)
2. Frontend llama `/auth/register` con datos del usuario
3. Backend verifica Firebase UID (si se proporciona)
4. Se crea registro en PostgreSQL con `firebase_uid`

### Proceso de Login
1. Usuario se autentica en Firebase (frontend)
2. Frontend obtiene ID token de Firebase
3. Frontend llama `/auth/login` con el token
4. Backend verifica token con Firebase Admin SDK
5. Backend busca usuario por `firebase_uid`
6. Backend genera JWT interno para sesión
7. Cliente usa JWT interno para requests posteriores

## Beneficios

### Seguridad
- ✅ **Sin contraseñas en backend**: Firebase maneja toda la autenticación
- ✅ **Tokens verificados**: Firebase Admin SDK valida cada token
- ✅ **Rotación automática**: Tokens Firebase tienen expiración corta
- ✅ **Multi-factor**: Firebase soporta 2FA nativo

### Experiencia de Usuario
- ✅ **Login social**: Google, Facebook, Apple nativo
- ✅ **Verificación automática**: Email/SMS manejado por Firebase
- ✅ **Reset de password**: Flujo nativo de Firebase
- ✅ **Persistencia**: Firebase mantiene sesiones activas

### Desarrollo
- ✅ **Modo mock**: Desarrollo sin dependencias Firebase
- ✅ **Testing**: Tokens mock para pruebas automatizadas
- ✅ **Escalabilidad**: Firebase maneja millones de usuarios
- ✅ **Monitoreo**: Firebase Analytics y Crashlytics

## Migración

Si necesitas migrar de autenticación tradicional a Firebase:

1. **Mantener emails existentes**
2. **Crear usuarios Firebase por lotes**
3. **Vincular `firebase_uid` a usuarios existentes**
4. **Gradual migration**: Ambos sistemas pueden coexistir

El sistema actual ya está preparado para esta migración gradual.
