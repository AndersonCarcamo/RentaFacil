"""
Admin Dashboard Endpoints
Endpoints para el panel de administración con métricas reales del sistema
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text, func, and_, or_
from datetime import datetime, timedelta
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
            SELECT COUNT(DISTINCT user_id) as count 
            FROM analytics.events 
            WHERE created_at >= :week_ago AND user_id IS NOT NULL
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
    
    # Vistas totales del mes
    total_views_query = db.execute(
        text("""
            SELECT COUNT(*) as count
            FROM analytics.events
            WHERE event_type = 'view'
            AND created_at >= :month_start
        """),
        {"month_start": month_start}
    )
    total_views = total_views_query.scalar() or 0
    
    # Vistas del mes pasado
    last_month_views_query = db.execute(
        text("""
            SELECT COUNT(*) as count
            FROM analytics.events
            WHERE event_type = 'view'
            AND created_at >= :last_month_start
            AND created_at < :month_start
        """),
        {
            "last_month_start": last_month_start,
            "month_start": month_start
        }
    )
    last_month_views = last_month_views_query.scalar() or 0
    views_growth = ((total_views - last_month_views) / last_month_views * 100) if last_month_views > 0 else 0
    
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
    
    thirty_days_ago = now - timedelta(days=30)
    
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
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Eventos por día
    daily_events_query = db.execute(
        text("""
            SELECT 
                DATE(created_at) as date,
                event_type,
                COUNT(*) as count
            FROM analytics.events
            WHERE created_at >= :start_date
            GROUP BY DATE(created_at), event_type
            ORDER BY date ASC
        """),
        {"start_date": start_date}
    )
    daily_events_raw = daily_events_query.fetchall()
    
    # Organizar eventos por día
    daily_events = {}
    for row in daily_events_raw:
        date_str = row.date.isoformat()
        if date_str not in daily_events:
            daily_events[date_str] = {
                "date": date_str,
                "views": 0,
                "contacts": 0,
                "searches": 0,
                "favorites": 0
            }
        
        if row.event_type == 'view':
            daily_events[date_str]["views"] = row.count
        elif row.event_type == 'contact':
            daily_events[date_str]["contacts"] = row.count
        elif row.event_type == 'search':
            daily_events[date_str]["searches"] = row.count
        elif row.event_type == 'favorite':
            daily_events[date_str]["favorites"] = row.count
    
    # Top búsquedas (extraer de metadata)
    top_searches_query = db.execute(
        text("""
            SELECT 
                metadata->>'query' as search_term,
                COUNT(*) as count
            FROM analytics.events
            WHERE event_type = 'search'
            AND created_at >= :start_date
            AND metadata->>'query' IS NOT NULL
            GROUP BY metadata->>'query'
            ORDER BY count DESC
            LIMIT 10
        """),
        {"start_date": start_date}
    )
    top_searches = [
        {"term": row.search_term, "count": row.count}
        for row in top_searches_query.fetchall()
    ]
    
    # Top propiedades más vistas
    top_listings_query = db.execute(
        text("""
            SELECT 
                e.listing_id,
                l.title,
                COUNT(*) as views,
                COUNT(DISTINCT e.user_id) as unique_visitors
            FROM analytics.events e
            JOIN core.listings l ON e.listing_id = l.id
            WHERE e.event_type = 'view'
            AND e.created_at >= :start_date
            AND e.listing_id IS NOT NULL
            GROUP BY e.listing_id, l.title
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
            SELECT 
                event_type,
                COUNT(*) as count
            FROM analytics.events
            WHERE created_at >= :start_date
            GROUP BY event_type
        """),
        {"start_date": start_date}
    )
    event_distribution = {
        row.event_type: row.count
        for row in event_distribution_query.fetchall()
    }
    
    # Tasa de conversión vista → contacto
    total_views = event_distribution.get('listing_view', 0)
    total_contacts = event_distribution.get('contact_click', 0)
    conversion_rate = (total_contacts / total_views * 100) if total_views > 0 else 0
    
    return {
        "period": {
            "days": days,
            "start_date": start_date.date().isoformat(),
            "end_date": datetime.utcnow().date().isoformat()
        },
        "daily_events": list(daily_events.values()),
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
        - MRR (Monthly Recurring Revenue)
        - ARR (Annual Recurring Revenue)
        - Ingresos por plan
        - Transacciones recientes
        - Pagos fallidos
        - Churn rate
    """
    
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)
    
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
    
    mrr_by_plan = []
    total_mrr = 0
    for row in mrr_query.fetchall():
        plan_mrr = float(row.total_mrr or 0)
        total_mrr += plan_mrr
        mrr_by_plan.append({
            "plan_name": row.plan_name,
            "price": float(row.price),
            "subscriptions": row.subscription_count,
            "mrr": plan_mrr
        })
    
    # ARR (Annual Recurring Revenue)
    arr = total_mrr * 12
    
    # Transacciones del mes actual
    current_month_transactions_query = db.execute(
        text("""
            SELECT 
                COUNT(*) as total_transactions,
                COUNT(CASE WHEN status = 'succeeded' THEN 1 END) as completed,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
                COALESCE(SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END), 0) as total_revenue
            FROM core.payments
            WHERE created_at >= :month_start
        """),
        {"month_start": month_start}
    )
    transactions_stats = current_month_transactions_query.fetchone()
    
    # Últimas 10 transacciones
    recent_transactions_query = db.execute(
        text("""
            SELECT 
                p.id,
                p.amount,
                p.status,
                p.payment_method,
                p.created_at,
                u.email as user_email,
                u.full_name as user_name
            FROM core.payments p
            LEFT JOIN core.users u ON p.user_id = u.id
            ORDER BY p.created_at DESC
            LIMIT 10
        """)
    )
    recent_transactions = [
        {
            "id": str(row.id),
            "amount": float(row.amount),
            "status": row.status,
            "payment_method": row.payment_method,
            "created_at": row.created_at.isoformat(),
            "user_email": row.user_email,
            "user_name": row.user_name
        }
        for row in recent_transactions_query.fetchall()
    ]
    
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
            "by_plan": mrr_by_plan
        },
        "arr": round(arr, 2),
        "current_month": {
            "total_transactions": transactions_stats.total_transactions,
            "completed": transactions_stats.completed,
            "failed": transactions_stats.failed,
            "pending": transactions_stats.pending,
            "revenue": round(float(transactions_stats.total_revenue), 2)
        },
        "recent_transactions": recent_transactions,
        "churn": {
            "rate_percentage": round(churn_rate, 2),
            "active_at_start": active_at_start,
            "cancelled_this_month": cancelled
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
    
    # Comisiones de plataforma del mes
    platform_fees_query = db.execute(
        text("""
            SELECT 
                COALESCE(SUM(platform_fee), 0) as total_fees,
                COUNT(*) as booking_count
            FROM core.booking_payments
            WHERE created_at >= :month_start
            AND status = 'completed'
        """),
        {"month_start": month_start}
    )
    fees_data = platform_fees_query.fetchone()
    
    # Top 10 propiedades por ingresos
    top_properties_query = db.execute(
        text("""
            SELECT 
                l.id as listing_id,
                l.title,
                COUNT(b.id) as booking_count,
                COALESCE(SUM(b.total_price), 0) as total_revenue,
                COALESCE(SUM(bp.platform_fee), 0) as platform_fees
            FROM core.listings l
            JOIN core.bookings b ON l.id = b.listing_id
            LEFT JOIN core.booking_payments bp ON b.id = bp.booking_id
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
        "cancellation": {
            "rate_percentage": round(cancellation_rate, 2),
            "total_bookings": total_bookings,
            "cancelled": cancelled_bookings
        }
    }
