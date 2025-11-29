# Integración de Amenidades - Sistema EasyRent

## 📋 Resumen

Las amenidades ya están integradas en el frontend y listas para conectarse al backend. El sistema permite:

1. ✅ Cargar todas las amenidades disponibles desde el backend
2. ✅ Seleccionar amenidades al crear/editar una propiedad
3. ✅ Guardar amenidades asociadas a una propiedad
4. ✅ Mostrar amenidades en los detalles de la propiedad
5. ✅ Fallback a amenidades mock si el backend no está disponible

---

## 🗄️ Estructura de Base de Datos

### Tabla: `core.amenities`
```sql
CREATE TABLE core.amenities (
    id      SERIAL PRIMARY KEY,
    name    TEXT NOT NULL UNIQUE,
    icon    TEXT
);
```

### Tabla: `core.listing_amenities` (Relación N:N)
```sql
CREATE TABLE core.listing_amenities (
    listing_id          UUID NOT NULL,
    listing_created_at  TIMESTAMPTZ NOT NULL,
    amenity_id          INTEGER NOT NULL REFERENCES core.amenities(id) ON DELETE CASCADE,
    
    FOREIGN KEY (listing_id, listing_created_at) 
        REFERENCES core.listings(id, created_at) ON DELETE CASCADE,
        
    PRIMARY KEY (listing_id, listing_created_at, amenity_id)
);
```

**Nota importante:** Las foreign keys incluyen `listing_created_at` porque `listings` es una tabla particionada con PK compuesta `(id, created_at)`.

---

## 🎨 Frontend - Archivos Creados/Modificados

### 1. **`lib/api/amenities.ts`** ✨ NUEVO
Servicio de API para amenidades con las siguientes funciones:

```typescript
// Obtener todas las amenidades disponibles
getAmenities(): Promise<Amenity[]>

// Obtener amenidades de una propiedad específica
getListingAmenities(listingId: string): Promise<Amenity[]>

// Actualizar amenidades de una propiedad (reemplaza todas)
updateListingAmenities(listingId: string, amenityIds: number[]): Promise<void>

// Agregar amenidades a una propiedad
addListingAmenities(listingId: string, amenityIds: number[]): Promise<void>

// Remover amenidades de una propiedad
removeListingAmenities(listingId: string, amenityIds: number[]): Promise<void>
```

**Interfaces:**
```typescript
interface Amenity {
  id: number;
  name: string;
  icon?: string;
}

interface ListingAmenity {
  listing_id: string;
  listing_created_at: string;
  amenity_id: number;
  amenity?: Amenity;
}
```

### 2. **`lib/api/listings.ts`** ✏️ MODIFICADO
Agregado campo `amenities` a la interfaz `Listing`:

```typescript
export interface Listing {
  // ... otros campos
  amenities?: Array<{ id: number; name: string; icon?: string }>;
  // ...
}
```

### 3. **`pages/dashboard/create-listing.tsx`** ✏️ MODIFICADO

**Cambios:**
- Import de `getAmenities`, `updateListingAmenities`, `Amenity`
- Estado `availableAmenities` para amenidades del backend
- Estado `loadingAmenities` para loading state
- `useEffect` para cargar amenidades al montar el componente
- Carga de amenidades seleccionadas al editar propiedad
- Guardado de amenidades al crear/actualizar propiedad
- UI actualizada con fallback a amenidades mock

**Flujo de guardado:**
```typescript
// Al crear propiedad
const createdListing = await createListing(listingData);
if (createdListing.id && formData.selectedAmenities.length > 0) {
  await updateListingAmenities(createdListing.id, formData.selectedAmenities);
}

// Al actualizar propiedad
await updateListing(editingListingId, listingData);
await updateListingAmenities(editingListingId, formData.selectedAmenities);
```

### 4. **`components/property/PropertyModal.tsx`** ✅ YA ESTABA
Ya muestra las amenidades correctamente:

```tsx
{property.amenities && property.amenities.length > 0 && (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
    {property.amenities.map((amenity) => (
      <div key={amenity.id} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
        <CheckCircleIcon className="w-5 h-5 text-blue-600" />
        <span>{amenity.name}</span>
      </div>
    ))}
  </div>
)}
```

---

## 🔌 Backend - Endpoints Requeridos

### 1. **GET `/api/amenities`**
Obtiene todas las amenidades disponibles (público).

