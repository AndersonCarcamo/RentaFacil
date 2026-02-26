# Guía de Testing - Vista Móvil Crear Propiedad

## 🚀 Inicio Rápido

### 1. Preparación
```bash
# Asegurarse que el servidor está corriendo
cd Frontend/web
npm run dev
```

### 2. Abrir en Navegador
```
http://localhost:3000/dashboard/create-listing
```

### 3. Activar Vista Móvil

**En Chrome/Edge:**
1. F12 (DevTools)
2. Ctrl+Shift+M (Toggle device toolbar)
3. Seleccionar dispositivo: iPhone SE, Pixel 5, etc.
4. Ancho: 375px - 428px

**En Firefox:**
1. F12 (DevTools)
2. Ctrl+Shift+M (Responsive design mode)
3. Ajustar a 375px

---

## 📱 Casos de Prueba

### Test 1: Navegación Básica

**Objetivo:** Verificar navegación entre pasos

1. ✅ Abrir página en móvil (<768px)
2. ✅ Ver Paso 1: Tipo de propiedad
3. ✅ Botón "Siguiente" debe estar deshabilitado
4. ✅ Seleccionar "Departamento"
5. ✅ Seleccionar "Alquiler"
6. ✅ Botón "Siguiente" se habilita
7. ✅ Click "Siguiente" → Paso 2
8. ✅ Ver botón "Atrás"
9. ✅ Click "Atrás" → Paso 1
10. ✅ Datos persisten (tipo y operación guardados)

**Resultado esperado:**
- Navegación suave
- Datos persisten
- Botones condicionalmente deshabilitados

---

### Test 2: Auto-guardado

**Objetivo:** Verificar persistencia en localStorage

1. ✅ Completar Paso 1
2. ✅ Avanzar a Paso 2
3. ✅ Ingresar dirección: "Av. Arequipa 1234"
4. ✅ Ingresar distrito: "San Isidro"
5. ✅ Ingresar ciudad: "Lima"
6. ✅ Esperar 2 segundos
7. ✅ Abrir DevTools → Application → Local Storage
8. ✅ Buscar key: `listing_draft`
9. ✅ Verificar datos guardados

**Resultado esperado:**
```json
{
  "propertyType": "departamento",
  "operationType": "alquiler",
  "address": "Av. Arequipa 1234",
  "district": "San Isidro",
  "city": "Lima"
}
```

---

### Test 3: Validaciones

**Objetivo:** Verificar validaciones por paso

#### Paso 1 - Básico
- ❌ "Siguiente" deshabilitado si falta tipo de propiedad
- ❌ "Siguiente" deshabilitado si falta operación
- ✅ "Siguiente" habilitado con ambos seleccionados

#### Paso 2 - Ubicación
- ❌ "Siguiente" deshabilitado si falta dirección
- ❌ "Siguiente" deshabilitado si falta distrito
- ❌ "Siguiente" deshabilitado si falta ciudad
- ✅ "Siguiente" habilitado con todos los campos

#### Paso 3 - Detalles
- ❌ "Siguiente" deshabilitado si título < 10 caracteres
- ✅ "Siguiente" habilitado con título válido

#### Paso 4 - Precio
- ❌ "Siguiente" deshabilitado si precio = 0
- ✅ "Siguiente" habilitado con precio > 0

#### Paso 6 - Fotos
- ❌ "Siguiente" deshabilitado si 0 imágenes
- ✅ "Siguiente" habilitado con ≥ 1 imagen

#### Paso 7 - Contacto
- ❌ "Siguiente" deshabilitado si falta teléfono Y email
- ✅ "Siguiente" habilitado con al menos uno

---

### Test 4: Contador de Habitaciones

**Objetivo:** Verificar widgets de contador

1. ✅ Ir a Paso 3
2. ✅ Click "+" en Dormitorios → aumenta a 1
3. ✅ Click "+" varias veces → llega a 10
4. ✅ Click "+" en 10 → botón deshabilitado
5. ✅ Click "-" → disminuye
6. ✅ Click "-" en 0 → botón deshabilitado (mínimo 0)
7. ✅ Repetir con Baños (mínimo 1)

**Resultado esperado:**
- Botones + y - funcionan
- Respetan límites (0-10 dormitorios, 1-10 baños)
- Visual feedback cuando disabled

---

### Test 5: Carga de Imágenes

**Objetivo:** Verificar ImageUploader

