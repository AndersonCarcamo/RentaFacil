# Página de Crear Propiedad

## 📝 Descripción

Nueva página para crear propiedades en el dashboard con un flujo paso a paso (wizard).

## 🚀 Características

### Flujo Multi-paso (4 pasos)

1. **Información Básica**
   - Título de la propiedad
   - Descripción
   - Tipo de operación (Alquiler, Venta, Alquiler Temporal)
   - Tipo de propiedad (Departamento, Casa, Studio, etc.)
   - Tipo de anunciante
   - Periodo de alquiler (si aplica)
   - Amoblado (checkbox)

2. **Ubicación**
   - Departamento
   - Provincia
   - Distrito
   - Dirección (opcional)

3. **Detalles y Precio**
   - Precio
   - Área construida
   - Dormitorios
   - Baños
   - Estacionamientos

4. **Contacto**
   - Nombre de contacto
   - Teléfono de contacto
   - Resumen de la publicación

### Indicadores Visuales

- ✅ Barra de progreso con íconos
- ✅ Validación de campos requeridos
- ✅ Loading state al enviar
- ✅ Mensaje de error si falla
- ✅ Resumen antes de publicar

## 📋 Integración

### En Dashboard

El botón "Nueva Propiedad" ahora redirige a `/dashboard/create-listing`

```typescript
<Button
  onClick={() => router.push('/dashboard/create-listing')}
  variant="primary"
>
  <PlusIcon className="w-4 h-4" />
  Nueva Propiedad
</Button>
```

### Mensaje de Éxito

Cuando se crea exitosamente, redirige al dashboard con un mensaje de éxito:

```typescript
router.push('/dashboard?success=listing_created');
```

El dashboard muestra un banner verde de confirmación que se oculta después de 5 segundos.

## 🔧 API Integración

Usa el endpoint `createListing` de `lib/api/listings.ts`:

```typescript
await createListing({
  title: string,
  description: string,
  operation: 'rent' | 'sale' | 'temp_rent',
  property_type: 'apartment' | 'house' | ...,
  // ... más campos
});
```

## 🎨 UX/UI

### Validaciones

- Campos marcados con `*` son requeridos
- El botón "Siguiente" está siempre habilitado (validación HTML5)
- El botón "Publicar" se deshabilita durante el envío
- Mensajes de error claros si falla

### Responsive

- Mobile-first design
- Grid adaptativo
- Botones táctiles grandes

### Accesibilidad

- Labels asociados a inputs
- Placeholders descriptivos
- Focus states claros
- Colores con buen contraste

## 📱 Estados

### Loading States

```typescript
const [submitting, setSubmitting] = useState(false);
```

Muestra spinner y texto "Publicando..." en el botón.

### Error States

```typescript
const [error, setError] = useState<string | null>(null);
```

Muestra banner rojo con el mensaje de error.

### Success State

Redirige al dashboard con query param `?success=listing_created`

## 🔐 Protección

La página verifica autenticación:

```typescript
React.useEffect(() => {
  if (!loading && !user) {
    router.push('/login');
  }
}, [user, loading, router]);
```

## 🎯 Próximas Mejoras

### Fase 1 (Actual) ✅
- [x] Formulario multi-paso
- [x] Validación básica
- [x] Integración con API
- [x] Mensaje de éxito

### Fase 2 (Pendiente)
- [ ] Upload de imágenes
- [ ] Upload de videos
- [ ] Geocodificación de dirección
- [ ] Mapa interactivo
- [ ] Amenidades/Servicios
- [ ] Vista previa antes de publicar
- [ ] Guardar como borrador
- [ ] Validación de límites del plan

### Fase 3 (Futuro)
- [ ] Editor de descripción rico (markdown/WYSIWYG)
- [ ] Sugerencias de precio basadas en ubicación
- [ ] Detección automática de Airbnb eligibility
- [ ] Plantillas de descripción
- [ ] Autocompletar dirección
- [ ] SEO: meta title/description

## 📊 Estructura de Datos

```typescript
interface FormData {
  title: string;
  description: string;
  operation: string;
  property_type: string;
  advertiser_type: string;
  
  // Ubicación
  department: string;
  province: string;
  district: string;
  address: string;
  
  // Precio
  price: string;
  currency: string;
  
  // Detalles
  area_built: string;
  bedrooms: string;
  bathrooms: string;
  parking_spots: string;
  
  // Alquiler
  rental_term: string;
  furnished: boolean;
  
  // Contacto
  contact_name: string;
  contact_phone: string;
}
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Crear propiedad con campos mínimos
- [ ] Crear propiedad con todos los campos
- [ ] Navegar entre pasos (Siguiente/Anterior)
- [ ] Validar campos requeridos
- [ ] Probar con tipo de operación: Alquiler
- [ ] Probar con tipo de operación: Venta
- [ ] Verificar mensaje de éxito en dashboard
- [ ] Probar sin autenticación (debe redirigir a login)
- [ ] Probar con error de API
- [ ] Responsive en mobile
- [ ] Responsive en tablet

## 🐛 Problemas Conocidos

Ninguno por ahora.

## 📞 Soporte

Para dudas o problemas, revisar:
- `lib/api/listings.ts` - Funciones de API
- `Backend/app/schemas/listings.py` - Esquema de datos esperado
- `Backend/app/endpoints/listings.py` - Endpoint de backend
