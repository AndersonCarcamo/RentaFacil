# 📍 Sistema de Geocodificación Automática

## 🎯 Objetivo

Obtener automáticamente las coordenadas GPS (latitud y longitud) de las propiedades sin que el usuario tenga que ingresarlas manualmente. Esto permite:

✅ Mostrar propiedades en un mapa interactivo
✅ Búsqueda por proximidad geográfica
✅ Cálculo de distancias a puntos de interés
✅ Mejora de la experiencia de usuario

---

## 🏗️ Arquitectura

### 1. Hook Personalizado: `useGeocoding`

**Ubicación**: `Frontend/web/lib/hooks/useGeocoding.ts`

#### Funcionalidades

```typescript
const { 
  geocodeAddress,        // Convierte dirección → coordenadas
  geocodeByDistrict,     // Fallback: distrito → coordenadas
  getCurrentLocation,    // Obtiene ubicación del navegador
  loading,               // Estado de carga
  error                  // Mensajes de error
} = useGeocoding();
```

#### Proveedor de Geocodificación

**API Usada**: [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/)

**Ventajas**:
- ✅ **Gratuita** - No requiere API key
- ✅ **Sin límites estrictos** - Política de uso razonable
- ✅ **Buena cobertura** - Especialmente en ciudades grandes
- ✅ **Open Source** - Datos de OpenStreetMap

**Desventajas**:
- ⚠️ Requiere User-Agent en headers
- ⚠️ Límite de 1 request por segundo (respetado con debounce)
- ⚠️ Menos precisa en zonas rurales

#### Alternativas (futuro)

Si se requiere mayor precisión o volumen:

1. **Google Maps Geocoding API**
   - Más precisa
   - Requiere API key y facturación
   - $5 por 1000 requests

2. **Mapbox Geocoding API**
   - Moderna y rápida
   - 100,000 requests gratis/mes
   - Requiere API key

3. **HERE Geocoding API**
   - Buena cobertura LATAM
   - 250,000 requests gratis/mes

---

## 🔄 Flujo de Trabajo

### Paso 1: Usuario Completa Dirección

```
Usuario escribe:
├─ Departamento: "Lima"
├─ Provincia: "Lima"
├─ Distrito: "San Isidro"
└─ Dirección: "Av. Conquistadores 456"
```

### Paso 2: Debounce (1 segundo)

Espera 1 segundo después de que el usuario deja de escribir para evitar requests innecesarios.

### Paso 3: Geocodificación

```typescript
geocodeAddress(
  "Av. Conquistadores 456",
  "San Isidro",
  "Lima", 
  "Lima"
)
```

**Query enviado a API**:
```
Av. Conquistadores 456, San Isidro, Lima, Lima, Perú
```

### Paso 4: Respuesta

**Caso exitoso**:
```json
{
  "lat": "-12.0976",
  "lon": "-77.0363",
  "display_name": "Av. Conquistadores, San Isidro, Lima, Perú"
}
```

**Estado mostrado**: `✅ Ubicación encontrada`

### Paso 5: Fallback (si falla)

Si no encuentra la dirección exacta, intenta con solo el distrito:

```typescript
geocodeByDistrict("San Isidro", "Lima", "Lima")
```

**Estado mostrado**: `⚠️ No se pudo obtener ubicación exacta`

### Paso 6: Almacenamiento

```typescript
formData.latitude = -12.0976
formData.longitude = -77.0363
```

---

## 🎨 Interfaz de Usuario

### Indicadores Visuales

#### 🔍 Buscando
```
┌─────────────────────────────────────────────┐
│ 🔍 Obteniendo coordenadas...               │
│ [spinner]                                   │
└─────────────────────────────────────────────┘
Fondo: Azul claro
```

#### ✅ Éxito
```
┌─────────────────────────────────────────────┐
│ ✅ Ubicación encontrada                     │
└─────────────────────────────────────────────┘
Fondo: Verde claro
Auto-desaparece en 3 segundos
```

#### ⚠️ Parcial
```
┌─────────────────────────────────────────────┐
│ ⚠️ No se pudo obtener ubicación exacta     │
└─────────────────────────────────────────────┘
Fondo: Amarillo claro
Auto-desaparece en 3 segundos
```

