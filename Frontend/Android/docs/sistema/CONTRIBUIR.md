# Aplicación Móvil Android

## Configuración del Entorno

### Requisitos
- Node.js 16+
- npm o yarn
- Expo CLI
- Android Studio (opcional, para emulador)

### Instalación Inicial

```bash
# Clonar el repositorio (si aplica)
git clone <repo-url>
cd Android

# Instalar dependencias
npm install

# Crear archivo .env (copiar de .env.example)
cp .env.example .env

# Editar .env con tu configuración local
```

### Ejecutar el Proyecto

```bash
# Iniciar Expo
npm start

# En una nueva terminal, conectar a Android
npm run android

# O iniciar en web para debugging
npm run web
```

## Estructura de Carpetas

```
src/
├── screens/        # Pantallas principales
├── components/     # Componentes reutilizables
├── navigation/     # Configuración de navegación
├── services/       # Servicios (API, Storage)
├── hooks/          # Custom React hooks
├── utils/          # Funciones de utilidad
├── types/          # Tipos TypeScript
├── constants/      # Constantes de la aplicación
└── assets/         # Recursos estáticos
```

## Convenciones de Código

### Nombres de Archivos

```typescript
// Screens (PascalCase)
LoginScreen.tsx
RegisterScreen.tsx
HomeScreen.tsx

// Components (PascalCase)
Button.tsx
TextInputField.tsx
PropertyCard.tsx

// Services (camelCase)
authApi.ts
apiService.ts
storageService.ts

// Utils y Hooks (camelCase)
validation.ts
useAuth.ts
```

### Estilos

```typescript
// StyleSheet al final del archivo
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SIZES.lg,
  },
  text: {
    fontSize: SIZES.fontSize.base,
    color: COLORS.text.primary,
  },
});
```

### Props con TypeScript

```typescript
interface MyComponentProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
}

const MyComponent: React.FC<MyComponentProps> = ({
  title,
  onPress,
  isLoading = false,
}) => {
  // ...
};
```

### Componentes

```typescript
// ✅ Usar componentes funcionales
const MyComponent: React.FC<MyComponentProps> = (props) => {
  const [state, setState] = useState('');
  return <View>{/* JSX */}</View>;
};

// ❌ Evitar Class Components
class MyComponent extends React.Component {}
```

### Hooks

```typescript
// ✅ Usar custom hooks para lógica reutilizable
const useCustomLogic = () => {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    // lógica
  }, []);
  
  return { data };
};

// Usar en componentes
const MyComponent = () => {
  const { data } = useCustomLogic();
  return <View>{/* JSX */}</View>;
};
```

## Patrones de Desarrollo

### Patrón de Servicio

```typescript
// src/services/api/featureApi.ts
import { apiService } from './apiService';

export const featureApi = {
  async getFeatures(): Promise<Feature[]> {
    try {
      return await apiService.get<Feature[]>('/features');
    } catch (error) {
      console.error('Error fetching features:', error);
      throw error;
    }
  },

  async createFeature(data: CreateFeatureData): Promise<Feature> {
    return await apiService.post<Feature>('/features', data);
  },
};
```

### Patrón de Hook

```typescript
// src/hooks/useFeature.ts
import { useState, useEffect } from 'react';
import { featureApi } from '@/services/api/featureApi';

export const useFeature = () => {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFeatures = async () => {
      try {
        const data = await featureApi.getFeatures();
        setFeatures(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    };

    loadFeatures();
  }, []);

  return { features, isLoading, error };
};
```

### Patrón de Screen

```typescript
// src/screens/feature/FeatureScreen.tsx
import React, { useState } from 'react';
import { View, ScrollView, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFeature } from '@/hooks/useFeature';
import { Container, Button } from '@/components/ui';
import { COLORS, SIZES, ROUTES } from '@/constants';

const FeatureScreen = () => {
  const navigation = useNavigation();
  const { features, isLoading } = useFeature();
  const [selectedFilter, setSelectedFilter] = useState('all');

  const handlePress = (featureId: string) => {
    navigation.navigate(ROUTES.FEATURE_DETAILS as never, { id: featureId } as never);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.secondary }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Container>
          {/* Contenido */}
        </Container>
      </ScrollView>
    </SafeAreaView>
  );
};

export default FeatureScreen;

const styles = StyleSheet.create({
  // ...
});
```

## Manejo de Errores

### En Servicios

