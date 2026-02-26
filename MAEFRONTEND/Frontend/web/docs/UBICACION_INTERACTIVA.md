# 🗺️ Sistema de Ubicación Interactiva - Mejoras

## 📋 Resumen de Mejoras

Se ha mejorado significativamente el sistema de ubicación del formulario de creación de propiedades con las siguientes características:

### ✅ Características Implementadas

1. **Mapa Interactivo con Leaflet**
   - Usuario puede hacer clic en el mapa para establecer ubicación
   - Marcador arrastrable para ajuste fino
   - Vista previa de la ubicación en tiempo real
   - Zoom y navegación completa del mapa

2. **Autocompletado Inteligente**
   - Provincias con autocompletado
   - Distritos con autocompletado
   - Filtrado en tiempo real mientras el usuario escribe
   - Cierre automático al seleccionar o hacer clic fuera

3. **Departamentos Limitados**
   - Solo Lima y Callao disponibles
   - Selector dropdown simple
   - Datos completos de todas las provincias y 180+ distritos

4. **Sincronización Bidireccional**
   - Selección de distrito → actualiza coordenadas → muestra en mapa
   - Click en mapa → actualiza coordenadas → geocoding inverso (futuro)
   - Geocoding automático → actualiza coordenadas → muestra en mapa

---

## 🏗️ Arquitectura

### Componentes Creados

#### 1. `MapPicker.tsx`
**Ubicación**: `Frontend/web/components/MapPicker.tsx`

**Responsabilidad**: Componente de mapa interactivo con Leaflet

**Props**:
```typescript
interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (latitude: number, longitude: number) => void;
  className?: string;
  height?: string;
}
```

**Características**:
- ✅ Mapa interactivo con tiles de OpenStreetMap
- ✅ Marcador arrastrable (drag & drop)
- ✅ Click en mapa para establecer ubicación
- ✅ Zoom y pan (navegación)
- ✅ Centrado automático al cambiar coordenadas
- ✅ Icono personalizado de Leaflet
- ✅ Import dinámico (sin SSR) para Next.js

**Uso**:
```tsx
<MapPicker
  latitude={formData.latitude}
  longitude={formData.longitude}
  onLocationChange={(lat, lng) => {
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
  }}
  height="400px"
/>
```

#### 2. `AutocompleteInput.tsx`
**Ubicación**: `Frontend/web/components/AutocompleteInput.tsx`

**Responsabilidad**: Input con autocompletado y filtrado en tiempo real

**Props**:
```typescript
interface AutocompleteInputProps {
  label: string;
  value: string;
  options: AutocompleteOption[];
  onChange: (value: string, coordinates?: { latitude, longitude }) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

interface AutocompleteOption {
  value: string;
  label: string;
  coordinates?: { latitude: number; longitude: number };
}
```

**Características**:
- ✅ Filtrado en tiempo real (case-insensitive)
- ✅ Dropdown con scroll si hay muchas opciones
- ✅ Cierre automático al seleccionar o click fuera
- ✅ Teclado: Tab, Enter, Escape
- ✅ Coordenadas opcionales en cada opción
- ✅ Estado disabled cuando no hay opciones

**Uso**:
```tsx
<AutocompleteInput
  label="Distrito"
  value={formData.district}
  options={districts.map(d => ({
    value: d.name,
    label: d.name,
    coordinates: d.coordinates,
  }))}
  onChange={(value, coords) => {
    setFormData(prev => ({ 
      ...prev, 
      district: value,
      ...(coords && { latitude: coords.latitude, longitude: coords.longitude })
    }));
  }}
  placeholder="Escribe o selecciona..."
  required
/>
```

#### 3. `peru-locations.ts`
**Ubicación**: `Frontend/web/lib/data/peru-locations.ts`

**Responsabilidad**: Base de datos de ubicaciones de Perú

**Estructura de Datos**:
```typescript
interface District {
  name: string;
  coordinates: { latitude: number; longitude: number };
}

interface Province {
  name: string;
  districts: District[];
  coordinates: { latitude: number; longitude: number };
}

interface Department {
  name: string;
  provinces: Province[];
}
```

**Cobertura**:
- **Departamentos**: Lima, Callao
- **Provincias en Lima**: 10 provincias
  - Lima (43 distritos)
  - Barranca (5 distritos)
  - Cajatambo (5 distritos)
  - Canta (7 distritos)
  - Cañete (11 distritos)
  - Huaral (12 distritos)
  - Huarochirí (32 distritos)
  - Huaura (12 distritos)
  - Oyón (6 distritos)
  - Yauyos (33 distritos)
