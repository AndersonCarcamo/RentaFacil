from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc, asc
from typing import List, Tuple, Optional, Dict, Any
from datetime import datetime, timedelta
from decimal import Decimal
import uuid

from app.models.subscription import Plan, Subscription, SubscriptionUsage, PaymentHistory
from app.schemas.subscriptions import (
    CreatePlanRequest, UpdatePlanRequest, CreateSubscriptionRequest,
    UpdateSubscriptionRequest, CancelSubscriptionRequest, PauseSubscriptionRequest,
    SubscriptionStatus, BillingCycle, PaymentStatus
)
from app.core.exceptions import BusinessLogicError


class SubscriptionService:
    """Servicio para gestión de suscripciones y planes"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # =================== PLANS ===================
    
    def get_plans(self, active_only: bool = True) -> List[Plan]:
        """Obtener todos los planes disponibles"""
        query = self.db.query(Plan)
        
        if active_only:
            query = query.filter(Plan.active == True)
        
        return query.order_by(Plan.sort_order, Plan.name).all()
    
    def get_plan_by_id(self, plan_id: str) -> Optional[Plan]:
        """Obtener plan por ID"""
        return self.db.query(Plan).filter(Plan.id == plan_id).first()
    
    def create_plan(self, plan_data: CreatePlanRequest) -> Plan:
        """Crear nuevo plan"""
        # Validar que el nombre no exista
        existing_plan = self.db.query(Plan).filter(Plan.name == plan_data.name).first()
        if existing_plan:
            raise BusinessLogicError(f"Plan with name '{plan_data.name}' already exists")
        
        plan = Plan(
            name=plan_data.name,
            description=plan_data.description,
            price_monthly=plan_data.price_monthly,
            price_yearly=plan_data.price_yearly,
            features=plan_data.features,
            limits=plan_data.limits.dict() if plan_data.limits else {},
            active=plan_data.active,
            sort_order=plan_data.sort_order
        )
        
        self.db.add(plan)
        self.db.commit()
        self.db.refresh(plan)
        return plan
    
    def update_plan(self, plan_id: str, plan_data: UpdatePlanRequest) -> Optional[Plan]:
        """Actualizar plan existente"""
        plan = self.get_plan_by_id(plan_id)
        if not plan:
            return None
        
        # Actualizar campos
        for field, value in plan_data.dict(exclude_unset=True).items():
            if field == "limits" and value:
                setattr(plan, field, value.dict())
            else:
                setattr(plan, field, value)
        
        plan.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(plan)
        return plan
    
    def delete_plan(self, plan_id: str) -> bool:
        """Eliminar plan (solo si no tiene suscripciones activas)"""
        plan = self.get_plan_by_id(plan_id)
        if not plan:
            return False
        
        # Verificar que no tenga suscripciones activas
        active_subscriptions = self.db.query(Subscription).filter(
            and_(
                Subscription.plan_id == plan_id,
                Subscription.status == SubscriptionStatus.ACTIVE
            )
        ).count()
        
        if active_subscriptions > 0:
            raise BusinessLogicError("Cannot delete plan with active subscriptions")
        
        self.db.delete(plan)
        self.db.commit()
        return True
    
    # =================== SUBSCRIPTIONS ===================
    
    def get_user_subscriptions(self, user_id: str, page: int = 1, limit: int = 20) -> Tuple[List[Subscription], int]:
        """Obtener suscripciones del usuario"""
        query = self.db.query(Subscription).options(
            joinedload(Subscription.plan)
        ).filter(Subscription.user_id == user_id)
        
        total = query.count()
        offset = (page - 1) * limit
        subscriptions = query.order_by(desc(Subscription.created_at)).offset(offset).limit(limit).all()
        
        return subscriptions, total
    
    def get_subscription_by_id(self, subscription_id: str, user_id: Optional[str] = None) -> Optional[Subscription]:
        """Obtener suscripción por ID"""
        query = self.db.query(Subscription).options(
            joinedload(Subscription.plan)
        ).filter(Subscription.id == subscription_id)
        
        if user_id:
            query = query.filter(Subscription.user_id == user_id)
        
        return query.first()
    
    def get_active_subscription(self, user_id: str) -> Optional[Subscription]:
        """Obtener suscripción activa del usuario"""
        return self.db.query(Subscription).options(
            joinedload(Subscription.plan)
        ).filter(
            and_(
                Subscription.user_id == user_id,
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.current_period_end > datetime.utcnow()
            )
        ).first()
    
    def create_subscription(self, user_id: str, subscription_data: CreateSubscriptionRequest) -> Subscription:
        """Crear nueva suscripción"""
        # Verificar que el plan existe
        plan = self.get_plan_by_id(str(subscription_data.plan_id))
        if not plan or not plan.active:
            raise BusinessLogicError("Plan not found or not active")
        
        # Verificar que el usuario no tenga una suscripción activa
        existing_subscription = self.get_active_subscription(user_id)
        if existing_subscription:
            raise BusinessLogicError("User already has an active subscription")
        
        # Calcular fechas según el ciclo de facturación
        start_date = datetime.utcnow()
        if subscription_data.billing_cycle == BillingCycle.MONTHLY:
            period_end = start_date + timedelta(days=30)
        else:  # YEARLY
            period_end = start_date + timedelta(days=365)
        
        subscription = Subscription(
            user_id=user_id,
            plan_id=subscription_data.plan_id,
            billing_cycle=subscription_data.billing_cycle,
            payment_method_id=subscription_data.payment_method_id,
            start_date=start_date,
            current_period_start=start_date,
            current_period_end=period_end,
            next_payment_date=period_end,
            status=SubscriptionStatus.ACTIVE
        )
        
        self.db.add(subscription)
        self.db.commit()
        self.db.refresh(subscription)
        
        # Crear registro de uso inicial
        self._create_usage_record(subscription)
        
        return subscription
    
    def update_subscription(self, subscription_id: str, user_id: str, update_data: UpdateSubscriptionRequest) -> Optional[Subscription]:
        """Actualizar suscripción"""
        subscription = self.get_subscription_by_id(subscription_id, user_id)
        if not subscription:
            return None
        
        if subscription.status != SubscriptionStatus.ACTIVE:
            raise BusinessLogicError("Can only update active subscriptions")
        
        # Si se cambia el plan
        if update_data.plan_id:
            new_plan = self.get_plan_by_id(str(update_data.plan_id))
            if not new_plan or not new_plan.active:
                raise BusinessLogicError("New plan not found or not active")
            
            subscription.plan_id = update_data.plan_id
        
        # Si se cambia el ciclo de facturación
        if update_data.billing_cycle:
            subscription.billing_cycle = update_data.billing_cycle
            # Recalcular fecha de próximo pago
            if update_data.billing_cycle == BillingCycle.MONTHLY:
                subscription.next_payment_date = subscription.current_period_start + timedelta(days=30)
            else:  # YEARLY
                subscription.next_payment_date = subscription.current_period_start + timedelta(days=365)
        
        subscription.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(subscription)
        return subscription
    
    def cancel_subscription(self, subscription_id: str, user_id: str, cancel_data: CancelSubscriptionRequest) -> Optional[Subscription]:
        """Cancelar suscripción"""
        subscription = self.get_subscription_by_id(subscription_id, user_id)
        if not subscription:
            return None
        
        if subscription.status not in [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAUSED]:
            raise BusinessLogicError("Can only cancel active or paused subscriptions")
        
        subscription.cancellation_reason = cancel_data.reason
        subscription.cancel_at_period_end = cancel_data.cancel_at_period_end
        subscription.cancelled_at = datetime.utcnow()
        
        if not cancel_data.cancel_at_period_end:
            subscription.status = SubscriptionStatus.CANCELLED
            subscription.current_period_end = datetime.utcnow()
        
        subscription.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(subscription)
        return subscription
    
    def pause_subscription(self, subscription_id: str, user_id: str, pause_data: PauseSubscriptionRequest) -> Optional[Subscription]:
        """Pausar suscripción"""
        subscription = self.get_subscription_by_id(subscription_id, user_id)
        if not subscription:
            return None
        
        if subscription.status != SubscriptionStatus.ACTIVE:
            raise BusinessLogicError("Can only pause active subscriptions")
        
        subscription.status = SubscriptionStatus.PAUSED
        subscription.pause_until = pause_data.pause_until
        subscription.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(subscription)
        return subscription
    
    def resume_subscription(self, subscription_id: str, user_id: str) -> Optional[Subscription]:
        """Reanudar suscripción pausada"""
        subscription = self.get_subscription_by_id(subscription_id, user_id)
        if not subscription:
            return None
        
        if subscription.status != SubscriptionStatus.PAUSED:
            raise BusinessLogicError("Can only resume paused subscriptions")
        
        subscription.status = SubscriptionStatus.ACTIVE
        subscription.pause_until = None
        subscription.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(subscription)
        return subscription
    
    # =================== USAGE TRACKING ===================
    
    def get_subscription_usage(self, subscription_id: str) -> Optional[SubscriptionUsage]:
        """Obtener uso actual de la suscripción"""
        return self.db.query(SubscriptionUsage).filter(
            and_(
                SubscriptionUsage.subscription_id == subscription_id,
                SubscriptionUsage.period_start <= datetime.utcnow(),
                SubscriptionUsage.period_end >= datetime.utcnow()
            )
        ).first()
    
    def update_usage(self, subscription_id: str, usage_type: str, increment: int = 1) -> bool:
        """Actualizar uso de la suscripción"""
        usage = self.get_subscription_usage(subscription_id)
        if not usage:
            return False
        
        if usage_type == "listings":
            usage.listings_used += increment
        elif usage_type == "images":
            usage.images_uploaded += increment
        elif usage_type == "videos":
            usage.videos_uploaded += increment
        elif usage_type == "api_calls":
            usage.api_calls += increment
        
        usage.updated_at = datetime.utcnow()
        self.db.commit()
        return True
    
    def check_usage_limits(self, user_id: str, usage_type: str) -> Dict[str, Any]:
        """Verificar límites de uso"""
        subscription = self.get_active_subscription(user_id)
        if not subscription:
            return {"allowed": False, "reason": "No active subscription"}
        
        usage = self.get_subscription_usage(str(subscription.id))
        if not usage:
            return {"allowed": False, "reason": "Usage record not found"}
        
        limits = subscription.plan.limits or {}
        
        if usage_type == "listings":
            max_limit = limits.get("max_listings", 0)
            current_usage = usage.listings_used
        elif usage_type == "images":
            max_limit = limits.get("max_images", 0)
            current_usage = usage.images_uploaded
        elif usage_type == "videos":
            max_limit = limits.get("max_videos", 0)
            current_usage = usage.videos_uploaded
        elif usage_type == "api_calls":
            max_limit = limits.get("api_calls_per_day", 0)
            current_usage = usage.api_calls
        else:
            return {"allowed": False, "reason": "Unknown usage type"}
        
        # -1 significa ilimitado
        if max_limit == -1:
            return {"allowed": True, "remaining": -1}
        
        remaining = max_limit - current_usage
        allowed = remaining > 0
        
        return {
            "allowed": allowed,
            "remaining": remaining,
            "used": current_usage,
            "limit": max_limit
        }
    
    def _create_usage_record(self, subscription: Subscription) -> SubscriptionUsage:
        """Crear registro de uso para una suscripción"""
        usage = SubscriptionUsage(
            subscription_id=subscription.id,
            period_start=subscription.current_period_start,
            period_end=subscription.current_period_end,
            limits_snapshot=subscription.plan.limits or {}
        )
        
        self.db.add(usage)
        self.db.commit()
        return usage
    
    # =================== PAYMENT TRACKING ===================
    
    def record_payment(self, subscription_id: str, amount: Decimal, payment_method: str, external_id: str = None) -> PaymentHistory:
        """Registrar un pago"""
        subscription = self.get_subscription_by_id(subscription_id)
        if not subscription:
            raise BusinessLogicError("Subscription not found")
        
        payment = PaymentHistory(
            subscription_id=subscription_id,
            amount=amount,
            payment_method=payment_method,
            external_payment_id=external_id,
            status=PaymentStatus.COMPLETED,
            payment_date=datetime.utcnow(),
            period_start=subscription.current_period_start,
            period_end=subscription.current_period_end,
            description=f"Payment for {subscription.plan.name} ({subscription.billing_cycle})"
        )
        
        self.db.add(payment)
        
        # Actualizar fechas de la suscripción
        subscription.last_payment_date = datetime.utcnow()
        
        # Calcular próximo período
        if subscription.billing_cycle == BillingCycle.MONTHLY:
            next_period_end = subscription.current_period_end + timedelta(days=30)
        else:  # YEARLY
            next_period_end = subscription.current_period_end + timedelta(days=365)
        
        subscription.current_period_start = subscription.current_period_end
        subscription.current_period_end = next_period_end
        subscription.next_payment_date = next_period_end
        
        self.db.commit()
        
        # Crear nuevo registro de uso para el siguiente período
        self._create_usage_record(subscription)
        
        return payment
    
    def get_payment_history(self, subscription_id: str, page: int = 1, limit: int = 20) -> Tuple[List[PaymentHistory], int]:
        """Obtener historial de pagos"""
        query = self.db.query(PaymentHistory).filter(
            PaymentHistory.subscription_id == subscription_id
        )
        
        total = query.count()
        offset = (page - 1) * limit
        payments = query.order_by(desc(PaymentHistory.created_at)).offset(offset).limit(limit).all()
        
        return payments, total
    
    # =================== ADMIN FUNCTIONS ===================
    
    def get_all_subscriptions(self, status: Optional[str] = None, page: int = 1, limit: int = 20) -> Tuple[List[Subscription], int]:
        """Obtener todas las suscripciones (admin)"""
        query = self.db.query(Subscription).options(
            joinedload(Subscription.plan)
        )
        
        if status:
            query = query.filter(Subscription.status == status)
        
        total = query.count()
        offset = (page - 1) * limit
        subscriptions = query.order_by(desc(Subscription.created_at)).offset(offset).limit(limit).all()
        
        return subscriptions, total
    
    def get_subscription_stats(self) -> Dict[str, Any]:
        """Obtener estadísticas de suscripciones"""
        total_active = self.db.query(Subscription).filter(Subscription.status == SubscriptionStatus.ACTIVE).count()
        total_cancelled = self.db.query(Subscription).filter(Subscription.status == SubscriptionStatus.CANCELLED).count()
        total_paused = self.db.query(Subscription).filter(Subscription.status == SubscriptionStatus.PAUSED).count()
        
        # Revenue del último mes
        last_month = datetime.utcnow() - timedelta(days=30)
        monthly_revenue = self.db.query(func.sum(PaymentHistory.amount)).filter(
            and_(
                PaymentHistory.status == PaymentStatus.COMPLETED,
                PaymentHistory.payment_date >= last_month
            )
        ).scalar() or 0
        
        return {
            "total_active": total_active,
            "total_cancelled": total_cancelled,
            "total_paused": total_paused,
            "monthly_revenue": float(monthly_revenue),
            "total_subscriptions": total_active + total_cancelled + total_paused
        }
