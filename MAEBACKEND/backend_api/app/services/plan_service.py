"""
Plan Service
Lógica de negocio para gestión de planes del sistema
"""

from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.models.subscription import Plan
from app.schemas.plans import PlanCreate, PlanUpdate
from app.core.exceptions import NotFoundException, BadRequestException
from app.services.api_cache_service import api_cache_service


class PlanService:
    """Servicio para gestión de planes"""

    @staticmethod
    def get_all_plans(
        db: Session,
        include_inactive: bool = False,
        tier: Optional[str] = None,
        target_user_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Plan]:
        """
        Obtener todos los planes
        
        Args:
            db: Sesión de base de datos
            include_inactive: Incluir planes inactivos
            tier: Filtrar por tier específico
            target_user_type: Filtrar por tipo de usuario (individual, agency)
            skip: Registros a saltar
            limit: Límite de registros
            
        Returns:
            Lista de planes
        """
        query = db.query(Plan)
        
        if not include_inactive:
            query = query.filter(Plan.is_active == True)
        
        if tier:
            query = query.filter(Plan.tier == tier)
        
        if target_user_type:
            query = query.filter(Plan.target_user_type == target_user_type)
        
        return query.order_by(Plan.tier, Plan.period_months).offset(skip).limit(limit).all()

    @staticmethod
    def get_plan_by_id(db: Session, plan_id: UUID) -> Plan:
        """
        Obtener plan por ID
        
        Args:
            db: Sesión de base de datos
            plan_id: ID del plan
            
        Returns:
            Plan encontrado
            
        Raises:
            NotFoundException: Si el plan no existe
        """
        plan = db.query(Plan).filter(Plan.id == plan_id).first()
        if not plan:
            raise NotFoundException(f"Plan con ID {plan_id} no encontrado")
        return plan

    @staticmethod
    def get_plan_by_code(db: Session, code: str) -> Optional[Plan]:
        """
        Obtener plan por código
        
        Args:
            db: Sesión de base de datos
            code: Código del plan
            
        Returns:
            Plan encontrado o None
        """
        return db.query(Plan).filter(Plan.code == code).first()

    @staticmethod
    def create_plan(db: Session, plan_data: PlanCreate) -> Plan:
        """
        Crear un nuevo plan
        
        Args:
            db: Sesión de base de datos
            plan_data: Datos del plan
            
        Returns:
            Plan creado
            
        Raises:
            BadRequestException: Si el código ya existe
        """
        # Verificar que el código no exista
        existing = PlanService.get_plan_by_code(db, plan_data.code)
        if existing:
            raise BadRequestException(f"Ya existe un plan con el código '{plan_data.code}'")
        
        # Crear plan
        plan = Plan(**plan_data.model_dump())
        
        db.add(plan)
        db.commit()
        db.refresh(plan)
        api_cache_service.invalidate_static_namespace("plans-catalog")
        
        return plan

    @staticmethod
    def update_plan(db: Session, plan_id: UUID, plan_data: PlanUpdate) -> Plan:
        """
        Actualizar un plan existente
        
        Args:
            db: Sesión de base de datos
            plan_id: ID del plan
            plan_data: Datos a actualizar
            
        Returns:
            Plan actualizado
            
        Raises:
            NotFoundException: Si el plan no existe
        """
        plan = PlanService.get_plan_by_id(db, plan_id)
        
        # Actualizar campos
        update_data = plan_data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(plan, field, value)
        
        db.commit()
        db.refresh(plan)
        api_cache_service.invalidate_static_namespace("plans-catalog")
        
        return plan

    @staticmethod
    def delete_plan(db: Session, plan_id: UUID) -> bool:
        """
        Eliminar un plan (soft delete - marcarlo como inactivo)
        
        Args:
            db: Sesión de base de datos
            plan_id: ID del plan
            
        Returns:
            True si se eliminó correctamente
            
        Raises:
            NotFoundException: Si el plan no existe
        """
        plan = PlanService.get_plan_by_id(db, plan_id)
        
        # Soft delete - marcar como inactivo
        plan.is_active = False
        
        db.commit()
        api_cache_service.invalidate_static_namespace("plans-catalog")
        
        return True

    @staticmethod
    def get_default_plan(db: Session) -> Optional[Plan]:
        """
        Obtener el plan por defecto del sistema
        
        Args:
            db: Sesión de base de datos
            
        Returns:
            Plan por defecto o None
        """
        return db.query(Plan).filter(
            Plan.is_default == True,
            Plan.is_active == True
        ).first()

    @staticmethod
    def set_as_default(db: Session, plan_id: UUID) -> Plan:
        """
        Establecer un plan como predeterminado
        
        Args:
            db: Sesión de base de datos
            plan_id: ID del plan
            
        Returns:
            Plan actualizado
            
        Raises:
            NotFoundException: Si el plan no existe
        """
        # Remover flag de default de todos los planes
        db.query(Plan).update({Plan.is_default: False})
        
        # Establecer el nuevo plan como default
        plan = PlanService.get_plan_by_id(db, plan_id)
        plan.is_default = True
        
        db.commit()
        db.refresh(plan)
        api_cache_service.invalidate_static_namespace("plans-catalog")
        
        return plan