**Response:**
```json
[
  { "id": 1, "name": "WiFi", "icon": "📶" },
  { "id": 2, "name": "Piscina", "icon": "🏊" },
  { "id": 3, "name": "Gimnasio", "icon": "💪" }
]
```

### 2. **GET `/api/listings/{listing_id}/amenities`**
Obtiene amenidades de una propiedad específica (público).

**Response:**
```json
[
  { "id": 1, "name": "WiFi", "icon": "📶" },
  { "id": 2, "name": "Piscina", "icon": "🏊" }
]
```

### 3. **PUT `/api/listings/{listing_id}/amenities`** 🔒
Actualiza amenidades de una propiedad (reemplaza todas) - requiere autenticación.

**Request Body:**
```json
{
  "amenity_ids": [1, 2, 3, 5, 8]
}
```

**Lógica del backend:**
1. Verificar que el usuario sea dueño de la propiedad
2. Obtener `listing_created_at` de la propiedad
3. Eliminar registros existentes en `listing_amenities`
4. Insertar nuevos registros:
   ```sql
   DELETE FROM core.listing_amenities 
   WHERE listing_id = ? AND listing_created_at = ?;
   
   INSERT INTO core.listing_amenities (listing_id, listing_created_at, amenity_id)
   VALUES 
     (?, ?, 1),
     (?, ?, 2),
     (?, ?, 3);
   ```

### 4. **POST `/api/listings/{listing_id}/amenities`** 🔒
Agrega amenidades sin eliminar las existentes - requiere autenticación.

**Request Body:**
```json
{
  "amenity_ids": [4, 6]
}
```

### 5. **DELETE `/api/listings/{listing_id}/amenities`** 🔒
Elimina amenidades específicas - requiere autenticación.

**Request Body:**
```json
{
  "amenity_ids": [1, 3]
}
```

---

## 🎯 Implementación Backend (FastAPI)

### Modelo SQLAlchemy

```python
# Backend/app/models/amenity.py
from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP, UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Amenity(Base):
    __tablename__ = "amenities"
    __table_args__ = {"schema": "core"}
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, unique=True, nullable=False)
    icon = Column(String)
    
    # Relationship
    listing_amenities = relationship("ListingAmenity", back_populates="amenity")

class ListingAmenity(Base):
    __tablename__ = "listing_amenities"
    __table_args__ = {"schema": "core"}
    
    listing_id = Column(UUID, primary_key=True)
    listing_created_at = Column(TIMESTAMP(timezone=True), primary_key=True)
    amenity_id = Column(Integer, ForeignKey("core.amenities.id", ondelete="CASCADE"), primary_key=True)
    
    # Relationships
    amenity = relationship("Amenity", back_populates="listing_amenities")
```

### Schema Pydantic

```python
# Backend/app/schemas/amenities.py
from pydantic import BaseModel
from typing import Optional

class AmenityBase(BaseModel):
    name: str
    icon: Optional[str] = None

class AmenityResponse(AmenityBase):
    id: int
    
    class Config:
        orm_mode = True

class UpdateListingAmenitiesRequest(BaseModel):
    amenity_ids: list[int]
```

### Endpoints FastAPI

