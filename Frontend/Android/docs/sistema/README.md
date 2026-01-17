# RENTA fácil - Aplicación Móvil Android

## Estructura del Proyecto

```
Android/
├── src/
│   ├── screens/          # Pantallas principales
│   │   ├── auth/         # Autenticación
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── home/         # Pantalla principal
│   │   │   └── HomeScreen.tsx
│   │   ├── search/       # Búsqueda
│   │   ├── properties/   # Propiedades
│   │   ├── booking/      # Reservas
│   │   ├── profile/      # Perfil
│   │   └── dashboard/    # Dashboard de propietarios
│   ├── components/       # Componentes reutilizables
│   │   ├── common/       # Componentes comunes
│   │   ├── forms/        # Formularios
│   │   ├── cards/        # Tarjetas
│   │   └── ui/           # UI elements
│   ├── navigation/       # Configuración de navegación
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   └── MainNavigator.tsx
│   ├── services/         # Servicios y API
│   │   ├── api/          # Llamadas a API
│   │   ├── storage/      # AsyncStorage
│   │   └── notifications/# Push notifications
│   ├── hooks/            # Custom hooks
│   ├── utils/            # Utilidades
│   ├── types/            # TypeScript types
│   ├── constants/        # Constantes
│   ├── store/            # Estado global (Context/Redux)
│   └── assets/           # Recursos estáticos
│       ├── images/
│       ├── icons/
│       └── fonts/
├── App.tsx               # Punto de entrada
├── app.json              # Configuración de Expo
├── package.json          # Dependencias
└── tsconfig.json         # Configuración TypeScript
```

## Tecnologías

- React Native
- TypeScript
- Expo (opcional)
- React Navigation
- Axios
- AsyncStorage
- React Native Maps
- React Native Image Picker

## Instalación

```bash
cd Android
npm install
npm start
```

## Desarrollo

- Modo de desarrollo: `npm start`
- Android: `npm run android`
- iOS: `npm run ios`