- **Provincia en Callao**: 1 provincia
  - Callao (7 distritos)
- **Total distritos**: 173 distritos

**Funciones Exportadas**:
```typescript
getDepartments(): string[]
getProvinces(department: string): Province[]
getDistricts(department: string, province: string): District[]
searchDistricts(department: string, province: string, query: string): District[]
getDistrictCoordinates(department, province, district): Coordinates | null
getProvinceCoordinates(department, province): Coordinates | null
```

---

## 🔄 Flujo de Interacción

### Escenario 1: Usuario Completa Formulario Manualmente

```
1. Usuario selecciona: Departamento = "Lima"
   ↓
2. Se habilita select de Provincia, carga opciones
   ↓
3. Usuario escribe "Lima" → autocompletado muestra "Lima"
   ↓
4. Usuario selecciona "Lima"
   ↓ Coordenadas: -12.0464, -77.0428
5. Mapa se centra en Lima
   ↓
6. Se habilita select de Distrito
   ↓
7. Usuario escribe "Mira" → autocompletado muestra "Miraflores"
   ↓
8. Usuario selecciona "Miraflores"
   ↓ Coordenadas: -12.1192, -77.0286
9. Mapa se centra en Miraflores con zoom 15
   ↓ Marcador aparece en centro de Miraflores
10. Usuario arrastra marcador a ubicación exacta
   ↓ Coordenadas: -12.1205, -77.0310 (ajustadas)
11. ✅ Ubicación final guardada
```

### Escenario 2: Usuario Usa el Mapa Primero

```
1. Usuario hace zoom en el mapa
   ↓
2. Usuario navega a la zona deseada
   ↓
3. Usuario hace clic en el mapa
   ↓ Coordenadas capturadas: -12.0976, -77.0363
4. Marcador se coloca en el punto clickeado
   ↓
5. FormData actualizado con coordenadas
   ↓
6. [Futuro] Geocoding inverso detecta: "San Isidro, Lima, Lima"
   ↓
7. [Futuro] Autocompletar distrito con "San Isidro"
   ↓
8. ✅ Ubicación guardada
```

### Escenario 3: Usuario Ajusta Manualmente el Marcador

```
1. Usuario tiene distrito seleccionado: "San Borja"
   ↓ Coordenadas iniciales: -12.0947, -77.0011
2. Mapa muestra marcador en centro de San Borja
   ↓
3. Usuario arrastra el marcador a su edificio específico
   ↓ Coordenadas ajustadas: -12.0955, -77.0025
4. onLocationChange se dispara
   ↓
5. FormData actualizado
   ↓
6. Mensaje: "✅ Ubicación actualizada manualmente"
   ↓
7. ✅ Coordenadas finales más precisas
```

---

## 🎨 UI/UX

### Estados Visuales

#### Autocompletado Activo
```
┌─────────────────────────────────────┐
│ Distrito *                          │
├─────────────────────────────────────┤
│ Mira█                               │
│ ┌─────────────────────────────────┐ │
│ │ Miraflores                      │ │  ← hover: bg-blue-50
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### Sin Resultados
```
┌─────────────────────────────────────┐
│ Distrito *                          │
├─────────────────────────────────────┤
│ XYZ123█                             │
│ ┌─────────────────────────────────┐ │
│ │  No se encontraron resultados   │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### Mapa con Marcador
```
┌───────────────────────────────────────────┐
│  📍 Ubicación en el Mapa                 │
├───────────────────────────────────────────┤
│                                           │
│        [Mapa Interactivo]                 │
│            📍 ← Marcador arrastrable      │
│                                           │
│  [+ -] 🔍                                 │
└───────────────────────────────────────────┘
💡 Haz clic en el mapa o arrastra el marcador
```

#### Coordenadas Capturadas
```
┌───────────────────────────────────────────┐
│ ℹ️ 📍 Ubicación Interactiva               │
│                                           │
│ Selecciona la ubicación en el mapa o     │
│ completa la dirección...                  │
│                                           │
│ ✓ Coordenadas: -12.119200, -77.028600   │
└───────────────────────────────────────────┘
```

---

## 📊 Datos Técnicos

### Coordenadas de Distritos Principales (Lima)

