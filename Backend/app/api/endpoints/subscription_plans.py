"""
Subscription Plans Endpoints
Endpoints para gestión de planes de suscripción
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.api.deps import get_db
# from app.api.deps import get_current_admin  # TODO: Implementar get_current_admin
from app.schemas.subscription_plans import (
    PlanCreate,
    PlanUpdate,
    PlanResponse,
    PlanListResponse,
    PlanStatsResponse
)
from app.services.subscription_plan_service import SubscriptionPlanService
from app.core.exceptions import NotFoundException, BadRequestException


router = APIRouter()


@router.get("/", response_model=PlanListResponse)
def get_all_plans(
    include_inactive: bool = False,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Obtener todos los planes de suscripción
    
    Args:
        include_inactive: Incluir planes inactivos
        skip: Número de registros a saltar
        limit: Límite de registros
        
    Returns:
        Lista de planes
    """
    plans = SubscriptionPlanService.get_all_plans(
        db=db,
        include_inactive=include_inactive,
        skip=skip,
        limit=limit
    )
    
    return {
        "plans": plans,
        "total": len(plans)
    }


@router.get("/{plan_id}", response_model=PlanResponse)
def get_plan(
    plan_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Obtener un plan por ID
    
    Args:
        plan_id: ID del plan
        
    Returns:
        Plan encontrado
        
    Raises:
        NotFoundException: Si el plan no existe
    """
    return SubscriptionPlanService.get_plan_by_id(db, plan_id)


@router.get("/code/{plan_code}", response_model=PlanResponse)
def get_plan_by_code(
    plan_code: str,
    db: Session = Depends(get_db)
):
    """
    Obtener un plan por código
    
    Args:
        plan_code: Código del plan (ej: basico, premium)
        
    Returns:
        Plan encontrado
        
    Raises:
        NotFoundException: Si el plan no existe
    """
    plan = SubscriptionPlanService.get_plan_by_code(db, plan_code)
    
    if not plan:
        raise NotFoundException(f"Plan con código '{plan_code}' no encontrado")
    
    return plan


@router.post("/", response_model=PlanResponse, status_code=status.HTTP_201_CREATED)
def create_plan(
    plan_data: PlanCreate,
    db: Session = Depends(get_db),
    # current_admin = Depends(get_current_admin)  # TODO: Descomentar cuando esté implementado
):
    """
    Crear un nuevo plan
    
    Args:
        plan_data: Datos del plan
        
    Returns:
        Plan creado
        
    Raises:
        BadRequestException: Si el código ya existe
    """
    # TODO: Usar current_admin.email cuando esté implementado
    admin_email = "admin@easyrent.pe"
    
    return SubscriptionPlanService.create_plan(
        db=db,
        plan_data=plan_data,
        admin_email=admin_email
    )


@router.patch("/{plan_id}", response_model=PlanResponse)
def update_plan(
    plan_id: UUID,
    plan_data: PlanUpdate,
    db: Session = Depends(get_db),
    # current_admin = Depends(get_current_admin)  # TODO: Descomentar cuando esté implementado
):
    """
    Actualizar un plan existente
    
    Args:
        plan_id: ID del plan
        plan_data: Datos a actualizar
        
    Returns:
        Plan actualizado
        
    Raises:
        NotFoundException: Si el plan no existe
    """
    # TODO: Usar current_admin.email cuando esté implementado
    admin_email = "admin@easyrent.pe"
    
    return SubscriptionPlanService.update_plan(
        db=db,
        plan_id=plan_id,
        plan_data=plan_data,
        admin_email=admin_email
    )


@router.delete("/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plan(
    plan_id: UUID,
    db: Session = Depends(get_db),
    # current_admin = Depends(get_current_admin)  # TODO: Descomentar cuando esté implementado
):
    """
    Eliminar un plan (soft delete)
    
    Args:
        plan_id: ID del plan
        
    Returns:
        204 No Content
        
    Raises:
        NotFoundException: Si el plan no existe
        BadRequestException: Si tiene suscripciones activas
    """
    SubscriptionPlanService.delete_plan(db, plan_id)


@router.get("/{plan_id}/stats", response_model=PlanStatsResponse)
def get_plan_stats(
    plan_id: UUID,
    db: Session = Depends(get_db),
    # current_admin = Depends(get_current_admin)  # TODO: Descomentar cuando esté implementado
):
    """
    Obtener estadísticas de un plan
    
    Args:
        plan_id: ID del plan
        
    Returns:
        Estadísticas del plan
        
    Raises:
        NotFoundException: Si el plan no existe
    """
    return SubscriptionPlanService.get_plan_stats(db, plan_id)


@router.post("/reorder")
def reorder_plans(
    plan_orders: dict,
    db: Session = Depends(get_db),
    # current_admin = Depends(get_current_admin)  # TODO: Descomentar cuando esté implementado
):
    """
    Reordenar planes
    
    Args:
        plan_orders: Diccionario {plan_id: order}
        
    Returns:
        Mensaje de éxito
    """
    SubscriptionPlanService.reorder_plans(db, plan_orders)
    
    return {"message": "Planes reordenados correctamente"}