1. ✅ Ir a Paso 6
2. ✅ Click "Seleccionar fotos"
3. ✅ Seleccionar 1 imagen
4. ✅ Ver preview en grid
5. ✅ Ver indicador "1/10 fotos"
6. ✅ Click botón "X" para eliminar
7. ✅ Imagen se elimina
8. ✅ Agregar 11 imágenes → solo se guardan 10

**Resultado esperado:**
- Preview instantáneo
- Máximo 10 imágenes
- Botón eliminar funciona
- Primera imagen = portada

---

### Test 6: Características y Amenidades

**Objetivo:** Verificar toggles y selección múltiple

#### Paso 5 - Amenidades
1. ✅ Click en "WiFi" → se selecciona (azul)
2. ✅ Click en "TV" → se selecciona
3. ✅ Click en "WiFi" otra vez → se deselecciona
4. ✅ Multiple selection funciona

#### Toggles
1. ✅ Toggle "Amoblado" → activa (azul)
2. ✅ Toggle "Estacionamiento" → activa
3. ✅ Toggle "Mascotas" → activa
4. ✅ Toggle otra vez → desactiva

**Resultado esperado:**
- Selección múltiple de amenidades
- Toggles suaves con animación
- Estados visuales claros

---

### Test 7: Precio Formateado

**Objetivo:** Verificar formato de moneda

1. ✅ Ir a Paso 4
2. ✅ Ingresar "1500" → muestra "S/ 1,500"
3. ✅ Cambiar a "Dólares" → muestra "$ 1,500"
4. ✅ Ingresar "2500.50" → muestra "S/ 2,500.50"

**Resultado esperado:**
- Formato con separadores de miles
- Símbolo de moneda correcto
- Decimales opcionales

---

### Test 8: Preview Final

**Objetivo:** Verificar paso de revisión

1. ✅ Completar todos los pasos
2. ✅ Ir a Paso 8
3. ✅ Ver preview card con:
   - Imagen de portada
   - Título
   - Dirección
   - Precio formateado
   - Dormitorios, baños, área
4. ✅ Verificar mensaje de validación:
   - ✅ Verde si todo completo
   - ⚠️ Amarillo si falta algo

**Resultado esperado:**
- Preview realista de la publicación
- Validación final clara
- Términos y condiciones

---

### Test 9: Publicación

**Objetivo:** Verificar flujo de publicación

1. ✅ Completar wizard completo
2. ✅ Paso 8: Click "Publicar propiedad"
3. ✅ Ver botón con spinner "Publicando..."
4. ✅ Esperar 2s (mock API)
5. ✅ Ver modal de éxito
6. ✅ Modal se cierra automáticamente (2s)
7. ✅ Redirección a /dashboard

**Resultado esperado:**
- Loading state visible
- Modal de éxito aparece
- Auto-close y redirección
- localStorage limpio

---

### Test 10: Recuperación de Borrador

**Objetivo:** Verificar recovery después de cerrar

1. ✅ Completar Paso 1, 2, 3
2. ✅ Verificar auto-guardado (localStorage)
3. ✅ Cerrar navegador
4. ✅ Volver a abrir página
5. ✅ Ver datos recuperados
6. ✅ Continuar desde Paso 3

**Resultado esperado:**
- Datos persisten después de cierre
- Usuario puede continuar
- No pierde progreso

---

### Test 11: Botón Cerrar

**Objetivo:** Verificar confirmación al cerrar

1. ✅ Iniciar wizard
2. ✅ Completar algunos pasos
3. ✅ Click botón "X" (cerrar)
4. ✅ Ver confirmación: "¿Deseas guardar como borrador?"
5. ✅ Click "Aceptar" → vuelve a dashboard
6. ✅ Reabrir → datos están guardados
7. ✅ Click "Cancelar" → permanece en wizard

**Resultado esperado:**
- Confirmación antes de cerrar
- Opción de guardar borrador
- No se pierde trabajo accidentalmente

---

### Test 12: Responsive Design

**Objetivo:** Verificar en diferentes tamaños

#### iPhone SE (375px)
- ✅ Todo visible sin scroll horizontal
- ✅ Touch targets ≥ 44px
- ✅ Texto legible

#### iPhone 12 Pro (390px)
- ✅ Layout correcto
- ✅ Botones accesibles

#### Pixel 5 (393px)
- ✅ Grid de amenidades 2 columnas
- ✅ Grid de imágenes 3 columnas

#### iPad Mini (768px - límite)
- ✅ Se mantiene en vista móvil
- ✅ No muestra desktop version

#### Desktop (1024px)
- ✅ Cambia a vista desktop
- ✅ Formulario largo completo

