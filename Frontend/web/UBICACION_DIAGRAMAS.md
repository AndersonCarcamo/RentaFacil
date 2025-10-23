# 🎨 Diagrama Visual del Sistema de Ubicación

## 📱 Interfaz de Usuario - Step 2: Ubicación

```
┌────────────────────────────────────────────────────────────────────────┐
│  📍 Paso 2: Ubicación                                                  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ ℹ️ 📍 Ubicación Interactiva                                      │ │
│  │                                                                  │ │
│  │ Selecciona la ubicación en el mapa o completa la dirección.     │ │
│  │ Obtendremos automáticamente las coordenadas GPS.                │ │
│  │                                                                  │ │
│  │ ✓ Coordenadas: -12.119200, -77.028600                          │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌─────────────┬─────────────────────┬─────────────────────────────┐ │
│  │ Departamento│ Provincia           │ Distrito                    │ │
│  ├─────────────┼─────────────────────┼─────────────────────────────┤ │
│  │ [Lima ▼]    │ [Lim▮]              │ [Mir▮]                      │ │
│  │             │ ┌─────────────────┐ │ ┌───────────────────────┐   │ │
│  │             │ │ Lima            │ │ │ Miraflores            │   │ │
│  │             │ │ (hover)         │ │ │ Miramar               │   │ │
│  │             │ └─────────────────┘ │ │ Miramar Alto          │   │ │
│  │             │                     │ └───────────────────────┘   │ │
│  └─────────────┴─────────────────────┴─────────────────────────────┘ │
│                                                                        │
│  Dirección (opcional)                                                  │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │ Av. José Pardo 123, Piso 5                                       │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│  💡 La dirección exacta solo se mostrará a usuarios interesados       │
│                                                                        │
│  📍 Ubicación en el Mapa                                               │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                                                                  │ │
│  │         ╔═══════════╗                                            │ │
│  │         ║   MAPA    ║     [+ -] 🔍 Zoom                         │ │
│  │         ║           ║                                            │ │
│  │         ║     📍    ║  ← Marcador arrastrable                   │ │
│  │         ║  (Marker) ║                                            │ │
│  │         ║           ║                                            │ │
│  │         ╚═══════════╝                                            │ │
│  │                                                                  │ │
│  │  🌍 OpenStreetMap                                                │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│  💡 Haz clic en el mapa o arrastra el marcador para ajustar           │
│                                                                        │
│  [← Atrás]                                            [Siguiente →]   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Interacción

### Escenario 1: Selección Manual con Autocompletado

```
Usuario                    Sistema                      Mapa
   │                          │                          │
   │ 1. Selecciona "Lima"     │                          │
   ├─────────────────────────>│                          │
   │                          │ Carga provincias         │
   │                          │ de Lima                  │
   │                          │                          │
   │ 2. Escribe "lim"         │                          │
   ├─────────────────────────>│                          │
   │                          │ Filtra opciones          │
   │<─────────────────────────┤ Muestra "Lima"           │
   │                          │                          │
   │ 3. Selecciona "Lima"     │                          │
   ├─────────────────────────>│                          │
   │                          │ Carga distritos          │
   │                          │ Coordenadas: -12.04,     │
   │                          │              -77.04      │
   │                          ├─────────────────────────>│
   │                          │                          │ Centra en Lima
   │                          │                          │ Zoom nivel 13
   │                          │                          │
   │ 4. Escribe "mira"        │                          │
   ├─────────────────────────>│                          │
   │                          │ Filtra distritos         │
   │<─────────────────────────┤ "Miraflores"             │
   │                          │                          │
   │ 5. Selecciona            │                          │
   │    "Miraflores"          │                          │
   ├─────────────────────────>│                          │
   │                          │ Coordenadas: -12.11,     │
   │                          │              -77.02      │
   │                          ├─────────────────────────>│
   │                          │                          │ Centra en Miraflores
   │                          │                          │ Zoom nivel 15
   │                          │                          │ 📍 Coloca marcador
   │                          │                          │
   │ 6. Arrastra marcador     │                          │
   ├──────────────────────────┼─────────────────────────>│
   │                          │<─────────────────────────┤ Nuevas coords
   │                          │ -12.1120, -77.0290       │
   │                          │                          │
   │<─────────────────────────┤ "✅ Ubicación            │
   │ "Actualizada"            │ actualizada"             │
   │                          │                          │
