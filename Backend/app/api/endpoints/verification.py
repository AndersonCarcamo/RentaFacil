"""
Endpoints para verificación de identidad
Nota: El procesamiento OCR se realiza a través de un microservicio externo
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid
import httpx
from datetime import datetime
from loguru import logger

from app.core.database import get_db
from app.core.config import settings
from app.api.deps import get_current_user
from app.models.auth import User
from app.models.verification import Verification, VerificationDocument, VerificationStatus as DBVerificationStatus, VerificationType
from app.schemas.verification import (
    DNIVerificationResponse,
    UserVerificationStatus,
    VerificationStatus,
    VerificationListResponse
)

# URL del servicio OCR (puede configurarse via variable de entorno)
OCR_SERVICE_URL = os.getenv("OCR_SERVICE_URL", "http://localhost:8001")


router = APIRouter()


# Directorio para almacenar documentos de verificación
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
MEDIA_DIR = os.path.join(BASE_DIR, "media")
VERIFICATION_MEDIA_DIR = os.path.join(MEDIA_DIR, "verifications")
os.makedirs(VERIFICATION_MEDIA_DIR, exist_ok=True)


def save_verification_file(
    user_id: str,
    file: UploadFile,
    document_type: str
) -> tuple[str, str]:
    """
    Guarda un archivo de verificación
    
    Args:
        user_id: ID del usuario
        file: Archivo a guardar
        document_type: Tipo de documento (dni_front, dni_back)
        
    Returns:
        Tuple con (ruta_completa, ruta_relativa)
    """
    # Crear directorio para el usuario
    user_dir = os.path.join(VERIFICATION_MEDIA_DIR, str(user_id))
    os.makedirs(user_dir, exist_ok=True)
    
    # Generar nombre único para el archivo
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{document_type}_{uuid.uuid4()}{file_extension}"
    
    # Rutas
    full_path = os.path.join(user_dir, unique_filename)
    relative_path = os.path.join("verifications", str(user_id), unique_filename)
    
    # Guardar archivo
    with open(full_path, "wb") as buffer:
        content = file.file.read()
        buffer.write(content)
    
    logger.info(f"Archivo guardado: {relative_path}")
    return full_path, relative_path


@router.post("/verify-dni", response_model=DNIVerificationResponse, status_code=status.HTTP_201_CREATED)
async def verify_dni(
    dni_front: UploadFile = File(..., description="Imagen del frente del DNI"),
    dni_back: Optional[UploadFile] = File(None, description="Imagen del reverso del DNI (opcional)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Verifica la identidad del usuario mediante OCR del DNI
    
    - **dni_front**: Imagen del frente del DNI (obligatorio)
    - **dni_back**: Imagen del reverso del DNI (opcional, para validación adicional)
    
    El sistema extrae automáticamente:
    - Número de DNI
    - Nombres y apellidos
    - Fecha de nacimiento
    
    Y valida que coincidan con los datos registrados del usuario.
    """
    try:
        # Validar que el usuario sea propietario
        if current_user.role != "landlord":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo los propietarios pueden verificar su identidad con DNI"
            )
        
        # Validar que no tenga una verificación pendiente o aprobada
        existing_verification = db.query(Verification).filter(
            Verification.requester_id == current_user.id,
            Verification.target_type == VerificationType.USER,
            Verification.status.in_([DBVerificationStatus.PENDING, DBVerificationStatus.APPROVED])
        ).first()
        
        if existing_verification:
            if existing_verification.status == DBVerificationStatus.APPROVED:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Tu cuenta ya está verificada"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Ya tienes una verificación en proceso. Por favor espera la revisión."
                )
        
        # Validar formato de archivos
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.pdf']
        front_ext = os.path.splitext(dni_front.filename)[1].lower()
        
        if front_ext not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Formato no permitido. Use: {', '.join(allowed_extensions)}"
            )
        
        # Guardar imagen frontal
        front_full_path, front_relative_path = save_verification_file(
            current_user.id,
            dni_front,
            "dni_front"
        )
        
        # Procesar OCR en la imagen frontal mediante servicio externo
        logger.info(f"Enviando imagen al servicio OCR para usuario {current_user.id}")
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # Enviar imagen al servicio OCR
                with open(front_full_path, 'rb') as f:
                    files = {'image': (dni_front.filename, f, dni_front.content_type)}
                    ocr_response = await client.post(
                        f"{OCR_SERVICE_URL}/process-dni",
                        files=files
                    )
                
                if ocr_response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="Servicio OCR no disponible. Intenta más tarde."
                    )
                
                ocr_data = ocr_response.json()
                
                if not ocr_data.get('success'):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=ocr_data.get('error', 'No se pudo procesar el DNI')
                    )
                
                extracted_data = ocr_data.get('extracted_data', {})
                
                # Validar datos extraídos con datos del usuario
                validation_payload = {
                    "dni_number": current_user.national_id,
                    "first_name": current_user.first_name or "",
                    "last_name": current_user.last_name or "",
                    "extracted_data": extracted_data
                }
                
                validation_response = await client.post(
                    f"{OCR_SERVICE_URL}/validate-dni",
                    json=validation_payload
                )
                
                if validation_response.status_code != 200:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="Servicio de validación no disponible"
                    )
                
                validation_result = validation_response.json()
                
        except httpx.RequestError as e:
            logger.error(f"Error conectando con servicio OCR: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Servicio OCR no disponible. Por favor, intenta más tarde."
            )
        
        # Guardar imagen trasera si se proporciona
        back_relative_path = None
        if dni_back:
            back_ext = os.path.splitext(dni_back.filename)[1].lower()
            if back_ext in allowed_extensions:
                _, back_relative_path = save_verification_file(
                    current_user.id,
                    dni_back,
                    "dni_back"
                )
        
        # Crear registro de verificación
        verification = Verification(
            target_type=VerificationType.USER,
            target_id=current_user.id,
            requester_id=current_user.id,
            status=DBVerificationStatus.UNDER_REVIEW,
            requester_notes="Verificación automática mediante OCR",
            verification_data={
                'extracted_data': extracted_data,
                'validation_result': validation_result,
                'confidence_score': validation_result.get('confidence_score', 0.0),
                'auto_processed': True
            }
        )
        
        db.add(verification)
        db.flush()
        
        # Crear documentos asociados
        front_doc = VerificationDocument(
            verification_id=verification.id,
            document_type="dni_front",
            file_path=front_relative_path,
            file_name=dni_front.filename,
            file_size=dni_front.size or 0,
            mime_type=dni_front.content_type,
            uploaded_by=current_user.id
        )
        db.add(front_doc)
        
        if back_relative_path and dni_back:
            back_doc = VerificationDocument(
                verification_id=verification.id,
                document_type="dni_back",
                file_path=back_relative_path,
                file_name=dni_back.filename,
                file_size=dni_back.size or 0,
                mime_type=dni_back.content_type,
                uploaded_by=current_user.id
            )
            db.add(back_doc)
        
        # Decisión automática basada en confianza
        confidence_score = validation_result.get('confidence_score', 0.0)
        
        if confidence_score >= 0.9 and validation_result.get('is_valid'):
            # Alta confianza: aprobar automáticamente
            verification.status = DBVerificationStatus.APPROVED
            verification.review_completed_at = datetime.utcnow()
            verification.moderator_notes = "Aprobado automáticamente - Alta confianza en OCR"
            
            # Marcar usuario como verificado
            current_user.is_verified = True
            
            message = "¡Verificación exitosa! Tu identidad ha sido confirmada automáticamente."
            
        elif confidence_score >= 0.7:
            # Confianza media: dejar en revisión manual
            verification.status = DBVerificationStatus.UNDER_REVIEW
            message = "Tu solicitud está en revisión. Nuestro equipo la revisará en menos de 24 horas."
            
        else:
            # Baja confianza: requerir revisión manual
            verification.status = DBVerificationStatus.UNDER_REVIEW
            message = "Necesitamos revisar tu solicitud manualmente. Te notificaremos en 24-48 horas."
        
        db.commit()
        db.refresh(verification)
        
        logger.info(
            f"Verificación creada: {verification.id} - "
            f"Usuario: {current_user.id} - "
            f"Confianza: {confidence_score:.2f} - "
            f"Estado: {verification.status}"
        )
        
        return DNIVerificationResponse(
            id=str(verification.id),
            status=VerificationStatus(verification.status.value),
            message=message,
            extracted_data=extracted_data if confidence_score >= 0.5 else None,
            validation_result=validation_result if confidence_score >= 0.5 else None,
            confidence_score=confidence_score,
            created_at=verification.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en verificación DNI: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar la verificación: {str(e)}"
        )


