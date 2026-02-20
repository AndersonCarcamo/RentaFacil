from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, Request
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.api.deps import get_db, get_current_admin_user
from app.services.admin_service import AdminService
from app.schemas.admin import (
    AdminDashboardResponse, AdminUserListResponse, AdminUserResponse,
    UserSuspensionCreate, UserSuspensionResponse, AdminListingListResponse,
    AdminListingResponse, ListingFlagCreate, ListingFlagResponse,
    SystemHealthResponse, SystemMetricsResponse, AuditLogListResponse,
    UserFilters, ListingFilters, AuditLogFilters
)
from app.schemas.admin_plans import (
    SubscriptionPlanUpdate,
    SubscriptionPlanResponse,
    AdminUserCreate,
    AdminUserResponse as AdminUserResponsePlans,
    AdminActionLog,
    AdminOverviewStats
)
from app.schemas.auth import UserResponse
from app.core.exceptions import NotFoundError, ValidationError
from app.models.subscription import Plan as SubscriptionPlan
from app.models.auth import User

router = APIRouter()

# Lista de administradores del sistema
SYSTEM_ADMIN_EMAILS = [
    'admin@easyrent.pe',
    'administrador@easyrent.pe'
]


@router.get("/dashboard", response_model=AdminDashboardResponse)
def get_admin_dashboard(
    current_user: UserResponse = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Dashboard de administración
    
    - Métricas principales del sistema
    - Estado de salud de componentes
    - Actividades recientes
    - Alertas del sistema
    """
    service = AdminService(db)
    return service.get_dashboard_data()


# User Management Endpoints
@router.get("/users", response_model=AdminUserListResponse)
def get_users_admin(
    role: Optional[List[str]] = Query(None),
    status: Optional[List[str]] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Gestión de usuarios (admin)
    
    - Lista todos los usuarios del sistema con filtros
    - Información detallada para administración
    - Soporte para búsqueda y paginación
    """
    skip = (page - 1) * size
    
    filters = UserFilters(
        role=role,
        status=status,
        search=search
    )
    
    service = AdminService(db)
    users, total = service.get_users_for_admin(
        filters=filters,
        skip=skip,
        limit=size
    )
    
    # Convertir a respuestas de admin (con información adicional)
    admin_users = []
    for user in users:
        # Aquí se calcularían las estadísticas adicionales por usuario
        admin_user = AdminUserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            phone_number=user.phone_number,
            role=getattr(user, 'role', 'user'),
            status='active' if user.is_active else 'inactive',
            is_verified=user.is_verified,
            verification_documents=0,  # TODO: Calcular real
            listings_count=0,  # TODO: Calcular real
            active_subscriptions=0,  # TODO: Calcular real
            last_login=getattr(user, 'last_login', None),
            created_at=user.created_at,
            updated_at=user.updated_at,
            is_suspended=False,  # TODO: Verificar suspensiones activas
            suspension_reason=None,
            suspension_expires=None,
            total_payments=0.0,  # TODO: Calcular real
            flags_received=0  # TODO: Calcular real
        )
        admin_users.append(admin_user)
    
    return AdminUserListResponse(
        items=admin_users,
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size,
        has_next=page * size < total,
        has_prev=page > 1
    )


@router.post("/users/{user_id}/suspend", response_model=UserSuspensionResponse)
def suspend_user(
    user_id: UUID = Path(..., description="ID del usuario a suspender"),
    suspension_data: UserSuspensionCreate = ...,
    request: Request = ...,
    current_user: UserResponse = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Suspender usuario
    
    - Permite suspender usuarios por tiempo limitado o indefinido
    - Registra la razón y notas administrativas
    - Genera log de auditoría automáticamente
    """
    try:
        service = AdminService(db)
        suspension = service.suspend_user(
            user_id=user_id,
            suspension_data=suspension_data,
            admin_id=current_user.id
        )
        
        return suspension
        
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/users/{user_id}/unsuspend")
def unsuspend_user(
    user_id: UUID = Path(..., description="ID del usuario"),
    request: Request = ...,
    current_user: UserResponse = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Quitar suspensión
    
    - Remover suspensión activa de un usuario
    - Registra la acción en el log de auditoría
    """
    try:
        service = AdminService(db)
        result = service.unsuspend_user(
            user_id=user_id,
            admin_id=current_user.id
        )
        
        if result:
            return {"message": "Suspensión removida exitosamente"}
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo remover la suspensión"
            )
            
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró suspensión activa para este usuario"
        )