```

### Escenario 2: Uso del Mapa Primero

```
Usuario                    Sistema                      Mapa
   │                          │                          │
   │ 1. Hace zoom en mapa     │                          │
   ├──────────────────────────┼─────────────────────────>│
   │                          │                          │ Zoom in/out
   │                          │                          │
   │ 2. Navega por el mapa    │                          │
   ├──────────────────────────┼─────────────────────────>│
   │                          │                          │ Pan (desplazar)
   │                          │                          │
   │ 3. Click en ubicación    │                          │
   ├──────────────────────────┼─────────────────────────>│
   │                          │<─────────────────────────┤ Coords capturadas
   │                          │ lat: -12.0976            │ 📍 Marcador
   │                          │ lng: -77.0363            │
   │                          │                          │
   │<─────────────────────────┤ Actualiza formData       │
   │ "✅ Ubicación            │                          │
   │ actualizada"             │                          │
   │                          │                          │
   │ [FUTURO]                 │                          │
   │                          │ Geocoding inverso        │
   │                          │ Detecta: "San Isidro"    │
   │<─────────────────────────┤ Autocompleta distrito    │
   │                          │                          │
```

---

## 🧩 Arquitectura de Componentes

```
create-listing.tsx (Formulario Principal)
    │
    ├─── Step 2: Ubicación
    │       │
    │       ├─── <select> Departamento
    │       │       └─── Options: [Lima, Callao]
    │       │
    │       ├─── <AutocompleteInput> Provincia
    │       │       ├─── Input con filtrado
    │       │       ├─── Dropdown dinámico
    │       │       └─── onChange → actualiza coords
    │       │
    │       ├─── <AutocompleteInput> Distrito
    │       │       ├─── Input con filtrado
    │       │       ├─── Dropdown dinámico
    │       │       └─── onChange → actualiza coords + centra mapa
    │       │
    │       ├─── <input> Dirección
    │       │       └─── onChange → geocoding (1s debounce)
    │       │
    │       └─── <MapPicker> (dynamic import)
    │               ├─── Leaflet Map
    │               ├─── Draggable Marker
    │               ├─── Click Handler
    │               └─── onLocationChange → actualiza coords
    │
    └─── FormData State
            ├─── department: string
            ├─── province: string
            ├─── district: string
            ├─── address: string
            ├─── latitude: number | null
            └─── longitude: number | null
```

---

## 🗂️ Estructura de Datos

```
PERU_LOCATIONS
    │
    ├─── Lima (Department)
    │       │
    │       ├─── Lima (Province)
    │       │       ├─── coordinates: { lat: -12.0464, lng: -77.0428 }
    │       │       └─── districts: [
    │       │               {
    │       │                   name: "Miraflores",
    │       │                   coordinates: { lat: -12.1192, lng: -77.0286 }
    │       │               },
    │       │               {
    │       │                   name: "San Isidro",
    │       │                   coordinates: { lat: -12.0976, lng: -77.0363 }
    │       │               },
    │       │               ... (43 distritos)
    │       │           ]
    │       │
    │       ├─── Barranca (Province)
    │       │       └─── districts: [ ... 5 distritos ]
    │       │
    │       ├─── Cañete (Province)
    │       │       └─── districts: [ ... 11 distritos ]
    │       │
    │       └─── ... (10 provincias total)
    │
    └─── Callao (Department)
            └─── Callao (Province)
                    ├─── coordinates: { lat: -12.0565, lng: -77.1181 }
                    └─── districts: [
                            "Callao", "Bellavista", "La Perla",
                            "La Punta", "Ventanilla", "Mi Perú",
                            "Carmen de la Legua Reynoso"
                        ]

