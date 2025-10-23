# 🧪 Guía de Pruebas - Sistema de Ubicación

## ✅ Checklist de Pruebas

### Test 1: Orden Alfabético de Distritos

**Objetivo**: Verificar que los distritos aparezcan ordenados alfabéticamente

**Pasos**:
1. Navega a crear propiedad
2. En Step 2, selecciona:
   - Departamento: "Lima"
   - Provincia: "Lima"
3. Haz clic en el campo "Distrito"
4. Observa la lista desplegable

**Resultado Esperado**:
```
✓ Los distritos deben aparecer en orden alfabético:
  - Ancón
  - Ate
  - Barranco
  - Breña
  - Carabayllo
  - Cercado de Lima
  - Chaclacayo
  - ...
  - Villa María del Triunfo

❌ NO debe aparecer desordenado
```

**Estado**: [ ] Pendiente | [ ] Aprobado | [ ] Fallido

---

### Test 2: Filtrado de Distritos por Provincia

**Objetivo**: Verificar que solo aparezcan distritos de la provincia seleccionada

**Pasos A - Provincia Lima**:
1. Selecciona Departamento: "Lima"
2. Selecciona Provincia: "Lima"
3. Abre el dropdown de Distrito

**Resultado Esperado A**:
```
✓ Debe mostrar 43 distritos de Lima:
  - Miraflores, San Isidro, San Borja, Surco, etc.

❌ NO debe mostrar distritos de otras provincias
```

**Pasos B - Provincia Barranca**:
1. Mantén Departamento: "Lima"
2. Cambia Provincia a: "Barranca"
3. Abre el dropdown de Distrito

**Resultado Esperado B**:
```
✓ Debe mostrar solo 5 distritos de Barranca:
  - Barranca
  - Paramonga
  - Pativilca
  - Supe
  - Supe Puerto

❌ NO debe mostrar distritos de Lima (provincia)
```

**Pasos C - Provincia Cañete**:
1. Mantén Departamento: "Lima"
2. Cambia Provincia a: "Cañete"
3. Abre el dropdown de Distrito

**Resultado Esperado C**:
```
✓ Debe mostrar 11 distritos de Cañete:
  - Asia
  - Calango
  - Cerro Azul
  - Imperial
  - Mala
  - Nuevo Imperial
  - Quilmaná
  - San Antonio
  - San Luis
  - San Vicente de Cañete
  - Santa Cruz de Flores

❌ NO debe mostrar Miraflores (es de Lima provincia)
```

**Estado**: [ ] Pendiente | [ ] Aprobado | [ ] Fallido

---

### Test 3: Sincronización Dirección → Mapa

**Objetivo**: Verificar que al escribir la dirección, el mapa se actualice automáticamente

**Pasos**:
1. Selecciona:
   - Departamento: "Lima"
   - Provincia: "Lima"
   - Distrito: "Miraflores"
2. Observa que el mapa se centra en Miraflores
3. Escribe en "Dirección": "Av. Pardo 123"
4. Espera 1 segundo (debounce)

**Resultado Esperado**:
```
✓ Debe aparecer mensaje: "🔍 Obteniendo coordenadas..."
✓ Luego: "✅ Ubicación exacta encontrada"
✓ El mapa debe actualizarse mostrando la ubicación más precisa
✓ El marcador debe moverse a la nueva ubicación
✓ Las coordenadas deben cambiar en el banner informativo

Ejemplo:
ANTES:  -12.119200, -77.028600 (centro de Miraflores)
DESPUÉS: -12.120500, -77.029100 (Av. Pardo 123)
```

**Estado**: [ ] Pendiente | [ ] Aprobado | [ ] Fallido

---

### Test 4: Dirección Deshabilitada sin Distrito

**Objetivo**: Verificar que la dirección solo se pueda completar después de seleccionar distrito

**Pasos A - Sin Distrito**:
1. En Step 2, NO selecciones distrito
2. Intenta hacer clic en el campo "Dirección"

**Resultado Esperado A**:
```
✓ El campo debe estar deshabilitado (disabled)
✓ Debe mostrar mensaje: "⚠️ Primero selecciona el distrito"
✓ El campo debe verse gris (no editable)

❌ NO debe permitir escribir
```