# Listing Management Endpoints
@router.get("/listings", response_model=AdminListingListResponse)
def get_listings_admin(
    status: Optional[List[str]] = Query(None),
    verification_status: Optional[List[str]] = Query(None),
    property_type: Optional[List[str]] = Query(None),
    listing_type: Optional[List[str]] = Query(None),
    flagged: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Gestión de listings (admin)
    
    - Lista todos los listings del sistema con filtros avanzados
    - Información detallada para moderación
    - Filtros por estado, verificación, flags, etc.
    """
    skip = (page - 1) * size
    
    filters = ListingFilters(
        status=status,
        verification_status=verification_status,
        property_type=property_type,
        listing_type=listing_type,
        flagged=flagged,
        search=search
    )
    
    service = AdminService(db)
    listings, total = service.get_listings_for_admin(
        filters=filters,
        skip=skip,
        limit=size
    )
    
    # Convertir a respuestas de admin (con información adicional)
    admin_listings = []
    for listing in listings:
        # Aquí se calcularían las estadísticas adicionales por listing
        admin_listing = AdminListingResponse(
            id=listing.id,
            title=listing.title,
            property_type=listing.property_type,
            listing_type=listing.listing_type,
            status=listing.status,
            owner_id=listing.owner_id,
            owner_name="",  # TODO: Obtener nombre del owner
            price=listing.price,
            currency=listing.currency,
            location=listing.location,
            verification_status=None,  # TODO: Obtener estado de verificación
            views_count=0,  # TODO: Calcular real
            favorites_count=0,  # TODO: Calcular real
            leads_count=0,  # TODO: Calcular real
            flags_count=0,  # TODO: Calcular real
            created_at=listing.created_at,
            updated_at=listing.updated_at
        )
        admin_listings.append(admin_listing)
    
    return AdminListingListResponse(
        items=admin_listings,
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size,
        has_next=page * size < total,
        has_prev=page > 1
    )


@router.post("/listings/{listing_id}/flag", response_model=ListingFlagResponse)
def flag_listing(
    listing_id: UUID = Path(..., description="ID del listing"),
    flag_data: ListingFlagCreate = ...,
    request: Request = ...,
    current_user: UserResponse = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Marcar listing como problemático
    
    - Permite a los admins marcar listings con problemas
    - Especificar razón y notas adicionales
    - Inicia proceso de revisión
    """
    try:
        service = AdminService(db)
        flag = service.flag_listing(
            listing_id=listing_id,
            flag_data=flag_data,
            admin_id=current_user.id
        )
        
        # Convertir a respuesta (necesitaría información adicional del listing)
        flag_response = ListingFlagResponse(
            id=flag.id,
            listing_id=flag.listing_id,
            listing_title="",  # TODO: Obtener título del listing
            reported_by=flag.reported_by,
            reporter_name=None,
            admin_id=flag.admin_id,
            admin_name=current_user.full_name,
            reason=flag.reason,
            description=flag.description,
            admin_notes=flag.admin_notes,
            status=flag.status,
            is_resolved=flag.is_resolved,
            action_taken=flag.action_taken,
            created_at=flag.created_at,
            reviewed_at=flag.reviewed_at,
            resolved_at=flag.resolved_at
        )
        
        return flag_response
        
    except NotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing no encontrado"
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# System Health Endpoints
@router.get("/system/health", response_model=SystemHealthResponse)
def get_system_health(
    current_user: UserResponse = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Estado del sistema
    
    - Estado de salud de todos los componentes
    - Métricas de uptime y rendimiento
    - Detecta componentes críticos
    """
    service = AdminService(db)
    components = service.get_system_health()
    
    if not components:
        return SystemHealthResponse(
            overall_status="healthy",
            components=[],
            summary={"healthy": 0, "warning": 0, "critical": 0, "maintenance": 0}
        )
    
    # Calcular estado general y resumen
    status_counts = {"healthy": 0, "warning": 0, "critical": 0, "maintenance": 0}
    overall_status = "healthy"
    
    for component in components:
        status_counts[component.status.value] += 1
        
        # Determinar estado general (el más crítico gana)
        if component.status.value == "critical":
            overall_status = "critical"
        elif component.status.value == "warning" and overall_status == "healthy":
            overall_status = "warning"
        elif component.status.value == "maintenance" and overall_status in ["healthy"]:
            overall_status = "maintenance"
    
    # Convertir componentes a respuesta
    component_responses = []
    for comp in components:
        component_responses.append({
            "component_name": comp.component_name,
            "component_type": comp.component_type,
            "status": comp.status,
            "status_message": comp.status_message,
            "response_time_ms": comp.response_time_ms,
            "uptime_percentage": comp.uptime_percentage,
            "last_error": comp.last_error,
            "error_count": comp.error_count,
            "version": comp.version,
            "last_check_at": comp.last_check_at,
            "last_healthy_at": comp.last_healthy_at
        })
    
    return SystemHealthResponse(
        overall_status=overall_status,
        components=component_responses,
        summary=status_counts
    )


@router.get("/system/metrics", response_model=SystemMetricsResponse)
def get_system_metrics(
    metric_name: Optional[str] = Query(None),
    service: Optional[str] = Query(None),
    hours: int = Query(24, ge=1, le=168),
    current_user: UserResponse = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Métricas del sistema
    
    - Métricas técnicas detalladas del sistema
    - Filtros por nombre de métrica y servicio
    - Datos históricos configurables
    """
    admin_service = AdminService(db)
    metrics = admin_service.get_system_metrics(
        metric_name=metric_name,
        service=service,
        hours=hours
    )
    
    # Convertir métricas a respuesta
    metric_responses = []
    for metric in metrics:
        metric_responses.append({
            "id": metric.id,
            "metric_name": metric.metric_name,
            "metric_type": metric.metric_type,
            "value": metric.value,
            "unit": metric.unit,
            "service": metric.service,
            "instance": metric.instance,
            "environment": metric.environment,
            "tags": metric.tags,
            "timestamp": metric.timestamp
        })
    
    # Calcular resumen
    summary = {}
    if metrics:
        summary = {
            "total_metrics": len(metrics),
            "time_range": {
                "from": min(m.timestamp for m in metrics),
                "to": max(m.timestamp for m in metrics)
            },
            "services": list(set(m.service for m in metrics if m.service)),
            "metric_types": list(set(m.metric_type for m in metrics))
        }
    
    return SystemMetricsResponse(
        metrics=metric_responses,
        summary=summary
    )


# Audit Log Endpoints
@router.get("/audit-log", response_model=AuditLogListResponse)
def get_audit_log(
    action: Optional[List[str]] = Query(None),
    user_id: Optional[UUID] = Query(None),
    target_type: Optional[str] = Query(None),
    target_id: Optional[UUID] = Query(None),
    severity: Optional[List[str]] = Query(None),
    category: Optional[List[str]] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Log de auditoría
    
    - Historial completo de acciones del sistema
    - Filtros avanzados por acción, usuario, fechas
    - Información detallada para auditorías y debugging
    """
    skip = (page - 1) * size
    
    # Convertir fechas de string a datetime si se proporcionan
    from_datetime = None
    to_datetime = None
    try:
        if from_date:
            from_datetime = datetime.fromisoformat(from_date.replace('Z', '+00:00'))
        if to_date:
            to_datetime = datetime.fromisoformat(to_date.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formato de fecha inválido. Use formato ISO 8601"
        )
    
    filters = AuditLogFilters(
        action=action,
        user_id=user_id,
        target_type=target_type,
        target_id=target_id,
        severity=severity,
        category=category,
        from_date=from_datetime,
        to_date=to_datetime,
        search=search
    )
    
    service = AdminService(db)
    logs, total = service.get_audit_logs(
        filters=filters,
        skip=skip,
        limit=size
    )
    
    return AuditLogListResponse(
        items=logs,
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size,
        has_next=page * size < total,
        has_prev=page > 1
    )


# ==================== ENDPOINTS DE GESTIÓN DE PLANES ====================

@router.get("/plans", response_model=List[SubscriptionPlanResponse])
async def get_subscription_plans_admin(
    include_inactive: bool = Query(False, description="Incluir planes inactivos"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_admin_user)
):
    """
    Obtener todos los planes de suscripción (solo admins).
    
    - **include_inactive**: Si es True, incluye planes inactivos
    """
    query = select(SubscriptionPlan)
    
    if not include_inactive:
        query = query.where(SubscriptionPlan.active == True)
    
    query = query.order_by(SubscriptionPlan.sort_order)
    
    result = db.execute(query)
    plans = result.scalars().all()
    
    return plans


@router.get("/plans/{plan_id}", response_model=SubscriptionPlanResponse)
async def get_plan_details_admin(
    plan_id: str = Path(..., description="ID del plan"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_admin_user)
):
    """
    Obtener detalles de un plan específico (solo admins).
    """
    result = db.execute(
        select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id)
    )
    plan = result.scalar_one_or_none()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan '{plan_id}' no encontrado"
        )
    
    return plan


@router.put("/plans/{plan_id}", response_model=SubscriptionPlanResponse)
async def update_subscription_plan_admin(
    plan_id: str = Path(..., description="ID del plan"),
    plan_update: SubscriptionPlanUpdate = ...,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_admin_user)
):
    """
    Actualizar un plan de suscripción existente (solo admins).
    
    Permite modificar:
    - Nombre y descripción
    - Precios (mensual y anual)
    - Límites (propiedades, imágenes, videos, etc.)
    - Características/features
    - Estado activo/inactivo
    """
    # Verificar que el plan existe
    result = db.execute(
        select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id)
    )
    plan = result.scalar_one_or_none()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan '{plan_id}' no encontrado"
        )
    
    # Actualizar solo los campos proporcionados
    update_data = plan_update.dict(exclude_unset=True)
    
    # Validaciones
    if 'price_monthly' in update_data and update_data['price_monthly'] < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El precio mensual no puede ser negativo"
        )
    
    if 'price_yearly' in update_data and update_data['price_yearly'] < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El precio anual no puede ser negativo"
        )
    
    # Actualizar campos del plan
    for field, value in update_data.items():
        setattr(plan, field, value)
    
    plan.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(plan)
    
    # Log de auditoría
    print(f"📝 Admin {current_user.email} actualizó el plan {plan_id}: {update_data}")
    
    return plan


@router.post("/plans", response_model=SubscriptionPlanResponse)
async def create_subscription_plan_admin(
    plan_data: SubscriptionPlanUpdate = ...,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_admin_user)
):
    """
    Crear un nuevo plan de suscripción (solo admins).
    """
    if not plan_data.name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre del plan es requerido"
        )
    
    # Generar ID único basado en el nombre
    plan_id = plan_data.name.lower().replace(' ', '_').replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u')
    
    # Verificar que no existe un plan con ese ID
    result = db.execute(
        select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id)
    )
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un plan con ID '{plan_id}'"
        )
    
    # Crear nuevo plan
    new_plan = SubscriptionPlan(
        id=plan_id,
        **plan_data.dict(exclude_unset=True, exclude={'name'}),
        name=plan_data.name,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    
    print(f"📝 Admin {current_user.email} creó el plan {plan_id}")
    
    return new_plan


@router.delete("/plans/{plan_id}")
async def delete_subscription_plan_admin(
    plan_id: str = Path(..., description="ID del plan"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_admin_user)
):
    """
    Eliminar (desactivar) un plan de suscripción (solo admins).
    
    En lugar de eliminar físicamente, se marca como inactivo.
    """
    result = db.execute(
        select(SubscriptionPlan).where(SubscriptionPlan.id == plan_id)
    )
    plan = result.scalar_one_or_none()
    
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Plan '{plan_id}' no encontrado"
        )
    
    # Marcar como inactivo en lugar de eliminar
    plan.active = False
    plan.updated_at = datetime.utcnow()
    
    db.commit()
    
    print(f"📝 Admin {current_user.email} desactivó el plan {plan_id}")
    
    return {"message": f"Plan '{plan_id}' desactivado correctamente"}


# ==================== ENDPOINTS DE GESTIÓN DE ADMINISTRADORES ====================

@router.get("/admins", response_model=List[AdminUserResponsePlans])
async def get_admin_users_list(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_admin_user)
):
    """
    Listar todos los usuarios administradores (solo admins).
    """
    # Obtener administradores de la base de datos
    result = db.execute(
        select(User).where(User.role == UserRole.ADMIN)
    )
    db_admins = result.scalars().all()
    
    # Convertir a respuesta
    admins = []
    for db_admin in db_admins:
        admins.append(AdminUserResponsePlans(
            email=db_admin.email,
            addedDate=db_admin.created_at.isoformat() if db_admin.created_at else datetime.utcnow().isoformat(),
            addedBy="Sistema",
            isSystemAdmin=db_admin.email.lower() in SYSTEM_ADMIN_EMAILS
        ))
    
    # Agregar administradores del sistema si no están en la BD
    for system_email in SYSTEM_ADMIN_EMAILS:
        if not any(a.email.lower() == system_email.lower() for a in admins):
            admins.append(AdminUserResponsePlans(
                email=system_email,
                addedDate=datetime(2024, 1, 1).isoformat(),
                addedBy="Sistema",
                isSystemAdmin=True
            ))
    
    return admins


@router.post("/admins", response_model=AdminUserResponsePlans)
async def add_admin_user_new(
    admin_data: AdminUserCreate = ...,
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_admin_user)
):
    """
    Agregar un nuevo usuario administrador (solo admins).
    
    - **email**: Email del usuario a convertir en administrador
    """
    email = admin_data.email.lower().strip()
    
    # Buscar el usuario en la base de datos
    result = db.execute(
        select(User).where(User.email == email)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró un usuario con el email '{email}'"
        )
    
    # Verificar si ya es administrador
    if user.role == UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El usuario '{email}' ya es administrador"
        )
    
    # Marcar como administrador
    user.role = UserRole.ADMIN
    user.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(user)
    
    print(f"📝 Admin {current_user.email} agregó a {email} como administrador")
    
    return AdminUserResponsePlans(
        email=user.email,
        addedDate=datetime.utcnow().isoformat(),
        addedBy=current_user.email,
        isSystemAdmin=False
    )


@router.delete("/admins/{email}")
async def remove_admin_user_delete(
    email: str = Path(..., description="Email del administrador a eliminar"),
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_admin_user)
):
    """
    Eliminar privilegios de administrador de un usuario (solo admins).
    
    No se pueden eliminar administradores del sistema.
    """
    email = email.lower().strip()
    
    # Verificar que no es un administrador del sistema
    if email in SYSTEM_ADMIN_EMAILS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No se pueden eliminar administradores del sistema"
        )
    
    # Buscar el usuario
    result = db.execute(
        select(User).where(User.email == email)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró un usuario con el email '{email}'"
        )
    
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El usuario '{email}' no es administrador"
        )
    
    # Verificar que no es el último administrador
    result = db.execute(
        select(User).where(User.role == UserRole.ADMIN)
    )
    admin_count = len(result.scalars().all())
    
    if admin_count <= 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No se puede eliminar el último administrador del sistema"
        )
    
    # Remover privilegios de administrador
    user.role = UserRole.USER
    user.updated_at = datetime.utcnow()
    
    db.commit()
    
    print(f"📝 Admin {current_user.email} removió a {email} como administrador")
    
    return {"message": f"Privilegios de administrador removidos de '{email}'"}


# ==================== ENDPOINTS DE ESTADÍSTICAS ====================

@router.get("/stats/overview", response_model=AdminOverviewStats)
async def get_admin_overview_statistics(
    db: Session = Depends(get_db),
    current_user: UserResponse = Depends(get_current_admin_user)
):
    """
    Obtener estadísticas generales para el panel de administrador.
    """
    # Contar usuarios totales
    result = db.execute(select(User))
    total_users = len(result.scalars().all())
    
    # TODO: Agregar más estadísticas cuando las tablas estén disponibles
    
    return AdminOverviewStats(
        totalUsers=total_users,
        activeListings=0,
        premiumSubscriptions=0,
        monthlyRevenue=0.0,
        lastUpdated=datetime.utcnow().isoformat()
    )
