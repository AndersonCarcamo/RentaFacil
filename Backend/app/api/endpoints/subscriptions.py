from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.core.database import get_db
from app.api.deps import get_current_user
from app.services.subscription_service import SubscriptionService
from app.schemas.subscriptions import (
    PlanResponse, CreatePlanRequest, UpdatePlanRequest,
    SubscriptionResponse, SubscriptionDetailResponse, CreateSubscriptionRequest,
    UpdateSubscriptionRequest, CancelSubscriptionRequest, PauseSubscriptionRequest,
    UsageResponse, PaymentResponse, PaginatedPlans, PaginatedSubscriptions, PaginatedPayments
)
from app.core.exceptions import BusinessLogicError

router = APIRouter()

# =================== PLANS ===================

@router.get("/plans", summary="Obtener planes disponibles")
async def get_plans(
    active_only: bool = Query(True, description="Solo planes activos"),
    db: Session = Depends(get_db)
):
    """Obtener todos los planes disponibles desde la tabla core.plans"""
    try:
        from app.models.subscription import Plan
        from app.schemas.subscriptions import FrontendPlanResponse, FrontendPlanLimits
        
        # Query directa a la tabla plans
        query = db.query(Plan)
        if active_only:
            query = query.filter(Plan.is_active == True)
        
        plans = query.order_by(Plan.tier).all()
        
        # Construir respuesta con formato frontend
        response_plans = []
        for plan in plans:
            features = []
            if plan.max_active_listings:
                features.append(f"{plan.max_active_listings} {'propiedad' if plan.max_active_listings == 1 else 'propiedades'} activas")
            if plan.max_images_per_listing:
                features.append(f"Hasta {plan.max_images_per_listing} {'imagen' if plan.max_images_per_listing == 1 else 'imágenes'} por propiedad")
            if plan.max_videos_per_listing:
                features.append(f"Hasta {plan.max_videos_per_listing} {'video' if plan.max_videos_per_listing == 1 else 'videos'} por propiedad")
            if plan.listing_active_days:
                features.append(f"Listados activos por {plan.listing_active_days} días")
            if plan.featured_listings:
                features.append("Listados destacados")
            if plan.priority_support:
                features.append("Soporte prioritario")
            if plan.analytics_access:
                features.append("Acceso a analíticas")
            if plan.api_access:
                features.append("Acceso a API")
            
            # Calcular precios según el período
            price_monthly = plan.price_amount
            price_yearly = plan.price_amount
            
            if plan.period == 'monthly':
                price_yearly = plan.price_amount * 12
            elif plan.period == 'yearly':
                price_monthly = plan.price_amount / 12
            elif plan.period == 'quarterly':
                price_monthly = plan.price_amount / 3
                price_yearly = (plan.price_amount / 3) * 12
            
            response_plans.append(
                FrontendPlanResponse(
                    id=plan.id,
                    name=plan.name,
                    description=plan.description or f"Plan {plan.tier.capitalize() if isinstance(plan.tier, str) else plan.tier.value.capitalize()}",
                    price_monthly=round(price_monthly, 2),
                    price_yearly=round(price_yearly, 2),
                    features=features,
                    limits=FrontendPlanLimits(
                        max_listings=plan.max_active_listings,
                        max_images=plan.max_images_per_listing,
                        max_videos=plan.max_videos_per_listing,
                    ),
                    active=plan.is_active,
                    sort_order=0,  # Podemos usar tier como orden
                    created_at=plan.created_at,
                    updated_at=plan.updated_at
                )
            )
        
        return response_plans
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error getting plans: {str(e)}")


