# SEO Implementation - URLs Únicas para Propiedades

## 🎯 Problema Original

Las propiedades se mostraban solo en **modals** sin URLs únicas, causando:
- ❌ **Cero SEO**: Google no puede indexar propiedades individuales
- ❌ **No compartible**: Imposible compartir links directos
- ❌ **Mala UX**: Botón "atrás" del navegador no funciona
- ❌ **Sin meta tags**: No hay Open Graph para redes sociales

## ✅ Solución Implementada

### Sistema Híbrido:
1. **Páginas dedicadas**: `/propiedad/[slug]` con SSR (Server-Side Rendering)
2. **Navegación desde búsqueda**: Click en propiedad → navega a su página
3. **Modal reutilizado**: Se usa el mismo componente `PropertyModal` pero dentro de una página

---

## 📂 Estructura de Archivos

### 1. Nueva Página: `Frontend/web/pages/propiedad/[slug].tsx`

**Características:**
- ✅ URL dinámica por slug: `/propiedad/departamento-barranco-3-dorm`
- ✅ SSR con `getServerSideProps` para cargar datos desde el servidor
- ✅ Meta tags dinámicos (title, description, Open Graph, Twitter Cards)
- ✅ JSON-LD structured data para Google Rich Results
- ✅ Reutiliza el componente `PropertyModal`
- ✅ Redirección automática a `/search` al cerrar

**Meta Tags Incluidos:**
```tsx
<Head>
  {/* Básicos */}
  <title>{property.title} - {property.district}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonicalUrl} />

  {/* Open Graph (Facebook) */}
  <meta property="og:type" content="website" />
  <meta property="og:title" content={title} />
  <meta property="og:image" content={firstImage} />
  
  {/* Twitter Cards */}
  <meta name="twitter:card" content="summary_large_image" />
  
  {/* Structured Data (JSON-LD) */}
  <script type="application/ld+json">
    {
      "@type": "RealEstateListing",
      "name": "...",
      "offers": {...}
    }
  </script>
</Head>
```

---

### 2. Backend: Endpoint para obtener por slug

**Archivo:** `Backend/app/api/endpoints/listings.py`

**Nuevo Endpoint:**
```python
@router.get("/by-slug/{slug}", response_model=ListingResponse)
async def get_listing_by_slug(slug: str, db: Session = Depends(get_db)):
    """
    Obtener propiedad por slug para URLs amigables.
    Importante para SEO y compartir links.
    """
    listing = db.query(Listing).filter(
        Listing.slug == slug,
        Listing.status == 'published'
    ).first()
    
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    # ... incluir imágenes y amenidades
    return listing_dict
```

**URL:** `GET /v1/listings/by-slug/{slug}`

**Nota:** Se coloca **ANTES** del endpoint `/{listing_id}` para evitar que el slug se interprete como ID.

---

### 3. Frontend: Modificaciones en search.tsx

**Cambios:**

1. **Eliminado:** Modal state management
```typescript
// ❌ ANTES
const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
const [isModalOpen, setIsModalOpen] = useState(false);

// ✅ AHORA: No se necesita, navegamos directamente
```

2. **Actualizado:** `openPropertyModal` navega en vez de abrir modal
```typescript
const openPropertyModal = (propertyId: string) => {
  const propertyData = apiProperties.find(p => p.id === propertyId);
  const propertySlug = propertyData?.slug || propertyId;
  
  // Navega a la página de la propiedad
  router.push(`/propiedad/${propertySlug}`, undefined, { shallow: true });
};
```

3. **Eliminado:** Renderizado del modal
```typescript
// ❌ ANTES
{selectedPropertyId && (
  <PropertyModal ... />
)}

// ✅ AHORA: Modal se renderiza en /propiedad/[slug].tsx
```

---

### 4. Actualizado: PropertyResponse type

**Archivo:** `Frontend/web/lib/api/properties.ts`

```typescript
export interface PropertyResponse {
  // ... campos existentes
  slug?: string  // ✅ NUEVO: Para URLs amigables
  // ...
}
```

---

## 🔄 Flujo de Navegación

### Escenario 1: Usuario busca propiedades

1. Usuario en `/search?location=barranco`
2. Ve lista de propiedades
3. Click en una propiedad
4. **ANTES:** Abre modal sin cambio de URL
5. **AHORA:** Navega a `/propiedad/departamento-barranco-3-dorm`
6. Se muestra la misma interfaz (modal reutilizado)
7. Al cerrar: Regresa a `/search`

### Escenario 2: Usuario recibe link compartido

1. Recibe link: `https://easyrent.pe/propiedad/casa-miraflores-vista-mar`
2. Abre link
3. Servidor carga datos con SSR (SEO-friendly)
4. Se muestra la propiedad con todos los meta tags
5. Google puede indexar la página
6. Facebook/WhatsApp muestran preview con imagen

