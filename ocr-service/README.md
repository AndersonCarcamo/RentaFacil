# Servicio OCR para Verificación de DNI

Microservicio independiente para procesamiento OCR de documentos de identidad (DNI peruano).

## 🚀 Características

- ✅ Extracción automática de datos de DNI
- ✅ Validación de datos extraídos
- ✅ API REST simple y eficiente
- ✅ Dockerizado para fácil despliegue
- ✅ Sin conflictos con el backend principal

## 📋 Requisitos

### Opción 1: Docker (Recomendado)
- Docker
- Docker Compose

### Opción 2: Instalación Local
- Python 3.11+
- Tesseract OCR (con pack de idioma español)

## 🐳 Instalación con Docker

```bash
# Desde el directorio ocr-service
docker-compose up -d
```

El servicio estará disponible en `http://localhost:8001`

## 💻 Instalación Local

### 1. Instalar Tesseract OCR

**Windows:**
```powershell
# Descargar desde: https://github.com/UB-Mannheim/tesseract/wiki
# Instalar y agregar al PATH
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr tesseract-ocr-spa
```

**macOS:**
```bash
brew install tesseract tesseract-lang
```

### 2. Crear entorno virtual e instalar dependencias

```bash
python -m venv venv

# Windows
.\venv\Scripts\activate

# Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Ejecutar el servicio

```bash
python main.py
```

O usando uvicorn directamente:

```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

## 📡 API Endpoints

### Health Check
```http
GET /health
```

Respuesta:
```json
{
  "status": "healthy",
  "tesseract_version": "5.x.x"
}
```

### Procesar DNI
```http
POST /process-dni
Content-Type: multipart/form-data

image: [archivo de imagen]
```

Respuesta exitosa:
```json
{
  "success": true,
  "extracted_data": {
    "dni_number": "12345678",
    "first_name": "JUAN",
    "last_name": "PEREZ GARCIA",
    "birth_date": "01/01/1990"
  }
}
```

### Validar Datos
```http
POST /validate-dni
Content-Type: application/json

{
  "dni_number": "12345678",
  "first_name": "Juan",
  "last_name": "Perez",
  "extracted_data": {
    "dni_number": "12345678",
    "first_name": "JUAN",
    "last_name": "PEREZ GARCIA"
  }
}
```

Respuesta:
```json
{
  "dni_match": true,
  "name_match": true,
  "confidence_score": 0.95,
  "mismatches": []
}
```

## 🔧 Configuración

El servicio funciona sin configuración adicional, pero puedes ajustar:

- **Puerto**: Editar `docker-compose.yml` o ejecutar con `--port`
- **Timeout OCR**: Modificar en `ocr_service.py`
- **Preprocesamiento**: Ajustar parámetros en `DNIOCRService.preprocess_image()`

## 🧪 Pruebas

```bash
# Verificar que el servicio está corriendo
curl http://localhost:8001/health

# Probar procesamiento de DNI
curl -X POST http://localhost:8001/process-dni \
  -F "image=@ruta/a/dni_frontal.jpg"
```

## 🔄 Integración con Backend Principal

El backend principal (puerto 8000) se comunica con este servicio mediante HTTP:

```python
import httpx

async def process_dni_via_ocr_service(image_path: str):
    async with httpx.AsyncClient() as client:
        with open(image_path, 'rb') as f:
            files = {'image': f}
            response = await client.post(
                'http://localhost:8001/process-dni',
                files=files
            )
            return response.json()
```

## 📝 Logs

Los logs del servicio se escriben en stdout. Con Docker:

```bash
docker-compose logs -f ocr-service
```

## 🛑 Detener el Servicio

### Docker:
```bash
docker-compose down
```

### Local:
```bash
# Ctrl+C en la terminal donde corre el servicio
```

## 🐛 Troubleshooting

### Tesseract no encontrado
```
Error: Tesseract is not installed or it's not in your PATH
```
**Solución**: Instalar Tesseract y agregar al PATH del sistema

### Baja precisión OCR
- Verificar que la imagen sea clara y de buena calidad
- Asegurar buena iluminación en la imagen
- Imagen del DNI debe estar derecha (no rotada)
- Resolución mínima recomendada: 1200x800px

### Puerto en uso
```
Error: Address already in use
```
**Solución**: Cambiar el puerto en `docker-compose.yml` o al ejecutar localmente

## 📦 Estructura del Proyecto

```
ocr-service/
├── main.py              # Servidor FastAPI
├── ocr_service.py       # Lógica de OCR
├── requirements.txt     # Dependencias Python
├── Dockerfile          # Imagen Docker
├── docker-compose.yml  # Orquestación Docker
└── README.md           # Documentación
```

## 🔒 Seguridad

- ⚠️ En producción, configurar CORS específico (no usar `*`)
- ⚠️ Implementar autenticación entre servicios
- ⚠️ Usar HTTPS en producción
- ⚠️ Limitar tamaño de archivos subidos

## 📄 Licencia

Parte del proyecto EasyRent
