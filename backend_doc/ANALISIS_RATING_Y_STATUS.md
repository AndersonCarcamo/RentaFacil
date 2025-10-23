# Análisis y Soluciones: Sistema de Rating y Estado de Listings

## 📊 RESUMEN EJECUTIVO

### Problemas Identificados:
1. ✅ **Rating/Reviews**: No existía en la base de datos, ahora agregado
2. ⚠️ **Status del Listing**: El enum correcto ya existe pero el frontend usa valores incorrectos
3. ✅ **Vistas**: Todas las vistas existen y han sido actualizadas

---

## 1. 🌟 SISTEMA DE RATING Y REVIEWS

### Problema Original:
El dashboard mostraba campos `rating` y `totalReviews` que no existían en el modelo de base de datos.

### Solución Implementada:

#### A) Para Base de Datos Nueva (Producción):
**Archivo:** `15_add_rating_reviews_system.sql`

Este archivo debe ser incluido en el orden de ejecución de scripts:
```bash
# Ejecutar DESPUÉS de 03_core_tables.sql y 04_user_interactions.sql
psql -U tu_usuario -d tu_database -f backend_doc/15_add_rating_reviews_system.sql
```

#### B) Para Base de Datos Existente (Desarrollo/Migración):
**Archivo:** `16_update_existing_db_add_rating.sql`

```bash
# Ejecutar en la base de datos actual de desarrollo
psql -U tu_usuario -d tu_database -f backend_doc/16_update_existing_db_add_rating.sql
```

### Estructura Creada:

#### Nuevas columnas en `core.listings`:
```sql
- rating NUMERIC(3,2)        -- Promedio 0.00 a 5.00
- total_reviews INTEGER      -- Contador de reseñas
```

#### Nueva tabla `core.reviews`:
```sql
CREATE TABLE core.reviews (
    id UUID PRIMARY KEY,
    listing_id UUID,
    listing_created_at TIMESTAMPTZ,
    
    -- Revisor
    reviewer_user_id UUID,
    reviewer_name TEXT,
    reviewer_avatar_url TEXT,
    
    -- Calificaciones
    rating NUMERIC(3,2),                    -- Rating general (requerido)
    rating_cleanliness NUMERIC(3,2),       -- Rating limpieza (opcional)
    rating_communication NUMERIC(3,2),      -- Rating comunicación (opcional)
    rating_location NUMERIC(3,2),          -- Rating ubicación (opcional)
    rating_value NUMERIC(3,2),             -- Rating relación calidad-precio (opcional)
    
    -- Contenido
    title TEXT,
    comment TEXT,
    
    -- Respuesta del propietario
    owner_response TEXT,
    owner_response_at TIMESTAMPTZ,
    
    -- Estados
    is_verified BOOLEAN,      -- Si el usuario realmente se hospedó
    is_public BOOLEAN,        -- Si la reseña es visible públicamente
    is_reported BOOLEAN,      -- Si fue reportada
    
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
);
```

### Funcionalidades Automáticas:

1. **Trigger automático**: Cuando se inserta/actualiza/elimina una review, automáticamente se recalcula el `rating` y `total_reviews` del listing.

2. **Vista pública**: `core.v_public_reviews` - Reviews visibles con información del listing y usuario.

3. **Función de estadísticas**: `core.get_listing_review_stats(listing_id)` - Retorna JSON con:
   - Total de reviews
   - Rating promedio
   - Reviews verificadas
   - Distribución por estrellas (5★, 4★, 3★, 2★, 1★)
   - Ratings promedio por categoría

### Ejemplo de Uso:

```sql
-- Insertar una review
INSERT INTO core.reviews (
    listing_id,
    listing_created_at,
    reviewer_user_id,
    reviewer_name,
    rating,
    rating_cleanliness,
    rating_communication,
    rating_location,
    rating_value,
    title,
    comment,
    is_verified
) VALUES (
    'uuid-del-listing',
    '2025-01-15 10:00:00',
    'uuid-del-usuario',
    'Juan Pérez',
    4.5,
    5.0,
    4.5,
    4.0,
    4.5,
    'Excelente departamento',
    'Muy limpio y bien ubicado. El propietario fue muy atento.',
    true
);

-- El trigger automáticamente actualiza listing.rating y listing.total_reviews

-- Obtener estadísticas
SELECT core.get_listing_review_stats('uuid-del-listing');
```

---

## 2. 📝 ESTADO DE LISTINGS (Status)

### Problema:
El frontend estaba usando valores incorrectos para el status.

### Estados Correctos en la Base de Datos:
```sql
CREATE TYPE core.listing_status AS ENUM (
    'draft',                  -- Borrador (no publicado)
    'published',             -- Publicado y visible
    'archived',              -- Archivado (no visible)
    'moderated',             -- En moderación
    'removed',               -- Eliminado
    'pending_verification'   -- Pendiente de verificación
);
```

