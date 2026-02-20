# Integración con Servicio OCR

El sistema de verificación de identidad utiliza un **microservicio OCR independiente** para procesar documentos DNI.

## 🔗 Arquitectura

```
Frontend (3000) → Backend (8000) → OCR Service (8001)
                                      ↓
                                  Tesseract OCR
```

## 📋 Requisitos

Para que la verificación de identidad funcione, necesitas:

1. **Backend principal** corriendo en puerto 8000
2. **Servicio OCR** corriendo en puerto 8001

## 🚀 Inicio Rápido

### 1. Iniciar Servicio OCR

```bash
cd ../ocr-service

# Opción A: Con Docker (recomendado)
docker-compose up -d

# Opción B: Sin Docker
python main.py
```

Verifica que esté corriendo:
```bash
curl http://localhost:8001/health
```

### 2. Iniciar Backend

```bash
cd Backend
python -m uvicorn app.main:app --reload
```

## 🔧 Configuración

El backend se comunica con el servicio OCR mediante la variable de entorno:

```env
OCR_SERVICE_URL=http://localhost:8001
```

Puedes cambiar la URL si el servicio OCR está en otro servidor.

## 📡 Endpoints de Verificación

### POST /v1/verification/verify-dni

Sube imágenes del DNI para verificación automática.

**Request:**
```http
POST /v1/verification/verify-dni
Authorization: Bearer {token}
Content-Type: multipart/form-data

dni_front: [archivo JPG/PNG]
dni_back: [archivo JPG/PNG] (opcional)
```

**Response (Auto-aprobado - confianza ≥90%):**
```json
{
  "verification_id": "uuid",
  "status": "APPROVED",
  "confidence_score": 0.95,
  "extracted_data": {
    "dni_number": "12345678",
    "first_name": "JUAN",
    "last_name": "PEREZ GARCIA"
  },
  "message": "¡Verificación exitosa! Tu cuenta ha sido verificada automáticamente."
}
```

**Response (Revisión manual - confianza 70-89%):**
```json
{
  "verification_id": "uuid",
  "status": "UNDER_REVIEW",
  "confidence_score": 0.75,
  "message": "Tu documentación está en revisión. Te notificaremos en 24 horas."
}
```

### GET /v1/verification/status

Obtiene el estado actual de verificación del usuario.

**Response:**
```json
{
  "is_verified": false,
  "has_pending_verification": true,
  "latest_verification": {
    "id": "uuid",
    "status": "UNDER_REVIEW",
    "created_at": "2025-10-25T10:00:00Z"
  }
}
```

### GET /v1/verification/history

Obtiene el historial de intentos de verificación.

**Response:**
```json
{
  "verifications": [
    {
      "id": "uuid",
      "status": "APPROVED",
      "confidence_score": 0.95,
      "created_at": "2025-10-25T10:00:00Z"
    }
  ],
  "total": 1,
  "by_status": {
    "APPROVED": 1,
    "REJECTED": 0,
    "UNDER_REVIEW": 0
  }
}
```

## 🔍 Flujo de Verificación

1. **Usuario sube DNI** → Frontend envía al Backend
2. **Backend guarda archivos** → Almacena en `/media/verifications/{user_id}/`
3. **Backend llama a OCR Service** → POST `/process-dni`
4. **OCR extrae datos** → DNI, nombres, apellidos
5. **Backend valida datos** → POST `/validate-dni` al OCR Service
6. **Decisión automática:**
   - Confianza ≥90%: **Auto-aprobado** ✅
   - Confianza ≥70%: **Revisión 24h** ⏱️
   - Confianza <70%: **Revisión manual** 👤
7. **Usuario notificado** → Email + notificación en dashboard

## 🐛 Troubleshooting

### Servicio OCR no disponible

**Error:**
```
503 Service Unavailable: Servicio OCR no disponible
```

**Solución:**
1. Verifica que el servicio OCR esté corriendo:
   ```bash
   curl http://localhost:8001/health
   ```
2. Revisa los logs del servicio OCR
3. Verifica la variable `OCR_SERVICE_URL` en tu configuración

### Timeout en procesamiento

**Error:**
```
Request timeout al procesar DNI
```

**Soluciones:**
- Reduce el tamaño de la imagen (max 5MB recomendado)
- Verifica que la imagen no esté corrupta
- Aumenta el timeout en el código (default 30s)

### Baja precisión OCR

**Problema:** Muchos documentos requieren revisión manual

**Soluciones:**
- Validar calidad de imagen en frontend antes de enviar
- Agregar instrucciones claras al usuario sobre cómo tomar la foto
- Ajustar parámetros de preprocesamiento en el servicio OCR

## 📊 Monitoreo

### Logs del Backend

```bash
# Ver logs en tiempo real
tail -f logs/app.log

# Buscar errores de OCR
grep "OCR" logs/app.log | grep ERROR
```

### Logs del Servicio OCR

```bash
# Con Docker
docker-compose -f ../ocr-service/docker-compose.yml logs -f

# Sin Docker
# Los logs aparecen en stdout donde corre el servicio
```

### Métricas Importantes

- Tasa de auto-aprobación (objetivo: >60%)
- Tiempo promedio de procesamiento (objetivo: <5s)
- Tasa de error de OCR (objetivo: <10%)
- Precisión de validación (objetivo: >95%)

## 🔒 Seguridad

### Comunicación entre servicios

En **desarrollo**: HTTP sin autenticación (localhost)

En **producción**: 
- Usar HTTPS
- Implementar autenticación con API Key:
  ```python
  headers = {"X-API-Key": os.getenv("OCR_SERVICE_API_KEY")}
  ```
- Limitar acceso por firewall/red interna

### Datos sensibles

- Las imágenes de DNI se almacenan en `/media/verifications/`
- Solo accesibles por el propietario y administradores
- Se recomienda cifrar en reposo en producción
- Implementar política de retención (ej: eliminar después de 90 días)

## 🚀 Despliegue en Producción

### Opción 1: Docker Compose

```yaml
# docker-compose.yml (proyecto completo)
version: '3.8'

services:
  backend:
    build: ./Backend
    ports:
      - "8000:8000"
    environment:
      - OCR_SERVICE_URL=http://ocr-service:8001
    depends_on:
      - ocr-service
      - postgres
  
  ocr-service:
    build: ./ocr-service
    ports:
      - "8001:8001"
  
  postgres:
    image: postgres:17
    ...
```

### Opción 2: Servidores Separados

**Backend:**
```bash
OCR_SERVICE_URL=https://ocr.tudominio.com python -m uvicorn app.main:app
```

**OCR Service:**
```bash
# En otro servidor
docker-compose up -d
```

## 📚 Referencias

- [Documentación Servicio OCR](../ocr-service/README.md)
- [API Endpoints Verificación](./ENDPOINTS.md#verificación)
- [Modelo de Datos](./DATABASE.md#verifications)