Total: 2 departamentos, 11 provincias, 173 distritos
```

---

## 🔀 Estado del Formulario (FormData)

```
┌─────────────────────────────────────────────────┐
│          FormData State                         │
├─────────────────────────────────────────────────┤
│                                                 │
│  Ubicación Textual:                             │
│  ┌─────────────────────────────────────────┐   │
│  │ department:  "Lima"                     │   │
│  │ province:    "Lima"                     │   │
│  │ district:    "Miraflores"               │   │
│  │ address:     "Av. José Pardo 123"       │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Coordenadas GPS:                               │
│  ┌─────────────────────────────────────────┐   │
│  │ latitude:    -12.119200                 │   │
│  │ longitude:   -77.028600                 │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Estado UI:                                     │
│  ┌─────────────────────────────────────────┐   │
│  │ geocodingStatus: "✅ Ubicación          │   │
│  │                   encontrada"           │   │
│  │ geocoding:       false                  │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📡 Payload de API

```json
POST /api/v1/listings
{
  "title": "Hermoso Departamento en Miraflores",
  "description": "...",
  "operation": "rent",
  "property_type": "apartment",
  
  // Ubicación Textual
  "department": "Lima",
  "province": "Lima",
  "district": "Miraflores",
  "address": "Av. José Pardo 123, Piso 5",
  
  // Coordenadas GPS (NUEVAS)
  "latitude": -12.119200,
  "longitude": -77.028600,
  
  // ... otros campos ...
  "price": 2500.00,
  "bedrooms": 2,
  "bathrooms": 2
}
```

---

## 🎯 Casos de Uso Visualizados

### Caso 1: Propiedad en Zona Conocida

```
Input:
┌─────────────────────────────┐
│ Departamento: Lima          │
│ Provincia:    Lima          │
│ Distrito:     San Isidro    │
│ Dirección:    Av. Repúbl... │
└─────────────────────────────┘

Proceso:
1. Autocompletado: "San Isidro" → coords distrito
2. Geocoding: "Av. República..." → coords exactas
3. Mapa: Usuario ajusta marcador

Output:
┌─────────────────────────────┐
│ Lat:  -12.097600            │
│ Lng:  -77.036300            │
│ Precisión: ± 10 metros      │
└─────────────────────────────┘
```

### Caso 2: Usuario No Sabe Distrito

```
Input:
┌─────────────────────────────┐
│ Departamento: Lima          │
│ Provincia:    Lima          │
│ Distrito:     (vacío)       │
│ [Usuario usa MAPA]          │
└─────────────────────────────┘

Proceso:
1. Usuario hace zoom en mapa
2. Usuario navega visualmente
3. Usuario hace clic en ubicación
4. Sistema captura coordenadas

Output:
┌─────────────────────────────┐
│ Lat:  -12.120000            │
│ Lng:  -77.030000            │
│ Distrito: (autodetectar*)   │
│ *futuro: geocoding inverso  │
└─────────────────────────────┘
```

### Caso 3: Ajuste Fino de Ubicación

```
Distrito seleccionado:
┌─────────────────────────────┐
│ "Miraflores"                │
│ Centro aprox: -12.119, -77.028│
└─────────────────────────────┘
           ↓
Mapa se centra automáticamente
           ↓
┌─────────────────────────────┐
│      [Mapa Visual]          │
│                             │
│         📍 ← Centro         │
│                             │
│  Usuario arrastra a:        │
│  Su edificio específico     │
└─────────────────────────────┘
           ↓
Coordenadas actualizadas:
┌─────────────────────────────┐
│ ANTES: -12.119200, -77.028600│
│ DESPUÉS:-12.119500, -77.029100│
│ Δ: 50 metros al sureste     │
└─────────────────────────────┘
```

---

## 📍 Mapa Conceptual de Lima