### ❌ Frontend Incorrecto (ANTES):
```typescript
// Valores que NO existen en la BD
property.status === 'ACTIVE'
property.status === 'INACTIVE'
property.status === 'DRAFT'
```

### ✅ Frontend Correcto (AHORA):
```typescript
// Valores que SÍ existen en la BD
property.status === 'published'   // Activo/Visible
property.status === 'draft'       // Borrador
property.status === 'archived'    // Archivado/Inactivo
```

### Mapeo de Conceptos:
| Frontend (viejo) | Backend (correcto) | Descripción |
|-----------------|-------------------|-------------|
| ACTIVE | published | Propiedad publicada y visible |
| INACTIVE | archived | Propiedad archivada/oculta |
| DRAFT | draft | Borrador, sin publicar |
| - | moderated | En proceso de moderación |
| - | removed | Eliminada del sistema |
| - | pending_verification | Pendiente verificación |

### Correcciones Realizadas en Dashboard:

1. **Estadísticas**:
```typescript
// ANTES
const activeProperties = properties.filter(p => p.status === 'ACTIVE').length;

// AHORA
const activeProperties = properties.filter(p => p.status === 'published').length;
```

2. **Toggle Status**:
```typescript
// ANTES
property.status === 'ACTIVE' ? 'desactivar' : 'activar'

// AHORA
property.status === 'published' ? 'desactivar' : 'activar'
```

3. **API Calls**:
```typescript
// Publicar
if (property.status !== 'published') {
  await publishListing(propertyId);  // Cambia a 'published'
}

// Despublicar
if (property.status === 'published') {
  await unpublishListing(propertyId);  // Cambia a 'draft'
}
```

---

## 3. 👁️ VISTAS DISPONIBLES

### Vistas Confirmadas en la Base de Datos:

#### A) `core.v_listing_owner_current_plan`
**Ubicación:** `08_subscription_plans.sql`
**Propósito:** Combina listings con el plan actual del propietario
```sql
SELECT 
    listing_id,
    listing_created_at,
    owner_user_id,
    plan_id,
    plan_code,
    max_active_listings,
    listing_active_days,
    max_images_per_listing,
    max_videos_per_listing,
    ...
FROM core.v_listing_owner_current_plan;
```

#### B) `core.v_listings_airbnb_analysis`
**Ubicación:** `airbnb_system_optimized.sql` (actualizada en `15_add_rating_reviews_system.sql`)
**Propósito:** Análisis de elegibilidad Airbnb con ratings
```sql
SELECT 
    l.*,
    l.rating,                  -- ✨ NUEVO
    l.total_reviews,           -- ✨ NUEVO
    rental_style,
    can_be_airbnb_quick
FROM core.v_listings_airbnb_analysis;
```

#### C) `core.v_pending_verifications`
**Ubicación:** `06_verification_workflow.sql`
**Propósito:** Listings pendientes de verificación
```sql
SELECT 
    verification_id,
    listing_id,
    title,
    operation,
    property_type,
    district,
    price,
    owner_name,
    owner_email,
    days_pending
FROM core.v_pending_verifications
WHERE status = 'pending';
```

#### D) `core.v_published_listings`
**Ubicación:** `03_core_tables.sql`
**Propósito:** Solo listings publicados y verificados
```sql
SELECT *
FROM core.v_published_listings
WHERE status = 'published'
  AND verification_status = 'verified'
  AND published_at IS NOT NULL;
```

#### E) `core.v_user_current_plan`
**Ubicación:** `08_subscription_plans.sql`
**Propósito:** Plan de suscripción actual del usuario
```sql
SELECT 
    user_id,
    subscription_id,
    plan_id,
    plan_code,
    plan_name,
    tier,
    max_active_listings,
    ...
FROM core.v_user_current_plan
WHERE status IN ('trialing', 'active');
```

#### F) `core.v_public_reviews` ✨ NUEVA
**Ubicación:** `15_add_rating_reviews_system.sql`
**Propósito:** Reviews públicos con información del listing
```sql
SELECT 
    id,
    listing_id,
    rating,
    title,
    comment,
    rating_cleanliness,
    rating_communication,
    rating_location,
    rating_value,
    is_verified,
    reviewer_name,
    created_at,
    listing_title,
    property_type,
    district
FROM core.v_public_reviews;
```

---

## 4. 🔧 ACTUALIZACIÓN DEL MODELO BACKEND

### Archivo a Modificar: `Backend/app/models/listing.py`

Agregar estos campos al modelo `Listing`:

```python
class Listing(Base):
    __tablename__ = "listings"
    __table_args__ = {"schema": "core"}
    
    # ... campos existentes ...
    
    # ✨ NUEVOS CAMPOS DE RATING
    rating = Column(DECIMAL(3, 2), nullable=True)
    total_reviews = Column(Integer, nullable=False, default=0)
    
    # ... resto de campos ...

    @property
    def average_rating(self) -> float:
        """Retorna el rating promedio como float"""
        return float(self.rating) if self.rating else 0.0
    
    @property
    def has_reviews(self) -> bool:
        """Indica si la propiedad tiene reseñas"""
        return self.total_reviews > 0
```

### Crear nuevo modelo para Reviews:

**Archivo nuevo:** `Backend/app/models/review.py`

```python
from sqlalchemy import Column, String, Boolean, DateTime, Text, DECIMAL, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.core.database import Base

class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    listing_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    listing_created_at = Column(DateTime(timezone=True), nullable=False)
    
    # Revisor
    reviewer_user_id = Column(UUID(as_uuid=True), ForeignKey("core.users.id", ondelete="CASCADE"), 
                             nullable=False, index=True)
    reviewer_name = Column(Text, nullable=True)
    reviewer_avatar_url = Column(Text, nullable=True)
    
    # Ratings
    rating = Column(DECIMAL(3, 2), nullable=False)
    rating_cleanliness = Column(DECIMAL(3, 2), nullable=True)
    rating_communication = Column(DECIMAL(3, 2), nullable=True)
    rating_location = Column(DECIMAL(3, 2), nullable=True)
    rating_value = Column(DECIMAL(3, 2), nullable=True)
    
    # Contenido
    title = Column(Text, nullable=True)
    comment = Column(Text, nullable=False)
    
    # Respuesta del propietario
    owner_response = Column(Text, nullable=True)
    owner_response_at = Column(DateTime(timezone=True), nullable=True)
    
    # Estados
    is_verified = Column(Boolean, nullable=False, default=False)
    is_public = Column(Boolean, nullable=False, default=True)
    is_reported = Column(Boolean, nullable=False, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, 
                       server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<Review(id={self.id}, listing_id={self.listing_id}, rating={self.rating})>"
```

---

## 5. 📋 CHECKLIST DE IMPLEMENTACIÓN

### Para Base de Datos:

- [ ] **Nuevo sistema (producción):**
  - [ ] Ejecutar `15_add_rating_reviews_system.sql` en el orden correcto
  - [ ] Verificar que las columnas `rating` y `total_reviews` existen en `core.listings`
  - [ ] Verificar que la tabla `core.reviews` fue creada
  - [ ] Verificar que los triggers están activos
  - [ ] Verificar que las vistas fueron actualizadas

- [ ] **Sistema existente (desarrollo):**
  - [ ] Hacer backup de la base de datos actual
  - [ ] Ejecutar `16_update_existing_db_add_rating.sql`
  - [ ] Revisar los mensajes de verificación al final del script
  - [ ] Probar insertar una review de prueba
  - [ ] Verificar que el trigger actualiza automáticamente el listing

### Para Backend:

- [ ] Actualizar `Backend/app/models/listing.py`:
  - [ ] Agregar campos `rating` y `total_reviews`
  - [ ] Agregar properties `average_rating` y `has_reviews`

- [ ] Crear `Backend/app/models/review.py`:
  - [ ] Crear modelo completo de Review
  - [ ] Registrar en `__init__.py`

- [ ] Actualizar schemas:
  - [ ] Agregar `rating` y `total_reviews` en `ListingResponse`
  - [ ] Crear `ReviewCreate` y `ReviewResponse` schemas

- [ ] Crear endpoints de reviews:
  - [ ] `GET /v1/listings/{id}/reviews` - Listar reviews
  - [ ] `POST /v1/listings/{id}/reviews` - Crear review
  - [ ] `PUT /v1/reviews/{id}` - Editar review
  - [ ] `DELETE /v1/reviews/{id}` - Eliminar review
  - [ ] `POST /v1/reviews/{id}/response` - Responder review (owner)

### Para Frontend:

- [x] Actualizar `dashboard.tsx`:
  - [x] Cambiar `property.status === 'ACTIVE'` → `'published'`
  - [x] Cambiar `property.rentalType` → `property.rental_type`
  - [x] Cambiar `property.price` → `property.price_amount`
  - [x] Cambiar `property.address` → `property.address_line1`
  - [x] Usar `rating` y `total_reviews` de la API

- [ ] Actualizar `Listing` interface en `listings.ts`:
  - [ ] Agregar campos opcionales: `rating?: number` y `total_reviews?: number`

- [ ] Crear componente de Reviews:
  - [ ] `ReviewList` - Listar reviews de una propiedad
  - [ ] `ReviewForm` - Formulario para crear review
  - [ ] `ReviewCard` - Tarjeta individual de review
  - [ ] `RatingStars` - Componente de estrellas de rating

---