```typescript
// ✅ Buena práctica
export const authApi = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await apiService.post<LoginResponse>('/auth/login', credentials);
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error; // Propagar error al caller
    }
  },
};
```

### En Hooks

```typescript
// ✅ Buena práctica
const useAuth = () => {
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      // Éxito
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
    }
  };

  return { login, error };
};
```

### En Screens

```typescript
// ✅ Buena práctica
const LoginScreen = () => {
  const { login, error: authError } = useAuth();
  const [formError, setFormError] = useState('');

  const handleSubmit = async () => {
    if (!validateForm()) {
      setFormError('Por favor completa todos los campos');
      return;
    }

    try {
      await login(email, password);
    } catch (error) {
      setFormError('Error al iniciar sesión');
    }
  };

  return (
    <View>
      {formError && <Alert type="error" message={formError} />}
      {/* Form */}
    </View>
  );
};
```

## Checklist para Nuevas Pantallas

- [ ] Crear archivo en `src/screens/[feature]/FeatureScreen.tsx`
- [ ] Agregar interfaz de props si es necesario
- [ ] Importar componentes necesarios
- [ ] Crear StyleSheet al final del archivo
- [ ] Agregar ruta en `src/constants/index.ts`
- [ ] Agregar al navegador correspondiente
- [ ] Exportar en `src/screens/index.ts`
- [ ] Documentar en `DESARROLLO.md`
- [ ] Crear hook personalizado si es necesario
- [ ] Crear servicio si interactúa con API

## Testing

### Ejecutar Tests (cuando estén implementados)

```bash
npm test
```

### Escribir Tests

```typescript
// src/utils/__tests__/validation.test.ts
import { validators } from '@/utils/validation';

describe('validators', () => {
  describe('email', () => {
    it('should validate correct email', () => {
      expect(validators.email('test@example.com')).toBe(true);
    });

    it('should reject invalid email', () => {
      expect(validators.email('invalid')).toBe(false);
    });
  });
});
```

## Debugging

### Usar Expo DevTools

```bash
# Presionar 'j' en la terminal para abrir debugger
npm start
# Seleccionar opción de debug
```

### Logging

```typescript
// ✅ Usar console.log con emojis para debugging
console.log('✅ Éxito:', data);
console.error('❌ Error:', error);
console.warn('⚠️ Advertencia:', warning);
console.info('ℹ️ Info:', info);
```

## Variables de Entorno

```bash
# .env
EXPO_PUBLIC_API_URL=http://localhost:8080/api
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=xxx
EXPO_PUBLIC_STRIPE_KEY=xxx
```

**Nota:** Solo variables que comienzan con `EXPO_PUBLIC_` están disponibles en la aplicación.

## Submitting Changes

### Proceso de Commit

1. Crear rama feature
   ```bash
   git checkout -b feature/nombre-del-feature
   ```

2. Hacer cambios siguiendo convenciones

3. Commit con mensaje descriptivo
   ```bash
   git commit -m "feat: agregar nueva pantalla de búsqueda"
   ```

4. Push a la rama
   ```bash
   git push origin feature/nombre-del-feature
   ```

5. Crear Pull Request

### Mensaje de Commit

Seguir convención Conventional Commits:

```
feat: agregar nueva funcionalidad
fix: corregir bug
docs: actualizar documentación
style: cambios de formateo
refactor: reorganizar código sin cambiar funcionalidad
test: agregar tests
chore: tareas de build/dependencias
```

## Preguntas Frecuentes

### ¿Cómo agregar nueva pantalla?
1. Crear archivo en `src/screens/`
2. Agregar ruta en `src/constants/index.ts`
3. Agregar al navegador en `src/navigation/`
4. Ver "Checklist para Nuevas Pantallas"

### ¿Cómo integrar con API?
1. Crear archivo en `src/services/api/`
2. Definir tipos en `src/types/index.ts`
3. Usar en hook personalizado
4. Consumir en screen

### ¿Cómo manejar estado global?
Por ahora usar Context API. Considerar Redux en el futuro para aplicaciones complejas.

## Soporte

Para preguntas o problemas:
1. Revisar documentación existente
2. Contactar al equipo de desarrollo
3. Crear issue en el repositorio

## Código de Conducta

- Ser respetuoso con otros contribuyentes
- Revisar código de forma constructiva
- Mantener comunicación clara
- Cumplir con convenciones del proyecto

¡Gracias por contribuir! 🎉
