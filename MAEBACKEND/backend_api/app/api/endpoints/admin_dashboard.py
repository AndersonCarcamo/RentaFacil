"""
Admin Dashboard Endpoints
Endpoints para el panel de administración con métricas reales del sistema
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text, func, and_, or_
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.auth import User

router = APIRouter()


async def require_admin(current_user: User = Depends(get_current_user)):
    """Verificar que el usuario sea administrador"""
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Acceso denegado. Se requieren permisos de administrador.")
    return current_user


@router.get("/overview")
async def get_admin_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Obtener métricas generales del dashboard de administración
    
    Returns:
        - Estadísticas de usuarios (total, activos, nuevos)
        - Estadísticas de propiedades (total, activas, pendientes verificación)
        - Estadísticas financieras (MRR, ingresos del mes, growth)
        - Alertas críticas (verificaciones pendientes, pagos fallidos, usuarios reportados)
    """
    
    # Calcular fechas para comparaciones
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)
    last_month_end = month_start - timedelta(seconds=1)
    
    # ==================== USUARIOS ====================
    
    # Total de usuarios
    total_users_query = db.execute(
        text("SELECT COUNT(*) as count FROM core.users")
    )
    total_users = total_users_query.scalar() or 0
    
    # Usuarios del mes pasado (para calcular growth)
    last_month_users_query = db.execute(
        text("SELECT COUNT(*) as count FROM core.users WHERE created_at < :month_start"),
        {"month_start": month_start}
    )
    last_month_users = last_month_users_query.scalar() or 0
    users_growth = ((total_users - last_month_users) / last_month_users * 100) if last_month_users > 0 else 0
    
    # Usuarios activos últimos 7 días (con eventos)
    active_users_query = db.execute(
        text("""
            SELECT COUNT(DISTINCT user_id) as count FROM (
                SELECT user_id FROM analytics.listing_views WHERE viewed_at >= :week_ago AND user_id IS NOT NULL
                UNION
                SELECT user_id FROM analytics.listing_contacts WHERE contacted_at >= :week_ago AND user_id IS NOT NULL
                UNION
                SELECT user_id FROM analytics.searches WHERE searched_at >= :week_ago AND user_id IS NOT NULL
                UNION
                SELECT user_id FROM analytics.listing_favorites WHERE actioned_at >= :week_ago AND user_id IS NOT NULL
            ) active_users
        """),
        {"week_ago": week_ago}
    )
    active_users = active_users_query.scalar() or 0
    
    # Nuevos registros hoy
    new_today_query = db.execute(
        text("SELECT COUNT(*) as count FROM core.users WHERE created_at >= :today"),
        {"today": today_start}
    )
    new_users_today = new_today_query.scalar() or 0
    
    # ==================== PROPIEDADES ====================
    
    # Total de propiedades
    total_listings_query = db.execute(
        text("SELECT COUNT(*) as count FROM core.listings")
    )
    total_listings = total_listings_query.scalar() or 0
    
    # Propiedades activas
    active_listings_query = db.execute(
        text("SELECT COUNT(*) as count FROM core.listings WHERE status = 'published'")
    )
    active_listings = active_listings_query.scalar() or 0
    
    # Propiedades del mes pasado
    last_month_listings_query = db.execute(
        text("SELECT COUNT(*) as count FROM core.listings WHERE created_at < :month_start"),
        {"month_start": month_start}
    )
    last_month_listings = last_month_listings_query.scalar() or 0
    listings_growth = ((total_listings - last_month_listings) / last_month_listings * 100) if last_month_listings > 0 else 0
    
    # Propiedades nuevas hoy
    new_listings_today_query = db.execute(
        text("SELECT COUNT(*) as count FROM core.listings WHERE created_at >= :today"),
        {"today": today_start}
    )
    new_listings_today = new_listings_today_query.scalar() or 0
    
    # ==================== VERIFICACIONES ====================
    
    # Propiedades pendientes de verificación
    pending_verifications_query = db.execute(
        text("""
            SELECT COUNT(*) as count 
            FROM core.listings l
            LEFT JOIN core.listing_verifications lv ON l.id = lv.listing_id
            WHERE (lv.id IS NULL OR lv.status = 'pending')
            AND l.created_at < :threshold
        """),
        {"threshold": now - timedelta(hours=48)}  # Más de 48 horas sin verificar
    )
    pending_verifications = pending_verifications_query.scalar() or 0
    
    # ==================== FINANZAS ====================
    
    # Ingresos del mes actual (payments completados)
    current_month_revenue_query = db.execute(
        text("""
            SELECT COALESCE(SUM(amount), 0) as total
            FROM core.payments
            WHERE status = 'succeeded'
            AND created_at >= :month_start
            AND created_at < :next_month
        """),
        {
            "month_start": month_start,
            "next_month": month_start + timedelta(days=32)  # Aproximación al siguiente mes
        }
    )
    current_month_revenue = float(current_month_revenue_query.scalar() or 0)
    
    # Ingresos del mes pasado
    last_month_revenue_query = db.execute(
        text("""
            SELECT COALESCE(SUM(amount), 0) as total
            FROM core.payments
            WHERE status = 'succeeded'
            AND created_at >= :last_month_start
            AND created_at < :month_start
        """),
        {
            "last_month_start": last_month_start,
            "month_start": month_start
        }
    )
    last_month_revenue = float(last_month_revenue_query.scalar() or 0)
    revenue_growth = ((current_month_revenue - last_month_revenue) / last_month_revenue * 100) if last_month_revenue > 0 else 0
    
    # MRR (Monthly Recurring Revenue) - Suscripciones activas
    mrr_query = db.execute(
        text("""
            SELECT COALESCE(SUM(p.price_amount), 0) as mrr
            FROM core.subscriptions s
            JOIN core.plans p ON s.plan_id = p.id
            WHERE s.status = 'active'
            AND s.current_period_end > :now
        """),
        {"now": now}
    )
    mrr = float(mrr_query.scalar() or 0)
    
    # Suscripciones activas
    active_subscriptions_query = db.execute(
        text("""
            SELECT COUNT(*) as count
            FROM core.subscriptions
            WHERE status = 'active'
            AND current_period_end > :now
        """),
        {"now": now}
    )
    active_subscriptions = active_subscriptions_query.scalar() or 0
    
    # Suscripciones del mes pasado
    last_month_subs_query = db.execute(
        text("""
            SELECT COUNT(*) as count
            FROM core.subscriptions
            WHERE status = 'active'
            AND current_period_start < :month_start
            AND current_period_end > :last_month_end
        """),
        {
            "month_start": month_start,
            "last_month_end": last_month_end
        }
    )
    last_month_subs = last_month_subs_query.scalar() or 0
    subs_growth = ((active_subscriptions - last_month_subs) / last_month_subs * 100) if last_month_subs > 0 else 0
    
    # Pagos fallidos en las últimas 24 horas
    failed_payments_query = db.execute(
        text("""
            SELECT COUNT(*) as count
            FROM core.payments
            WHERE status = 'failed'
            AND created_at >= :yesterday
        """),
        {"yesterday": now - timedelta(hours=24)}
    )
    failed_payments_24h = failed_payments_query.scalar() or 0
    
    # ==================== ANALYTICS ====================
    
    # Vistas últimos 30 días
    thirty_days_ago = now - timedelta(days=30)
    sixty_days_ago = now - timedelta(days=60)
    
    total_views_query = db.execute(
        text("""
            SELECT COUNT(*) as count
            FROM analytics.listing_views
            WHERE viewed_at >= :thirty_days_ago
        """),
        {"thirty_days_ago": thirty_days_ago}
    )
    total_views = total_views_query.scalar() or 0
    
    # Vistas de los 30 días anteriores (para comparación)
    previous_period_views_query = db.execute(
        text("""
            SELECT COUNT(*) as count
            FROM analytics.listing_views
            WHERE viewed_at >= :sixty_days_ago
            AND viewed_at < :thirty_days_ago
        """),
        {
            "sixty_days_ago": sixty_days_ago,
            "thirty_days_ago": thirty_days_ago
        }
    )
    previous_period_views = previous_period_views_query.scalar() or 0
    views_growth = ((total_views - previous_period_views) / previous_period_views * 100) if previous_period_views > 0 else 0
    
    # ==================== BOOKINGS (Airbnb-style) ====================
    
    # Reservas activas
    active_bookings_query = db.execute(
        text("""
            SELECT COUNT(*) as count
            FROM core.bookings
            WHERE status IN ('confirmed', 'reservation_paid', 'checked_in')
            AND check_out_date >= :now
        """),
        {"now": now}
    )
    active_bookings = active_bookings_query.scalar() or 0
    
    # ==================== DATOS DE TENDENCIA (30 días) ====================
    
    # Tendencia de usuarios (registros por día)
    users_trend_query = db.execute(
        text("""
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM core.users
            WHERE created_at >= :thirty_days_ago
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        """),
        {"thirty_days_ago": thirty_days_ago}
    )
    users_trend_raw = users_trend_query.fetchall()
    
    # Acumular usuarios totales por día
    users_trend = []
    cumulative_users = total_users - sum(row.count for row in users_trend_raw)
    for row in users_trend_raw:
        cumulative_users += row.count
        users_trend.append({
            "date": row.date.strftime("%d/%m"),
            "value": cumulative_users
        })
    
    # Tendencia de propiedades (activas por día)
    listings_trend_query = db.execute(
        text("""
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM core.listings
            WHERE created_at >= :thirty_days_ago
            AND status = 'published'
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        """),
        {"thirty_days_ago": thirty_days_ago}
    )
    listings_trend_raw = listings_trend_query.fetchall()
    
    # Acumular propiedades activas por día
    listings_trend = []
    cumulative_listings = active_listings - sum(row.count for row in listings_trend_raw)
    for row in listings_trend_raw:
        cumulative_listings += row.count
        listings_trend.append({
            "date": row.date.strftime("%d/%m"),
            "value": cumulative_listings
        })
    
    # Tendencia de ingresos diarios (pagos exitosos)
    revenue_trend_query = db.execute(
        text("""
            SELECT 
                DATE(created_at) as date,
                COALESCE(SUM(amount), 0) as total
            FROM core.payments
            WHERE created_at >= :thirty_days_ago
            AND status = 'succeeded'
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        """),
        {"thirty_days_ago": thirty_days_ago}
    )
    revenue_trend_raw = revenue_trend_query.fetchall()
    
    revenue_trend = []
    for row in revenue_trend_raw:
        revenue_trend.append({
            "date": row.date.strftime("%d/%m"),
            "value": float(row.total)
        })
    
    # ==================== RESPUESTA ====================
    
    return {
        "users": {
            "total": total_users,
            "active_7d": active_users,
            "new_today": new_users_today,
            "growth_percentage": round(users_growth, 1),
            "trend": users_trend if users_trend else None
        },
        "listings": {
            "total": total_listings,
            "active": active_listings,
            "new_today": new_listings_today,
            "growth_percentage": round(listings_growth, 1),
            "trend": listings_trend if listings_trend else None
        },
        "finances": {
            "mrr": round(mrr, 2),
            "current_month_revenue": round(current_month_revenue, 2),
            "revenue_growth_percentage": round(revenue_growth, 1),
            "active_subscriptions": active_subscriptions,
            "subscriptions_growth_percentage": round(subs_growth, 1),
            "revenue_trend": revenue_trend if revenue_trend else None
        },
        "analytics": {
            "total_views_month": total_views,
            "views_growth_percentage": round(views_growth, 1)
        },
        "bookings": {
            "active": active_bookings
        },
        "alerts": {
            "pending_verifications": pending_verifications,
            "failed_payments_24h": failed_payments_24h,
            "critical_count": pending_verifications + failed_payments_24h
        },
        "generated_at": now.isoformat()
    }


