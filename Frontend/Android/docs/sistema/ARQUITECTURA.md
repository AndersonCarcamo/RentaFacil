# Arquitectura de la Aplicación Móvil Android

## Resumen Ejecutivo

La aplicación RENTA fácil para Android sigue una arquitectura modular basada en React Native con TypeScript. El proyecto está organizado en capas independientes que facilitan el mantenimiento, testing y escalabilidad.

## Capas de Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                  │
│  (Screens, Components, Navigation)                       │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                      LOGIC LAYER                         │
│  (Hooks, State Management, Business Logic)              │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                      SERVICE LAYER                       │
│  (API Client, Storage Service)                          │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                      DATA LAYER                          │
│  (AsyncStorage, Network Requests)                       │
└─────────────────────────────────────────────────────────┘
```

## Descripción de Capas

### 1. Presentation Layer (Capa de Presentación)

**Ubicación:** `src/screens/`, `src/components/`

Responsabilidades:
- Renderizar UI
- Manejar interacciones del usuario
- Mostrar datos al usuario

**Componentes Principales:**
- **Screens:** LoginScreen, RegisterScreen, HomeScreen
- **Components:** UI Components (Button, TextInputField, Alert)
- **Navigation:** Navegación entre pantallas

**Reglas:**
- Los screens son "inteligentes" (conectan con hooks)
- Los components son "tontos" (props + rendering)
- No hay lógica de negocio compleja

```typescript
// ✅ Buena práctica
const LoginScreen = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  
  return <TextInputField value={email} onChangeText={setEmail} />;
};

// ❌ Mala práctica
const LoginScreen = () => {
  const response = await fetch('/api/login');
  // Lógica de API directa en el screen
};
```

### 2. Logic Layer (Capa de Lógica)

**Ubicación:** `src/hooks/`

Responsabilidades:
- State management
- Business logic
- Efectos secundarios

**Hooks Principales:**
- `useAuth` - Autenticación del usuario
- Otros hooks personalizados (por implementar)

**Patrón:**
```typescript
// Custom Hook
const useAuth = () => {
  const [user, setUser] = useState(null);
  
  const login = async (email, password) => {
    const response = await authApi.login({ email, password });
    setUser(response.user);
  };
  
  return { user, login };
};

// Uso en Screen
const LoginScreen = () => {
  const { login } = useAuth();
  // ...
};
```

### 3. Service Layer (Capa de Servicios)

**Ubicación:** `src/services/`

Responsabilidades:
- Comunicación con API
- Gestión de almacenamiento
- Formateo de datos

**Servicios Disponibles:**

#### API Service
```typescript
// API client genérico
import { apiService } from '@/services/api/apiService';

await apiService.get('/properties');
await apiService.post('/auth/login', credentials);
await apiService.upload('/upload', file);
```

#### Auth API
```typescript
// Operaciones de autenticación
import { authApi } from '@/services/api/authApi';

await authApi.login({ email, password });
await authApi.register(registerData);
await authApi.logout();
```

#### Storage Service
```typescript
// Operaciones de almacenamiento local
import { storageService } from '@/services/storage/storageService';

await storageService.saveUser(user);
const user = await storageService.getUser();
await storageService.saveFavorite(propertyId);
```

### 4. Data Layer (Capa de Datos)

**Ubicación:** Sistema de archivos nativo, Network

Responsabilidades:
- Almacenamiento persistente (AsyncStorage)
- Comunicación de red (Axios)

## Flujo de Datos

### Ejemplo: Login de Usuario

```
1. Usuario escribe email/contraseña en LoginScreen
2. Click en botón "Iniciar Sesión"
3. LoginScreen llama a useAuth() hook
4. useAuth() llama a authApi.login()
5. authApi.login() llama a apiService.post()
6. apiService.post() hace request a backend
7. Response se guarda en AsyncStorage vía storageService
8. Hook actualiza estado con usuario logueado
9. NavigationContainer detecta isLoggedIn=true
10. Navega a MainNavigator

