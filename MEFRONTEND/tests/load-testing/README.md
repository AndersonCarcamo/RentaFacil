# 🧪 Pruebas de Carga - Sistema de Búsqueda y Mapa

Este directorio contiene el script para realizar pruebas de carga en el sistema de búsqueda con mapa.

## 📋 Requisitos

### Instalar k6

**Windows (con Chocolatey):**
```powershell
choco install k6
```

**Windows (con Scoop):**
```powershell
scoop install k6
```

**Windows (descarga directa):**
https://dl.k6.io/msi/k6-latest-amd64.msi

**Verificar instalación:**
```powershell
k6 version
```

## 🚀 Ejecutar las Pruebas

### Prueba Básica (10-200 usuarios simultáneos)
```powershell
k6 run load-test-search.js
```

### Prueba Personalizada
```powershell
# Solo 50 usuarios por 1 minuto
k6 run --vus 50 --duration 1m load-test-search.js

# Prueba más agresiva: hasta 500 usuarios
k6 run --stage 1m:100,2m:200,2m:300,2m:400,2m:500,1m:0 load-test-search.js
```

### Con resultados detallados
```powershell
k6 run --out json=results.json load-test-search.js
```

## 📊 Interpretar Resultados

### Métricas Clave:

- **http_req_duration**: Tiempo de respuesta
  - `avg`: Promedio (debería ser < 2000ms)
  - `p(95)`: 95% de usuarios (debería ser < 5000ms)
  - `p(99)`: 99% de usuarios (debería ser < 10000ms)

- **http_req_failed**: Tasa de errores
  - Debería ser < 1% para sistema estable
  - < 10% aceptable bajo carga extrema

- **vus**: Usuarios virtuales simultáneos
  - Max muestra el pico alcanzado

### Indicadores de Problemas:

🔴 **Sistema sobrecargado si:**
- Promedio de respuesta > 5000ms
- Tasa de errores > 10%
- Tiempo P95 > 10000ms

🟡 **Degradación aceptable si:**
- Promedio de respuesta 2000-5000ms
- Tasa de errores 1-10%
- Tiempo P95 5000-10000ms

🟢 **Sistema saludable si:**
- Promedio de respuesta < 2000ms
- Tasa de errores < 1%
- Tiempo P95 < 5000ms

## 🎯 Escenarios de Prueba

El script prueba varios escenarios realistas:

1. **Búsqueda por ubicación**
   - Lima, Miraflores, San Isidro, Surco

2. **Búsqueda por tipo de propiedad**
   - Apartamentos, casas

3. **Búsqueda por rango de precio**
   - S/500 - S/2000

4. **Búsqueda de alquiler temporal**
   - Tipo Airbnb

## 📈 Fases de la Prueba

1. **Warm-up** (30s): 0 → 10 usuarios
2. **Ramp-up 1** (1m): 10 → 50 usuarios
3. **Sustained 1** (2m): 50 usuarios constantes
4. **Ramp-up 2** (1m): 50 → 100 usuarios
5. **Sustained 2** (2m): 100 usuarios constantes
6. **Ramp-up 3** (1m): 100 → 200 usuarios
7. **Peak Load** (2m): 200 usuarios constantes
8. **Cool-down** (30s): 200 → 0 usuarios

**Duración total: ~10 minutos**

## 🔧 Personalizar la Prueba

### Ajustar número de usuarios:

Edita `load-test-search.js` en la sección `options.stages`:

```javascript
stages: [
  { duration: '1m', target: 50 },   // Tu objetivo
  { duration: '3m', target: 50 },   // Mantener
  { duration: '30s', target: 0 },   // Finalizar
]
```

### Agregar más URLs de búsqueda:

```javascript
const SEARCH_URLS = [
  '/search?mode=alquiler&location=lima',
  '/search?mode=alquiler&location=tu-distrito',
  // Agrega más aquí
];
```

## 📝 Análisis de Resultados

Después de la prueba, revisa:

1. **Terminal**: Resumen con métricas principales
2. **load-test-results.json**: Datos detallados para análisis
3. **Logs del servidor**: Verifica errores en el backend

### Ver resultados JSON:
```powershell
Get-Content load-test-results.json | ConvertFrom-Json | Format-List
```

## 🚨 Monitoreo Durante la Prueba

Mientras corre la prueba, monitorea:

1. **Navegador**: http://127.0.0.1:3000/search
2. **Terminal k6**: Métricas en tiempo real
3. **Task Manager**: Uso de CPU/RAM
4. **Network**: Ancho de banda utilizado

## 💡 Tips

- **Backend**: Asegúrate de que el servidor backend esté corriendo
- **Frontend**: El dev server de Next.js debe estar activo
- **Cache**: Limpia el cache del navegador antes de probar
- **Baseline**: Ejecuta primero con pocos usuarios para establecer un baseline

## ⚡ Prueba Rápida

Para una prueba rápida de 1 minuto:

```powershell
k6 run --vus 20 --duration 1m load-test-search.js
```

## 🎓 Resultados Esperados

Sistema de referencia (hardware típico):
- **20 usuarios**: Sin problemas
- **50 usuarios**: Posible ligera degradación
- **100 usuarios**: Sistema estresado, tiempos aumentan
- **200+ usuarios**: Probablemente necesite optimización/escalado

Tu kilometraje puede variar dependiendo de:
- Hardware del servidor
- Conexión a base de datos
- Cache configurado
- Optimizaciones del código