### Banner Informativo

```
┌─────────────────────────────────────────────────────┐
│ ℹ️ 📍 Ubicación Automática                         │
│                                                     │
│ Al completar la dirección, obtendremos             │
│ automáticamente las coordenadas GPS para mostrar   │
│ tu propiedad en el mapa. No te preocupes, la      │
│ dirección exacta solo se mostrará a usuarios      │
│ interesados.                                       │
│                                                     │
│ ✓ Coordenadas: -12.097600, -77.036300            │
└─────────────────────────────────────────────────────┘
```

---

## 📊 Campos Agregados al FormData

```typescript
interface FormData {
  // ... otros campos ...
  
  // Ubicación
  department: string;
  province: string;
  district: string;
  address: string;
  
  // NUEVOS: Coordenadas GPS
  latitude: number | null;   // -90 a 90
  longitude: number | null;  // -180 a 180
}
```

---

## 🗄️ Almacenamiento en Base de Datos

### Campos en tabla `listings`

```sql
-- Ya existen en la tabla (03_core_tables.sql)
latitude NUMERIC(10, 8),   -- 8 decimales de precisión
longitude NUMERIC(11, 8),  -- 8 decimales de precisión
```

### Precisión de Coordenadas

| Decimales | Precisión | Uso |
|-----------|-----------|-----|
| 0 | ~111 km | País |
| 1 | ~11 km | Ciudad |
| 2 | ~1.1 km | Barrio |
| 3 | ~110 m | Campo de fútbol |
| 4 | ~11 m | Parcela |
| 5 | ~1.1 m | Árbol |
| **6** | **~0.11 m** | **Persona** ⭐ |
| 7 | ~1.1 cm | Alta precisión |
| 8 | ~1.1 mm | Topografía |

**Usamos 8 decimales** para máxima precisión.

---

## 🔒 Privacidad y Seguridad

### ¿Por qué no mostrar al público?

1. **Privacidad del propietario**
   - Evita visitas no deseadas
   - Protege la ubicación exacta

2. **Seguridad**
   - Previene reconocimiento del lugar
   - Reduce riesgo de robos

3. **Control de leads**
   - Solo usuarios interesados ven dirección exacta
   - Mejor calidad de contactos

### ¿Qué se muestra al público?

```
Mostrar:
✅ Distrito (San Isidro)
✅ Referencia general (Cerca al Country Club)
✅ Mapa con área aproximada (círculo de 200m)

NO mostrar:
❌ Dirección exacta
❌ Pin exacto en el mapa
❌ Número de calle/edificio
```

---

## 🛠️ Implementación Técnica

### useEffect con Debounce

```typescript
useEffect(() => {
  const getCoordinates = async () => {
    if (formData.district && formData.province && formData.department) {
      const coordinates = await geocodeAddress(
        formData.address,
        formData.district,
        formData.province,
        formData.department
      );
      
      if (coordinates) {
        setFormData(prev => ({
          ...prev,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        }));
      }
    }
  };

  // Debounce: esperar 1 segundo
  const timeoutId = setTimeout(() => {
    if (formData.district && formData.province && formData.department) {
      getCoordinates();
    }
  }, 1000);

  return () => clearTimeout(timeoutId);
}, [formData.address, formData.district, formData.province, formData.department]);
```

### Request a Nominatim API

```typescript
const response = await fetch(
  `https://nominatim.openstreetmap.org/search?` +
  `q=${encodeURIComponent(fullAddress)}&` +
  `format=json&` +
  `limit=1&` +
  `countrycodes=pe`,
  {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'EasyRent/1.0', // REQUERIDO
    }
  }
);
```

---

## 🧪 Testing

### Casos de Prueba

#### 1. Dirección Completa Válida
```
Input:
  address: "Av. Javier Prado 1500"
  district: "San Isidro"
  province: "Lima"
  department: "Lima"

Expected:
  ✅ Coordenadas obtenidas
  latitude: ~-12.097
  longitude: ~-77.036
