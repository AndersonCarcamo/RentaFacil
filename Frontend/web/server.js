const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');
const os = require('os');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Escuchar en todas las interfaces
const port = 3000;

// Rutas a los certificados (en el mismo directorio que server.js)
const certsDir = path.join(__dirname, 'certs');
const certPath = path.join(certsDir, 'localhost.crt');
const keyPath = path.join(certsDir, 'localhost.key');

// Verificar que los certificados existan
if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.error('❌ Certificados SSL no encontrados.');
  console.error('   Por favor ejecuta: npm run setup:https');
  process.exit(1);
}

// Crear app de Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpsOptions = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };

  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    
    // Obtener la IP local de la máquina
    const networkInterfaces = os.networkInterfaces();
    const localIPs = [];
    
    Object.keys(networkInterfaces).forEach((interfaceName) => {
      networkInterfaces[interfaceName].forEach((iface) => {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIPs.push(iface.address);
        }
      });
    });
    
    console.log('');
    console.log('🔐 ========================================');
    console.log('   SERVIDOR HTTPS INICIADO');
    console.log('🔐 ========================================');
    console.log('');
    console.log('✅ Servidor listo en:');
    console.log(`   • Local:    https://localhost:${port}`);
    console.log(`   • Red local: https://${localIPs[0] || 'IP-NO-DETECTADA'}:${port}`);
    console.log('');
    if (localIPs.length > 0) {
      console.log('📱 Para conectar desde tu celular:');
      console.log(`   1. Conéctate a la misma WiFi`);
      console.log(`   2. Abre: https://${localIPs[0]}:${port}`);
      console.log(`   3. Acepta el certificado en tu celular`);
      console.log('');
    }
    console.log('⚠️  ADVERTENCIA DE SEGURIDAD:');
    console.log('   Tu navegador mostrará una advertencia porque');
    console.log('   estamos usando certificados auto-firmados.');
    console.log('');
    console.log('📱 Para aceptar el certificado:');
    console.log('   • Chrome: Escribe "thisisunsafe" en la página');
    console.log('   • Firefox: "Avanzado" → "Aceptar riesgo"');
    console.log('   • Edge: "Avanzado" → "Continuar"');
    console.log('   • Safari (iOS): "Detalles" → "Visitar este sitio"');
    console.log('');
    console.log('🌍 Geolocalización:');
    console.log('   Ahora puedes usar navigator.geolocation');
    console.log('   porque estás en HTTPS');
    console.log('');
    console.log('🔐 ========================================');
    console.log('');
  });
});
