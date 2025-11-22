# Endpoints Adicionales Requeridos para Panel de Admin

## 📋 Resumen

Los componentes `UsersManager` y `ListingsManager` del panel de administración requieren algunos endpoints adicionales en el backend que actualmente no están implementados.

## 🔴 Endpoints Faltantes

### 1. PATCH `/v1/users/{user_id}` - Actualizar Usuario (Admin)

**Propósito:** Permitir al admin modificar el estado de activación de usuarios

**Request Body:**
```json
{
  "is_active": false
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "is_active": false,
  "updated_at": "2024-11-22T10:30:00Z"
}
```

**Autorización:** Solo admin

**Notas:**
- Actualmente el endpoint de users solo permite que el usuario actualice sus propios datos
- Se necesita un endpoint admin que permita modificar `is_active` y `role`

---

### 2. PATCH `/v1/listings/{listing_id}/featured` - Marcar Destacado

**Propósito:** Permitir al admin marcar/desmarcar propiedades como destacadas

**Request Body:**
```json
{
  "is_featured": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Departamento en Miraflores",
  "is_featured": true,
  "updated_at": "2024-11-22T10:30:00Z"
}
```

**Autorización:** Solo admin

**Notas:**
- Campo `is_featured` debe existir en tabla `public.listings`
- Las propiedades destacadas deberían aparecer primero en los resultados de búsqueda
- Considerar límite de propiedades destacadas simultáneas

---

### 3. PATCH `/v1/listings/{listing_id}/verify` - Verificar Propiedad

**Propósito:** Permitir al admin verificar propiedades como legítimas

**Request Body:**
```json
{
  "is_verified": true,
  "verification_notes": "Documentación revisada y aprobada"
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Departamento en Miraflores",
  "is_verified": true,
  "verified_at": "2024-11-22T10:30:00Z",
  "verified_by": "admin_user_id",
  "updated_at": "2024-11-22T10:30:00Z"
}
```

**Autorización:** Solo admin

**Notas:**
- Campos necesarios en tabla:
  - `is_verified` (boolean)
  - `verified_at` (timestamp)
  - `verified_by` (uuid - FK a users)
  - `verification_notes` (text - opcional)
- Las propiedades verificadas generan más confianza en los usuarios

---

## 🟡 Endpoints que Necesitan Mejoras

### 4. GET `/v1/users` - Listar Usuarios (Existente)

**Estado Actual:** ✅ Implementado

**Mejoras Sugeridas:**
- Agregar campo `last_login` en la respuesta
- Agregar estadísticas de actividad del usuario
- Incluir conteo de propiedades publicadas por usuario

**Response Mejorado:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "full_name": "Juan Pérez",
      "role": "user",
      "is_active": true,
      "created_at": "2024-01-15T10:00:00Z",
      "last_login": "2024-11-20T15:30:00Z",
      "listings_count": 5,
      "active_listings_count": 3
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 20
}
```

---

### 5. GET `/v1/listings/` - Listar Propiedades (Existente)

**Estado Actual:** ✅ Implementado

**Mejoras Sugeridas:**
- Agregar filtro por `status` (draft, published, archived)
- Agregar filtro por `is_verified`
- Agregar filtro por `is_featured`
- Incluir información del propietario en la respuesta
- Agregar conteo de vistas e imágenes

**Query Parameters Adicionales:**
```
?status=published
&is_verified=true
&is_featured=true
```

**Response Mejorado:**
```json
[
  {
    "id": "uuid",
    "title": "Departamento en Miraflores",
    "status": "published",
    "is_verified": true,
    "is_featured": false,
    "views_count": 245,
    "images_count": 8,
    "owner_id": "uuid",
    "owner_email": "owner@example.com",
    "owner_name": "María García",
    "created_at": "2024-10-15T10:00:00Z",
    "published_at": "2024-10-16T12:00:00Z"
  }
]
```

---

## 🗄️ Cambios en Base de Datos Requeridos

### Tabla `public.listings`

```sql
-- Agregar campos de verificación
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Agregar campo destacado
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS featured_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

-- Agregar contador de vistas
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_listings_verified ON public.listings(is_verified, is_active);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON public.listings(is_featured, is_active);
CREATE INDEX IF NOT EXISTS idx_listings_views ON public.listings(views_count DESC);
```

### Tabla `public.users`

```sql
-- Agregar campo de último login
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Actualizar last_login automáticamente (función)
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_login = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar last_login en autenticación
-- (Implementar en el servicio de auth)
```

---

## 🔧 Servicios Backend a Actualizar

### 1. `user_service.py`

```python
class UserService:
    def update_user_admin(
        self,
        db: Session,
        user_id: UUID,
        is_active: Optional[bool] = None,
        role: Optional[UserRole] = None
    ) -> User:
        """Actualizar usuario por admin"""
        user = self.get_user_by_id(db, user_id)
        
        if is_active is not None:
            user.is_active = is_active
        
        if role is not None:
            user.role = role
        
        user.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)
        return user
