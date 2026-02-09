# Generación de Slugs - Guía de Ejecución

## 📋 Scripts Disponibles

### 1. Script SQL (PostgreSQL)
**Archivo:** `backend_doc/30_generate_slugs.sql`

**Ejecutar:**
```bash
cd Backend
psql -U postgres -d easy_rent -f ../backend_doc/30_generate_slugs.sql
```

**Qué hace:**
- ✅ Crea función `generate_slug_from_title()`
- ✅ Genera slugs únicos para todas las propiedades
- ✅ Crea índice único en la columna `slug`
- ✅ Verifica que no haya duplicados
- ✅ Muestra logs de progreso

**Ventajas:**
- Rápido (procesa todo en SQL)
- No requiere Python activo
- Perfecto para producción

---

### 2. Script Python CLI
**Archivo:** `Backend/app/scripts/generate_slugs.py`

**Ejecutar:**
```bash
cd Backend

# Ver qué haría sin hacer cambios
python -m app.scripts.generate_slugs --dry-run

# Generar slugs solo para propiedades sin slug
python -m app.scripts.generate_slugs

# Regenerar TODOS los slugs (incluso si ya tienen)
python -m app.scripts.generate_slugs --force
```

**Qué hace:**
- ✅ Usa la lógica de `slug_generator.py`
- ✅ Muestra logs detallados en consola
- ✅ Soporte para dry-run (simulación)
- ✅ Opción --force para regenerar todos

**Ventajas:**
- Más control y feedback
- Usa la misma lógica que el backend
- Útil para desarrollo

---

## 🔧 Funcionalidad Automática

### Al crear propiedades nuevas

**Archivo:** `Backend/app/services/listing_service.py`

El servicio ahora genera slugs automáticamente:

```python
def create_listing(self, data: CreateListingRequest, owner_user_id: str) -> Listing:
    # Generar slug único
    base_slug = generate_listing_slug(
        title=data.title,
        property_type=data.property_type,
        district=data.district,
        bedrooms=data.bedrooms
    )
    unique_slug = ensure_unique_slug(self.db, base_slug)
    
    listing = Listing(
        # ... otros campos
        slug=unique_slug,
        # ...
    )
```

### Al actualizar propiedades

Si cambia el título, distrito o tipo de propiedad, el slug se regenera automáticamente.

---

## 📝 Formato de Slugs Generados

### Patrón:
```
{property_type}-{district}-{bedrooms}-dorm-{title}
```

### Ejemplos:

**Entrada:**
```json
{
  "title": "Departamento Moderno con Vista al Mar",
  "property_type": "apartment",
  "district": "Barranco",
  "bedrooms": 3
}
```

**Slug generado:**
```
apartment-barranco-3-dorm-departamento-moderno-con-vista-al-mar
```

**Si ya existe, se agrega contador:**
```
apartment-barranco-3-dorm-departamento-moderno-con-vista-al-mar-1
apartment-barranco-3-dorm-departamento-moderno-con-vista-al-mar-2
```

---

## 🧪 Testing

### 1. Verificar propiedades sin slug

```sql
SELECT id, title, slug, property_type, district
FROM core.listings
WHERE slug IS NULL OR slug = ''
ORDER BY created_at DESC;
```

### 2. Verificar slugs duplicados

```sql
SELECT slug, COUNT(*) as count
FROM core.listings
WHERE slug IS NOT NULL
GROUP BY slug
HAVING COUNT(*) > 1;
```

### 3. Probar endpoint por slug

```bash
# Obtener el slug de una propiedad
curl http://localhost:8000/v1/listings/by-slug/apartment-barranco-3-dorm

# Verificar que retorna la propiedad correcta
```

### 4. Probar desde el frontend

```
http://localhost:3000/propiedad/apartment-barranco-3-dorm
```

---

## ⚙️ Configuración

### Longitud máxima
Por defecto: **100 caracteres**

Modificar en `slug_generator.py`:
```python
def slugify(text: str, max_length: int = 100):
    # Cambiar max_length según necesites
```

### Caracteres permitidos
- ✅ Letras minúsculas (a-z)
- ✅ Números (0-9)
- ✅ Guiones (-)
- ❌ Espacios → se convierten en guiones
- ❌ Acentos → se normalizan (á → a)
- ❌ Caracteres especiales → se eliminan

---

## 🚀 Proceso de Despliegue

### Desarrollo Local

1. Generar slugs para datos existentes:
```bash
cd Backend
python -m app.scripts.generate_slugs
```

2. Verificar en frontend:
```bash
cd Frontend/web
npm run dev
```

3. Probar navegación y SEO

### Producción

1. Hacer backup de la base de datos:
```bash
pg_dump easy_rent > backup_before_slugs.sql
```

2. Ejecutar script SQL:
```bash
psql -U postgres -d easy_rent -f backend_doc/30_generate_slugs.sql
```

3. Verificar que no hay errores:
```sql
-- Ver últimos slugs generados
SELECT id, title, slug FROM core.listings 
ORDER BY updated_at DESC LIMIT 20;

-- Verificar unicidad
SELECT slug, COUNT(*) FROM core.listings 
WHERE slug IS NOT NULL 
GROUP BY slug 
HAVING COUNT(*) > 1;
```

4. Desplegar backend con cambios en `listing_service.py`

5. Desplegar frontend con página `/propiedad/[slug].tsx`

---

## 🐛 Troubleshooting

### Error: "duplicate key value violates unique constraint"

**Causa:** Hay slugs duplicados

**Solución:**
```bash
python -m app.scripts.generate_slugs --force
```

### Error: "module 'app.utils.slug_generator' not found"

**Causa:** No se encuentra el módulo

**Solución:**
```bash
# Asegúrate de estar en el directorio correcto
cd Backend
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
python -m app.scripts.generate_slugs
```

### Los slugs son muy largos

**Solución:** Modificar `max_length` en `slug_generator.py`

---

## ✅ Checklist Final

- [ ] Ejecutar script SQL o Python para generar slugs existentes
- [ ] Verificar que no hay duplicados
- [ ] Probar endpoint `/by-slug/{slug}`
- [ ] Probar página `/propiedad/[slug]` en frontend
- [ ] Verificar meta tags con "Ver código fuente"
- [ ] Testear compartir en redes sociales
- [ ] Verificar que nuevas propiedades generan slug automáticamente

---

**Fecha:** Enero 2024  
**Status:** ✅ Listo para ejecutar
