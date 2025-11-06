// COMPONENTE DE PRUEBA - Pega esto en la consola del navegador mientras estás en localhost:3000

(function testGeolocation() {
  console.clear()
  console.log('%c🔍 TEST DE GEOLOCALIZACIÓN', 'font-size: 20px; font-weight: bold; color: #4CAF50')
  console.log('='.repeat(50))
  
  // Test 1: API disponible
  console.log('\n📋 Test 1: ¿API disponible?')
  console.log('navigator.geolocation existe:', !!navigator.geolocation)
  
  if (!navigator.geolocation) {
    console.error('❌ Tu navegador NO soporta geolocalización')
    return
  }
  
  // Test 2: Contexto seguro
  console.log('\n📋 Test 2: Contexto seguro')
  console.log('window.isSecureContext:', window.isSecureContext)
  console.log('protocol:', window.location.protocol)
  console.log('hostname:', window.location.hostname)
  
  if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
    console.warn('⚠️ Estás en HTTP (no localhost), puede fallar')
  }
  
  // Test 3: Permisos
  console.log('\n📋 Test 3: Estado de permisos')
  
  if (navigator.permissions) {
    navigator.permissions.query({ name: 'geolocation' }).then(result => {
      console.log('Estado actual:', result.state)
      
      const emoji = {
        'granted': '✅',
        'prompt': '⚠️',
        'denied': '❌'
      }[result.state] || '❓'
      
      console.log(`${emoji} ${result.state.toUpperCase()}`)
      
      if (result.state === 'granted') {
        console.log('%c✅ Permisos OK - Debería funcionar', 'color: green; font-weight: bold')
      } else if (result.state === 'prompt') {
        console.log('%c⚠️ Sin permisos aún - Te preguntará', 'color: orange; font-weight: bold')
      } else if (result.state === 'denied') {
        console.log('%c❌ PERMISOS BLOQUEADOS', 'color: red; font-weight: bold; font-size: 16px')
        console.log('\n🔧 CÓMO ARREGLARLO:')
        console.log('1. Mira junto a la URL → Hay un icono 🔒 o ℹ️')
        console.log('2. Haz CLICK en ese icono')
        console.log('3. Busca "Ubicación" o "Location"')
        console.log('4. Cámbialo a "Permitir" o "Allow"')
        console.log('5. Presiona Ctrl+Shift+R (Windows) o Cmd+Shift+R (Mac)')
        console.log('6. Si sigue fallando, cierra TODO el navegador y abre de nuevo')
      }
      
      // Test 4: Intentar obtener ubicación
      console.log('\n📋 Test 4: Intentando obtener ubicación...')
      console.log('⏳ Esperando GPS... (máx 10 segundos)')
      
      const startTime = Date.now()
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
          console.log(`\n%c✅ ¡ÉXITO! (${elapsed}s)`, 'color: green; font-size: 16px; font-weight: bold')
          console.log('Latitud:', position.coords.latitude)
          console.log('Longitud:', position.coords.longitude)
          console.log('Precisión:', Math.round(position.coords.accuracy), 'metros')
          console.log('Altitud:', position.coords.altitude || 'N/A')
          console.log('Velocidad:', position.coords.speed || 'N/A')
          
          console.log('\n🎉 Tu botón de ubicación FUNCIONARÁ')
          console.log('Puedes probarlo ahora en la página')
        },
        (error) => {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
          console.log(`\n%c❌ ERROR (${elapsed}s)`, 'color: red; font-size: 16px; font-weight: bold')
          console.log('Código de error:', error.code)
          console.log('Mensaje:', error.message)
          
          console.log('\n📖 Significado del error:')
          
          switch (error.code) {
            case 1: // PERMISSION_DENIED
              console.log('%c🔴 PERMISSION_DENIED (1)', 'font-weight: bold; font-size: 14px')
              console.log('Los permisos están BLOQUEADOS en el navegador')
              console.log('\n🔧 SOLUCIÓN:')
              console.log('1. Click en el 🔒 junto a la URL')
              console.log('2. Ubicación → Permitir')
              console.log('3. Ctrl+Shift+R para recargar')
              console.log('4. Si no funciona: Cierra TODO el navegador y reabre')
              console.log('\n💡 ALTERNATIVA: Ejecuta esto para ver dónde está:')
              console.log('chrome://settings/content/location')
              break
              
            case 2: // POSITION_UNAVAILABLE
              console.log('%c🟡 POSITION_UNAVAILABLE (2)', 'font-weight: bold; font-size: 14px')
              console.log('No se puede determinar la ubicación')
              console.log('\n🔧 POSIBLES CAUSAS:')
              console.log('• GPS del sistema desactivado')
              console.log('• Wi-Fi desconectado')
              console.log('• Servicios de ubicación del OS apagados')
              console.log('\n💡 SOLUCIÓN Windows:')
              console.log('Configuración → Privacidad → Ubicación → Activar')
              console.log('\n💡 SOLUCIÓN Mac:')
              console.log('System Preferences → Security & Privacy → Location Services')
              break
              
            case 3: // TIMEOUT
              console.log('%c🟠 TIMEOUT (3)', 'font-weight: bold; font-size: 14px')
              console.log('Tardó más de 10 segundos')
              console.log('\n🔧 SOLUCIÓN:')
              console.log('• Espera un momento y vuelve a intentar')
              console.log('• Muévete a un lugar con mejor señal')
              console.log('• Verifica que tengas conexión a internet')
              break
              
            default:
              console.log('%c❓ ERROR DESCONOCIDO', 'font-weight: bold; font-size: 14px')
              console.log('Código:', error.code)
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    }).catch(err => {
      console.error('❌ Error al verificar permisos:', err)
    })
  } else {
    console.warn('⚠️ API de permisos no disponible en este navegador')
    console.log('Intentando obtener ubicación de todas formas...')
    
    navigator.geolocation.getCurrentPosition(
      pos => console.log('✅ Funciona:', pos.coords),
      err => console.error('❌ Error:', err)
    )
  }
  
  console.log('\n' + '='.repeat(50))
  console.log('📸 Haz una captura de pantalla de esta consola')
  console.log('y envíasela al desarrollador si algo falla')
})()