Flujo de datos:
┌─────────────────┐
│  LoginScreen    │
│  (email, pwd)   │
└────────┬────────┘
         │
    useAuth()
         │
    authApi.login()
         │
    apiService.post()
         │
   Backend API
         │
    storageService
         │
   AsyncStorage
```

## Estado de la Aplicación

### Global State (por implementar)
- Usar Context API o Redux para estado global
- Ejemplos: User, Theme, Language

### Local State (Implementado)
- useState en hooks para estado local
- Ejemplos: Form inputs, UI toggles

## Manejo de Errores

### Niveles de Error

```typescript
// 1. Validación en Cliente
if (!validators.email(email)) {
  setErrors({ email: validationMessages.email });
}

// 2. Error de Servidor
try {
  await authApi.login(credentials);
} catch (error) {
  if (error.message.includes('401')) {
    // Credenciales inválidas
  }
}

// 3. Error de Red
try {
  await apiService.get('/data');
} catch (error) {
  if (error.message.includes('No se pudo conectar')) {
    // Sin conexión
  }
}
```

## Constantes y Configuración

**Ubicación:** `src/constants/index.ts`

```typescript
// API
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

// Rutas
export const ROUTES = {
  LOGIN: 'Login',
  REGISTER: 'Register',
  HOME: 'Home',
  // ...
};

// Colores
export const COLORS = {
  primary: '#2563EB',
  // ...
};

// Validación
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // ...
};
```

## Tipos TypeScript

**Ubicación:** `src/types/index.ts`

```typescript
export interface User {
  id: string;
  email: string;
  firstName: string;
  role: 'USER' | 'LANDLORD' | 'AGENT';
  // ...
}

export interface Property {
  id: string;
  title: string;
  price: number;
  // ...
}
```

## Utilidades

**Ubicación:** `src/utils/`

### Validación
```typescript
import { validators, validationMessages } from '@/utils/validation';

if (!validators.email(email)) {
  showError(validationMessages.email);
}
```

### Formateo
```typescript
import { formatPrice, formatDate } from '@/utils/formatters';

const displayPrice = formatPrice(2500); // "2,500"
const displayDate = formatDate('2024-01-01'); // "01/01/2024"
```

## Navegación

### Estructura de Navigation

```
AppNavigator
├── AuthNavigator (cuando no autenticado)
│   ├── LoginScreen
│   └── RegisterScreen
└── MainNavigator (cuando autenticado)
    └── BottomTabNavigator
        ├── HomeStack
        ├── SearchStack
        ├── FavoritesStack
        └── ProfileStack
```

## Pasos para Agregar Nueva Pantalla

1. **Crear Screen Component**
   ```typescript
   // src/screens/[feature]/FeatureScreen.tsx
   const FeatureScreen = () => {
     return <View>{/* UI */}</View>;
   };
   export default FeatureScreen;
   ```

2. **Agregar Ruta**
   ```typescript
   // src/constants/index.ts
   export const ROUTES = {
     // ...
     FEATURE: 'Feature',
   };
   ```

3. **Agregar al Navegador**
   ```typescript
   // src/navigation/MainNavigator.tsx
   <Stack.Screen name={ROUTES.FEATURE} component={FeatureScreen} />
   ```

4. **Navegar desde otros screens**
   ```typescript
   navigation.navigate(ROUTES.FEATURE as never);
   ```

## Performance

### Optimizaciones Implementadas
- ✅ Memoización de componentes
- ✅ Lazy loading de pantallas
- ✅ Caché de datos

### Recomendaciones Futuras
- Implementar Redux para estado global
- Code splitting por feature
- Imágenes optimizadas
- Virtualización de listas largas

## Testing

### Estructura de Tests (por implementar)
```
__tests__/
├── screens/
├── components/
├── services/
├── hooks/
└── utils/
```

## Deployment

### Preparación para Producción
1. Configurar variables de entorno
2. Minificar y ofuscar código
3. Generar APK/Bundle
4. Testing en dispositivos reales
5. Publicar en Google Play Store

## Referencias

- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Expo Documentation](https://docs.expo.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
