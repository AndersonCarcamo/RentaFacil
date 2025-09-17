from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.api.deps import get_db, get_current_user, get_current_admin_user
from app.services.verification_service import VerificationService
from app.schemas.verifications import (
    VerificationCreate, VerificationUpdate, VerificationResponse,
    VerificationDetailResponse, VerificationListResponse, VerificationFilters,
    ModerationQueueResponse, ModerationAssignment, ModerationActionResponse,
    ModerationDashboard, VerificationStats, VerificationDocumentResponse
)
from app.schemas.auth import UserResponse
from app.core.exceptions import NotFoundError, ValidationError

router = APIRouter()


@router.post("/", response_model=VerificationResponse, status_code=status.HTTP_201_CREATED)
def create_verification(
    verification_data: VerificationCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Crear nueva solicitud de verificación
    
    - Permite a usuarios solicitar verificación de sus entidades (listings, agencies, perfil)
    - Automáticamente se agrega a la cola de moderación
    """
    try:
        service = VerificationService(db)
        verification = service.create_verification(verification_data, current_user.id)
        return verification
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/", response_model=VerificationListResponse)
def get_verifications(
    status_filter: Optional[List[str]] = Query(None, alias="status"),
    verification_type: Optional[List[str]] = Query(None, alias="type"),
    priority: Optional[List[str]] = Query(None, alias="priority"),
    assigned: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtener lista de verificaciones
    
    - Usuarios normales solo ven sus propias verificaciones
    - Moderadores pueden ver todas las verificaciones
    """
    skip = (page - 1) * size
    
    # Determinar si el usuario es moderador (simplificado - en producción usar roles)
    is_moderator = hasattr(current_user, 'role') and current_user.role in ['moderator', 'admin']
    
    filters = VerificationFilters(
        status=status_filter,
        verification_type=verification_type,
        priority=priority,
        assigned=assigned,
        search=search
    )
    
    service = VerificationService(db)
    verifications, total = service.get_verifications(
        filters=filters,
        user_id=current_user.id,
        is_moderator=is_moderator,
        skip=skip,
        limit=size
    )
    
    return VerificationListResponse(
        items=verifications,
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size,
        has_next=page * size < total,
        has_prev=page > 1
    )


@router.get("/{verification_id}", response_model=VerificationDetailResponse)
def get_verification(
    verification_id: UUID = Path(..., description="ID de la verificación"),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtener detalles de una verificación específica
    
    - Solo el solicitante, moderador asignado o admins pueden ver los detalles
    """
    service = VerificationService(db)
    
    # Determinar si es moderador
    is_moderator = hasattr(current_user, 'role') and current_user.role in ['moderator', 'admin']
    user_id = None if is_moderator else current_user.id
    
    verification = service.get_verification(verification_id, user_id)
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verificación no encontrada"
        )
    
    return verification


@router.put("/{verification_id}", response_model=VerificationResponse)
def update_verification(
    verification_id: UUID,
    update_data: VerificationUpdate,
    current_user: UserResponse = Depends(get_current_admin_user),  # Solo moderadores/admins
    db: Session = Depends(get_db)
):
    """
    Actualizar verificación (solo moderadores/admins)
    
    - Permite cambiar estado, prioridad, agregar notas del moderador
    - Registra todas las acciones en el historial
    """
    try:
        service = VerificationService(db)
        verification = service.update_verification(
            verification_id, 
            update_data, 
            current_user.id
        )
        return verification
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verificación no encontrada"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/moderation/queue", response_model=List[ModerationQueueResponse])
def get_moderation_queue(
    assigned_to_me: bool = Query(False),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Obtener cola de moderación (solo moderadores/admins)
    
    - Lista todas las verificaciones pendientes de revisión
    - Permite filtrar por asignaciones personales
    """
    skip = (page - 1) * size
    assigned_to = current_user.id if assigned_to_me else None
    
    service = VerificationService(db)
    queue_items, total = service.get_moderation_queue(
        assigned_to=assigned_to,
        skip=skip,
        limit=size
    )
    
    return queue_items


@router.post("/moderation/assign/{verification_id}", response_model=ModerationQueueResponse)
def assign_verification(
    verification_id: UUID,
    assignment: ModerationAssignment,
    current_user: UserResponse = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Asignar verificación a moderador (solo admins)
    
    - Asigna una verificación específica a un moderador
    - Actualiza la cola de moderación con tiempo estimado
    """
    try:
        service = VerificationService(db)
        queue_item = service.assign_moderation(verification_id, assignment)
        return queue_item
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verificación no encontrada"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/moderation/start/{verification_id}", response_model=ModerationQueueResponse)
def start_processing(
    verification_id: UUID,
    current_user: UserResponse = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Iniciar procesamiento de verificación (solo moderadores asignados)
    
    - Marca el inicio del proceso de revisión
    - Cambia estado a "under_review"
    """
    try:
        service = VerificationService(db)
        queue_item = service.start_processing(verification_id, current_user.id)
        return queue_item
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verificación no encontrada en la cola"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/stats", response_model=VerificationStats)
def get_verification_stats(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtener estadísticas de verificaciones
    
    - Usuarios normales ven solo sus estadísticas
    - Moderadores/admins ven estadísticas globales
    """
    is_moderator = hasattr(current_user, 'role') and current_user.role in ['moderator', 'admin']
    user_id = None if is_moderator else current_user.id
    
    service = VerificationService(db)
    return service.get_verification_stats(user_id, is_moderator)


@router.get("/moderation/dashboard", response_model=ModerationDashboard)
def get_moderation_dashboard(
    current_user: UserResponse = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Dashboard de moderación (solo moderadores/admins)
    
    - Resumen completo del estado de moderación
    - Verificaciones recientes, cola pendiente, asignaciones
    """
    service = VerificationService(db)
    
    # Obtener estadísticas
    stats = service.get_verification_stats(is_moderator=True)
    
    # Obtener verificaciones recientes
    recent_verifications, _ = service.get_verifications(
        is_moderator=True,
        skip=0,
        limit=10
    )
    
    # Obtener cola pendiente
    pending_queue, _ = service.get_moderation_queue(skip=0, limit=10)
    
    # Obtener asignaciones del usuario actual
    my_assigned, _ = service.get_verifications(
        filters=VerificationFilters(assigned=True),
        user_id=current_user.id,
        is_moderator=True,
        skip=0,
        limit=10
    )
    
    # Obtener acciones recientes
    recent_actions, _ = service.get_moderation_actions(skip=0, limit=10)
    
    return ModerationDashboard(
        stats=stats,
        recent_verifications=recent_verifications,
        pending_queue=pending_queue,
        my_assigned=my_assigned,
        recent_actions=recent_actions
    )


@router.get("/actions", response_model=List[ModerationActionResponse])
def get_moderation_actions(
    verification_id: Optional[UUID] = Query(None),
    moderator_id: Optional[UUID] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Obtener historial de acciones de moderación (solo moderadores/admins)
    
    - Lista todas las acciones realizadas en el sistema de moderación
    - Permite filtrar por verificación o moderador específico
    """
    skip = (page - 1) * size
    
    service = VerificationService(db)
    actions, total = service.get_moderation_actions(
        verification_id=verification_id,
        moderator_id=moderator_id,
        skip=skip,
        limit=size
    )
    
    return actions


@router.post("/{verification_id}/documents", response_model=VerificationDocumentResponse)
def add_verification_document(
    verification_id: UUID,
    document_type: str,
    file_path: str,
    file_name: str,
    file_size: Optional[int] = None,
    mime_type: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Agregar documento a verificación
    
    - Solo el solicitante puede agregar documentos inicialmente
    - Los moderadores pueden solicitar documentos adicionales
    """
    try:
        service = VerificationService(db)
        document = service.add_document(
            verification_id=verification_id,
            document_type=document_type,
            file_path=file_path,
            file_name=file_name,
            uploaded_by=current_user.id,
            file_size=file_size,
            mime_type=mime_type
        )
        return document
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verificación no encontrada"
        )


@router.put("/documents/{document_id}/verify", response_model=VerificationDocumentResponse)
def verify_document(
    document_id: UUID,
    verified: bool,
    notes: Optional[str] = None,
    current_user: UserResponse = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Verificar documento (solo moderadores/admins)
    
    - Aprobar o rechazar documentos específicos
    - Agregar notas de verificación
    """
    try:
        service = VerificationService(db)
        document = service.verify_document(
            document_id=document_id,
            verified=verified,
            moderator_id=current_user.id,
            notes=notes
        )
        return document
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado"
        )
