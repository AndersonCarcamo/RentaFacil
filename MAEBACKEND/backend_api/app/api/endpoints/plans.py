"""
Plans API Endpoints
Endpoints para gestión de planes del sistema (core.plans)
"""

from fastapi import APIRouter, Depends, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from app.api.deps import get_db
from app.services.api_cache_service import api_cache_service
from app.schemas.plans import (
    PlanCreate,
    PlanUpdate,
    PlanResponse,
    PlanListResponse,
)
from app.services.plan_service import PlanService

router = APIRouter()


@router.get("/", response_model=PlanListResponse)
def get_all_plans(
    include_inactive: bool = False,
    tier: Optional[str] = None,
    target_user_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Obtener todos los planes del sistema
    
    Query params:
    - include_inactive: Incluir planes inactivos
    - tier: Filtrar por tier (individual_free, individual_basic, individual_premium, enterprise_free, enterprise_basic, enterprise_premium)
    - target_user_type: Filtrar por tipo de usuario (individual, agency)
    - skip: Registros a saltar (paginación)
    - limit: Límite de registros
    """
    cache_suffix = f"list:{include_inactive}:{tier or 'all'}:{target_user_type or 'all'}:{skip}:{limit}"
    cached_response = api_cache_service.get_static_data("plans-catalog", cache_suffix)
    if cached_response is not None:
        return cached_response

    plans = PlanService.get_all_plans(
        db=db,
        include_inactive=include_inactive,
        tier=tier,
        target_user_type=target_user_type,
        skip=skip,
        limit=limit
    )
    response = {"plans": plans, "total": len(plans)}
    api_cache_service.set_static_data("plans-catalog", cache_suffix, jsonable_encoder(response))
    return response


@router.get("/default", response_model=PlanResponse)
def get_default_plan(db: Session = Depends(get_db)):
    """Obtener el plan por defecto del sistema"""
    cached_response = api_cache_service.get_static_data("plans-catalog", "default")
    if cached_response is not None:
        return cached_response

    plan = PlanService.get_default_plan(db)
    if not plan:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("No hay un plan por defecto configurado")
    api_cache_service.set_static_data("plans-catalog", "default", jsonable_encoder(plan))
    return plan


@router.get("/{plan_id}", response_model=PlanResponse)
def get_plan(plan_id: UUID, db: Session = Depends(get_db)):
    """Obtener un plan por ID"""
    cache_suffix = f"id:{plan_id}"
    cached_response = api_cache_service.get_static_data("plans-catalog", cache_suffix)
    if cached_response is not None:
        return cached_response

    plan = PlanService.get_plan_by_id(db, plan_id)
    api_cache_service.set_static_data("plans-catalog", cache_suffix, jsonable_encoder(plan))
    return plan


@router.get("/code/{code}", response_model=PlanResponse)
def get_plan_by_code(code: str, db: Session = Depends(get_db)):
    """Obtener un plan por código"""
    cache_suffix = f"code:{code}"
    cached_response = api_cache_service.get_static_data("plans-catalog", cache_suffix)
    if cached_response is not None:
        return cached_response

    plan = PlanService.get_plan_by_code(db, code)
    if not plan:
        from app.core.exceptions import NotFoundException
        raise NotFoundException(f"Plan con código '{code}' no encontrado")
    api_cache_service.set_static_data("plans-catalog", cache_suffix, jsonable_encoder(plan))
    return plan


@router.post("/", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
def create_plan(
    plan_data: PlanCreate,
    db: Session = Depends(get_db)
):
    """
    Crear un nuevo plan del sistema
    
    Requiere autenticación de administrador (por implementar)
    """
    return PlanService.create_plan(db, plan_data)


@router.patch("/{plan_id}", response_model=PlanResponse)
def update_plan(
    plan_id: UUID,
    plan_data: PlanUpdate,
    db: Session = Depends(get_db)
):
    """
    Actualizar un plan existente
    
    Requiere autenticación de administrador (por implementar)
    """
    return PlanService.update_plan(db, plan_id, plan_data)


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(
    plan_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Eliminar (desactivar) un plan
    
    Requiere autenticación de administrador (por implementar)
    """
    PlanService.delete_plan(db, plan_id)


@router.post("/{plan_id}/set-default", response_model=PlanResponse)
def set_default_plan(
    plan_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Establecer un plan como predeterminado del sistema
    
    Requiere autenticación de administrador (por implementar)
    """
    return PlanService.set_as_default(db, plan_id)
