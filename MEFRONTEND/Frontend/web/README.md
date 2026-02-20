# RentaFacil - Frontend Web

Frontend web de la plataforma RentaFacil desarrollado con Next.js, TypeScript y TailwindCSS.

## 🚀 Características Principales

- **Next.js 14** - Framework React con SSR/SSG
- **TypeScript** - Tipado estático robusto
- **TailwindCSS** - Diseño responsive y moderno
- **SEO Optimizado** - Meta tags, structured data, sitemap
- **ASO Ready** - Optimizado para buscadores
- **PWA Support** - Soporte para aplicación web progresiva
- **Dark Mode** - Tema claro/oscuro
- **Responsive Design** - Diseño adaptable a todos los dispositivos
- **Performance First** - Optimizaciones de rendimiento
- **Accessibility** - Cumple estándares WCAG

## 📦 Tecnologías Incluidas

### Core
- Next.js 14
- React 18
- TypeScript 5
- TailwindCSS 3

### UI/UX
- Headless UI
- Heroicons
- Framer Motion
- Swiper
- React Hot Toast

### Estado y Data
- TanStack Query
- Zustand
- React Hook Form
- Zod

### SEO y Analytics
- Next SEO
- Next Sitemap
- Google Analytics
- Meta Pixel

### Testing y Calidad
- ESLint
- Prettier
- TypeScript
- Jest
- Testing Library

## 🛠️ Instalación

1. **Instalar dependencias**
```bash
npm install
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```
Editar `.env.local` con los valores correctos.

3. **Ejecutar en desarrollo**
```bash
npm run dev
```

4. **Construir para producción**
```bash
npm run build
npm start
```

## 📁 Estructura del Proyecto

```
frontend/web/
├── components/          # Componentes React
│   ├── ui/             # Componentes UI base
│   ├── Layout.tsx      # Layout principal
│   ├── Header.tsx      # Encabezado
│   └── Footer.tsx      # Pie de página
├── pages/              # Páginas Next.js
│   ├── api/           # API routes
│   ├── _app.tsx       # App wrapper
│   ├── _document.tsx  # Document personalizado
│   └── index.tsx      # Página de inicio
├── styles/            # Estilos globales
├── lib/               # Utilidades y configuraciones
├── hooks/             # Custom hooks
├── types/             # Definiciones TypeScript
├── utils/             # Funciones utilitarias
├── store/             # Estado global (Zustand)
├── config/            # Configuraciones
└── public/            # Archivos estáticos
```

## 🎨 Sistema de Diseño

### Colores
Paleta de marca (Option A – CTAs amarillos):

- **Primary Action (Amarillo)**: #F5C842 (secondary-500) – Botones y llamadas principales.
- **Primary Action Hover**: #D4A926 (secondary-600).
- **Secondary / Informational (Azul claro)**: #2CA7E1 (primary-500) – Acciones secundarias, enlaces destacados.
- **Secondary Hover**: #1D7FAF (primary-600).
- **Navy Corporativo**: #0C2D55 (brand-navy / primary-900) – Fondos sólidos, headings, énfasis fuerte.
- **Yellow Light**: #FFE488 (secondary-200) – Fondos suaves, badges.
- **Accent Gray**: Escala gray-* para tipografía neutra y contenedores.
- **Éxito**: #22c55e (verde Tailwind) – mensajes de éxito.
- **Error**: #ef4444 – errores y validaciones.

Se mantienen alias primary/secondary para compatibilidad, usando tokens brand.* cuando se necesita mayor claridad semántica.

### Tipografía
- **Font Family**: Inter (Google Fonts)
- **Escalas**: 2xs, xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl, 6xl

### Espaciado
- **Sistema**: Basado en múltiplos de 4px (0.25rem)
- **Breakpoints**: xs(475px), sm(640px), md(768px), lg(1024px), xl(1280px), 2xl(1536px)

## 📱 Responsive Design

El diseño está optimizado para:
- **Mobile**: 320px - 767px
- **Tablet**: 768px - 1023px  
- **Desktop**: 1024px+
- **Large Desktop**: 1440px+

## 🔍 SEO Optimización

### Implementado
- ✅ Meta tags dinámicos
- ✅ Open Graph
- ✅ Twitter Cards
- ✅ Structured Data (JSON-LD)
- ✅ Sitemap XML
- ✅ Robots.txt
- ✅ URLs amigables
- ✅ Optimización de imágenes
- ✅ Core Web Vitals

### ASO Features
- ✅ PWA Manifest
- ✅ Service Worker
- ✅ App-like experience
- ✅ Offline support
- ✅ Push notifications ready

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run build           # Build para producción
npm run start           # Servidor de producción
npm run lint            # Ejecutar ESLint
npm run lint:fix        # Corregir errores de lint
npm run type-check      # Verificar tipos TypeScript

# Testing
npm run test            # Ejecutar tests
npm run test:watch      # Tests en modo watch
npm run test:coverage   # Tests con coverage

# Utilidades
npm run analyze         # Analizar bundle size
npm run sitemap         # Generar sitemap
```

## 🌍 Internacionalización (Futuro)

El proyecto está preparado para soportar múltiples idiomas:
- Español (es) - Principal
- Inglés (en) - Secundario

## 📊 Performance

### Métricas Objetivo
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms
- **Time to Interactive**: < 3.5s

### Optimizaciones Implementadas
- Image optimization con Next.js
- Bundle splitting automático
- Lazy loading de componentes
- Preloading de recursos críticos
- Compression y minificación
- CDN ready

## 🔐 Seguridad

### Headers Implementados
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer Policy
- Permissions Policy

### Validación
- Validación client-side con Zod
- Sanitización de inputs
- HTTPS enforcement
- Secure cookies

## 🧪 Testing

### Configurado
- Jest para unit testing
- Testing Library para componentes
- Coverage reporting
- E2E testing ready (Playwright/Cypress)

## 📱 PWA Features

### Implementado
- Web App Manifest
- Service Worker
- Offline fallback
- Install prompt
- Push notifications ready
- Background sync ready

## 🔄 CI/CD Ready

El proyecto está configurado para:
- GitHub Actions
- Vercel deployment
- Automatic testing
- Bundle analysis
- Performance monitoring

## 📞 Soporte y Contacto

Para soporte técnico o consultas sobre el frontend:
- **Email**: dev@rentafacil.com
- **Documentación**: [docs.rentafacil.com](https://docs.rentafacil.com)
- **Issues**: GitHub Issues

## 📄 Licencia

Este proyecto es propiedad de RentaFacil. Todos los derechos reservados.

---

**Desarrollado con ❤️ para RentaFacil**