```
                        CALLAO
                    (7 distritos)
                    │
                    │  Ventanilla
                    │  │
                    │  ├─ Callao Centro
                    │  ├─ Bellavista
                    │  └─ La Punta
                    │
────────────────────┼────────────────────
                    │
                 LIMA NORTE
            (Comas, Los Olivos,
         San Martín de Porres, etc.)
                    │
    ────────────────┼────────────────
                    │
    LIMA OESTE      │      LIMA ESTE
  (San Miguel,      │   (Ate, La Molina,
   Magdalena)       │    SJL, etc.)
                    │
          ┌─────────┴─────────┐
          │                   │
    LIMA CENTRO         LIMA MODERNA
   (Cercado Lima,      (Miraflores,
    La Victoria,        San Isidro,
    Breña, etc.)        San Borja,
                        Surco, etc.)
          │                   │
          └─────────┬─────────┘
                    │
                 LIMA SUR
          (Villa El Salvador,
           Chorrillos, Lurín,
           SJM, etc.)
```

---

## 🧭 Coordenadas de Referencia

```
                      N (Norte)
                        ↑
                        │
                   -11.8 (Ventanilla)
                        │
                        │
W (Oeste) -77.2 ────────┼──────── -76.9 E (Este)
   (Callao)             │        (La Molina)
                        │
                        │
                   -12.2 (Lurín)
                        │
                        ↓
                      S (Sur)

Rangos de Perú:
- Latitud:  -0° (Tumbes) a -18° (Tacna)
- Longitud: -68° (Madre de Dios) a -81° (Piura)

Lima Metropolitana:
- Latitud:  -11.7° (norte) a -12.5° (sur)
- Longitud: -77.2° (oeste) a -76.7° (este)
```

---

## 🔄 Sincronización de Estados

```
┌────────────────────────────────────────────────────┐
│                                                    │
│   [Distrito Selector] ←──────→ [FormData] ←──────→ [Mapa]
│         │                          │                  │
│         │ onChange                 │ useEffect        │
│         │                          │                  │
│         └──────────────────────────┴──────────────────┘
│                          │
│                    Coordenadas
│                          │
│         ┌────────────────┴────────────────┐
│         │                                 │
│   [Geocoding API]              [Marcador Arrastrable]
│         │                                 │
│         └────────────────┬────────────────┘
│                          │
│                    Actualización
│                          │
│                          ▼
│                 [Base de Datos]
│
└────────────────────────────────────────────────────┘
```

**Leyenda**:
- `←────→` : Sincronización bidireccional
- `│` : Flujo unidireccional
- `[Componente]` : Elemento de UI o servicio

---

## 🎨 Estados de la UI

### Estado 1: Inicial (Sin Departamento)
```
Departamento: [ Seleccionar... ▼ ]
Provincia:    [ ─────────────────── ] (disabled)
Distrito:     [ ─────────────────── ] (disabled)
Mapa:         [Centro de Perú, zoom 6]
```

### Estado 2: Departamento Seleccionado
```
Departamento: [ Lima ▼ ]
Provincia:    [ Escribe o selecciona... ]  (enabled)
Distrito:     [ ─────────────────────── ] (disabled)
Mapa:         [Centro de Lima, zoom 10]
```

### Estado 3: Provincia Seleccionada
```
Departamento: [ Lima ▼ ]
Provincia:    [ Lima ]
Distrito:     [ Escribe o selecciona... ]  (enabled)
Mapa:         [Centro de Provincia Lima, zoom 12]
```

### Estado 4: Distrito Seleccionado + Marcador
```
Departamento: [ Lima ▼ ]
Provincia:    [ Lima ]
Distrito:     [ Miraflores ]
Mapa:         [📍 Miraflores, zoom 15]
              ✓ Coordenadas: -12.119200, -77.028600
```

### Estado 5: Ajuste Manual en Mapa
```
Departamento: [ Lima ▼ ]
Provincia:    [ Lima ]
Distrito:     [ Miraflores ]
Mapa:         [📍 Posición ajustada, zoom 17]
              ✓ Coordenadas: -12.119500, -77.029100
              ✅ Ubicación actualizada manualmente
```

---

**Documento de Referencia Visual**  
Creado: 17 de octubre, 2025  
Versión: 1.0
