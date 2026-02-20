# Configuración de Firebase para Autenticación

Este documento explica cómo configurar Firebase Authentication para RENTA fácil.

## 1. Crear un proyecto en Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto" o "Create project"
3. Ingresa el nombre del proyecto: `rentafacil` (o el que prefieras)
4. Puedes deshabilitar Google Analytics si no lo necesitas
5. Haz clic en "Crear proyecto"

## 2. Agregar una aplicación web

1. En la página principal del proyecto, haz clic en el ícono **Web** (`</>`)
2. Ingresa un nombre para tu app: `RentaFacil Web`
3. **NO marques** "Firebase Hosting" por ahora
4. Haz clic en "Registrar app"
5. Copia las credenciales que te muestra:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "rentafacil-xxxx.firebaseapp.com",
  projectId: "rentafacil-xxxx",
  storageBucket: "rentafacil-xxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

## 3. Habilitar Email/Password Authentication

1. En el menú lateral, ve a **Authentication** (Autenticación)
2. Haz clic en **Get started** o **Comenzar**
3. Ve a la pestaña **Sign-in method**
4. Haz clic en **Email/Password**
5. **Habilita** la opción "Email/Password"
6. **NO habilites** "Email link (passwordless sign-in)" por ahora
7. Haz clic en **Save** (Guardar)

## 4. Configurar las variables de entorno

1. Copia el archivo `.env.local.example` a `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edita `.env.local` y agrega tus credenciales de Firebase:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=rentafacil-xxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=rentafacil-xxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=rentafacil-xxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123def456

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. **IMPORTANTE**: Nunca subas el archivo `.env.local` a Git (ya está en `.gitignore`)

## 5. Configurar el Backend

El backend necesita validar los tokens de Firebase. Asegúrate de que:

1. El archivo `Backend/app/core/firebase.py` esté configurado correctamente
2. Descarga las credenciales de servicio de Firebase:
   - Ve a **Project Settings** > **Service accounts**
   - Haz clic en **Generate new private key**
   - Guarda el archivo JSON en `Backend/` con el nombre que corresponda
   - Configura la variable de entorno en el backend

## 6. Probar la autenticación

1. Inicia el backend:
   ```bash
   cd Backend
   uvicorn app.main:app --reload
   ```

2. Inicia el frontend:
   ```bash
   cd frontend/web
   npm run dev
   ```

3. Ve a http://localhost:3000/registro
4. Crea una cuenta de prueba
5. Ve a http://localhost:3000/login
6. Inicia sesión con las credenciales que acabas de crear

## 7. Verificar que funciona

Si todo está configurado correctamente, deberías ver en la consola del navegador:

```
🔥 Firebase auth state changed: tu@email.com
🔐 Logging in with Firebase: tu@email.com
✅ Firebase login successful
🎫 Got Firebase ID token
✅ Backend login successful
```

Y en Firebase Console > Authentication > Users, deberías ver tu usuario registrado.

## Troubleshooting

### Error: "Firebase: Error (auth/api-key-not-valid)"
- Verifica que `NEXT_PUBLIC_FIREBASE_API_KEY` esté correctamente configurado
- Revisa que no tenga espacios al inicio o final

### Error: "Firebase: Error (auth/project-not-found)"
- Verifica que `NEXT_PUBLIC_FIREBASE_PROJECT_ID` coincida con tu proyecto

### Error: "Firebase: Error (auth/operation-not-allowed)"
- Ve a Firebase Console > Authentication > Sign-in method
- Asegúrate de que Email/Password esté habilitado

### Error en el backend: "Invalid Firebase token"
- Verifica que las credenciales del servicio estén configuradas
- Asegúrate de que el backend pueda acceder al archivo de credenciales

## Recursos adicionales

- [Documentación oficial de Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firebase Auth REST API](https://firebase.google.com/docs/reference/rest/auth)
- [Verificar tokens en el backend](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