@router.get("/plans/{plan_id}", response_model=PlanResponse, summary="Obtener plan por ID")
async def get_plan(
    plan_id: str,
    db: Session = Depends(get_db)
):
    """Obtener detalles de un plan específico"""
    try:
        service = SubscriptionService(db)
        plan = service.get_plan_by_id(plan_id)
        
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        
        return PlanResponse(
            id=plan.id,
            name=plan.name,
            description=plan.description,
            price_monthly=plan.price_monthly,
            price_yearly=plan.price_yearly,
            features=plan.features or [],
            limits=plan.limits or {},
            active=plan.active,
            sort_order=plan.sort_order,
            created_at=plan.created_at,
            updated_at=plan.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting plan: {str(e)}")


# =================== SUBSCRIPTIONS ===================

@router.get("/current", summary="Obtener suscripción activa del usuario")
async def get_current_subscription(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener la suscripción activa del usuario actual usando v_user_current_plan - O(1) lookup"""
    try:
        from app.schemas.subscriptions import FrontendSubscriptionResponse, FrontendPlanResponse, FrontendPlanLimits
        from sqlalchemy import text
        from datetime import datetime
        
        user_id = str(current_user.id)
        
        # Query directo a la vista v_user_current_plan - O(1) lookup ultra rápido
        query = text("""
            SELECT 
                user_id, subscription_id, plan_id, plan_code, plan_name,
                plan_tier as tier, max_active_listings, listing_active_days,
                max_images_per_listing, max_videos_per_listing, 
                featured_listings, priority_support, analytics_access, api_access,
                current_period_start, current_period_end, status
            FROM core.v_user_current_plan
            WHERE user_id = :user_id
            LIMIT 1
        """)
        
        result = db.execute(query, {"user_id": user_id}).fetchone()
        
        # Ahora todos los usuarios tienen suscripción gracias al trigger
        # Pero por si acaso, manejamos el caso edge
        if not result:
            raise HTTPException(
                status_code=404, 
                detail="No active subscription found. Please contact support."
            )
        
        # Construir features desde los datos del plan
        features = []
        if result.max_active_listings:
            features.append(f"{result.max_active_listings} {'propiedad' if result.max_active_listings == 1 else 'propiedades'} activas")
        if result.max_images_per_listing:
            features.append(f"Hasta {result.max_images_per_listing} {'imagen' if result.max_images_per_listing == 1 else 'imágenes'} por propiedad")
        if result.max_videos_per_listing:
            features.append(f"Hasta {result.max_videos_per_listing} {'video' if result.max_videos_per_listing == 1 else 'videos'} por propiedad")
        if result.listing_active_days:
            features.append(f"Listados activos por {result.listing_active_days} días")
        if result.featured_listings:
            features.append("Listados destacados")
        if result.priority_support:
            features.append("Soporte prioritario")
        if result.analytics_access:
            features.append("Acceso a analíticas")
        if result.api_access:
            features.append("Acceso a API")
        
        # Construir respuesta del plan
        plan_response = FrontendPlanResponse(
            id=result.plan_id,
            name=result.plan_name,
            description=f"Plan {result.tier.capitalize()}",  # tier ya es string, no Enum
            price_monthly=0,  # TODO: Obtener de tabla plans si se necesita
            price_yearly=0,
            features=features,
            limits=FrontendPlanLimits(
                max_listings=result.max_active_listings,
                max_images=result.max_images_per_listing,
                max_videos=result.max_videos_per_listing,
            ),
            active=True,
            sort_order=0,
            created_at=datetime.utcnow(),  # La vista no tiene estos campos
            updated_at=datetime.utcnow()
        )
        
        # Construir respuesta de suscripción
        response = FrontendSubscriptionResponse(
            id=result.subscription_id,
            user_id=result.user_id,
            plan_id=result.plan_id,
            status=result.status,
            billing_cycle="monthly",  # Default - TODO: calcular desde period_months
            start_date=result.current_period_start,
            current_period_start=result.current_period_start,
            current_period_end=result.current_period_end,
            cancelled_at=None,  # La vista no tiene este campo
            pause_until=None,
            auto_renewal=True,
            cancel_at_period_end=False,
            plan=plan_response,
            created_at=result.current_period_start,
            updated_at=datetime.utcnow()
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error getting current subscription: {str(e)}")


@router.get("/subscriptions", response_model=PaginatedSubscriptions, summary="Obtener suscripciones del usuario")
async def get_subscriptions(
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(20, ge=1, le=100, description="Elementos por página"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener suscripciones del usuario"""
    try:
        service = SubscriptionService(db)
        user_id = str(current_user.id)
        subscriptions, total = service.get_user_subscriptions(user_id, page, limit)
        
        pages = (total + limit - 1) // limit
        
        subscriptions_response = []
        for sub in subscriptions:
            plan_response = None
            if sub.plan:
                plan_response = PlanResponse(
                    id=sub.plan.id,
                    name=sub.plan.name,
                    description=sub.plan.description,
                    price_monthly=sub.plan.price_monthly,
                    price_yearly=sub.plan.price_yearly,
                    features=sub.plan.features or [],
                    limits=sub.plan.limits or {},
                    active=sub.plan.active,
                    sort_order=sub.plan.sort_order,
                    created_at=sub.plan.created_at,
                    updated_at=sub.plan.updated_at
                )
            
            subscriptions_response.append(
                SubscriptionResponse(
                    id=sub.id,
                    user_id=sub.user_id,
                    plan_id=sub.plan_id,
                    status=sub.status,
                    billing_cycle=sub.billing_cycle,
                    start_date=sub.start_date,
                    current_period_start=sub.current_period_start,
                    current_period_end=sub.current_period_end,
                    cancelled_at=sub.cancelled_at,
                    pause_until=sub.pause_until,
                    auto_renewal=sub.auto_renewal,
                    cancel_at_period_end=sub.cancel_at_period_end,
                    cancellation_reason=sub.cancellation_reason,
                    plan=plan_response,
                    created_at=sub.created_at,
                    updated_at=sub.updated_at
                )
            )
        
        return PaginatedSubscriptions(
            data=subscriptions_response,
            total=total,
            page=page,
            limit=limit,
            pages=pages,
            has_next=page < pages,
            has_prev=page > 1
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting subscriptions: {str(e)}")


@router.post("/subscriptions", 
            response_model=SubscriptionResponse, 
            status_code=status.HTTP_201_CREATED,
            summary="Crear suscripción")
async def create_subscription(
    subscription_data: CreateSubscriptionRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crear nueva suscripción"""
    try:
        service = SubscriptionService(db)
        user_id = str(current_user.id)
        subscription = service.create_subscription(user_id, subscription_data)
        
        # Cargar el plan
        plan_response = None
        if subscription.plan:
            plan_response = PlanResponse(
                id=subscription.plan.id,
                name=subscription.plan.name,
                description=subscription.plan.description,
                price_monthly=subscription.plan.price_monthly,
                price_yearly=subscription.plan.price_yearly,
                features=subscription.plan.features or [],
                limits=subscription.plan.limits or {},
                active=subscription.plan.active,
                sort_order=subscription.plan.sort_order,
                created_at=subscription.plan.created_at,
                updated_at=subscription.plan.updated_at
            )
        
        return SubscriptionResponse(
            id=subscription.id,
            user_id=subscription.user_id,
            plan_id=subscription.plan_id,
            status=subscription.status,
            billing_cycle=subscription.billing_cycle,
            start_date=subscription.start_date,
            current_period_start=subscription.current_period_start,
            current_period_end=subscription.current_period_end,
            cancelled_at=subscription.cancelled_at,
            pause_until=subscription.pause_until,
            auto_renewal=subscription.auto_renewal,
            cancel_at_period_end=subscription.cancel_at_period_end,
            cancellation_reason=subscription.cancellation_reason,
            plan=plan_response,
            created_at=subscription.created_at,
            updated_at=subscription.updated_at
        )
        
    except BusinessLogicError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating subscription: {str(e)}")


@router.get("/subscriptions/{subscription_id}", 
           response_model=SubscriptionDetailResponse, 
           summary="Obtener suscripción por ID")
async def get_subscription(
    subscription_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener detalles de una suscripción específica"""
    try:
        service = SubscriptionService(db)
        user_id = str(current_user.id)
        subscription = service.get_subscription_by_id(subscription_id, user_id)
        
        if not subscription:
            raise HTTPException(status_code=404, detail="Subscription not found")
        
        # Obtener uso actual
        usage = service.get_subscription_usage(subscription_id)
        current_usage = None
        remaining_limits = None
        
        if usage and subscription.plan and subscription.plan.limits:
            limits = subscription.plan.limits
            current_usage = {
                "listings": usage.listings_used,
                "images": usage.images_uploaded,
                "videos": usage.videos_uploaded,
                "api_calls": usage.api_calls
            }
            
            remaining_limits = {}
            for key, limit in limits.items():
                if key.startswith("max_"):
                    usage_key = key.replace("max_", "").replace("s", "")
                    if usage_key in current_usage:
                        remaining = limit - current_usage[usage_key] if limit != -1 else -1
                        remaining_limits[usage_key] = remaining
        
        # Preparar respuesta del plan
        plan_response = None
        if subscription.plan:
            plan_response = PlanResponse(
                id=subscription.plan.id,
                name=subscription.plan.name,
                description=subscription.plan.description,
                price_monthly=subscription.plan.price_monthly,
                price_yearly=subscription.plan.price_yearly,
                features=subscription.plan.features or [],
                limits=subscription.plan.limits or {},
                active=subscription.plan.active,
                sort_order=subscription.plan.sort_order,
                created_at=subscription.plan.created_at,
                updated_at=subscription.plan.updated_at
            )
        
        return SubscriptionDetailResponse(
            id=subscription.id,
            user_id=subscription.user_id,
            plan_id=subscription.plan_id,
            status=subscription.status,
            billing_cycle=subscription.billing_cycle,
            start_date=subscription.start_date,
            current_period_start=subscription.current_period_start,
            current_period_end=subscription.current_period_end,
            cancelled_at=subscription.cancelled_at,
            pause_until=subscription.pause_until,
            auto_renewal=subscription.auto_renewal,
            cancel_at_period_end=subscription.cancel_at_period_end,
            cancellation_reason=subscription.cancellation_reason,
            payment_method_id=subscription.payment_method_id,
            last_payment_date=subscription.last_payment_date,
            next_payment_date=subscription.next_payment_date,
            current_usage=current_usage,
            remaining_limits=remaining_limits,
            plan=plan_response,
            created_at=subscription.created_at,
            updated_at=subscription.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting subscription: {str(e)}")


@router.put("/subscriptions/{subscription_id}", 
           response_model=SubscriptionResponse, 
           summary="Actualizar suscripción")
async def update_subscription(
    subscription_id: str,
    update_data: UpdateSubscriptionRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualizar suscripción"""
    try:
        service = SubscriptionService(db)
        user_id = str(current_user.id)
        subscription = service.update_subscription(subscription_id, user_id, update_data)
        
        if not subscription:
            raise HTTPException(status_code=404, detail="Subscription not found")
        
        # Cargar el plan
        plan_response = None
        if subscription.plan:
            plan_response = PlanResponse(
                id=subscription.plan.id,
                name=subscription.plan.name,
                description=subscription.plan.description,
                price_monthly=subscription.plan.price_monthly,
                price_yearly=subscription.plan.price_yearly,
                features=subscription.plan.features or [],
                limits=subscription.plan.limits or {},
                active=subscription.plan.active,
                sort_order=subscription.plan.sort_order,
                created_at=subscription.plan.created_at,
                updated_at=subscription.plan.updated_at
            )
        
        return SubscriptionResponse(
            id=subscription.id,
            user_id=subscription.user_id,
            plan_id=subscription.plan_id,
            status=subscription.status,
            billing_cycle=subscription.billing_cycle,
            start_date=subscription.start_date,
            current_period_start=subscription.current_period_start,
            current_period_end=subscription.current_period_end,
            cancelled_at=subscription.cancelled_at,
            pause_until=subscription.pause_until,
            auto_renewal=subscription.auto_renewal,
            cancel_at_period_end=subscription.cancel_at_period_end,
            cancellation_reason=subscription.cancellation_reason,
            plan=plan_response,
            created_at=subscription.created_at,
            updated_at=subscription.updated_at
        )
        
    except HTTPException:
        raise
    except BusinessLogicError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating subscription: {str(e)}")


@router.delete("/subscriptions/{subscription_id}", summary="Cancelar suscripción")
async def cancel_subscription(
    subscription_id: str,
    cancel_data: CancelSubscriptionRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancelar suscripción"""
    try:
        service = SubscriptionService(db)
        user_id = str(current_user.id)
        subscription = service.cancel_subscription(subscription_id, user_id, cancel_data)
        
        if not subscription:
            raise HTTPException(status_code=404, detail="Subscription not found")
        
        return {
            "message": "Subscription cancelled successfully",
            "cancelled_at": subscription.cancelled_at,
            "cancel_at_period_end": subscription.cancel_at_period_end
        }
        
    except HTTPException:
        raise
    except BusinessLogicError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cancelling subscription: {str(e)}")


@router.post("/subscriptions/{subscription_id}/pause", summary="Pausar suscripción")
async def pause_subscription(
    subscription_id: str,
    pause_data: PauseSubscriptionRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Pausar suscripción"""
    try:
        service = SubscriptionService(db)
        user_id = str(current_user.id)
        subscription = service.pause_subscription(subscription_id, user_id, pause_data)
        
        if not subscription:
            raise HTTPException(status_code=404, detail="Subscription not found")
        
        return {
            "message": "Subscription paused successfully",
            "status": subscription.status,
            "pause_until": subscription.pause_until
        }
        
    except HTTPException:
        raise
    except BusinessLogicError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error pausing subscription: {str(e)}")


@router.post("/subscriptions/{subscription_id}/resume", summary="Reanudar suscripción")
async def resume_subscription(
    subscription_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reanudar suscripción pausada"""
    try:
        service = SubscriptionService(db)
        user_id = str(current_user.id)
        subscription = service.resume_subscription(subscription_id, user_id)
        
        if not subscription:
            raise HTTPException(status_code=404, detail="Subscription not found")
        
        return {
            "message": "Subscription resumed successfully",
            "status": subscription.status
        }
        
    except HTTPException:
        raise
    except BusinessLogicError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error resuming subscription: {str(e)}")


# =================== USAGE TRACKING ===================

@router.get("/subscriptions/{subscription_id}/usage", 
           response_model=UsageResponse, 
           summary="Obtener uso de suscripción")
async def get_subscription_usage(
    subscription_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener uso actual de la suscripción"""
    try:
        service = SubscriptionService(db)
        user_id = str(current_user.id)
        
        # Verificar que la suscripción pertenece al usuario
        subscription = service.get_subscription_by_id(subscription_id, user_id)
        if not subscription:
            raise HTTPException(status_code=404, detail="Subscription not found")
        
        usage = service.get_subscription_usage(subscription_id)
        if not usage:
            raise HTTPException(status_code=404, detail="Usage data not found")
        
        return UsageResponse(
            subscription_id=usage.subscription_id,
            period_start=usage.period_start,
            period_end=usage.period_end,
            listings_used=usage.listings_used,
            images_uploaded=usage.images_uploaded,
            videos_uploaded=usage.videos_uploaded,
            api_calls=usage.api_calls,
            limits_snapshot=usage.limits_snapshot or {}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting usage: {str(e)}")


# =================== PAYMENT HISTORY ===================

@router.get("/subscriptions/{subscription_id}/payments", 
           response_model=PaginatedPayments, 
           summary="Obtener historial de pagos")
async def get_payment_history(
    subscription_id: str,
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(20, ge=1, le=100, description="Elementos por página"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener historial de pagos de la suscripción"""
    try:
        service = SubscriptionService(db)
        user_id = str(current_user.id)
        
        # Verificar que la suscripción pertenece al usuario
        subscription = service.get_subscription_by_id(subscription_id, user_id)
        if not subscription:
            raise HTTPException(status_code=404, detail="Subscription not found")
        
        payments, total = service.get_payment_history(subscription_id, page, limit)
        pages = (total + limit - 1) // limit
        
        payments_response = []
        for payment in payments:
            payments_response.append(
                PaymentResponse(
                    id=payment.id,
                    subscription_id=payment.subscription_id,
                    amount=payment.amount,
                    currency=payment.currency,
                    payment_method=payment.payment_method,
                    status=payment.status,
                    payment_date=payment.payment_date,
                    period_start=payment.period_start,
                    period_end=payment.period_end,
                    description=payment.description,
                    invoice_url=payment.invoice_url,
                    created_at=payment.created_at
                )
            )
        
        return PaginatedPayments(
            data=payments_response,
            total=total,
            page=page,
            limit=limit,
            pages=pages,
            has_next=page < pages,
            has_prev=page > 1
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting payment history: {str(e)}")