```

#### 2. Solo Distrito (sin dirección)
```
Input:
  address: ""
  district: "Miraflores"
  province: "Lima"
  department: "Lima"

Expected:
  ✅ Coordenadas del centro del distrito
  latitude: ~-12.119
  longitude: ~-77.029
```

#### 3. Distrito Desconocido
```
Input:
  address: "Calle Inventada 123"
  district: "DistritoNoExiste"
  province: "Lima"
  department: "Lima"

Expected:
  ⚠️ No se pudo obtener ubicación exacta
  latitude: null
  longitude: null
```

#### 4. Cambio Rápido de Dirección
```
Usuario escribe rápidamente:
  "Av. A" → "Av. Ar" → "Av. Are" → "Av. Arequ"

Expected:
  Solo 1 request después de 1 segundo del último cambio
```

---

## 📈 Mejoras Futuras

### Corto Plazo
1. ⏳ **Mapa interactivo** en el formulario
   - Usuario puede ajustar pin manualmente
   - Vista previa de la ubicación

2. ⏳ **Validación de coordenadas**
   - Verificar que estén dentro de Perú
   - Alertar si están muy lejos del distrito

3. ⏳ **Caché de resultados**
   - Almacenar geocodificaciones comunes
   - Reducir requests a la API

### Mediano Plazo
4. ⏳ **Autocompletado de direcciones**
   - Integrar con Google Places API
   - Sugerencias mientras escribe

5. ⏳ **Reverse Geocoding**
   - Obtener dirección desde coordenadas
   - Útil si usuario marca en mapa

6. ⏳ **Puntos de interés cercanos**
   - "A 500m del Metro"
   - "Cerca de Plaza Vea"

### Largo Plazo
7. ⏳ **Múltiples proveedores de geocoding**
   - Fallback automático si uno falla
   - Google → Mapbox → Nominatim

8. ⏳ **Geocoding inverso inteligente**
   - Detectar tipo de zona (residencial, comercial)
   - Sugerir categorías basadas en ubicación

---

## 🚨 Manejo de Errores

### Error de Red
```typescript
try {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Error al obtener coordenadas');
} catch (err) {
  console.error('❌ Error en geocodificación:', err);
  // Intentar fallback por distrito
  return await geocodeByDistrict(district, province, department);
}
```

### Sin Resultados
```typescript
if (data && data.length > 0) {
  return coordinates;
} else {
  console.warn('⚠️ No se encontró dirección exacta');
  return await geocodeByDistrict(...);
}
```

### Timeout (futuro)
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch(url, { signal: controller.signal });
} catch (err) {
  if (err.name === 'AbortError') {
    console.error('⏱️ Timeout en geocodificación');
  }
} finally {
  clearTimeout(timeoutId);
}
```

---

## 📖 Referencias

- [Nominatim API Docs](https://nominatim.org/release-docs/latest/api/Search/)
- [OpenStreetMap Usage Policy](https://operations.osmfoundation.org/policies/nominatim/)
- [Coordinate Precision Guide](https://en.wikipedia.org/wiki/Decimal_degrees)

---

## ✅ Checklist de Implementación

### Frontend
- [x] Hook `useGeocoding` creado
- [x] Integrado en formulario create-listing
- [x] Debounce de 1 segundo implementado
- [x] Estados visuales (loading, success, error)
- [x] Banner informativo agregado
- [x] Coordenadas agregadas a FormData
- [x] Envío de coordenadas en submit

### Backend (Pendiente)
- [ ] Actualizar modelo Listing
- [ ] Validar formato de coordenadas
- [ ] Verificar que coordenadas estén en Perú
- [ ] Crear índice espacial en PostgreSQL
- [ ] Implementar búsqueda por proximidad
- [ ] API para obtener listings cercanos

### Testing
- [ ] Probar con direcciones reales de Lima
- [ ] Probar con distritos sin dirección
- [ ] Probar con distritos inexistentes
- [ ] Verificar debounce funciona
- [ ] Confirmar privacidad de coordenadas

---

**Documentación creada**: 17 de octubre, 2025
**Estado**: ✅ Implementado en Frontend
**API Externa**: OpenStreetMap Nominatim (gratuita)
