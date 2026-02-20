# Configuración de RSA Keys en Culqi

## ⚠️ IMPORTANTE
Según la documentación oficial de Culqi, **para encriptar el payload necesitas generar un ID RSA y llave RSA**.

## 📋 Pasos para obtener las RSA Keys

### 1. Acceder al Panel de Culqi
- Ve a tu panel de Culqi: https://integ-panel.culqi.com/ (para pruebas)
- O producción: https://panel.culqi.com/

### 2. Navegar a RSA Keys
```
Panel Culqi → Desarrollo → RSA Keys
```

### 3. Generar tu RSA ID y llave RSA
- Haz clic en el botón para generar nuevas llaves RSA
- Se te proporcionará:
  - **RSA ID**: Un identificador único (ej: `rsa_id_abc123`)
  - **RSA Public Key**: Una llave pública larga que comienza con `-----BEGIN PUBLIC KEY-----`

### 4. Agregar a tu `.env`
```bash
# Culqi RSA Keys - REQUERIDO para encriptación
CULQI_RSA_ID=tu_rsa_id_aqui
CULQI_RSA_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
...tu llave completa aquí...
-----END PUBLIC KEY-----"
```

## 🔐 Por qué son necesarias

Según la documentación de Culqi Python SDK:

> **Para encriptar el payload** debes generar un id y llave RSA ingresando a tu CulqiPanel > Desarrollo > RSA Keys.

### Uso en el código:
```python
from culqi.client import Culqi

# Configuración
culqi = Culqi(public_key, secret_key)

# Con encriptación RSA
options = {
    "rsa_public_key": rsa_public_key,
    "rsa_id": rsa_id
}
charge = culqi.charge.create(data=charge_data, **options)
```

## 📖 Referencias
- [SDK Python Culqi](https://docs.culqi.com/es/documentacion/librerias/backend/sdk_python)
- Sección: "Configuración → 2. Encriptar payload"

## 🎯 Siguiente Paso
1. Contacta a soporte de Culqi para activar tus llaves API (pk_test y sk_test)
2. Genera las RSA keys desde el panel
3. Actualiza tu archivo `.env` con ambas configuraciones
4. Reinicia tu servidor backend
5. Prueba el flujo de pago completo

## ⚡ Contacto Culqi
- WhatsApp: +51 970 141 600
- Email: soporte@culqi.com
- Merchant ID: 200000000188116
- Merchant: Renta Facil