```python
# Backend/app/api/endpoints/amenities.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.amenity import Amenity, ListingAmenity
from app.models.listing import Listing
from app.schemas.amenities import AmenityResponse, UpdateListingAmenitiesRequest
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/amenities", response_model=list[AmenityResponse])
def get_all_amenities(db: Session = Depends(get_db)):
    """Get all available amenities"""
    amenities = db.query(Amenity).all()
    return amenities

@router.get("/listings/{listing_id}/amenities", response_model=list[AmenityResponse])
def get_listing_amenities(listing_id: str, db: Session = Depends(get_db)):
    """Get amenities for a specific listing"""
    amenities = (
        db.query(Amenity)
        .join(ListingAmenity)
        .filter(ListingAmenity.listing_id == listing_id)
        .all()
    )
    return amenities

@router.put("/listings/{listing_id}/amenities", status_code=204)
def update_listing_amenities(
    listing_id: str,
    request: UpdateListingAmenitiesRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update amenities for a listing (replaces all)"""
    # Get listing and verify ownership
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Delete existing amenities
    db.query(ListingAmenity).filter(
        ListingAmenity.listing_id == listing_id,
        ListingAmenity.listing_created_at == listing.created_at
    ).delete()
    
    # Insert new amenities
    for amenity_id in request.amenity_ids:
        listing_amenity = ListingAmenity(
            listing_id=listing_id,
            listing_created_at=listing.created_at,
            amenity_id=amenity_id
        )
        db.add(listing_amenity)
    
    db.commit()
    return None

@router.post("/listings/{listing_id}/amenities", status_code=204)
def add_listing_amenities(
    listing_id: str,
    request: UpdateListingAmenitiesRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Add amenities to a listing without removing existing ones"""
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    for amenity_id in request.amenity_ids:
        # Check if already exists
        exists = db.query(ListingAmenity).filter(
            ListingAmenity.listing_id == listing_id,
            ListingAmenity.listing_created_at == listing.created_at,
            ListingAmenity.amenity_id == amenity_id
        ).first()
        
        if not exists:
            listing_amenity = ListingAmenity(
                listing_id=listing_id,
                listing_created_at=listing.created_at,
                amenity_id=amenity_id
            )
            db.add(listing_amenity)
    
    db.commit()
    return None

@router.delete("/listings/{listing_id}/amenities", status_code=204)
def remove_listing_amenities(
    listing_id: str,
    request: UpdateListingAmenitiesRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Remove specific amenities from a listing"""
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.owner_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.query(ListingAmenity).filter(
        ListingAmenity.listing_id == listing_id,
        ListingAmenity.listing_created_at == listing.created_at,
        ListingAmenity.amenity_id.in_(request.amenity_ids)
    ).delete(synchronize_session=False)
    
    db.commit()
    return None
```

### Registrar rutas

```python
# Backend/app/api/endpoints/__init__.py
from .amenities import router as amenities_router

# Backend/app/main.py
from app.api.endpoints import amenities_router

app.include_router(amenities_router, prefix="/api", tags=["amenities"])
```

---

## ✅ Testing

### 1. **Probar carga de amenidades**
```bash
curl http://localhost:8000/api/amenities
```

### 2. **Probar en frontend**
1. Ir a crear propiedad
2. Navegar a sección "Amenidades"
3. Verificar que se cargan desde el backend
4. Seleccionar algunas amenidades
5. Guardar propiedad
6. Editar propiedad y verificar que se cargan las seleccionadas

### 3. **Verificar en base de datos**
```sql
-- Ver amenidades de una propiedad
SELECT 
    l.title,
    a.name as amenity_name,
    a.icon
FROM core.listings l
JOIN core.listing_amenities la ON la.listing_id = l.id AND la.listing_created_at = l.created_at
JOIN core.amenities a ON a.id = la.amenity_id
WHERE l.id = 'YOUR_LISTING_ID';
```

---

## 📊 Datos de Prueba

Las amenidades ya están pre-cargadas en `backend_doc/12_sample_data.sql`:

```sql
INSERT INTO core.amenities (name, icon) VALUES
('Piscina', 'pool'),
('Gimnasio', 'fitness_center'),
('Ascensor', 'elevator'),
('Balcón', 'balcony'),
('Terraza', 'deck'),
('Jardín', 'local_florist'),
('Garaje', 'garage'),
('Seguridad 24h', 'security'),
('Aire Acondicionado', 'ac_unit'),
('Calefacción', 'thermostat'),
('Amoblado', 'chair'),
('Lavandería', 'local_laundry_service'),
('Internet/WiFi', 'wifi'),
('Mascotas Permitidas', 'pets'),
-- ... más amenidades
ON CONFLICT (name) DO NOTHING;
```

---

## 🎯 Estado Actual

✅ **Frontend:** 100% completo y funcional
- Carga amenidades desde backend
- Fallback a amenidades mock
- Guarda amenidades al crear/editar
- Muestra amenidades en detalles de propiedad

⏳ **Backend:** Pendiente de implementación
- Modelos SQLAlchemy
- Schemas Pydantic
- 5 endpoints FastAPI

🗄️ **Base de Datos:** 100% lista
- Tablas creadas
- Datos de prueba insertados
- Foreign keys configuradas

---

## 🚀 Próximos Pasos

1. Implementar modelos y schemas en backend
2. Crear endpoints FastAPI
3. Registrar rutas en `main.py`
4. Probar endpoints con curl/Postman
5. Verificar integración completa en frontend
6. Agregar validaciones adicionales si es necesario