@router.get("/analytics/summary")
async def get_analytics_summary(
    days: int = Query(default=30, ge=1, le=365, description="Número de días a analizar"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Obtener resumen de analytics con datos reales de eventos
    
    Args:
        days: Número de días hacia atrás a analizar (default 30)
    
    Returns:
        - Eventos por día
        - Top búsquedas
        - Top propiedades más vistas
        - Distribución de eventos por tipo
        - Conversión vista → contacto
    """
    
    now = datetime.utcnow()
    start_date = datetime.now(timezone.utc) - timedelta(days=days)
    
    # Eventos por día
    daily_events_query = db.execute(
        text("""
            WITH date_series AS (
                SELECT generate_series(
                    :start_date,
                    :end_date,
                    '1 day'::interval
                )::date AS date
            )
            SELECT 
                ds.date,
                COALESCE(SUM(CASE WHEN event_type = 'view' THEN count ELSE 0 END), 0) as views,
                COALESCE(SUM(CASE WHEN event_type = 'contact' THEN count ELSE 0 END), 0) as contacts,
                COALESCE(SUM(CASE WHEN event_type = 'search' THEN count ELSE 0 END), 0) as searches,
                COALESCE(SUM(CASE WHEN event_type = 'favorite' THEN count ELSE 0 END), 0) as favorites
            FROM date_series ds
            LEFT JOIN (
                SELECT DATE(viewed_at) as date, 'view' as event_type, COUNT(*) as count
                FROM analytics.listing_views WHERE viewed_at >= :start_date
                GROUP BY DATE(viewed_at)
                UNION ALL
                SELECT DATE(contacted_at) as date, 'contact' as event_type, COUNT(*) as count
                FROM analytics.listing_contacts WHERE contacted_at >= :start_date
                GROUP BY DATE(contacted_at)
                UNION ALL
                SELECT DATE(searched_at) as date, 'search' as event_type, COUNT(*) as count
                FROM analytics.searches WHERE searched_at >= :start_date
                GROUP BY DATE(searched_at)
                UNION ALL
                SELECT DATE(actioned_at) as date, 'favorite' as event_type, COUNT(*) as count
                FROM analytics.listing_favorites WHERE actioned_at >= :start_date
                GROUP BY DATE(actioned_at)
            ) events ON ds.date = events.date
            GROUP BY ds.date
            ORDER BY ds.date ASC
        """),
        {"start_date": start_date, "end_date": now}
    )
    
    daily_events = [
        {
            "date": row.date.isoformat(),
            "views": row.views,
            "contacts": row.contacts,
            "searches": row.searches,
            "favorites": row.favorites
        }
        for row in daily_events_query.fetchall()
    ]
    
    # Top búsquedas (de tabla especializada)
    top_searches_query = db.execute(
        text("""
            SELECT 
                query_text,
                COUNT(*) as count
            FROM analytics.searches
            WHERE searched_at >= :start_date
            AND query_text IS NOT NULL
            AND query_text != ''
            GROUP BY query_text 
            ORDER BY count DESC
            LIMIT 10
        """),
        {"start_date": start_date}
    )
    top_searches = [
        {"term": row.query_text, "count": row.count}
        for row in top_searches_query.fetchall()
    ]
    
    # Top propiedades más vistas
    top_listings_query = db.execute(
        text("""
            SELECT 
                v.listing_id,
                l.title,
                COUNT(*) as views,
                COUNT(DISTINCT v.user_id) as unique_visitors
            FROM analytics.listing_views v
            JOIN core.listings l ON v.listing_id = l.id
            WHERE v.viewed_at >= :start_date
            AND v.listing_id IS NOT NULL
            GROUP BY v.listing_id, l.title
            ORDER BY views DESC
            LIMIT 10
        """),
        {"start_date": start_date}
    )
    top_listings = [
        {
            "listing_id": str(row.listing_id),
            "title": row.title,
            "views": row.views,
            "unique_visitors": row.unique_visitors
        }
        for row in top_listings_query.fetchall()
    ]
    
    # Distribución de eventos por tipo
    event_distribution_query = db.execute(
        text("""
            SELECT 'view' as event_type, COUNT(*) as count FROM analytics.listing_views WHERE viewed_at >= :start_date
            UNION ALL
            SELECT 'contact' as event_type, COUNT(*) as count FROM analytics.listing_contacts WHERE contacted_at >= :start_date
            UNION ALL
            SELECT 'search' as event_type, COUNT(*) as count FROM analytics.searches WHERE searched_at >= :start_date
            UNION ALL
            SELECT 'favorite' as event_type, COUNT(*) as count FROM analytics.listing_favorites WHERE actioned_at >= :start_date
        """),
        {"start_date": start_date}
    )
    event_distribution = {
        row.event_type: row.count
        for row in event_distribution_query.fetchall()
    }
    
    # Tasa de conversión vista → contacto
    total_views = event_distribution.get('view', 0)
    total_contacts = event_distribution.get('contact', 0)
    conversion_rate = (total_contacts / total_views * 100) if total_views > 0 else 0
    
    return {
        "period": {
            "days": days,
            "start_date": start_date.date().isoformat(),
            "end_date": now.date().isoformat()
        },
        "daily_events": daily_events,
        "top_searches": top_searches,
        "top_listings": top_listings,
        "event_distribution": event_distribution,
        "conversion": {
            "views": total_views,
            "contacts": total_contacts,
            "rate_percentage": round(conversion_rate, 2)
        }
    }


@router.get("/finances/summary")
async def get_finances_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Resumen financiero completo
    
    Returns:
        - MRR (Monthly Recurring Revenue) con tendencia
        - MRR por plan
        - Ingresos totales del mes
        - Churn rate
    """
    
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)
    last_month_end = month_start - timedelta(seconds=1)
    
    # MRR - Suscripciones activas mensuales
    mrr_query = db.execute(
        text("""
            SELECT 
                p.name as plan_name,
                p.price_amount,
                COUNT(s.id) as subscription_count,
                SUM(p.price_amount) as total_mrr
            FROM core.subscriptions s
            JOIN core.plans p ON s.plan_id = p.id
            WHERE s.status = 'active'
            AND s.current_period_end > :now
            GROUP BY p.id, p.name, p.price_amount
            ORDER BY total_mrr DESC
        """),
        {"now": now}
    )
    
    mrr_by_plan = {}
    total_mrr = 0
    active_subscriptions = 0
    for row in mrr_query.fetchall():
        plan_mrr = float(row.total_mrr or 0)
        total_mrr += plan_mrr
        active_subscriptions += row.subscription_count
        mrr_by_plan[row.plan_name.lower()] = plan_mrr
    
    # MRR del mes pasado
    last_month_mrr_query = db.execute(
        text("""
            SELECT COALESCE(SUM(p.price_amount), 0) as total_mrr
            FROM core.subscriptions s
            JOIN core.plans p ON s.plan_id = p.id
            WHERE s.status = 'active'
            AND s.current_period_start <= :last_month_end
            AND s.current_period_end >= :last_month_start
        """),
        {
            "last_month_start": last_month_start,
            "last_month_end": last_month_end
        }
    )
    last_month_mrr = float(last_month_mrr_query.scalar() or 0)
    mrr_change = total_mrr - last_month_mrr
    mrr_growth_percentage = (mrr_change / last_month_mrr * 100) if last_month_mrr > 0 else 0
    
    # Tendencia de MRR (últimos 6 meses)
    mrr_trend_query = db.execute(
        text("""
            WITH RECURSIVE months AS (
                SELECT 
                    DATE_TRUNC('month', :now - INTERVAL '5 months') as month_date
                UNION ALL
                SELECT month_date + INTERVAL '1 month'
                FROM months
                WHERE month_date < DATE_TRUNC('month', :now)
            )
            SELECT 
                TO_CHAR(m.month_date, 'YYYY-MM') as month,
                COALESCE(SUM(p.price_amount), 0) as mrr
            FROM months m
            LEFT JOIN core.subscriptions s ON 
                s.status = 'active' AND
                DATE_TRUNC('month', s.current_period_start) <= m.month_date AND
                DATE_TRUNC('month', s.current_period_end) >= m.month_date
            LEFT JOIN core.plans p ON s.plan_id = p.id
            GROUP BY m.month_date
            ORDER BY m.month_date
        """),
        {"now": now}
    )
    
    mrr_trend = [
        {
            "date": row.month,
            "value": float(row.mrr or 0)
        }
        for row in mrr_trend_query.fetchall()
    ]
    
    # Ingresos totales del mes actual (solo pagos exitosos)
    current_month_revenue_query = db.execute(
        text("""
            SELECT 
                COUNT(*) as transaction_count,
                COALESCE(SUM(amount), 0) as total_amount
            FROM core.payments
            WHERE created_at >= :month_start
            AND status = 'succeeded'
        """),
        {"month_start": month_start}
    )
    revenue_data = current_month_revenue_query.fetchone()
    current_revenue = float(revenue_data.total_amount or 0)
    current_transaction_count = revenue_data.transaction_count or 0
    
    # Ingresos del mes pasado
    last_month_revenue_query = db.execute(
        text("""
            SELECT COALESCE(SUM(amount), 0) as total_amount
            FROM core.payments
            WHERE created_at >= :last_month_start
            AND created_at < :month_start
            AND status = 'succeeded'
        """),
        {
            "last_month_start": last_month_start,
            "month_start": month_start
        }
    )
    last_month_revenue = float(last_month_revenue_query.scalar() or 0)
    revenue_change = current_revenue - last_month_revenue
    revenue_growth_percentage = (revenue_change / last_month_revenue * 100) if last_month_revenue > 0 else 0
    
    # Churn rate (cancelaciones del mes actual)
    churn_query = db.execute(
        text("""
            WITH active_start AS (
                SELECT COUNT(*) as count
                FROM core.subscriptions
                WHERE current_period_start < :month_start
                AND current_period_end >= :month_start
            ),
            cancelled_this_month AS (
                SELECT COUNT(*) as count
                FROM core.subscriptions
                WHERE status = 'canceled'
                AND updated_at >= :month_start
                AND updated_at < :next_month
            )
            SELECT 
                (SELECT count FROM active_start) as active_at_start,
                (SELECT count FROM cancelled_this_month) as cancelled
        """),
        {
            "month_start": month_start,
            "next_month": month_start + timedelta(days=32)
        }
    )
    churn_data = churn_query.fetchone()
    active_at_start = churn_data.active_at_start or 0
    cancelled = churn_data.cancelled or 0
    churn_rate = (cancelled / active_at_start * 100) if active_at_start > 0 else 0
    
    return {
        "mrr": {
            "total": round(total_mrr, 2),
            "change": round(mrr_change, 2),
            "growth_percentage": round(mrr_growth_percentage, 2),
            "active_subscriptions": active_subscriptions,
            "trend": mrr_trend
        },
        "mrr_by_plan": mrr_by_plan,
        "total_revenue": {
            "amount": round(current_revenue, 2),
            "change": round(revenue_change, 2),
            "growth_percentage": round(revenue_growth_percentage, 2),
            "transaction_count": current_transaction_count
        },
        "churn": {
            "rate": round(churn_rate, 2),
            "cancelled": cancelled,
            "active_at_month_start": active_at_start
        }
    }


@router.get("/bookings/summary")
async def get_bookings_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Resumen del sistema de reservas estilo Airbnb
    
    Returns:
        - Reservas por estado
        - Ingresos por comisiones
        - Propiedades más rentables
        - Tasa de cancelación
    """
    
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Reservas por estado
    bookings_by_status_query = db.execute(
        text("""
            SELECT 
                status,
                COUNT(*) as count,
                COALESCE(SUM(total_price), 0) as total_value
            FROM core.bookings
            WHERE created_at >= :month_start
            GROUP BY status
        """),
        {"month_start": month_start}
    )
    
    bookings_by_status = {
        row.status: {
            "count": row.count,
            "total_value": float(row.total_value)
        }
        for row in bookings_by_status_query.fetchall()
    }
    
    # Comisiones de plataforma del mes (service_fee está en bookings)
    platform_fees_query = db.execute(
        text("""
            SELECT 
                COALESCE(SUM(service_fee), 0) as total_fees,
                COUNT(*) as booking_count
            FROM core.bookings
            WHERE created_at >= :month_start
            AND status IN ('confirmed', 'reservation_paid', 'checked_in', 'completed')
        """),
        {"month_start": month_start}
    )
    fees_data = platform_fees_query.fetchone()
    
    # Top 10 propiedades por ingresos (sin JOIN a booking_payments que no tiene platform_fee)
    top_properties_query = db.execute(
        text("""
            SELECT 
                l.id as listing_id,
                l.title,
                COUNT(b.id) as booking_count,
                COALESCE(SUM(b.total_price), 0) as total_revenue,
                COALESCE(SUM(b.service_fee), 0) as platform_fees
            FROM core.listings l
            JOIN core.bookings b ON l.id = b.listing_id
            WHERE b.created_at >= :month_start
            AND b.status IN ('confirmed', 'reservation_paid', 'checked_in', 'completed')
            GROUP BY l.id, l.title
            ORDER BY total_revenue DESC
            LIMIT 10
        """),
        {"month_start": month_start}
    )
    
    top_properties = [
        {
            "listing_id": str(row.listing_id),
            "title": row.title,
            "booking_count": row.booking_count,
            "total_revenue": float(row.total_revenue),
            "platform_fees": float(row.platform_fees)
        }
        for row in top_properties_query.fetchall()
    ]
    
    # Tasa de cancelación
    cancellation_query = db.execute(
        text("""
            SELECT 
                COUNT(*) as total_bookings,
                COUNT(CASE WHEN status IN ('cancelled_by_guest', 'cancelled_by_host', 'cancelled_no_payment') THEN 1 END) as cancelled
            FROM core.bookings
            WHERE created_at >= :month_start
        """),
        {"month_start": month_start}
    )
    cancel_data = cancellation_query.fetchone()
    total_bookings = cancel_data.total_bookings or 0
    cancelled_bookings = cancel_data.cancelled or 0
    cancellation_rate = (cancelled_bookings / total_bookings * 100) if total_bookings > 0 else 0
    
    return {
        "bookings_by_status": bookings_by_status,
        "platform_fees": {
            "total": round(float(fees_data.total_fees or 0), 2),
            "booking_count": fees_data.booking_count
        },
        "top_properties": top_properties,
        "cancellation_rate": round(cancellation_rate, 2)
    }


@router.get("/users/stats")
async def get_users_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Obtener estadísticas de usuarios para el tree de clasificación
    
    Returns:
        - Estadísticas por rol
        - Estadísticas por estado de verificación
        - Estadísticas por actividad
        - Estadísticas por plan de suscripción
    """
    
    now = datetime.now(timezone.utc)
    today_start = now
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    # Total de usuarios
    total_query = db.execute(text("SELECT COUNT(*) FROM core.users"))
    total_users = total_query.scalar() or 0
    
    # Por rol
    by_role_query = db.execute(
        text("""
            SELECT 
                role,
                COUNT(*) as count
            FROM core.users
            GROUP BY role
        """)
    )
    by_role = {row.role: row.count for row in by_role_query.fetchall()}
    
    # Por estado de verificación
    verification_query = db.execute(
        text("""
            SELECT 
                COUNT(*) as total,
                COUNT(CASE WHEN is_verified THEN 1 END) as verified,
                COUNT(CASE WHEN NOT is_verified THEN 1 END) as not_verified
            FROM core.users
        """)
    )
    ver_data = verification_query.fetchone()
    
    # Por estado activo/suspendido
    status_query = db.execute(
        text("""
            SELECT 
                COUNT(CASE WHEN is_active THEN 1 END) as active,
                COUNT(CASE WHEN NOT is_active THEN 1 END) as suspended
            FROM core.users
        """)
    )
    status_data = status_query.fetchone()
    
    # Por actividad reciente
    activity_query = db.execute(
        text("""
            WITH user_activity AS (
                SELECT DISTINCT user_id FROM analytics.listing_views WHERE viewed_at >= :week_ago AND user_id IS NOT NULL
                UNION
                SELECT DISTINCT user_id FROM analytics.listing_contacts WHERE contacted_at >= :week_ago AND user_id IS NOT NULL
                UNION
                SELECT DISTINCT user_id FROM analytics.searches WHERE searched_at >= :week_ago AND user_id IS NOT NULL
                UNION
                SELECT DISTINCT user_id FROM analytics.listing_favorites WHERE actioned_at >= :week_ago AND user_id IS NOT NULL
            )
            SELECT COUNT(DISTINCT user_id) FROM user_activity
        """),
        {"week_ago": week_ago}
    )
    active_last_week = activity_query.scalar() or 0
    
    # Nuevos registros hoy
    new_today_query = db.execute(
        text("SELECT COUNT(*) FROM core.users WHERE created_at >= :today"),
        {"today": today_start}
    )
    new_today = new_today_query.scalar() or 0
    
    # Nuevos esta semana
    new_week_query = db.execute(
        text("SELECT COUNT(*) FROM core.users WHERE created_at >= :week_ago"),
        {"week_ago": week_ago}
    )
    new_week = new_week_query.scalar() or 0
    
    # Nuevos este mes
    new_month_query = db.execute(
        text("SELECT COUNT(*) FROM core.users WHERE created_at >= :month_ago"),
        {"month_ago": month_ago}
    )
    new_month = new_month_query.scalar() or 0
    
    # Por plan de suscripción
    by_plan_query = db.execute(
        text("""
            SELECT 
                p.name as plan_name,
                COUNT(DISTINCT s.user_id) as user_count
            FROM core.subscriptions s
            JOIN core.plans p ON s.plan_id = p.id
            WHERE s.status = 'active'
            AND s.current_period_end > :now
            GROUP BY p.name
        """),
        {"now": now}
    )
    by_plan = {row.plan_name: row.user_count for row in by_plan_query.fetchall()}
    
    # Usuarios sin suscripción activa
    no_subscription_query = db.execute(
        text("""
            SELECT COUNT(*) FROM core.users u
            WHERE NOT EXISTS (
                SELECT 1 FROM core.subscriptions s
                WHERE s.user_id = u.id
                AND s.status = 'active'
                AND s.current_period_end > :now
            )
        """),
        {"now": now}
    )
    no_subscription = no_subscription_query.scalar() or 0
    
    return {
        "total": total_users,
        "by_role": {
            "user": by_role.get('user', 0),
            "agent": by_role.get('agent', 0),
            "admin": by_role.get('admin', 0)
        },
        "by_verification": {
            "verified": ver_data.verified or 0,
            "not_verified": ver_data.not_verified or 0
        },
        "by_status": {
            "active": status_data.active or 0,
            "suspended": status_data.suspended or 0
        },
        "by_activity": {
            "active_last_week": active_last_week,
            "new_today": new_today,
            "new_this_week": new_week,
            "new_this_month": new_month
        },
        "by_subscription": {
            **by_plan,
            "no_subscription": no_subscription
        }
    }


@router.get("/users/list")
async def get_users_list(
    role: Optional[str] = Query(None, description="Filtrar por rol: user, agent, admin"),
    is_active: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    is_verified: Optional[str] = Query(None, description="Filtrar por verificación: email, phone, full, none"),
    activity: Optional[str] = Query(None, description="Filtrar por actividad: today, week, month"),
    plan: Optional[str] = Query(None, description="Filtrar por plan de suscripción"),
    search: Optional[str] = Query(None, description="Buscar por nombre o email"),
    page: int = Query(1, ge=1, description="Página"),
    limit: int = Query(20, ge=1, le=100, description="Resultados por página"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Obtener lista de usuarios con filtros avanzados aplicados en backend
    
    Args:
        role: Filtrar por rol
        is_active: Filtrar por estado activo/suspendido
        is_verified: Filtrar por verificación (email, phone, full, none)
        activity: Filtrar por actividad reciente (today, week, month)
        plan: Filtrar por plan de suscripción
        search: Buscar por nombre o email
        page: Número de página
        limit: Resultados por página
    
    Returns:
        Lista de usuarios con paginación
    """
    
    now = datetime.now(timezone.utc)
    offset = (page - 1) * limit
    
    # Construir la query base
    base_conditions = []
    params = {"offset": offset, "limit": limit, "now": now}
    
    # Filtro por rol
    if role:
        base_conditions.append("u.role = :role")
        params["role"] = role
    
    # Filtro por estado activo
    if is_active is not None:
        base_conditions.append("u.is_active = :is_active")
        params["is_active"] = is_active
    
    # Filtro por verificación
    if is_verified:
        if is_verified == "verified":
            base_conditions.append("u.is_verified = true")
        elif is_verified == "not_verified":
            base_conditions.append("u.is_verified = false")
    
    # Filtro por búsqueda de texto
    if search:
        search_term = f"%{search.lower()}%"
        base_conditions.append("(LOWER(u.email) LIKE :search OR LOWER(concat_ws(first_name, last_name)) LIKE :search)")
        params["search"] = search_term
    
    # Filtro por plan de suscripción
    plan_join = ""
    if plan:
        if plan == "no_subscription":
            base_conditions.append("""
                NOT EXISTS (
                    SELECT 1 FROM core.subscriptions s
                    WHERE s.user_id = u.id
                    AND s.status = 'active'
                    AND s.current_period_end > :now
                )
            """)
        else:
            plan_join = """
                INNER JOIN core.subscriptions s ON u.id = s.user_id
                INNER JOIN core.plans p ON s.plan_id = p.id
            """
            base_conditions.append("p.name = :plan")
            base_conditions.append("s.status = 'active'")
            base_conditions.append("s.current_period_end > :now")
            params["plan"] = plan
    
    # Filtro por actividad
    activity_join = ""
    if activity:
        if activity == "today":
            activity_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif activity == "week":
            activity_date = now - timedelta(days=7)
        elif activity == "month":
            activity_date = now - timedelta(days=30)
        else:
            activity_date = None
        
        if activity_date:
            params["activity_date"] = activity_date
            activity_join = """
                INNER JOIN (
                    SELECT DISTINCT user_id FROM analytics.listing_views WHERE viewed_at >= :activity_date AND user_id IS NOT NULL
                    UNION
                    SELECT DISTINCT user_id FROM analytics.listing_contacts WHERE contacted_at >= :activity_date AND user_id IS NOT NULL
                    UNION
                    SELECT DISTINCT user_id FROM analytics.searches WHERE searched_at >= :activity_date AND user_id IS NOT NULL
                    UNION
                    SELECT DISTINCT user_id FROM analytics.listing_favorites WHERE actioned_at >= :activity_date AND user_id IS NOT NULL
                ) activity ON u.id = activity.user_id
            """
    
    # Construir WHERE clause
    where_clause = " AND ".join(base_conditions) if base_conditions else "1=1"
    
    # Query de conteo
    count_query = db.execute(
        text(f"""
            SELECT COUNT(DISTINCT u.id)
            FROM core.users u
            {plan_join}
            {activity_join}
            WHERE {where_clause}
        """),
        params
    )
    total = count_query.scalar() or 0
    
    # Query de datos con paginación
    users_query = db.execute(
        text(f"""
            SELECT DISTINCT
                u.id,
                u.email,
                concat_ws(first_name, last_name) as full_name,
                u.phone as phone,
                u.role,
                u.is_active,
                u.is_verified,
                u.created_at,
                u.last_login_at,
                u.profile_picture_url,
                u.first_name,
                u.last_name
            FROM core.users u
            {plan_join}
            {activity_join}
            WHERE {where_clause}
            ORDER BY u.created_at DESC
            LIMIT :limit OFFSET :offset
        """),
        params
    )
    
    users = [
        {
            "id": str(row.id),
            "email": row.email,
            "full_name": row.full_name,
            "phone": row.phone,
            "role": row.role,
            "is_active": row.is_active,
            # "is_email_verified": row.is_email_verified,
            # "is_phone_verified": row.is_phone_verified,
            "created_at": row.created_at.isoformat() if row.created_at else None,
            "last_login_at": row.last_login_at.isoformat() if row.last_login_at else None,
            "avatar_url": row.profile_picture_url,
            "first_name": row.first_name,
            "last_name": row.last_name
        }
        for row in users_query.fetchall()
    ]
    
    return {
        "data": users,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit if total > 0 else 1
    }