@router.get("/status", response_model=UserVerificationStatus)
async def get_verification_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtiene el estado de verificación del usuario actual
    """
    # Buscar verificación más reciente
    latest_verification = db.query(Verification).filter(
        Verification.requester_id == current_user.id,
        Verification.target_type == VerificationType.USER
    ).order_by(Verification.created_at.desc()).first()
    
    pending_verification = False
    verification_status = None
    verification_date = None
    
    if latest_verification:
        verification_status = VerificationStatus(latest_verification.status.value)
        pending_verification = latest_verification.status in [
            DBVerificationStatus.PENDING,
            DBVerificationStatus.UNDER_REVIEW
        ]
        if latest_verification.status == DBVerificationStatus.APPROVED:
            verification_date = latest_verification.review_completed_at
    
    return UserVerificationStatus(
        is_verified=current_user.is_verified,
        verification_status=verification_status,
        verification_date=verification_date,
        pending_verification=pending_verification
    )


@router.get("/history", response_model=VerificationListResponse)
async def get_verification_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtiene el historial de verificaciones del usuario
    """
    verifications = db.query(Verification).filter(
        Verification.requester_id == current_user.id,
        Verification.target_type == VerificationType.USER
    ).order_by(Verification.created_at.desc()).all()
    
    verification_responses = []
    pending_count = 0
    approved_count = 0
    rejected_count = 0
    
    for v in verifications:
        verification_responses.append(
            DNIVerificationResponse(
                id=str(v.id),
                status=VerificationStatus(v.status.value),
                message="",
                extracted_data=v.verification_data.get('extracted_data'),
                validation_result=v.verification_data.get('validation_result'),
                confidence_score=v.verification_data.get('confidence_score'),
                created_at=v.created_at
            )
        )
        
        if v.status == DBVerificationStatus.PENDING or v.status == DBVerificationStatus.UNDER_REVIEW:
            pending_count += 1
        elif v.status == DBVerificationStatus.APPROVED:
            approved_count += 1
        elif v.status == DBVerificationStatus.REJECTED:
            rejected_count += 1
    
    return VerificationListResponse(
        verifications=verification_responses,
        total=len(verifications),
        pending_count=pending_count,
        approved_count=approved_count,
        rejected_count=rejected_count
    )
