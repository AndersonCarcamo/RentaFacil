# ✅ TODO: Completar Integración del Formulario

## 🎯 Estado Actual

### ✅ Completado
- [x] Script SQL `18_add_listing_airbnb_fields.sql` ejecutado
- [x] Formulario frontend extendido con 6 pasos
- [x] Interface `FormData` actualizada con todos los campos
- [x] UI completa para Airbnb y tradicional
- [x] Lógica condicional implementada
- [x] Selector visual de modelo de alquiler
- [x] Grid de amenidades (20 opciones)
- [x] Políticas con botones visuales
- [x] Sección especial para Airbnb

---

## ⏳ Pendiente - Backend

### 1. Actualizar Modelo de Datos
**Archivo**: `Backend/app/models/listing.py`

```python
# Agregar campos nuevos:
class Listing(Base):
    # ... campos existentes ...
    
    # Campos a agregar:
    rental_model = Column(Enum('traditional', 'airbnb'))
    rental_mode = Column(Enum('full_property', 'private_room', 'shared_room'))
    smoking_allowed = Column(Boolean, nullable=True)
    deposit_required = Column(Boolean, default=False)
    deposit_amount = Column(Numeric(12, 2))
    minimum_stay_nights = Column(Integer, default=1)
    maximum_stay_nights = Column(Integer)
    check_in_time = Column(Time)
    check_out_time = Column(Time)
    max_guests = Column(Integer)
    cleaning_included = Column(Boolean, default=False)
    cleaning_fee = Column(Numeric(12, 2))
    utilities_included = Column(Boolean, default=False)
    internet_included = Column(Boolean, default=False)
    house_rules = Column(Text)
    cancellation_policy = Column(Text, default='flexible')
    available_from = Column(Date)
```

### 2. Actualizar Schema de Creación
**Archivo**: `Backend/app/schemas/listings.py`

```python
class CreateListingRequest(BaseModel):
    # ... campos existentes ...
    
    # Campos a agregar:
    rental_model: Optional[str] = 'traditional'
    rental_mode: Optional[str] = 'full_property'
    pet_friendly: Optional[bool] = None
    smoking_allowed: Optional[bool] = None
    deposit_required: Optional[bool] = False
    deposit_amount: Optional[float] = None
    minimum_stay_nights: Optional[int] = 1
    maximum_stay_nights: Optional[int] = None
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    max_guests: Optional[int] = None
    cleaning_included: Optional[bool] = False
    cleaning_fee: Optional[float] = None
    utilities_included: Optional[bool] = False
    internet_included: Optional[bool] = False
    house_rules: Optional[str] = None
    cancellation_policy: Optional[str] = 'flexible'
    available_from: Optional[date] = None
    
    @validator('rental_model')
    def validate_rental_model(cls, v):
        if v not in ['traditional', 'airbnb']:
            raise ValueError('Invalid rental_model')
        return v
    
    @validator('deposit_amount')
    def validate_deposit(cls, v, values):
        if values.get('deposit_required') and not v:
            raise ValueError('deposit_amount required when deposit_required is True')
        return v
```

### 3. Crear Endpoint de Amenidades
**Archivo**: `Backend/app/api/endpoints/listings.py`

```python
@router.get("/amenities", response_model=List[AmenityResponse])
async def get_amenities(db: Session = Depends(get_db)):
    """Obtener lista de todas las amenidades disponibles"""
    amenities = db.query(Amenity).order_by(Amenity.name).all()
    return amenities

@router.post("/listings/{listing_id}/amenities")
async def add_amenities_to_listing(
    listing_id: UUID,
    amenity_ids: List[int],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Asociar amenidades a una propiedad"""
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    if listing.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Limpiar amenidades existentes
    db.query(ListingAmenity).filter(
        ListingAmenity.listing_id == listing_id
    ).delete()
    
    # Agregar nuevas amenidades
    for amenity_id in amenity_ids:
        db.add(ListingAmenity(
            listing_id=listing_id,
            amenity_id=amenity_id
        ))
    
    db.commit()
    return {"message": "Amenities updated successfully"}
```

### 4. Agregar Validaciones
**Archivo**: `Backend/app/services/listing_service.py`

```python
def validate_airbnb_listing(data: CreateListingRequest):
    """Validar campos requeridos para listings tipo Airbnb"""
    if data.rental_model == 'airbnb':
        if not data.check_in_time:
            raise ValueError("check_in_time is required for Airbnb listings")
        if not data.check_out_time:
            raise ValueError("check_out_time is required for Airbnb listings")
        if not data.minimum_stay_nights:
            raise ValueError("minimum_stay_nights is required for Airbnb listings")
        if not data.cancellation_policy:
            raise ValueError("cancellation_policy is required for Airbnb listings")
```

---

## ⏳ Pendiente - Frontend

