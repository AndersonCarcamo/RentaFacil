"""
Servicio OCR independiente para procesamiento de DNI
Puerto: 8001
"""
from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import tempfile
import shutil
from loguru import logger

# Importar el servicio OCR versión 2 (optimizado)
from ocr_service_v2 import DNIOCRService

app = FastAPI(
    title="OCR Service",
    description="Microservicio independiente para procesamiento OCR de DNI peruano",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inicializar servicio OCR
dni_ocr_service = DNIOCRService()


class OCRResponse(BaseModel):
    success: bool
    extracted_data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class ValidationRequest(BaseModel):
    dni_number: Optional[str]
    first_name: str
    last_name: str
    extracted_data: Dict[str, Any]


class ValidationResponse(BaseModel):
    dni_match: bool
    name_match: bool
    confidence_score: float
    mismatches: list[str]


@app.get("/")
async def root():
    """Health check"""
    return {
        "service": "OCR Service",
        "status": "running",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Verificar que el servicio está funcionando"""
    try:
        # Verificar que Tesseract esté disponible
        version = dni_ocr_service.get_tesseract_version()
        return {
            "status": "healthy",
            "tesseract_version": version
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"OCR service not available: {str(e)}"
        )


@app.post("/process-dni", response_model=OCRResponse)
async def process_dni_image(
    image: UploadFile = File(..., description="Imagen del DNI (frente)")
):
    """
    Procesa una imagen de DNI y extrae información
    """
    temp_path = None
    
    try:
        # Validar tipo de archivo
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El archivo debe ser una imagen"
            )
        
        # Guardar archivo temporal
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            shutil.copyfileobj(image.file, temp_file)
            temp_path = temp_file.name
        
        logger.info(f"Procesando imagen DNI: {image.filename}")
        
        # Procesar imagen con OCR
        extracted_data = dni_ocr_service.process_dni_image(temp_path)
        
        if not extracted_data:
            return OCRResponse(
                success=False,
                error="No se pudo extraer información del DNI. Verifica que la imagen sea clara."
            )
        
        return OCRResponse(
            success=True,
            extracted_data=extracted_data
        )
        
    except Exception as e:
        logger.error(f"Error procesando DNI: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar la imagen: {str(e)}"
        )
    
    finally:
        # Limpiar archivo temporal
        if temp_path and os.path.exists(temp_path):
            try:
                os.unlink(temp_path)
            except:
                pass


@app.post("/validate-dni", response_model=ValidationResponse)
async def validate_dni_data(request: ValidationRequest):
    """
    Valida los datos extraídos del DNI contra los datos del usuario
    """
    try:
        logger.info(f"Validando datos de DNI para usuario")
        
        validation_result = dni_ocr_service.validate_dni_data(
            extracted_data=request.extracted_data,
            user_first_name=request.first_name,
            user_last_name=request.last_name,
            user_dni=request.dni_number
        )
        
        return ValidationResponse(**validation_result)
        
    except Exception as e:
        logger.error(f"Error validando DNI: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al validar datos: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