| Distrito | Latitud | Longitud | Zona |
|----------|---------|----------|------|
| **Miraflores** | -12.1192 | -77.0286 | Moderna |
| **San Isidro** | -12.0976 | -77.0363 | Financiera |
| **San Borja** | -12.0947 | -77.0011 | Residencial |
| **Surco** | -12.1456 | -76.9978 | Este |
| **La Molina** | -12.0797 | -76.9392 | Este |
| **Barranco** | -12.1464 | -77.0208 | Bohemia |
| **San Miguel** | -12.0772 | -77.0889 | Oeste |
| **Jesús María** | -12.0725 | -77.0411 | Centro |
| **Lince** | -12.0850 | -77.0333 | Centro |
| **Pueblo Libre** | -12.0772 | -77.0631 | Centro |
| **Magdalena** | -12.0906 | -77.0744 | Costa Verde |
| **Cercado Lima** | -12.0464 | -77.0428 | Centro Histórico |

### Coordenadas de Callao

| Distrito | Latitud | Longitud |
|----------|---------|----------|
| **Callao** | -12.0565 | -77.1181 |
| **Bellavista** | -12.0547 | -77.1111 |
| **La Perla** | -12.0706 | -77.1233 |
| **La Punta** | -12.0706 | -77.1625 |
| **Ventanilla** | -11.8636 | -77.1186 |
| **Mi Perú** | -12.0083 | -77.1583 |
| **Carmen Legua** | -12.0411 | -77.0900 |

---

## 🔧 Integración con Backend

### Campos Enviados al API

```typescript
POST /api/v1/listings

{
  // ... otros campos ...
  
  // Ubicación textual
  "department": "Lima",
  "province": "Lima",
  "district": "Miraflores",
  "address": "Av. Pardo 123",
  
  // Coordenadas GPS (nuevas)
  "latitude": -12.119200,
  "longitude": -77.028600
}
```

### Validación Backend Recomendada

```python
# En el schema de validación
class CreateListingRequest(BaseModel):
    # ... otros campos ...
    
    department: str
    province: str
    district: str
    address: Optional[str] = None
    
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    
    @validator('department')
    def validate_department(cls, v):
        if v not in ['Lima', 'Callao']:
            raise ValueError('Solo se aceptan Lima o Callao')
        return v
    
    @validator('latitude', 'longitude')
    def validate_coordinates_together(cls, v, values):
        # Si hay latitude, debe haber longitude y viceversa
        if 'latitude' in values and values['latitude'] is not None:
            if v is None:
                raise ValueError('Si hay latitude, debe haber longitude')
        return v
```

### Query de Búsqueda por Proximidad (Futuro)

```sql
-- Encontrar propiedades dentro de 2km
SELECT 
    l.*,
    (
        6371 * acos(
            cos(radians(-12.1192)) * cos(radians(l.latitude)) *
            cos(radians(l.longitude) - radians(-77.0286)) +
            sin(radians(-12.1192)) * sin(radians(l.latitude))
        )
    ) AS distance_km
FROM core.listings l
WHERE 
    l.latitude IS NOT NULL
    AND l.longitude IS NOT NULL
HAVING distance_km < 2
ORDER BY distance_km ASC
LIMIT 20;
```

---

## 🧪 Testing

### Casos de Prueba

#### Test 1: Selección Departamento → Provincia → Distrito
```
Given: Usuario en Step 2 (Ubicación)
When: Selecciona "Lima" → "Lima" → "Miraflores"
Then: 
  ✓ Coordenadas: -12.1192, -77.0286
  ✓ Mapa centrado en Miraflores
  ✓ Marcador visible
  ✓ formData actualizado correctamente
```

#### Test 2: Autocompletado con Filtrado
```
Given: Provincia "Lima" seleccionada
When: Usuario escribe "san" en distrito
Then: 
  ✓ Muestra opciones: San Isidro, San Borja, San Miguel, San Martín, etc.
  ✓ Filtra en tiempo real
  ✓ Case-insensitive ("SAN", "san", "San" funcionan)
```

#### Test 3: Click en Mapa
```
Given: Mapa visible en Step 2
When: Usuario hace clic en coordenadas -12.100, -77.040
Then:
  ✓ Marcador se coloca en esa posición
  ✓ formData.latitude = -12.100
  ✓ formData.longitude = -77.040
  ✓ Mensaje: "✅ Ubicación actualizada manualmente"
```

#### Test 4: Arrastrar Marcador
```
Given: Marcador existente en el mapa
When: Usuario arrastra marcador a nueva posición
Then:
  ✓ Coordenadas actualizadas en tiempo real
  ✓ formData sincronizado
  ✓ onLocationChange llamado con nuevas coordenadas
```

#### Test 5: Cambio de Departamento Resetea Campos
```
Given: Usuario tiene "Lima" → "Lima" → "Miraflores" seleccionado
When: Cambia departamento a "Callao"
Then:
  ✓ Province reseteado a ""
  ✓ District reseteado a ""
  ✓ Coordenadas mantenidas (no reseteadas)
  ✓ Dropdown de provincias carga opciones de Callao
```