**Pasos B - Con Distrito**:
1. Selecciona un distrito (ej: "San Isidro")
2. Verifica el campo "Dirección"

**Resultado Esperado B**:
```
✓ El campo debe estar habilitado (enabled)
✓ Debe mostrar mensaje: "💡 La dirección ayuda a ubicar..."
✓ Debe permitir escribir

❌ NO debe estar deshabilitado
```

**Estado**: [ ] Pendiente | [ ] Aprobado | [ ] Fallido

---

### Test 5: Indicador de Carga al Escribir Dirección

**Objetivo**: Verificar que aparezca indicador visual mientras se geocodifica

**Pasos**:
1. Selecciona distrito "Miraflores"
2. Escribe en dirección: "Av. Larco 1234"
3. Mientras escribes, observa el feedback visual

**Resultado Esperado**:
```
✓ Al dejar de escribir (después de 1 segundo):
  - Debe aparecer: "🔄 Actualizando ubicación en el mapa..."
  - Con animación de spin en el emoji 🔄

✓ Después de geocodificar:
  - Debe aparecer: "✅ Ubicación exacta encontrada"
  - El mensaje debe desaparecer después de 3 segundos
  - El mapa debe actualizarse

❌ NO debe quedarse trabado en "Actualizando..."
```

**Estado**: [ ] Pendiente | [ ] Aprobado | [ ] Fallido

---

### Test 6: Autocompletado con Filtrado en Tiempo Real

**Objetivo**: Verificar que el autocompletado filtre mientras escribes

**Pasos**:
1. Selecciona Provincia: "Lima"
2. En Distrito, escribe: "san"
3. Observa las opciones mostradas

**Resultado Esperado**:
```
✓ Debe mostrar solo distritos que contienen "san":
  - San Bartolo
  - San Borja
  - San Isidro
  - San Juan de Lurigancho
  - San Juan de Miraflores
  - San Luis
  - San Martín de Porres
  - San Miguel
  - Santiago de Surco
  
✓ Debe estar en ORDEN ALFABÉTICO

❌ NO debe mostrar:
  - Miraflores (no contiene "san")
  - Surquillo (no contiene "san")
```

**Pasos Adicionales**:
4. Borra y escribe: "villa"

**Resultado Esperado Adicional**:
```
✓ Debe mostrar:
  - Villa El Salvador
  - Villa María del Triunfo

❌ NO debe mostrar distritos sin "villa"
```

**Estado**: [ ] Pendiente | [ ] Aprobado | [ ] Fallido

---

### Test 7: Cambio de Provincia Resetea Distrito

**Objetivo**: Verificar que al cambiar provincia, el distrito se resetee

**Pasos**:
1. Selecciona:
   - Provincia: "Lima"
   - Distrito: "Miraflores"
2. Cambia Provincia a: "Cañete"
3. Observa el campo Distrito

**Resultado Esperado**:
```
✓ El campo Distrito debe quedar VACÍO
✓ El dropdown debe mostrar solo distritos de Cañete
✓ Las coordenadas pueden mantenerse (del último punto válido)

❌ NO debe seguir mostrando "Miraflores"
❌ NO debe mostrar distritos de Lima cuando se seleccionó Cañete
```

**Estado**: [ ] Pendiente | [ ] Aprobado | [ ] Fallido

---

### Test 8: Sincronización Completa (Integración)

**Objetivo**: Verificar que todos los componentes funcionen juntos

**Escenario Completo**:
1. Departamento: "Lima"
2. Provincia: "Lima"
3. Distrito: "San Isidro" (escribe "san is" y selecciona)
4. Dirección: "Av. Conquistadores 456"
5. Espera 1 segundo
6. Arrastra el marcador en el mapa
7. Observa toda la UI