**Resultado esperado:**
- Responsive de 320px a 768px
- Desktop version a partir de 769px
- Sin scroll horizontal
- Touch targets adecuados

---

### Test 13: Indicador de Progreso

**Objetivo:** Verificar StepIndicator

1. ✅ Paso 1 → círculo azul, resto gris
2. ✅ Paso 2 → círculo 1 verde con ✓, círculo 2 azul
3. ✅ Paso 8 → círculos 1-7 verdes, círculo 8 azul
4. ✅ Líneas conectoras verdes si completado
5. ✅ Títulos de pasos visibles

**Resultado esperado:**
- Progreso visual claro
- Estados: completado (verde), actual (azul), pendiente (gris)
- Checkmarks en completados

---

### Test 14: Contact Preferences

**Objetivo:** Verificar selección de contacto

1. ✅ Ir a Paso 7
2. ✅ Ingresar teléfono: "987654321"
3. ✅ Ingresar email: "test@email.com"
4. ✅ Seleccionar "WhatsApp" → borde verde
5. ✅ Seleccionar "Email" → cambia a morado
6. ✅ Seleccionar "Llamada" → cambia a azul

**Resultado esperado:**
- Solo 1 método seleccionado a la vez
- Colores distintos por método
- Visual feedback claro

---

### Test 15: Límites de Caracteres

**Objetivo:** Verificar contadores

#### Título (Paso 3)
- ✅ Ingresar texto
- ✅ Ver contador: "45/100 caracteres"
- ✅ Llegar a 100 → no permite más

#### Descripción (Paso 3)
- ✅ Ingresar texto largo
- ✅ Ver contador: "250/500 caracteres"
- ✅ Llegar a 500 → no permite más

**Resultado esperado:**
- Contadores actualizados en tiempo real
- Límites respetados
- Visual feedback

---

## 🐛 Reporte de Bugs

### Template para reportar

```markdown
## Bug: [Título corto]

**Pasos para reproducir:**
1. 
2. 
3. 

**Comportamiento esperado:**


**Comportamiento actual:**


**Screenshots:**


**Dispositivo:**
- Navegador: 
- Resolución: 
- OS: 
```

---

## ✅ Checklist Final

### Funcionalidad
- [ ] Todos los 8 pasos navegan correctamente
- [ ] Validaciones funcionan
- [ ] Auto-guardado funciona
- [ ] Recuperación de borrador funciona
- [ ] Carga de imágenes funciona
- [ ] Publicación simula correctamente
- [ ] Modal de éxito aparece
- [ ] Redirección funciona

### UX
- [ ] Animaciones suaves
- [ ] No hay scroll horizontal
- [ ] Touch targets ≥ 44px
- [ ] Feedback visual en todos los botones
- [ ] Estados disabled claros
- [ ] Loading states visibles

### Responsive
- [ ] 375px (iPhone SE) ✓
- [ ] 390px (iPhone 12) ✓
- [ ] 393px (Pixel 5) ✓
- [ ] 768px (iPad mini) ✓
- [ ] 1024px (Desktop) muestra versión desktop ✓

### Performance
- [ ] Carga rápida (<3s)
- [ ] No hay flickering
- [ ] Transiciones fluidas
- [ ] Auto-guardado no bloquea UI

---

## 📞 Soporte

### Logs de Debugging

```javascript
// En consola del navegador
localStorage.getItem('listing_draft')
// Ver borrador guardado

localStorage.removeItem('listing_draft')
// Limpiar borrador

// Ver paso actual
console.log('Current step:', currentStep);

// Ver datos completos
console.log('Form data:', data);
```

### Reset Completo

```javascript
// Limpiar todo y empezar de nuevo
localStorage.clear();
location.reload();
```

---

## 🎯 Criterios de Éxito

✅ **Aprobado si:**
- Todos los tests pasan
- No hay errores en consola
- Navegación fluida
- Auto-guardado funciona
- Responsive correcto
- UX intuitiva

❌ **Rechazado si:**
- Tests críticos fallan
- Errores de JavaScript
- Layout roto en móvil
- Pérdida de datos
- Botones no responden

---

## 📈 Próximos Tests

### Fase 2 (Después de integrar API)
- Test de creación real
- Test de edición
- Test de upload de imágenes
- Test de errores de red
- Test de validaciones backend

### Fase 3 (Testing avanzado)
- Tests de accesibilidad (WCAG)
- Tests de performance (Lighthouse)
- Tests en dispositivos reales
- Tests de diferentes navegadores
- Tests de offline support
