from fastapi import APIRouter, Depends, HTTPException, status, Query, Path
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.api.deps import get_db, get_current_user, get_current_admin_user
from app.services.notification_service import NotificationService
from app.schemas.notifications import (
    NotificationCreate, NotificationUpdate, NotificationResponse,
    NotificationListResponse, NotificationFilters, NotificationMarkRead,
    NotificationSettingsCreate, NotificationSettingsUpdate, NotificationSettingsResponse,
    NotificationStats, BulkNotificationCreate, BulkNotificationResponse
)
from app.schemas.auth import UserResponse
from app.core.exceptions import NotFoundError, ValidationError

router = APIRouter()


@router.get("/", response_model=NotificationListResponse)
def get_notifications(
    notification_type: Optional[List[str]] = Query(None, alias="type"),
    status_filter: Optional[List[str]] = Query(None, alias="status"),
    priority: Optional[List[str]] = Query(None, alias="priority"),
    category: Optional[str] = Query(None),
    read: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtener notificaciones del usuario actual
    
    - Lista todas las notificaciones del usuario autenticado
    - Permite filtrar por tipo, estado, prioridad, etc.
    - Incluye contador de notificaciones no leídas
    """
    skip = (page - 1) * size
    
    filters = NotificationFilters(
        notification_type=notification_type,
        status=status_filter,
        priority=priority,
        category=category,
        read=read,
        search=search
    )
    
    service = NotificationService(db)
    notifications, total = service.get_user_notifications(
        user_id=current_user.id,
        filters=filters,
        skip=skip,
        limit=size
    )
    
    # Obtener contador de no leídas
    unread_count = service.get_unread_count(current_user.id)
    
    return NotificationListResponse(
        items=notifications,
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size,
        has_next=page * size < total,
        has_prev=page > 1,
        unread_count=unread_count
    )


@router.get("/unread-count", response_model=dict)
def get_unread_count(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtener cantidad de notificaciones no leídas
    
    - Endpoint ligero para obtener solo el contador
    - Útil para badges en tiempo real
    """
    service = NotificationService(db)
    count = service.get_unread_count(current_user.id)
    
    return {"unread_count": count}


@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(
    notification_id: UUID = Path(..., description="ID de la notificación"),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtener notificación específica
    
    - Solo se puede acceder a notificaciones propias
    """
    service = NotificationService(db)
    notification = service.get_notification(notification_id, current_user.id)
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificación no encontrada"
        )
    
    return notification


@router.post("/{notification_id}/read", response_model=dict)
def mark_notification_as_read(
    notification_id: UUID = Path(..., description="ID de la notificación"),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Marcar notificación específica como leída
    
    - Solo se puede marcar notificaciones propias
    """
    service = NotificationService(db)
    mark_data = NotificationMarkRead(notification_ids=[notification_id])
    count = service.mark_as_read(current_user.id, mark_data)
    
    if count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificación no encontrada o ya leída"
        )
    
    return {"message": "Notificación marcada como leída"}


@router.post("/read-all", response_model=dict)
def mark_all_notifications_as_read(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Marcar todas las notificaciones como leídas
    
    - Marca todas las notificaciones no leídas del usuario como leídas
    """
    service = NotificationService(db)
    mark_data = NotificationMarkRead()  # Sin IDs específicos = todas
    count = service.mark_as_read(current_user.id, mark_data)
    
    return {
        "message": f"{count} notificaciones marcadas como leídas",
        "count": count
    }


@router.delete("/{notification_id}")
def delete_notification(
    notification_id: UUID = Path(..., description="ID de la notificación"),
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Eliminar notificación
    
    - Solo se pueden eliminar notificaciones propias
    """
    service = NotificationService(db)
    deleted = service.delete_notification(notification_id, current_user.id)
    
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificación no encontrada"
        )
    
    return {"message": "Notificación eliminada"}


@router.get("/stats", response_model=NotificationStats)
def get_notification_stats(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtener estadísticas de notificaciones del usuario
    
    - Resumen de notificaciones por tipo, estado, prioridad
    - Contador de notificaciones recientes
    """
    service = NotificationService(db)
    return service.get_notification_stats(current_user.id)


# Endpoints de configuración
@router.get("/settings", response_model=NotificationSettingsResponse)
def get_notification_settings(
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Obtener configuración de notificaciones del usuario
    
    - Si no existe configuración, crea una con valores por defecto
    """
    service = NotificationService(db)
    settings = service.get_or_create_notification_settings(current_user.id)
    return settings


@router.put("/settings", response_model=NotificationSettingsResponse)
def update_notification_settings(
    settings_update: NotificationSettingsUpdate,
    current_user: UserResponse = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Actualizar configuración de notificaciones
    
    - Permite configurar métodos de entrega por tipo de notificación
    - Configurar horarios silenciosos, frecuencia de digest, etc.
    """
    try:
        service = NotificationService(db)
        settings = service.update_notification_settings(current_user.id, settings_update)
        return settings
    except NotFoundError:
        # Si no existe configuración, crear una nueva
        try:
            default_settings = NotificationSettingsCreate()
            # Aplicar las actualizaciones a los valores por defecto
            update_dict = settings_update.model_dump(exclude_unset=True)
            for field, value in update_dict.items():
                setattr(default_settings, field, value)
            
            settings = service.create_notification_settings(current_user.id, default_settings)
            return settings
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error creando configuración: {str(e)}"
            )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# Endpoints administrativos
@router.post("/admin/create", response_model=NotificationResponse)
def create_notification_admin(
    notification_data: NotificationCreate,
    current_user: UserResponse = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Crear notificación (solo admins)
    
    - Permite a los admins crear notificaciones para usuarios específicos
    - Útil para avisos del sistema, mantenimiento, etc.
    """
    try:
        service = NotificationService(db)
        notification = service.create_notification(notification_data, current_user.id)
        return notification
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/admin/bulk", response_model=BulkNotificationResponse)
def create_bulk_notifications(
    bulk_data: BulkNotificationCreate,
    current_user: UserResponse = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Crear notificaciones masivas (solo admins)
    
    - Enviar notificaciones a múltiples usuarios o todos los usuarios
    - Útil para anuncios generales, actualizaciones del sistema
    """
    try:
        service = NotificationService(db)
        result = service.create_bulk_notifications(bulk_data, current_user.id)
        return result
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/admin/cleanup/expired")
def cleanup_expired_notifications(
    current_user: UserResponse = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Limpiar notificaciones expiradas (solo admins)
    
    - Elimina notificaciones que han pasado su fecha de expiración
    - Tarea de mantenimiento del sistema
    """
    service = NotificationService(db)
    count = service.cleanup_expired_notifications()
    
    return {
        "message": f"{count} notificaciones expiradas eliminadas",
        "count": count
    }


@router.post("/admin/cleanup/old-read")
def cleanup_old_read_notifications(
    days: int = Query(30, ge=1, le=365, description="Días de antigüedad para eliminar notificaciones leídas"),
    current_user: UserResponse = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Limpiar notificaciones leídas antiguas (solo admins)
    
    - Elimina notificaciones leídas más antiguas que X días
    - Ayuda a mantener el tamaño de la base de datos
    """
    service = NotificationService(db)
    count = service.cleanup_old_read_notifications(days)
    
    return {
        "message": f"{count} notificaciones antiguas eliminadas",
        "count": count,
        "days": days
    }