**Resultado Esperado**:
```
PASO 3 (Distrito):
✓ Mapa se centra en San Isidro (-12.0976, -77.0363)
✓ Aparece marcador
✓ Coordenadas se muestran en banner

PASO 4-5 (Dirección + Geocoding):
✓ Mensaje: "🔍 Obteniendo coordenadas..."
✓ Mensaje: "✅ Ubicación exacta encontrada"
✓ Mapa se actualiza con ubicación más precisa
✓ Coordenadas cambian a ubicación de la dirección

PASO 6 (Arrastrar Marcador):
✓ Mensaje: "✅ Ubicación actualizada manualmente"
✓ Coordenadas se actualizan en tiempo real
✓ FormData sincronizado

VERIFICACIÓN FINAL:
✓ formData.department = "Lima"
✓ formData.province = "Lima"
✓ formData.district = "San Isidro"
✓ formData.address = "Av. Conquistadores 456"
✓ formData.latitude = [coordenada ajustada manualmente]
✓ formData.longitude = [coordenada ajustada manualmente]
```

**Estado**: [ ] Pendiente | [ ] Aprobado | [ ] Fallido

---

## 🐛 Registro de Bugs

### Bug Template
```
ID: #001
Título: [Descripción corta]
Severidad: [ ] Crítico | [ ] Alto | [ ] Medio | [ ] Bajo
Pasos para reproducir:
1. 
2. 
3. 

Resultado esperado:
[Lo que debería pasar]

Resultado actual:
[Lo que está pasando]

Capturas: [URL o path]
Navegador: [Chrome/Firefox/Safari]
Estado: [ ] Abierto | [ ] En progreso | [ ] Resuelto
```

---

## 📊 Matriz de Pruebas

| Test ID | Funcionalidad | Prioridad | Estado | Fecha | Tester |
|---------|---------------|-----------|--------|-------|--------|
| T1 | Orden Alfabético | Alta | ⏳ | - | - |
| T2 | Filtrado por Provincia | Alta | ⏳ | - | - |
| T3 | Sincronización Dirección | Alta | ⏳ | - | - |
| T4 | Dirección Deshabilitada | Media | ⏳ | - | - |
| T5 | Indicador de Carga | Baja | ⏳ | - | - |
| T6 | Autocompletado Filtrado | Alta | ⏳ | - | - |
| T7 | Reset al Cambiar Provincia | Alta | ⏳ | - | - |
| T8 | Integración Completa | Crítica | ⏳ | - | - |

**Leyenda**:
- ⏳ Pendiente
- ✅ Aprobado
- ❌ Fallido
- 🔄 En progreso

---

## 🎯 Criterios de Aceptación

Para considerar el sistema listo para producción, TODOS los siguientes deben cumplirse:

- [ ] **T1-T7**: Todos los tests individuales aprobados
- [ ] **T8**: Test de integración aprobado
- [ ] **Performance**: Geocoding responde en < 2 segundos
- [ ] **UX**: No hay bloqueos ni trabas en la UI
- [ ] **Datos**: Todos los 173 distritos están disponibles
- [ ] **Orden**: Los distritos siempre aparecen alfabéticamente
- [ ] **Filtrado**: Solo distritos de la provincia seleccionada
- [ ] **Sincronización**: Mapa actualiza en tiempo real

---

## 📝 Notas del Tester

```
Fecha: [DD/MM/YYYY]
Tester: [Nombre]
Ambiente: [Dev/Staging/Prod]

Observaciones generales:
-

Problemas encontrados:
-

Sugerencias de mejora:
-

Tiempo total de pruebas: [X horas]
```

---

## 🔄 Historial de Versiones

### v1.1 (17 Oct 2025) - Mejoras de Orden y Filtrado
- ✅ Distritos ordenados alfabéticamente
- ✅ Filtrado estricto por provincia seleccionada
- ✅ Sincronización dirección → mapa mejorada
- ✅ Campo dirección deshabilitado sin distrito
- ✅ Indicador visual al geocodificar desde dirección

### v1.0 (17 Oct 2025) - Release Inicial
- ✅ Mapa interactivo con Leaflet
- ✅ Autocompletado de provincia y distrito
- ✅ 173 distritos de Lima y Callao
- ✅ Geocoding automático
- ✅ Marcador arrastrable

---

**Documento creado**: 17 de octubre, 2025  
**Última actualización**: 17 de octubre, 2025  
**Versión**: 1.1
