"""
Subscription Plans Service
Lógica de negocio para gestión de planes
"""

from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from uuid import UUID

from app.models.subscription_plan import SubscriptionPlan
from app.schemas.subscription_plans import PlanCreate, PlanUpdate
from app.core.exceptions import NotFoundException, BadRequestException
from app.services.api_cache_service import api_cache_service


class SubscriptionPlanService:
    """Servicio para gestión de planes de suscripción"""

    @staticmethod
    def get_all_plans(
        db: Session,
        include_inactive: bool = False,
        skip: int = 0,
        limit: int = 100
    ) -> List[SubscriptionPlan]:
        """
        Obtener todos los planes de suscripción
        
        Args:
            db: Sesión de base de datos
            include_inactive: Incluir planes inactivos
            skip: Número de registros a saltar
            limit: Límite de registros
            
        Returns:
            Lista de planes
        """
        query = db.query(SubscriptionPlan)
        
        if not include_inactive:
            query = query.filter(SubscriptionPlan.is_active == True)
        
        return query.order_by(SubscriptionPlan.sort_order).offset(skip).limit(limit).all()

    @staticmethod
    def get_plan_by_id(db: Session, plan_id: UUID) -> SubscriptionPlan:
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
        plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
        
        if not plan:
            raise NotFoundException(f"Plan con ID {plan_id} no encontrado")
        
        return plan

    @staticmethod
    def get_plan_by_code(db: Session, plan_code: str) -> Optional[SubscriptionPlan]:
        """
        Obtener plan por código
        
        Args:
            db: Sesión de base de datos
            plan_code: Código del plan (ej: basico, premium)
            
        Returns:
            Plan encontrado o None
        """
        return db.query(SubscriptionPlan).filter(
            SubscriptionPlan.plan_code == plan_code
        ).first()

    @staticmethod
    def create_plan(
        db: Session,
        plan_data: PlanCreate,
        admin_email: str
    ) -> SubscriptionPlan:
        """
        Crear un nuevo plan
        
        Args:
            db: Sesión de base de datos
            plan_data: Datos del plan
            admin_email: Email del admin creador
            
        Returns:
            Plan creado
            
        Raises:
            BadRequestException: Si el código ya existe
        """
        # Verificar que el código no exista
        existing = SubscriptionPlanService.get_plan_by_code(db, plan_data.plan_code)
        if existing:
            raise BadRequestException(f"Ya existe un plan con el código '{plan_data.plan_code}'")
        
        # Crear plan
        plan = SubscriptionPlan(
            plan_code=plan_data.plan_code,
            name=plan_data.name,
            description=plan_data.description,
            price_monthly=plan_data.price_monthly,
            price_yearly=plan_data.price_yearly,
            limits=plan_data.limits.model_dump(),
            features=plan_data.features,
            is_active=plan_data.is_active,
            sort_order=plan_data.sort_order,
            updated_by=admin_email
        )
        
        db.add(plan)
        db.commit()
        db.refresh(plan)
        api_cache_service.invalidate_static_namespace("subscription-plans-catalog")
        
        return plan

    @staticmethod
    def update_plan(
        db: Session,
        plan_id: UUID,
        plan_data: PlanUpdate,
        admin_email: str
    ) -> SubscriptionPlan:
        """
        Actualizar un plan existente
        
        Args:
            db: Sesión de base de datos
            plan_id: ID del plan
            plan_data: Datos a actualizar
            admin_email: Email del admin que actualiza
            
        Returns:
            Plan actualizado
            
        Raises:
            NotFoundException: Si el plan no existe
        """
        plan = SubscriptionPlanService.get_plan_by_id(db, plan_id)
        
        # Actualizar campos
        update_data = plan_data.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            # model_dump() ya convierte los objetos Pydantic a dict
            setattr(plan, field, value)
        
        plan.updated_by = admin_email
        
        db.commit()
        db.refresh(plan)
        api_cache_service.invalidate_static_namespace("subscription-plans-catalog")
        
        return plan

    @staticmethod
    def delete_plan(db: Session, plan_id: UUID) -> bool:
        """
        Eliminar un plan (soft delete - lo marca como inactivo)
        
        Args:
            db: Sesión de base de datos
            plan_id: ID del plan
            
        Returns:
            True si se eliminó correctamente
            
        Raises:
            NotFoundException: Si el plan no existe
            BadRequestException: Si el plan tiene suscripciones activas
        """
        plan = SubscriptionPlanService.get_plan_by_id(db, plan_id)
        
        # TODO: Verificar que no tenga suscripciones activas
        # active_subs = db.query(Subscription).filter(
        #     Subscription.plan_id == plan_id,
        #     Subscription.status == 'active'
        # ).count()
        # 
        # if active_subs > 0:
        #     raise BadRequestException(
        #         f"No se puede eliminar el plan porque tiene {active_subs} suscripciones activas"
        #     )
        
        # Soft delete
        plan.is_active = False
        
        db.commit()
        api_cache_service.invalidate_static_namespace("subscription-plans-catalog")
        
        return True

    @staticmethod
    def get_plan_stats(db: Session, plan_id: UUID) -> dict:
        """
        Obtener estadísticas de un plan
        
        Args:
            db: Sesión de base de datos
            plan_id: ID del plan
            
        Returns:
            Diccionario con estadísticas
            
        Raises:
            NotFoundException: Si el plan no existe
        """
        plan = SubscriptionPlanService.get_plan_by_id(db, plan_id)
        
        # TODO: Implementar cálculo de estadísticas desde la tabla de suscripciones
        # Por ahora retornar datos simulados
        
        return {
            "plan_id": str(plan.id),
            "plan_code": plan.plan_code,
            "plan_name": plan.name,
            "active_subscriptions": 0,
            "monthly_revenue": 0,
            "yearly_revenue": 0,
            "total_revenue": 0
        }

    @staticmethod
    def reorder_plans(db: Session, plan_orders: dict) -> bool:
        """
        Reordenar planes
        
        Args:
            db: Sesión de base de datos
            plan_orders: Diccionario {plan_id: order}
            
        Returns:
            True si se reordenó correctamente
        """
        for plan_id, order in plan_orders.items():
            plan = db.query(SubscriptionPlan).filter(
                SubscriptionPlan.id == UUID(plan_id)
            ).first()
            
            if plan:
                plan.sort_order = order
        
        db.commit()
        api_cache_service.invalidate_static_namespace("subscription-plans-catalog")
        
        return True