## 6. 🎯 RENTAL_TYPE: ACLARACIÓN IMPORTANTE

### En la Base de Datos:
**NO existe** un campo llamado `rental_type` en el enum tradicional.

Lo que existe es:
```sql
-- Campo: rental_term (Término de alquiler)
CREATE TYPE core.rental_term AS ENUM ('daily','weekly','monthly','yearly');

-- Campo: rental_mode (Modalidad de alquiler)
CREATE TYPE core.rental_mode AS ENUM ('full_property','private_room','shared_room');
```

### Interpretación Correcta:

Si en el frontend se usa `rental_type`, probablemente se refiere a:
- **`rental_term`**: El período de alquiler (diario/semanal/mensual/anual)
- O una combinación lógica para determinar si es "tipo Airbnb"

### Para determinar si es Airbnb:
```sql
SELECT *,
    CASE 
        WHEN rental_term IN ('daily', 'weekly') 
             AND furnished = true 
        THEN 'airbnb'
        ELSE 'traditional'
    END as rental_type
FROM core.listings;
```

### Recomendación:
En el backend, crear un campo computed o property:

```python
@property
def rental_type(self) -> str:
    """Determina el tipo de alquiler basado en rental_term"""
    if self.rental_term in ['daily', 'weekly'] and self.furnished:
        return 'airbnb'
    elif self.rental_term == 'monthly':
        return 'monthly'
    elif self.rental_term == 'yearly':
        return 'yearly'
    else:
        return 'traditional'
```

---

## 7. 📊 RESUMEN DE CAMBIOS EN EL FRONTEND

### Campos Actualizados en Dashboard:

| Campo Frontend (viejo) | Campo Backend (correcto) | Tipo |
|----------------------|------------------------|------|
| `property.status === 'ACTIVE'` | `property.status === 'published'` | string |
| `property.rentalType` | `property.rental_term` | enum |
| `property.price` | `property.price_amount` | number |
| `property.address` | `property.address_line1` | string |
| `property.type` | `property.property_type` | enum |
| `property.views` | `property.views_count` | number |
| `property.contacts` | `property.contacts_count` | number |
| `property.createdAt` | `property.created_at` | timestamp |
| `property.rating` | `property.rating` | ✅ Ahora existe |
| `property.totalReviews` | `property.total_reviews` | ✅ Ahora existe |

---

## 8. 🚀 ORDEN DE EJECUCIÓN DE SCRIPTS

Para un nuevo sistema en producción, ejecutar en este orden:

```bash
# 1. Configuración inicial
psql -f 00_database_setup.sql
psql -f 01_extensions_and_schemas.sql
psql -f 02_enums_and_types.sql

# 2. Tablas principales
psql -f 03_core_tables.sql
psql -f 04_user_interactions.sql

# 3. Analytics y verificación
psql -f 05_analytics.sql
psql -f 06_verification_workflow.sql

# 4. Seguridad y suscripciones
psql -f 07_security_audit.sql
psql -f 08_subscription_plans.sql

# 5. Facturación y particiones
psql -f 09_billing_payments.sql
psql -f 10_partition_management.sql

# 6. Reglas de negocio y datos de ejemplo
psql -f 11_business_rules.sql
psql -f 12_sample_data.sql

# 7. Sistema de Airbnb
psql -f airbnb_system_optimized.sql

# 8. ✨ NUEVO: Sistema de Rating y Reviews
psql -f 15_add_rating_reviews_system.sql

# 9. Suscripciones automáticas
psql -f 14_auto_free_subscription.sql
```

---

## 9. 📞 SOPORTE Y CONTACTO

**Desarrollador:** Sistema EasyRent
**Fecha:** Octubre 2025
**Versión:** 1.0.0

### Archivos Creados:
- ✅ `15_add_rating_reviews_system.sql` - Para base de datos nueva
- ✅ `16_update_existing_db_add_rating.sql` - Para base de datos existente
- ✅ `ANALISIS_RATING_Y_STATUS.md` - Este documento

---

## 📝 NOTAS FINALES

1. **Triggers automáticos**: El rating se actualiza automáticamente, NO necesitas calcularlo manualmente.

2. **Unique constraint**: Un usuario solo puede dejar una review por propiedad.

3. **Soft delete**: Las reviews se marcan como `is_public=false` en lugar de eliminarse.

4. **Verificación**: El campo `is_verified` indica si el usuario realmente se hospedó (útil para Airbnb).

5. **Categorías de rating**: Los ratings por categoría (limpieza, comunicación, ubicación, valor) son opcionales pero recomendados para propiedades tipo Airbnb.

6. **Status transitions**: 
   - `draft` → `pending_verification` → `published`
   - `published` → `archived` (cuando se desactiva)
   - `published` → `moderated` (si hay reportes)
   - `moderated` → `removed` (si se confirma violación)