```

### 2. `listing_service.py`

```python
class ListingService:
    def toggle_featured(
        self,
        db: Session,
        listing_id: UUID,
        is_featured: bool,
        admin_id: UUID
    ) -> Listing:
        """Marcar/desmarcar propiedad como destacada"""
        listing = self.get_listing_by_id(db, listing_id)
        listing.is_featured = is_featured
        
        if is_featured:
            listing.featured_at = datetime.now(timezone.utc)
            # Opcional: establecer duración
            listing.featured_until = datetime.now(timezone.utc) + timedelta(days=30)
        else:
            listing.featured_at = None
            listing.featured_until = None
        
        db.commit()
        db.refresh(listing)
        return listing
    
    def verify_listing(
        self,
        db: Session,
        listing_id: UUID,
        is_verified: bool,
        admin_id: UUID,
        notes: Optional[str] = None
    ) -> Listing:
        """Verificar propiedad"""
        listing = self.get_listing_by_id(db, listing_id)
        listing.is_verified = is_verified
        
        if is_verified:
            listing.verified_at = datetime.now(timezone.utc)
            listing.verified_by = admin_id
            listing.verification_notes = notes
        else:
            listing.verified_at = None
            listing.verified_by = None
            listing.verification_notes = None
        
        db.commit()
        db.refresh(listing)
        return listing
    
    def increment_views(
        self,
        db: Session,
        listing_id: UUID
    ) -> None:
        """Incrementar contador de vistas"""
        listing = self.get_listing_by_id(db, listing_id)
        listing.views_count = (listing.views_count or 0) + 1
        db.commit()
```

---

## 📝 Endpoints a Crear en `listings.py`

```python
@router.patch("/{listing_id}/featured", 
              response_model=ListingResponse,
              summary="Marcar como destacado (admin)")
async def toggle_featured(
    listing_id: UUID,
    is_featured: bool = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Marcar/desmarcar propiedad como destacada (solo admin)"""
    service = ListingService(db)
    return service.toggle_featured(db, listing_id, is_featured, current_user.id)


@router.patch("/{listing_id}/verify",
              response_model=ListingResponse,
              summary="Verificar propiedad (admin)")
async def verify_listing(
    listing_id: UUID,
    is_verified: bool = Body(..., embed=True),
    notes: Optional[str] = Body(None, embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Verificar propiedad como legítima (solo admin)"""
    service = ListingService(db)
    return service.verify_listing(
        db, listing_id, is_verified, current_user.id, notes
    )


@router.post("/{listing_id}/view",
             status_code=status.HTTP_204_NO_CONTENT,
             summary="Registrar vista")
async def record_view(
    listing_id: UUID,
    db: Session = Depends(get_db)
):
    """Incrementar contador de vistas de la propiedad"""
    service = ListingService(db)
    service.increment_views(db, listing_id)
```

---

## 📝 Endpoints a Crear en `users.py`

```python
@router.patch("/users/{user_id}/admin",
              response_model=UserDetailResponse,
              summary="Actualizar usuario (admin)")
async def update_user_admin(
    user_id: UUID,
    is_active: Optional[bool] = Body(None, embed=True),
    role: Optional[UserRole] = Body(None, embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Actualizar estado y rol de usuario (solo admin)"""
    service = UserService(db)
    return service.update_user_admin(db, user_id, is_active, role)
```

---

## 🔒 Dependencia de Autenticación Admin

Crear en `app/api/deps.py`:

```python
async def get_current_admin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Verificar que el usuario actual es admin"""
    if current_user.role != UserRole.admin:
        raise http_403_forbidden("No tienes permisos de administrador")
    return current_user
```

---

## ✅ Lista de Verificación

- [ ] Ejecutar migración SQL para agregar campos en `listings`
- [ ] Ejecutar migración SQL para agregar `last_login` en `users`
- [ ] Actualizar modelo `Listing` en `models/listing.py`
- [ ] Actualizar modelo `User` en `models/auth.py`
- [ ] Crear `get_current_admin_user` en `deps.py`
- [ ] Implementar métodos en `UserService`
- [ ] Implementar métodos en `ListingService`
- [ ] Crear endpoints admin en `users.py`
- [ ] Crear endpoints admin en `listings.py`
- [ ] Actualizar schemas con nuevos campos
- [ ] Probar endpoints con Postman/Thunder Client
- [ ] Actualizar documentación OpenAPI

---

## 🎯 Prioridad de Implementación

### Alta Prioridad (Funcionalidad Básica)
1. ✅ GET `/v1/users` - Ya implementado
2. ✅ GET `/v1/listings/` - Ya implementado
3. 🔴 PATCH `/v1/users/{user_id}` - Suspender/Activar usuarios
4. 🔴 PATCH `/v1/listings/{listing_id}/verify` - Verificar propiedades

### Media Prioridad (Características Adicionales)
5. 🔴 PATCH `/v1/listings/{listing_id}/featured` - Destacar propiedades
6. 🟡 Mejorar respuestas con conteos y estadísticas
7. 🟡 Agregar filtros adicionales

### Baja Prioridad (Optimizaciones)
8. POST `/v1/listings/{listing_id}/view` - Contador de vistas
9. Función automática de `last_login`
10. Índices adicionales de rendimiento

---

**Fecha de Creación:** 2024-11-22
**Estado:** Pendiente de implementación
**Responsable:** Backend Team
