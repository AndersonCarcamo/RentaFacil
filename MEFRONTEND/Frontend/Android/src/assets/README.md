# 📁 Assets Directory

Esta carpeta contiene todos los recursos estáticos de la aplicación.

## 📂 Estructura

```
assets/
├── images/       - Imágenes, logos, banners
├── icons/        - Iconos personalizados
└── fonts/        - Fuentes personalizadas
```

## 🖼️ images/

Coloca aquí:
- Logo de la app (logo.png, logo@2x.png, logo@3x.png)
- Favicon (favicon.png)
- Imágenes de onboarding
- Placeholders de propiedades
- Banners promocionales

**Recomendación:** Usa PNG con transparencia para logos e iconos.

## 🎨 icons/

Coloca aquí:
- Iconos personalizados en formato PNG o SVG
- Iconos de categorías
- Iconos de amenidades

**Recomendación:** Usa SVG cuando sea posible para mejor escalabilidad.

## 🔤 fonts/

Coloca aquí:
- Fuentes personalizadas (.ttf, .otf)
- Ejemplo: Poppins-Regular.ttf, Roboto-Bold.ttf

**Nota:** Requiere configuración en app.json para cargar fuentes.

## 📝 Convenciones de Nombres

- Usa kebab-case: `property-placeholder.png`
- Incluye dimensiones si es relevante: `banner-1080x720.png`
- Para variantes de resolución: `logo.png`, `logo@2x.png`, `logo@3x.png`

## 🚀 Uso en el Código

```tsx
import { Image } from 'react-native';

// Imagen local
<Image 
  source={require('@/assets/images/logo.png')} 
  style={{ width: 100, height: 100 }}
/>

// Con Expo Image
import { Image } from 'expo-image';

<Image 
  source={require('@/assets/images/property-placeholder.png')}
  contentFit="cover"
/>
```

## ⚠️ Nota sobre favicon.png

El favicon.png es requerido por Expo para la versión web. 
Si no tienes uno personalizado, puedes usar una imagen temporal de 48x48px.

Para generar un favicon profesional:
1. Usa https://favicon.io/ o https://realfavicongenerator.net/
2. Exporta en PNG de 48x48px mínimo (192x192px recomendado)
3. Guarda como `favicon.png` en esta carpeta