### 1. Actualizar API Client
**Archivo**: `Frontend/web/lib/api/listings.ts`

```typescript
// Agregar endpoint de amenidades
export async function getAmenities(): Promise<Amenity[]> {
  const response = await apiClient.get<Amenity[]>('/v1/amenities');
  return response.data;
}

export async function addListingAmenities(
  listingId: string,
  amenityIds: number[]
): Promise<void> {
  await apiClient.post(`/v1/listings/${listingId}/amenities`, {
    amenity_ids: amenityIds
  });
}

// Actualizar CreateListingRequest
export interface CreateListingRequest {
  // ... campos existentes ...
  
  // Nuevos campos:
  rental_model?: string;
  rental_mode?: string;
  pet_friendly?: boolean | null;
  smoking_allowed?: boolean | null;
  deposit_required?: boolean;
  deposit_amount?: number;
  minimum_stay_nights?: number;
  maximum_stay_nights?: number;
  check_in_time?: string;
  check_out_time?: string;
  max_guests?: number;
  cleaning_included?: boolean;
  cleaning_fee?: number;
  utilities_included?: boolean;
  internet_included?: boolean;
  house_rules?: string;
  cancellation_policy?: string;
  available_from?: string;
}
```

### 2. Actualizar Submit Handler
**Archivo**: `Frontend/web/pages/dashboard/create-listing.tsx`

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setSubmitting(true);

  try {
    // Convertir pet_friendly y smoking_allowed
    const pet_friendly_value = 
      formData.pet_friendly === 'yes' ? true :
      formData.pet_friendly === 'no' ? false : null;
    
    const smoking_allowed_value = 
      formData.smoking_allowed === 'yes' ? true :
      formData.smoking_allowed === 'no' ? false : null;
    
    // Preparar datos
    const listingData: CreateListingRequest = {
      // Campos básicos
      title: formData.title,
      description: formData.description,
      property_type: formData.property_type,
      rental_type: formData.operation,
      
      // Ubicación
      address_line1: formData.address || `${formData.district}, ${formData.province}`,
      city: formData.department,
      state_province: formData.province,
      country: 'PE',
      
      // Precio y depósito
      price_amount: parseFloat(formData.price),
      price_currency: formData.currency,
      deposit_required: formData.deposit_required,
      deposit_amount: formData.deposit_required ? parseFloat(formData.deposit_amount) : undefined,
      
      // Detalles
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
      bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
      parking_spots: formData.parking_spots ? parseInt(formData.parking_spots) : undefined,
      area_size: formData.area_built ? parseFloat(formData.area_built) : undefined,
      area_unit: 'm²',
      
      // Alquiler
      rental_term: (formData.operation === 'rent' || formData.operation === 'temp_rent') 
        ? formData.rental_term : undefined,
      rental_model: formData.rental_model,
      rental_mode: formData.rental_mode,
      furnished: formData.furnished,
      
      // Políticas
      pet_friendly: pet_friendly_value,
      smoking_allowed: smoking_allowed_value,
      house_rules: formData.house_rules,
      
      // Servicios
      utilities_included: formData.utilities_included,
      internet_included: formData.internet_included,
      
      // Disponibilidad
      available_from: formData.available_from || undefined,
      
      // Airbnb específicos
      ...(formData.rental_model === 'airbnb' && {
        max_guests: formData.max_guests ? parseInt(formData.max_guests) : undefined,
        minimum_stay_nights: parseInt(formData.minimum_stay_nights),
        maximum_stay_nights: formData.maximum_stay_nights 
          ? parseInt(formData.maximum_stay_nights) : undefined,
        check_in_time: formData.check_in_time,
        check_out_time: formData.check_out_time,
        cleaning_included: formData.cleaning_included,
        cleaning_fee: !formData.cleaning_included && formData.cleaning_fee 
          ? parseFloat(formData.cleaning_fee) : undefined,
        cancellation_policy: formData.cancellation_policy,
      }),
      
      status: 'draft',
    };

    // Crear la propiedad
    const newListing = await createListing(listingData);
    
    // Si hay amenidades seleccionadas, agregarlas
    if (formData.selectedAmenities.length > 0) {
      await addListingAmenities(newListing.id, formData.selectedAmenities);
    }
    
    // Redirigir con éxito
    router.push('/dashboard?success=listing_created');
  } catch (err: any) {
    console.error('Error creating listing:', err);
    setError(err.response?.data?.detail || 'Error al crear la propiedad');
  } finally {
    setSubmitting(false);
  }
};
```

### 3. Cargar Amenidades Dinámicamente
**Archivo**: `Frontend/web/pages/dashboard/create-listing.tsx`

```typescript
const [amenities, setAmenities] = useState<Amenity[]>([]);