---

## 📊 Beneficios SEO

### Meta Tags Dinámicos

Cada propiedad tiene:
```html
<!-- Title personalizado -->
<title>Departamento en Barranco - 3 dorm, 2 baños - PEN 2,500</title>

<!-- Description personalizada -->
<meta name="description" content="Hermoso departamento en Barranco, cerca al malecón..." />

<!-- Canonical URL única -->
<link rel="canonical" href="https://easyrent.pe/propiedad/departamento-barranco" />

<!-- Open Graph para redes sociales -->
<meta property="og:title" content="..." />
<meta property="og:image" content="https://.../property-1.jpg" />
```

### Structured Data (JSON-LD)

Google puede mostrar **Rich Results**:
```json
{
  "@context": "https://schema.org",
  "@type": "RealEstateListing",
  "name": "Departamento en Barranco",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Barranco",
    "addressRegion": "Lima"
  },
  "offers": {
    "@type": "Offer",
    "price": 2500,
    "priceCurrency": "PEN"
  }
}
```

---

## 🧪 Testing

### 1. Verificar que funciona la navegación

```bash
# Frontend (desarrollo)
cd Frontend/web
npm run dev

# Navegar a:
http://localhost:3000/search
# Click en una propiedad
# Debería navegar a: /propiedad/[slug]
```

### 2. Verificar endpoint de slug

```bash
# Probar endpoint directamente
curl http://localhost:8000/v1/listings/by-slug/departamento-barranco-3-dorm

# Debería retornar:
{
  "id": "...",
  "title": "Departamento en Barranco",
  "slug": "departamento-barranco-3-dorm",
  "images": [...],
  "amenities": [...]
}
```

### 3. Verificar meta tags

Abrir navegador en modo incógnito:
```
http://localhost:3000/propiedad/departamento-barranco
```

Inspeccionar HTML (`Ctrl+U`):
- ✅ `<title>` personalizado
- ✅ `<meta name="description">`
- ✅ `<meta property="og:image">`
- ✅ `<script type="application/ld+json">`

### 4. Verificar con herramientas SEO

**Google Rich Results Test:**
```
https://search.google.com/test/rich-results
```
Pegar URL de producción para verificar structured data.

**Facebook Sharing Debugger:**
```
https://developers.facebook.com/tools/debug/
```
Verificar que muestra preview correcto.

---

## 🚀 Variables de Entorno

Agregar en `.env.local`:

```bash
# Frontend
NEXT_PUBLIC_SITE_URL=https://easyrent.pe
NEXT_PUBLIC_API_URL=https://api.easyrent.pe

# Para desarrollo local
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 📝 Pendiente: Generar Slugs

Las propiedades necesitan slugs únicos. Opciones:

### Opción 1: Al crear propiedad (Recomendado)

```python
# Backend/app/services/listing_service.py
from slugify import slugify

def create_listing(self, data):
    # Generar slug automáticamente
    base_slug = slugify(f"{data.property_type}-{data.district}-{data.bedrooms}-dorm")
    slug = self._ensure_unique_slug(base_slug)
    
    listing = Listing(
        **data.dict(),
        slug=slug
    )
    # ...
```

### Opción 2: Script de migración para existentes

```sql
-- Generar slugs para propiedades existentes
UPDATE core.listings
SET slug = CONCAT(
    LOWER(REPLACE(property_type, ' ', '-')),
    '-',
    LOWER(REPLACE(district, ' ', '-')),
    '-',
    SUBSTR(CAST(id AS TEXT), 1, 8)
)
WHERE slug IS NULL;
```

---

## 🎨 Mejoras Futuras

1. **Sitemap XML**: Generar `/sitemap.xml` con todas las propiedades
2. **robots.txt**: Configurar para SEO óptimo
3. **Prerender**: Para navegadores sin JavaScript
4. **Lazy loading**: Para imágenes en propiedades
5. **Cache**: Redis para propiedades populares

---

## ✅ Checklist de Implementación

- [x] Crear página `/propiedad/[slug].tsx` con SSR
- [x] Implementar meta tags dinámicos (Open Graph, Twitter)
- [x] Agregar JSON-LD structured data
- [x] Crear endpoint `/by-slug/{slug}` en backend
- [x] Modificar `search.tsx` para navegar en vez de modal
- [x] Actualizar tipo `PropertyResponse` con `slug`
- [ ] Generar slugs para propiedades existentes
- [ ] Configurar variables de entorno en producción
- [ ] Verificar en Google Search Console
- [ ] Testear compartir en redes sociales

---

**Status:** ✅ Implementado y listo para testing  
**Fecha:** 2024  
**Impacto SEO:** 🚀 Alto - Ahora Google puede indexar cada propiedad individualmente