#### Test 6: Integración con Geocoding Automático
```
Given: Usuario completa distrito "San Isidro"
  AND: Escribe dirección "Av. Conquistadores 456"
When: Pasan 1 segundo (debounce)
Then:
  ✓ Geocoding automático se ejecuta
  ✓ Coordenadas refinadas desde distrito → dirección exacta
  ✓ Mapa se actualiza con nueva posición
  ✓ Mensaje: "✅ Ubicación encontrada"
```

---

## 🚀 Mejoras Futuras

### Corto Plazo (Próximas Semanas)

1. **Geocoding Inverso** (Reverse Geocoding)
   - Click en mapa → obtener distrito/provincia
   - Autocompletar campos al hacer click en mapa
   - API: Nominatim reverse endpoint

2. **Validación de Límites**
   - Verificar que coordenadas estén en Lima/Callao
   - Alertar si coordenadas muy lejos del distrito seleccionado
   - Detectar inconsistencias (distrito ≠ coordenadas)

3. **Mejora de UX**
   - Botón "Usar mi ubicación actual" (geolocation)
   - Mostrar radio de privacidad (círculo de 200m)
   - Vista Street View (Google Maps)

### Mediano Plazo (1-2 Meses)

4. **Puntos de Interés Cercanos**
   - Detectar metros cercanos
   - Mostrar parques, colegios, supermercados
   - "A 500m del Metro"
   - Overpass API (OpenStreetMap)

5. **Múltiples Markers (Multi-ubicación)**
   - Propiedades con múltiples unidades
   - Edificios completos
   - Complejos residenciales

6. **Heatmap de Precios**
   - Overlay en mapa mostrando zonas caras/baratas
   - Comparación con mercado
   - Recomendaciones de pricing

### Largo Plazo (3-6 Meses)

7. **Integración con Google Maps**
   - Opción de cambiar entre OSM y Google
   - Street View integrado
   - Mejor geocoding

8. **Modo Offline**
   - Caché de tiles del mapa
   - Coordenadas almacenadas localmente
   - IndexedDB

9. **AR (Realidad Aumentada)**
   - Ver propiedades en AR desde el mapa
   - Cámara apuntando a edificio → mostrar info

---

## 📖 Referencias

### Librerías Utilizadas

- **Leaflet**: https://leafletjs.com/
- **React-Leaflet**: https://react-leaflet.js.org/
- **OpenStreetMap**: https://www.openstreetmap.org/

### APIs

- **Nominatim (Geocoding)**: https://nominatim.org/release-docs/latest/api/Search/
- **Nominatim (Reverse)**: https://nominatim.org/release-docs/latest/api/Reverse/
- **Overpass API (POI)**: https://overpass-turbo.eu/

### Recursos de Datos

- **INEI - Distritos del Perú**: https://www.inei.gob.pe/
- **OpenStreetMap Perú**: https://www.openstreetmap.org/relation/288247

---

## ✅ Checklist de Implementación

### Frontend
- [x] Componente `MapPicker` creado
- [x] Componente `AutocompleteInput` creado
- [x] Archivo `peru-locations.ts` con 173 distritos
- [x] Import dinámico de Leaflet (sin SSR)
- [x] Integración en formulario Step 2
- [x] Sincronización bidireccional coordenadas ↔ mapa
- [x] Autocompletado de provincia
- [x] Autocompletado de distrito
- [x] Marcador arrastrable
- [x] Click en mapa actualiza coordenadas
- [x] Mensajes visuales de estado

### Backend (Pendiente)
- [ ] Validar coordenadas en rango válido
- [ ] Validar departamento en ['Lima', 'Callao']
- [ ] Índice espacial en PostgreSQL (PostGIS)
- [ ] Query de búsqueda por proximidad
- [ ] Endpoint GET /v1/locations/nearby

### Testing
- [ ] Test autocompletado provincia
- [ ] Test autocompletado distrito
- [ ] Test click en mapa
- [ ] Test arrastrar marcador
- [ ] Test sincronización coordenadas
- [ ] Test reset campos al cambiar departamento
- [ ] Test integración con geocoding automático

### Documentación
- [x] Documentación de arquitectura
- [x] Guía de uso de componentes
- [x] Ejemplos de integración
- [ ] Video demo de funcionalidad
- [ ] Documentación API backend

---

**Documento creado**: 17 de octubre, 2025  
**Estado**: ✅ Implementado en Frontend  
**Próximo paso**: Testing y ajustes de UX
