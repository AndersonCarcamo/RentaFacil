# Configuración de Firebase para RentaFacil

## Problema Actual
El error `Invalid or expired Firebase token` ocurre porque el backend no tiene configuradas las credenciales de Firebase para validar los tokens del frontend.

## Solución 1: Configuración Completa de Firebase (PRODUCCIÓN)

### Paso 1: Crear/Configurar Proyecto Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea un nuevo proyecto (o usa uno existente)
3. Activa **Authentication** → **Sign-in method** → Email/Password

### Paso 2: Obtener Service Account del Backend

1. En Firebase Console → **Project Settings** (⚙️)
2. Ve a la pestaña **Service Accounts**
3. Haz clic en **Generate new private key**
4. Descarga el archivo JSON
5. **Guárdalo como**: `/home/rentafacil/proyectos/RentaFacil/MAEBACKEND/backend_api/firebase-serviceAccount.json`

### Paso 3: Configurar Variables de Entorno del Frontend

1. Ve a Firebase Console → **Project Settings** → **General**
2. En **Web apps**, copia la configuración
3. Crea el archivo `/home/rentafacil/proyectos/RentaFacil/MEFRONTEND/Frontend/web/.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Paso 4: Reiniciar Servicios

```bash
# Reiniciar backend
cd /home/rentafacil/proyectos/RentaFacil/MAEBACKEND/backend_api
# Detener uvicorn y reiniciarlo

# Reiniciar frontend (si está corriendo)
cd /home/rentafacil/proyectos/RentaFacil/MEFRONTEND/Frontend/web
npm run dev
```

---

## Solución 2: Modo Mock/Desarrollo (TEMPORAL)

Si no tienes proyecto Firebase o quieres probar rápido, puedes usar el modo mock:

### Modificar el Frontend para usar tokens mock:

**Archivo**: `/home/rentafacil/proyectos/RentaFacil/MEFRONTEND/Frontend/web/lib/hooks/useAuth.tsx`

Línea ~183, cambiar:
```tsx
// ANTES:
const idToken = await firebaseUser.getIdToken()

// DESPUÉS (SOLO DESARROLLO):
const idToken = `mock_token_${userData.email.split('@')[0]}_${Date.now()}`
```

Línea ~210 (en login), cambiar:
```tsx
// ANTES:
const idToken = await firebaseUser.getIdToken()

// DESPUÉS (SOLO DESARROLLO):
const idToken = `mock_token_${email.split('@')[0]}_${Date.now()}`
```

⚠️ **IMPORTANTE**: Esta solución es SOLO para desarrollo. En producción DEBES usar Firebase real.

---

## Verificación

Después de configurar Firebase:

```bash
# Ver logs del backend para confirmar que se verificó el token
# Deberías ver: "Token verified successfully for user: email@example.com"

# NO deberías ver: "Invalid Firebase ID token" o "Expired Firebase ID token"
```

---

## Seguridad del Archivo serviceAccount.json

⚠️ **NUNCA** subas este archivo a Git:

```bash
# Verificar que está en .gitignore
cd /home/rentafacil/proyectos/RentaFacil/MAEBACKEND/backend_api
grep -r "firebase-serviceAccount.json" .gitignore
```

Si no está, añádelo:
```bash
echo "firebase-serviceAccount.json" >> .gitignore
```