useEffect(() => {
  // Cargar amenidades del backend
  const loadAmenities = async () => {
    try {
      const data = await getAmenities();
      setAmenities(data);
    } catch (err) {
      console.error('Error loading amenities:', err);
      // Usar amenidades mock como fallback
      setAmenities(AMENITIES);
    }
  };
  
  loadAmenities();
}, []);
```

### 4. Agregar Validaciones Client-Side

```typescript
const validateStep = (step: number): boolean => {
  switch (step) {
    case 1:
      return !!(formData.title && formData.operation && formData.property_type);
    case 2:
      return !!(formData.department && formData.province && formData.district);
    case 3:
      if (!formData.price) return false;
      if (formData.deposit_required && !formData.deposit_amount) return false;
      if (formData.rental_model === 'airbnb') {
        return !!(
          formData.minimum_stay_nights &&
          formData.check_in_time &&
          formData.check_out_time
        );
      }
      return true;
    case 6:
      return !!(formData.contact_name && formData.contact_phone);
    default:
      return true;
  }
};

// Usar en el botón "Siguiente"
<Button
  type="button"
  onClick={() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    } else {
      setError('Por favor completa todos los campos requeridos');
    }
  }}
  variant="primary"
  disabled={!validateStep(currentStep)}
>
  Siguiente
</Button>
```

---

## 🧪 Testing Checklist

### Pruebas Backend
- [ ] Ejecutar migraciones
- [ ] Verificar columnas agregadas en DB
- [ ] Probar endpoint de amenidades
- [ ] Probar creación con todos los campos
- [ ] Validar campos requeridos Airbnb
- [ ] Verificar advertiser_type se auto-asigna

### Pruebas Frontend
- [ ] Navegar por todos los pasos
- [ ] Seleccionar modelo Tradicional
- [ ] Seleccionar modelo Airbnb
- [ ] Verificar campos condicionales
- [ ] Seleccionar amenidades
- [ ] Completar formulario completo
- [ ] Enviar y verificar creación
- [ ] Verificar en dashboard

### Casos de Prueba
1. **Alquiler Tradicional Mínimo**
   - Solo campos requeridos básicos
   
2. **Alquiler Tradicional Completo**
   - Todos los campos + amenidades
   
3. **Airbnb Mínimo**
   - Campos básicos + campos Airbnb requeridos
   
4. **Airbnb Completo**
   - Todos los campos + todas las amenidades

---

## 📋 Comandos Útiles

### Backend
```bash
# Instalar dependencias
cd Backend
pip install -r requirements.txt

# Ejecutar migraciones (si usas Alembic)
alembic upgrade head

# Iniciar servidor
uvicorn app.main:app --reload
```

### Frontend
```bash
# Instalar dependencias
cd Frontend/web
npm install

# Iniciar en desarrollo
npm run dev

# Build para producción
npm run build
```

---

## 🎯 Prioridad de Tareas

### Alta Prioridad (Hacer Ahora)
1. ✅ Actualizar modelo Listing en backend
2. ✅ Actualizar schema CreateListingRequest
3. ✅ Implementar handleSubmit completo
4. ✅ Agregar conversión de pet_friendly/smoking_allowed
5. ✅ Probar creación end-to-end

### Media Prioridad (Esta Semana)
6. ⏳ Crear endpoint de amenidades
7. ⏳ Implementar asociación de amenidades
8. ⏳ Cargar amenidades dinámicamente
9. ⏳ Agregar validaciones client-side
10. ⏳ Mejorar manejo de errores

### Baja Prioridad (Futuro)
11. ⏳ Agregar guardado automático (draft)
12. ⏳ Implementar preview de propiedad
13. ⏳ Agregar subida de imágenes
14. ⏳ Implementar progreso en tiempo real
15. ⏳ Agregar tooltips explicativos

---

## 📚 Documentación Relacionada

- ✅ `LISTING_FIELDS_REFERENCE.md` - Referencia completa de campos
- ✅ `FORMULARIO_MEJORAS.md` - Resumen de mejoras implementadas
- ✅ `18_add_listing_airbnb_fields.sql` - Script SQL ejecutado
- ✅ `17_auto_advertiser_type.sql` - Script de advertiser_type
- ✅ `CHANGELOG_ADVERTISER_TYPE.md` - Log de cambios

---

## 🚀 Resultado Esperado

Al completar todos los pendientes:

✅ Usuario puede crear propiedades tradicionales completas
✅ Usuario puede crear propiedades tipo Airbnb completas
✅ Todas las validaciones funcionan correctamente
✅ Amenidades se guardan correctamente
✅ Advertiser_type se determina automáticamente
✅ Datos se persisten correctamente en BD
✅ UI es intuitiva y profesional
✅ Experiencia de usuario fluida

**Estado: 70% Completado** 🎯
**Falta: Backend + Integración completa** ⏳
