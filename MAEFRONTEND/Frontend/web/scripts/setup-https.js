const fs = require('fs');
const path = require('path');

const certsDir = path.join(__dirname, '..', 'certs');

// Crear directorio de certificados si no existe
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
  console.log('✅ Directorio de certificados creado');
}

const certPath = path.join(certsDir, 'localhost.crt');
const keyPath = path.join(certsDir, 'localhost.key');

// Verificar si los certificados ya existen
if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  console.log('✅ Los certificados SSL ya existen');
  console.log(`   Certificado: ${certPath}`);
  console.log(`   Clave: ${keyPath}`);
  process.exit(0);
}

console.log('🔐 Generando certificados SSL auto-firmados...');

(async () => {
  try {
    const mkcert = require('mkcert');
    
    // Crear una Autoridad Certificadora (CA)
    const ca = await mkcert.createCA({
      organization: 'RentaFacil Dev',
      countryCode: 'PE',
      state: 'Lima',
      locality: 'Lima',
      validity: 365
    });

    // Crear el certificado
    const cert = await mkcert.createCert({
      domains: ['localhost', '127.0.0.1', '::1'],
      validity: 365,
      ca: {
        key: ca.key,
        cert: ca.cert
      }
    });

    // Guardar los certificados
    fs.writeFileSync(keyPath, cert.key);
    fs.writeFileSync(certPath, cert.cert);
    
    // Guardar también el CA para instalarlo manualmente si es necesario
    const caPath = path.join(certsDir, 'rootCA.crt');
    fs.writeFileSync(caPath, ca.cert);

    console.log('✅ Certificados SSL generados exitosamente');
    console.log(`   Certificado: ${certPath}`);
    console.log(`   Clave: ${keyPath}`);
    console.log(`   CA Raíz: ${caPath}`);
    console.log('');
    console.log('🔐 ========================================');
    console.log('   IMPORTANTE: CONFIAR EN EL CERTIFICADO');
    console.log('🔐 ========================================');
    console.log('');
    console.log('⚠️  Para que la GEOLOCALIZACIÓN funcione, debes:');
    console.log('');
    console.log('📱 OPCIÓN 1 - Método Rápido (Chrome/Edge):');
    console.log('   1. Abre https://localhost:3000');
    console.log('   2. Verás "Tu conexión no es privada"');
    console.log('   3. Haz click en "Avanzado"');
    console.log('   4. Escribe en el teclado: thisisunsafe');
    console.log('   5. ¡Listo! El certificado se aceptará');
    console.log('');
    console.log('🔒 OPCIÓN 2 - Instalar Certificado Raíz:');
    console.log('');
    console.log('   Windows (Chrome/Edge):');
    console.log('   1. Abre: chrome://settings/security');
    console.log('   2. "Gestionar certificados"');
    console.log('   3. Pestaña "Entidades... raíz de confianza"');
    console.log('   4. "Importar" → Selecciona rootCA.crt');
    console.log('   5. Marca "Confiar para identificar sitios web"');
    console.log('   6. Reinicia Chrome');
    console.log('');
    console.log('   Windows (Manual):');
    console.log('   1. Doble click en: ' + caPath);
    console.log('   2. Click en "Instalar certificado"');
    console.log('   3. Selecciona "Usuario actual"');
    console.log('   4. "Colocar certificados en... siguiente almacén"');
    console.log('   5. Selecciona "Entidades de certificación raíz de confianza"');
    console.log('   6. Finalizar');
    console.log('');
    console.log('   Firefox:');
    console.log('   1. about:preferences#privacy');
    console.log('   2. "Certificados" → "Ver certificados"');
    console.log('   3. Pestaña "Entidades"');
    console.log('   4. "Importar" → rootCA.crt');
    console.log('   5. Marca todas las opciones');
    console.log('');
    console.log('🚀 Después ejecuta: npm run dev:https');
    console.log('');
  } catch (error) {
    console.error('❌ Error al generar certificados:');
    console.error(error.message);
    console.log('');
    console.log('💡 Ejecuta: npm install');
    process.exit(1);
  }
})();
