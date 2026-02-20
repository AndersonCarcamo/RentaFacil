# Instalación de Tesseract OCR para Verificación de DNI

## ✅ Pasos Completados

1. ✓ Instalación de dependencias Python:
   - pytesseract==0.3.10
   - opencv-python==4.8.1.78
   - pdf2image==1.16.3

2. ✓ Creación de servicios OCR:
   - `app/services/ocr_service.py` - Servicio principal de OCR
   - `app/api/endpoints/verification.py` - API de verificación
   - `app/schemas/verification.py` - Schemas de validación

3. ✓ Registro de rutas en el backend:
   - Router registrado en `app/main.py`
   - Endpoint disponible en: `/v1/verification/verify-dni`

4. ✓ Componente frontend creado:
   - `Frontend/web/components/VerificationModal.tsx`
   - Integrado en `Frontend/web/pages/dashboard.tsx`

## 🔧 Pasos Pendientes

### 1. Instalar Tesseract OCR (Requerido)

**Windows:**
1. Descargar el instalador desde: https://github.com/UB-Mannheim/tesseract/wiki
   - Opción recomendada: `tesseract-ocr-w64-setup-5.3.3.20231005.exe` (última versión estable)
2. Ejecutar el instalador
3. Durante la instalación, seleccionar:
   - ✓ Install Tesseract OCR
   - ✓ **Spanish language pack** (spa.traineddata) - IMPORTANTE
   - Ruta sugerida: `C:\Program Files\Tesseract-OCR\`
4. Agregar a PATH:
   ```powershell
   # Abrir PowerShell como Administrador
   [Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Program Files\Tesseract-OCR", "Machine")
   ```
5. Verificar instalación:
   ```bash
   tesseract --version
   ```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr tesseract-ocr-spa
```

**macOS:**
```bash
brew install tesseract tesseract-lang
```

### 2. Configurar Variable de Entorno (Solo Windows)

Si Tesseract no se encuentra automáticamente, agregar en `Backend/app/core/config.py`:

```python
# OCR Configuration
TESSERACT_CMD: str = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

Y en `Backend/app/services/ocr_service.py` agregar al inicio:

```python
import pytesseract
pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
```

### 3. Crear Directorio de Verificaciones

El directorio se crea automáticamente, pero puedes verificarlo:

```bash
# En Backend/
mkdir -p media/verifications
```

### 4. Reiniciar el Servidor Backend

Después de instalar Tesseract:

```bash
cd Backend
python -m uvicorn app.main:app --reload
```

### 5. Probar la Verificación

1. Iniciar sesión como propietario (landlord)
2. Ir al Dashboard
3. Click en "Verificar ahora" en el banner azul
4. Subir foto del DNI (frente obligatorio)
5. El sistema procesará automáticamente:
   - Extracción OCR de datos (nombre, DNI, fecha nacimiento)
   - Validación contra perfil de usuario
   - Aprobación automática si confianza ≥90%
   - Revisión manual si confianza 70-89%
   - Verificación manual si confianza <70%

## 📊 Funcionamiento del Sistema

### Flujo de Verificación

```
Usuario sube DNI
    ↓
Procesamiento OCR
    ↓
Extracción de datos (DNI, nombres, fecha)
    ↓
Validación contra perfil
    ↓
Cálculo de confianza (0-100%)
    ↓
├─ ≥90% → ✅ APROBADO (automático, is_verified=True)
├─ 70-89% → ⏳ EN REVISIÓN (24h manual)
└─ <70% → 📋 REVISIÓN MANUAL (24-48h)
```

### Endpoints Disponibles

- `POST /v1/verification/verify-dni` - Subir DNI para verificación
  - Headers: `Authorization: Bearer {token}`
  - Body (multipart/form-data):
    - `dni_front`: File (obligatorio)
    - `dni_back`: File (opcional)
  - Response:
    ```json
    {
      "verification_id": "uuid",
      "status": "APPROVED|UNDER_REVIEW",
      "confidence_score": 0.95,
      "extracted_data": {
        "dni_number": "12345678",
        "first_name": "JUAN",
        "last_name": "PEREZ GARCIA"
      },
      "message": "Verificación exitosa"
    }
    ```

- `GET /v1/verification/status` - Estado de verificación actual
- `GET /v1/verification/history` - Historial de verificaciones

## 🧪 Testing

### Probar OCR manualmente:

```python
from app.services.ocr_service import dni_ocr_service

# Procesar una imagen
result = dni_ocr_service.process_dni_image('/path/to/dni_front.jpg')
print(result)  # {'dni_number': '12345678', 'first_name': 'JUAN', ...}

# Validar datos
validation = dni_ocr_service.validate_dni_data(
    result, 
    user_first_name='Juan',
    user_last_name='Perez',
    user_dni='12345678'
)
print(validation['confidence_score'])  # 0.0 - 1.0
```

### Verificar Tesseract:

```bash
# Probar reconocimiento de texto
tesseract test_image.jpg output -l spa

# Ver paquetes de idiomas instalados
tesseract --list-langs
```

## 🔍 Troubleshooting

### Error: "tesseract is not installed or it's not in your PATH"

**Solución:**
1. Verificar que Tesseract esté instalado: `tesseract --version`
2. Si no está en PATH, agregarlo manualmente
3. Reiniciar la terminal/IDE después de agregar a PATH

### Error: "Failed to load language 'spa'"

**Solución:**
1. Reinstalar Tesseract con el paquete de idioma español
2. O descargar manualmente `spa.traineddata` de:
   https://github.com/tesseract-ocr/tessdata
3. Colocar en: `C:\Program Files\Tesseract-OCR\tessdata\`

### Error: "Could not find any fonts"

**Solución:**
- En Linux: `sudo apt-get install fonts-liberation`
- En Windows: Ya incluidas en la instalación

### Baja precisión del OCR (<70%)

**Causas comunes:**
- Imagen borrosa o con poca resolución
- Ángulo incorrecto de la foto
- Reflejos o sombras en el DNI
- DNI dañado o desgastado

**Soluciones:**
- Mejorar calidad de imagen (mínimo 300 DPI)
- Foto frontal sin ángulos
- Buena iluminación sin reflejos
- Ajustar parámetros de preprocesamiento en `ocr_service.py`

## 📚 Recursos Adicionales

- Documentación Tesseract: https://tesseract-ocr.github.io/
- Pytesseract GitHub: https://github.com/madmaze/pytesseract
- OpenCV Tutorials: https://docs.opencv.org/
- Modelos de idiomas: https://github.com/tesseract-ocr/tessdata

## 🎯 Próximos Pasos

Una vez completada la instalación:

1. ✅ Verificar que el servidor backend inicie sin errores
2. ✅ Probar el flujo completo de verificación
3. ✅ Ajustar umbrales de confianza si es necesario
4. ⏳ Implementar panel de administración para revisión manual
5. ⏳ Agregar notificaciones por email de cambio de estado
6. ⏳ Crear métricas y analytics de verificaciones
