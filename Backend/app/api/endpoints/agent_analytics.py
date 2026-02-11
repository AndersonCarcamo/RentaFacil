"""
Agent Analytics Endpoints
========================
Endpoints para obtener estadísticas y analytics de agentes inmobiliarios
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
import uuid

from app.core.database import get_db
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/analytics/agents/{agent_id}/stats")
async def get_agent_analytics_stats(
    agent_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Obtiene estadísticas agregadas de analytics para un agente específico.
    Incluye todas las propiedades del agente.
    """
    try:
        agent_uuid = uuid.UUID(agent_id)
        user_id = getattr(current_user, 'id', current_user.get('id') if isinstance(current_user, dict) else None)
        
        # Verificar que el usuario es el agente o tiene permisos
        agent_check = db.execute(text("""
            SELECT u.id, ua.agency_id, ua.role
            FROM core.users u
            LEFT JOIN core.user_agency ua ON u.id = ua.user_id
            WHERE u.id = :agent_id
        """), {'agent_id': agent_uuid}).fetchone()
        
        if not agent_check:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        # Verificar permisos: el mismo agente, o admin/owner de la agencia
        if agent_uuid != user_id:
            # Verificar si el usuario actual es admin/owner de la misma agencia
            user_agency = db.execute(text("""
                SELECT role FROM core.user_agency 
                WHERE user_id = :user_id AND agency_id = :agency_id
            """), {'user_id': user_id, 'agency_id': agent_check[1]}).fetchone()
            
            if not user_agency or user_agency[0] not in ['owner', 'admin']:
                raise HTTPException(status_code=403, detail="Not authorized")
        
        # Obtener todas las propiedades del agente
        listings = db.execute(text("""
            SELECT id, title, views_count, leads_count, created_at, status
            FROM core.listings
            WHERE owner_user_id = :agent_id
            AND status != 'archived'
            ORDER BY created_at DESC
        """), {'agent_id': agent_uuid}).fetchall()
        
        if not listings:
            return {
                "agent_id": agent_id,
                "total_listings": 0,
                "active_listings": 0,
                "total_views": 0,
                "total_contacts": 0,
                "unique_visitors": 0,
                "conversion_rate": 0,
                "daily_stats": [],
                "listings_performance": []
            }
        
        listing_ids = [str(listing[0]) for listing in listings]
        
        # Estadísticas agregadas 30 días (días completos)
        stats = db.execute(text("""
            SELECT 
                (SELECT COUNT(*) FROM analytics.listing_views 
                 WHERE listing_id = ANY(:listing_ids::uuid[])
                   AND viewed_at >= NOW() - INTERVAL '30 days'
                   AND DATE(viewed_at) < CURRENT_DATE) as views_30d,
                (SELECT COUNT(*) FROM analytics.listing_contacts 
                 WHERE listing_id = ANY(:listing_ids::uuid[])
                   AND contacted_at >= NOW() - INTERVAL '30 days'
                   AND DATE(contacted_at) < CURRENT_DATE) as contacts_30d,
                (SELECT COUNT(DISTINCT session_id) FROM analytics.listing_views 
                 WHERE listing_id = ANY(:listing_ids::uuid[])
                   AND DATE(viewed_at) < CURRENT_DATE) as unique_visitors
        """), {'listing_ids': listing_ids}).fetchone()
        
        # Vistas y contactos diarios últimos 30 días agregados
        daily = db.execute(text("""
            SELECT 
                date,
                COALESCE(v.views, 0) as views,
                COALESCE(c.contacts, 0) as contacts
            FROM generate_series(
                (NOW() - INTERVAL '30 days')::date,
                CURRENT_DATE - 1,
                '1 day'::interval
            ) date
            LEFT JOIN (
                SELECT DATE(viewed_at) as date, COUNT(*) as views
                FROM analytics.listing_views
                WHERE listing_id = ANY(:listing_ids::uuid[])
                  AND viewed_at >= NOW() - INTERVAL '30 days'
                  AND DATE(viewed_at) < CURRENT_DATE
                GROUP BY DATE(viewed_at)
            ) v ON v.date = date::date
            LEFT JOIN (
                SELECT DATE(contacted_at) as date, COUNT(*) as contacts
                FROM analytics.listing_contacts
                WHERE listing_id = ANY(:listing_ids::uuid[])
                  AND contacted_at >= NOW() - INTERVAL '30 days'
                  AND DATE(contacted_at) < CURRENT_DATE
                GROUP BY DATE(contacted_at)
            ) c ON c.date = date::date
            ORDER BY date ASC
        """), {'listing_ids': listing_ids}).fetchall()
        
        # Performance por propiedad (top 10)
        listings_performance = db.execute(text("""
            SELECT 
                l.id,
                l.title,
                l.status,
                COALESCE(v.views, 0) as views,
                COALESCE(c.contacts, 0) as contacts,
                COALESCE(v.unique_visitors, 0) as unique_visitors,
                CASE 
                    WHEN COALESCE(v.views, 0) > 0 
                    THEN ROUND((COALESCE(c.contacts, 0)::float / v.views) * 100, 2)
                    ELSE 0 
                END as conversion_rate
            FROM core.listings l
            LEFT JOIN (
                SELECT listing_id, COUNT(*) as views, COUNT(DISTINCT session_id) as unique_visitors
                FROM analytics.listing_views
                WHERE viewed_at >= NOW() - INTERVAL '30 days'
                GROUP BY listing_id
            ) v ON l.id = v.listing_id
            LEFT JOIN (
                SELECT listing_id, COUNT(*) as contacts
                FROM analytics.listing_contacts
                WHERE contacted_at >= NOW() - INTERVAL '30 days'
                GROUP BY listing_id
            ) c ON l.id = c.listing_id
            WHERE l.owner_user_id = :agent_id
              AND l.status != 'archived'
            ORDER BY views DESC
            LIMIT 10
        """), {'agent_id': agent_uuid}).fetchall()
        
        # Calcular totales
        total_views = sum(listing[2] for listing in listings)
        total_contacts = sum(listing[3] for listing in listings)
        active_count = sum(1 for listing in listings if listing[5] == 'published')
        
        return {
            "agent_id": agent_id,
            "total_listings": len(listings),
            "active_listings": active_count,
            "total_views": total_views,
            "total_contacts": total_contacts,
            "last_30_days": {
                "views": stats[0] if stats else 0,
                "contacts": stats[1] if stats else 0,
                "unique_visitors": stats[2] if stats else 0,
                "conversion_rate": round((stats[1] / stats[0] * 100) if stats and stats[0] > 0 else 0, 2)
            },
            "daily_stats": [{"date": str(r[0]), "views": r[1], "contacts": r[2]} for r in daily],
            "listings_performance": [
                {
                    "listing_id": str(r[0]),
                    "title": r[1],
                    "status": r[2],
                    "views": r[3],
                    "contacts": r[4],
                    "unique_visitors": r[5],
                    "conversion_rate": float(r[6])
                } for r in listings_performance
            ]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/agents/{agent_id}/listings-comparison")
async def get_agent_listings_comparison(
    agent_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Compara el rendimiento de todas las propiedades de un agente.
    Útil para identificar qué propiedades generan más engagement.
    """
    try:
        agent_uuid = uuid.UUID(agent_id)
        user_id = getattr(current_user, 'id', current_user.get('id') if isinstance(current_user, dict) else None)
        
        # Verificar permisos (mismo código que arriba)
        agent_check = db.execute(text("""
            SELECT u.id, ua.agency_id, ua.role
            FROM core.users u
            LEFT JOIN core.user_agency ua ON u.id = ua.user_id
            WHERE u.id = :agent_id
        """), {'agent_id': agent_uuid}).fetchone()
        
        if not agent_check:
            raise HTTPException(status_code=404, detail="Agent not found")
        
        if agent_uuid != user_id:
            user_agency = db.execute(text("""
                SELECT role FROM core.user_agency 
                WHERE user_id = :user_id AND agency_id = :agency_id
            """), {'user_id': user_id, 'agency_id': agent_check[1]}).fetchone()
            
            if not user_agency or user_agency[0] not in ['owner', 'admin']:
                raise HTTPException(status_code=403, detail="Not authorized")
        
        # Comparativa detallada por propiedad
        comparison = db.execute(text("""
            WITH listing_stats AS (
                SELECT 
                    l.id,
                    l.title,
                    l.district,
                    l.operation,
                    l.property_type,
                    l.price,
                    l.status,
                    l.published_at,
                    EXTRACT(days FROM NOW() - l.published_at) as days_published,
                    COALESCE(v.total_views, 0) as total_views,
                    COALESCE(c.total_contacts, 0) as total_contacts,
                    COALESCE(v.unique_visitors, 0) as unique_visitors,
                    COALESCE(v.views_7d, 0) as views_7d,
                    COALESCE(c.contacts_7d, 0) as contacts_7d
                FROM core.listings l
                LEFT JOIN (
                    SELECT 
                        listing_id, 
                        COUNT(*) as total_views,
                        COUNT(DISTINCT session_id) as unique_visitors,
                        COUNT(*) FILTER (WHERE viewed_at >= NOW() - INTERVAL '7 days') as views_7d
                    FROM analytics.listing_views
                    GROUP BY listing_id
                ) v ON l.id = v.listing_id
                LEFT JOIN (
                    SELECT 
                        listing_id, 
                        COUNT(*) as total_contacts,
                        COUNT(*) FILTER (WHERE contacted_at >= NOW() - INTERVAL '7 days') as contacts_7d
                    FROM analytics.listing_contacts
                    GROUP BY listing_id
                ) c ON l.id = c.listing_id
                WHERE l.owner_user_id = :agent_id
                  AND l.status != 'archived'
            )
            SELECT 
                id,
                title,
                district,
                operation,
                property_type,
                price,
                status,
                days_published,
                total_views,
                total_contacts,
                unique_visitors,
                views_7d,
                contacts_7d,
                CASE 
                    WHEN total_views > 0 
                    THEN ROUND((total_contacts::float / total_views) * 100, 2)
                    ELSE 0 
                END as conversion_rate,
                CASE 
                    WHEN days_published > 0 
                    THEN ROUND(total_views::float / days_published, 2)
                    ELSE 0
                END as avg_views_per_day,
                CASE 
                    WHEN days_published > 0 
                    THEN ROUND(total_contacts::float / days_published, 2)
                    ELSE 0
                END as avg_contacts_per_day
            FROM listing_stats
            ORDER BY total_views DESC
        """), {'agent_id': agent_uuid}).fetchall()
        
        return {
            "agent_id": agent_id,
            "total_listings": len(comparison),
            "listings": [
                {
                    "listing_id": str(r[0]),
                    "title": r[1],
                    "district": r[2],
                    "operation": r[3],
                    "property_type": r[4],
                    "price": float(r[5]) if r[5] else 0,
                    "status": r[6],
                    "days_published": int(r[7]) if r[7] else 0,
                    "total_views": r[8],
                    "total_contacts": r[9],
                    "unique_visitors": r[10],
                    "views_7d": r[11],
                    "contacts_7d": r[12],
                    "conversion_rate": float(r[13]),
                    "avg_views_per_day": float(r[14]),
                    "avg_contacts_per_day": float(r[15])
                } for r in comparison
            ]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/agencies/{agency_id}/overview")
async def get_agency_analytics_overview(
    agency_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Vista general de analytics de toda la agencia.
    Muestra rendimiento agregado de todos los agentes.
    """
    try:
        agency_uuid = uuid.UUID(agency_id)
        user_id = getattr(current_user, 'id', current_user.get('id') if isinstance(current_user, dict) else None)
        
        # Verificar que el usuario pertenece a la agencia y tiene permisos
        user_role = db.execute(text("""
            SELECT role FROM core.user_agency 
            WHERE user_id = :user_id AND agency_id = :agency_id
        """), {'user_id': user_id, 'agency_id': agency_uuid}).fetchone()
        
        if not user_role or user_role[0] not in ['owner', 'admin']:
            raise HTTPException(status_code=403, detail="Not authorized. Only agency owners/admins can view this.")
        
        # Estadísticas generales de la agencia
        agency_stats = db.execute(text("""
            SELECT 
                COUNT(DISTINCT l.owner_user_id) as total_agents,
                COUNT(DISTINCT l.id) as total_listings,
                COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'published') as active_listings,
                SUM(l.views_count) as total_views,
                SUM(l.leads_count) as total_contacts
            FROM core.listings l
            WHERE l.agency_id = :agency_id
              AND l.status != 'archived'
        """), {'agency_id': agency_uuid}).fetchone()
        
        # Performance por agente
        agents_performance = db.execute(text("""
            SELECT 
                u.id,
                u.first_name || ' ' || u.last_name as agent_name,
                u.email,
                ua.role,
                COUNT(DISTINCT l.id) as total_listings,
                COUNT(DISTINCT l.id) FILTER (WHERE l.status = 'published') as active_listings,
                COALESCE(SUM(l.views_count), 0) as total_views,
                COALESCE(SUM(l.leads_count), 0) as total_contacts,
                CASE 
                    WHEN SUM(l.views_count) > 0 
                    THEN ROUND((SUM(l.leads_count)::float / SUM(l.views_count)) * 100, 2)
                    ELSE 0 
                END as conversion_rate
            FROM core.users u
            JOIN core.user_agency ua ON u.id = ua.user_id
            LEFT JOIN core.listings l ON l.owner_user_id = u.id AND l.status != 'archived'
            WHERE ua.agency_id = :agency_id
              AND u.is_active = true
            GROUP BY u.id, u.first_name, u.last_name, u.email, ua.role
            ORDER BY total_views DESC
        """), {'agency_id': agency_uuid}).fetchall()
        
        # Tendencia diaria agregada (últimos 30 días)
        daily_trend = db.execute(text("""
            SELECT 
                date,
                COALESCE(v.views, 0) as views,
                COALESCE(c.contacts, 0) as contacts
            FROM generate_series(
                (NOW() - INTERVAL '30 days')::date,
                CURRENT_DATE - 1,
                '1 day'::interval
            ) date
            LEFT JOIN (
                SELECT DATE(viewed_at) as date, COUNT(*) as views
                FROM analytics.listing_views lv
                JOIN core.listings l ON lv.listing_id = l.id
                WHERE l.agency_id = :agency_id
                  AND lv.viewed_at >= NOW() - INTERVAL '30 days'
                  AND DATE(lv.viewed_at) < CURRENT_DATE
                GROUP BY DATE(lv.viewed_at)
            ) v ON v.date = date::date
            LEFT JOIN (
                SELECT DATE(contacted_at) as date, COUNT(*) as contacts
                FROM analytics.listing_contacts lc
                JOIN core.listings l ON lc.listing_id = l.id
                WHERE l.agency_id = :agency_id
                  AND lc.contacted_at >= NOW() - INTERVAL '30 days'
                  AND DATE(lc.contacted_at) < CURRENT_DATE
                GROUP BY DATE(contacted_at)
            ) c ON c.date = date::date
            ORDER BY date ASC
        """), {'agency_id': agency_uuid}).fetchall()
        
        return {
            "agency_id": agency_id,
            "overview": {
                "total_agents": agency_stats[0] if agency_stats else 0,
                "total_listings": agency_stats[1] if agency_stats else 0,
                "active_listings": agency_stats[2] if agency_stats else 0,
                "total_views": agency_stats[3] if agency_stats else 0,
                "total_contacts": agency_stats[4] if agency_stats else 0,
                "conversion_rate": round((agency_stats[4] / agency_stats[3] * 100) if agency_stats and agency_stats[3] > 0 else 0, 2)
            },
            "agents_performance": [
                {
                    "agent_id": str(r[0]),
                    "agent_name": r[1],
                    "email": r[2],
                    "role": r[3],
                    "total_listings": r[4],
                    "active_listings": r[5],
                    "total_views": r[6],
                    "total_contacts": r[7],
                    "conversion_rate": float(r[8])
                } for r in agents_performance
            ],
            "daily_trend": [{"date": str(r[0]), "views": r[1], "contacts": r[2]} for r in daily_trend]
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
