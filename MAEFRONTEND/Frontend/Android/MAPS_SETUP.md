# 🗺️ Configuración de Google Maps para Android

## ✅ Cambios Implementados

### 1. **Navegación Corregida en HomeScreen**
- ✅ Ahora cuando configures filtros avanzados y presiones "Buscar", te lleva **directo a los resultados**
- ✅ Ya no te manda a SearchScreen si ya tienes filtros configurados
- ✅ La lógica verifica si hay filtros O ubicación antes de decidir la navegación

### 2. **Mapa Implementado en SearchResultsScreen**
- ✅ Vista de mapa completamente funcional con `react-native-maps`
- ✅ Marcadores personalizados mostrando el precio de cada propiedad
- ✅ Marcadores cambian de color (azul → amarillo) cuando están seleccionados
- ✅ Card flotante en la parte inferior mostrando detalles de la propiedad seleccionada
- ✅ Botón para cerrar el card y deseleccionar propiedad
- ✅ Botón "Mi ubicación" para centrar el mapa
- ✅ Manejo correcto cuando no hay propiedades o no tienen coordenadas

### 3. **Características del Mapa**
- 📍 **Marcadores con precio**: Cada propiedad muestra su precio en el marcador
- 🎯 **Selección interactiva**: Click en marcador muestra card con info
- 🗺️ **Centrado automático**: Se centra en la primera propiedad con coordenadas
- 📱 **Responsive**: Card flotante adaptado a móvil
- 🖼️ **Imágenes**: Muestra foto de la propiedad en el card
- ℹ️ **Información**: Muestra hab, baños, área en el card

## 🔑 Configuración de Google Maps API Key

### Paso 1: Obtener API Key
1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto o selecciona uno existente
3. Habilita "Maps SDK for Android"
4. Ve a "Credenciales" → "Crear credenciales" → "Clave de API"
5. Copia la API Key generada

### Paso 2: Agregar la API Key
Edita el archivo `app.json` y reemplaza `YOUR_GOOGLE_MAPS_API_KEY` con tu clave:

```json
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "TU_API_KEY_AQUI"
    }
  }
}
```

### Paso 3: Reiniciar el proyecto
```bash
# Detén el servidor si está corriendo (Ctrl+C)
# Limpia caché y reinicia
npx expo start --clear
```

## 🧪 Cómo Probar

### Probar Navegación con Filtros:
1. En HomeScreen, presiona "Filtros avanzados"
2. Configura algunos filtros (ej: 2 habitaciones, precio máximo 3000)
3. Presiona "Buscar" en el último paso
4. ✅ **Debe ir DIRECTO a SearchResultsScreen con resultados**

### Probar Vista de Mapa:
1. En SearchResultsScreen, presiona el botón "Mapa"
2. ✅ Verás el mapa con marcadores de propiedades
3. Presiona un marcador
4. ✅ Aparece un card flotante con info de la propiedad
5. Presiona la X para cerrar el card
6. Presiona el botón "Mi ubicación" para centrar en tu ubicación

## 📝 Notas Importantes

### Coordenadas de Propiedades
Para que las propiedades aparezcan en el mapa, deben tener `latitude` y `longitude`:
- Si no tienen coordenadas, se muestra mensaje explicativo
- El backend debe devolver estos campos en la API

### Marcadores Personalizados
- **Azul (#2563EB)**: Marcador normal
- **Amarillo (#FCD34D)**: Marcador seleccionado
- **Texto**: Muestra el precio formateado (S/ o $)
- **Escala**: El seleccionado es 10% más grande

### Región Inicial
- **Centro por defecto**: Lima, Perú (-12.0464, -77.0428)
- **Si hay propiedades**: Se centra en la primera con coordenadas
- **Delta**: 0.05 (zoom medio, cubre varios distritos)

## 🐛 Troubleshooting

### "Mapa en blanco" o "Error loading map"
- Verifica que la API Key esté correctamente configurada en `app.json`
- Asegúrate de haber habilitado "Maps SDK for Android" en Google Cloud
- Reinicia el proyecto con `npx expo start --clear`

### "No hay propiedades en el mapa"
- Verifica que las propiedades tengan `latitude` y `longitude`
- Revisa los logs de consola para ver propiedades cargadas
- Prueba con búsqueda en "Barranco" que debería tener coordenadas

### "Marcadores no aparecen"
- Verifica en consola que las propiedades tienen coordenadas válidas
- Los valores deben ser números, no strings
- Ejemplo: `latitude: -12.123, longitude: -77.456`

## 🎯 Próximos Pasos (Opcionales)

- [ ] Implementar clustering de marcadores cuando hay muchas propiedades
- [ ] Agregar filtro de mapa para buscar en área visible
- [ ] Implementar zoom automático para mostrar todas las propiedades
- [ ] Agregar animación de cámara al seleccionar propiedad
- [ ] Implementar mapa en modo oscuro

## 📱 Compatibilidad

- ✅ Android (react-native-maps con Google Maps)
- ⚠️ iOS (requiere configuración adicional de Apple Maps)
- ⚠️ Web (requiere google-map-react o leaflet)

---

**Última actualización**: 6 de enero de 2026
