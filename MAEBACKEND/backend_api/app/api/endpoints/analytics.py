from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date, datetime
import uuid

from app.core.database import get_db
from app.api.deps import get_current_user
from app.services.analytics_service import AnalyticsService
from app.schemas.analytics import (
    DashboardResponse, ListingAnalyticsResponse, UserAnalyticsResponse,
    RevenueAnalyticsResponse, PerformanceAnalyticsResponse,
    ReportResponse, AnalyticsEventRequest, AnalyticsEventResponse,
    AnalyticsPeriod, ReportFormat, Granularity, MetricType
)
from app.core.exceptions import BusinessLogicError

router = APIRouter()

# =================== DASHBOARD ANALYTICS ===================

@router.get("/analytics/dashboard", 
           response_model=DashboardResponse, 
           summary="Dashboard principal")
async def get_dashboard(
    period: AnalyticsPeriod = Query(AnalyticsPeriod.THIRTY_DAYS, description="Período de análisis"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener métricas del dashboard principal"""
    try:
        service = AnalyticsService(db)
        user_id = str(current_user.get("user_id", current_user.get("id")))
        
        dashboard_data = service.get_dashboard_analytics(user_id, period.value)
        return dashboard_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting dashboard analytics: {str(e)}")


# =================== LISTINGS ANALYTICS ===================

@router.get("/analytics/listings", 
           response_model=ListingAnalyticsResponse, 
           summary="Analíticas de listings")
async def get_listings_analytics(
    listing_id: Optional[str] = Query(None, description="ID específico del listing"),
    period: AnalyticsPeriod = Query(AnalyticsPeriod.THIRTY_DAYS, description="Período de análisis"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener analíticas de listings"""
    try:
        service = AnalyticsService(db)
        user_id = str(current_user.get("user_id", current_user.get("id")))
        
        analytics_data = service.get_listing_analytics(user_id, listing_id, period.value)
        return analytics_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting listing analytics: {str(e)}")


# =================== USER ANALYTICS (ADMIN) ===================

@router.get("/analytics/users", 
           response_model=UserAnalyticsResponse, 
           summary="Analíticas de usuarios (admin)")
async def get_users_analytics(
    period: AnalyticsPeriod = Query(AnalyticsPeriod.THIRTY_DAYS, description="Período de análisis"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener analíticas de usuarios (solo administradores)"""
    try:
        # Verificar permisos de administrador
        user_role = current_user.get("role", "user")
        if user_role not in ["admin", "super_admin"]:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        service = AnalyticsService(db)
        analytics_data = service.get_user_analytics(period.value)
        return analytics_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting user analytics: {str(e)}")


# =================== REVENUE ANALYTICS (ADMIN) ===================

@router.get("/analytics/revenue", 
           response_model=RevenueAnalyticsResponse, 
           summary="Analíticas de ingresos (admin)")
async def get_revenue_analytics(
    period: AnalyticsPeriod = Query(AnalyticsPeriod.THIRTY_DAYS, description="Período de análisis"),
    granularity: Granularity = Query(Granularity.DAILY, description="Granularidad temporal"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener analíticas de ingresos (solo administradores)"""
    try:
        # Verificar permisos de administrador
        user_role = current_user.get("role", "user")
        if user_role not in ["admin", "super_admin"]:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        service = AnalyticsService(db)
        analytics_data = service.get_revenue_analytics(period.value, granularity.value)
        return analytics_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting revenue analytics: {str(e)}")


# =================== PERFORMANCE ANALYTICS ===================

@router.get("/analytics/performance", 
           response_model=PerformanceAnalyticsResponse, 
           summary="Analíticas de rendimiento")
async def get_performance_analytics(
    metric: Optional[MetricType] = Query(None, description="Métrica específica"),
    period: AnalyticsPeriod = Query(AnalyticsPeriod.THIRTY_DAYS, description="Período de análisis"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener analíticas de rendimiento"""
    try:
        service = AnalyticsService(db)
        
        metric_value = metric.value if metric else None
        analytics_data = service.get_performance_analytics(metric_value, period.value)
        return analytics_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting performance analytics: {str(e)}")


# =================== REPORTS ===================

@router.get("/reports/listings", 
           response_model=ReportResponse, 
           summary="Reporte de listings")
async def generate_listings_report(
    format: ReportFormat = Query(ReportFormat.JSON, description="Formato del reporte"),
    from_date: Optional[date] = Query(None, description="Fecha de inicio"),
    to_date: Optional[date] = Query(None, description="Fecha de fin"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generar reporte de listings"""
    try:
        service = AnalyticsService(db)
        user_id = str(current_user.get("user_id", current_user.get("id")))
        
        report = service.generate_listings_report(user_id, format.value, from_date, to_date)
        return report
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating listings report: {str(e)}")


@router.get("/reports/revenue", 
           response_model=ReportResponse, 
           summary="Reporte de ingresos (admin)")
async def generate_revenue_report(
    format: ReportFormat = Query(ReportFormat.JSON, description="Formato del reporte"),
    from_date: Optional[date] = Query(None, description="Fecha de inicio"),
    to_date: Optional[date] = Query(None, description="Fecha de fin"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generar reporte de ingresos (solo administradores)"""
    try:
        # Verificar permisos de administrador
        user_role = current_user.get("role", "user")
        if user_role not in ["admin", "super_admin"]:
            raise HTTPException(status_code=403, detail="Admin access required")
        
        service = AnalyticsService(db)
        user_id = str(current_user.get("user_id", current_user.get("id")))
        
        report = service.generate_revenue_report(user_id, format.value, from_date, to_date)
        return report
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating revenue report: {str(e)}")


# =================== ANALYTICS TRACKING ===================

@router.post("/analytics/track", 
            response_model=AnalyticsEventResponse, 
            status_code=status.HTTP_201_CREATED,
            summary="Registrar evento de analytics")
async def track_analytics_event(
    event_data: AnalyticsEventRequest,
    request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Registrar evento de analytics"""
    try:
        service = AnalyticsService(db)
        user_id = str(current_user.get("user_id", current_user.get("id"))) if current_user else None
        
        # Obtener información de la request
        ip_address = request.client.host
        user_agent = request.headers.get("user-agent", "")
        
        # Registrar evento
        service.track_event(user_id, event_data, ip_address, user_agent)
        
        return AnalyticsEventResponse(
            id=uuid.uuid4(),  # En la implementación real, esto vendría del evento creado
            event_type=event_data.event_type,
            event_category=event_data.event_category,
            event_action=event_data.event_action,
            created_at=datetime.utcnow()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error tracking analytics event: {str(e)}")


@router.post("/analytics/track/view/{listing_id}", 
            summary="Registrar vista de listing")
async def track_listing_view(
    listing_id: str,
    request: Request,
    session_id: str = Query(..., description="ID de sesión"),
    referrer: Optional[str] = Query(None, description="URL de referencia"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Registrar vista de listing"""
    try:
        service = AnalyticsService(db)
        user_id = str(current_user.get("user_id", current_user.get("id"))) if current_user else None
        
        # Obtener información de la request
        ip_address = request.client.host
        user_agent = request.headers.get("user-agent", "")
        
        # Registrar vista
        service.track_listing_view(listing_id, user_id, session_id, ip_address, user_agent, referrer)
        
        return {"message": "Listing view tracked successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error tracking listing view: {str(e)}")


# =================== REPORT DOWNLOAD ===================

@router.get("/reports/{report_id}/download", 
           summary="Descargar reporte generado")
async def download_report(
    report_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Descargar reporte generado"""
    try:
        # Aquí se implementaría la lógica para descargar el archivo del reporte
        # Por ahora, devolvemos un placeholder
        
        return {
            "message": "Report download not implemented yet",
            "report_id": report_id,
            "download_url": f"/api/v1/reports/{report_id}/download"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error downloading report: {str(e)}")


# =================== SEARCH ANALYTICS ===================

@router.get("/analytics/search", 
           summary="Analíticas de búsquedas")
async def get_search_analytics(
    period: AnalyticsPeriod = Query(AnalyticsPeriod.THIRTY_DAYS, description="Período de análisis"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener analíticas de búsquedas"""
    try:
        # Placeholder para analytics de búsquedas
        return {
            "period": period.value,
            "total_searches": 0,
            "popular_queries": [],
            "popular_filters": [],
            "search_trends": [],
            "zero_result_queries": []
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting search analytics: {str(e)}")


# =================== REAL-TIME ANALYTICS ===================

@router.get("/analytics/realtime", 
           summary="Analíticas en tiempo real")
async def get_realtime_analytics(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener analíticas en tiempo real"""
    try:
        # Placeholder para analytics en tiempo real
        user_id = str(current_user.get("user_id", current_user.get("id")))
        
        return {
            "active_users": 0,
            "current_views": 0,
            "active_listings": 0,
            "recent_activity": [],
            "live_conversions": 0,
            "top_pages": [],
            "traffic_sources": []
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting realtime analytics: {str(e)}")


# =================== TRACKING ENDPOINTS ===================

@router.post("/analytics/track/view", status_code=status.HTTP_201_CREATED)
async def track_view(
    listing_id: str,
    session_id: Optional[str] = None,
    referrer: Optional[str] = None,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user=None  # Opcional, puede ser anónimo
):
    """Registra una vista de un listing (no requiere autenticación)"""
    try:
        from sqlalchemy import text
        import json
        
        listing_uuid = uuid.UUID(listing_id)
        user_agent = request.headers.get('user-agent', '') if request else ''
        ip_address = request.client.host if request and request.client else None
        
        # Preparar propiedades como JSON
        properties_dict = {'referrer': referrer, 'ip_address': ip_address}
        properties_json = json.dumps(properties_dict)
        
        # Registrar evento
        event_data = {
            'user_id': getattr(current_user, 'id', None) if current_user else None,
            'session_id': session_id,
            'event_type': 'listing_view',
            'listing_id': listing_uuid,
            'properties_json': properties_json,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'created_at': datetime.utcnow(),
        }
        
        db.execute(text("""
            INSERT INTO analytics.events 
            (user_id, session_id, event_type, listing_id, properties, ip_address, user_agent, created_at)
            VALUES (:user_id, :session_id, :event_type, :listing_id, CAST(:properties_json AS jsonb), :ip_address, :user_agent, :created_at)
        """), event_data)
        
        # Incrementar contador
        db.execute(text("UPDATE core.listings SET views_count = views_count + 1 WHERE id = :listing_id"), 
                  {'listing_id': listing_uuid})
        
        db.commit()
        return {"message": "View tracked"}
    
    except Exception as e:
        db.rollback()
        # Tracking no debe romper la UX de detalle de propiedad
        return {
            "message": "View tracking skipped",
            "error": str(e)
        }


@router.post("/analytics/track/contact", status_code=status.HTTP_201_CREATED)
async def track_contact(
    listing_id: str,
    contact_type: str,  # 'phone', 'whatsapp', 'email'
    session_id: Optional[str] = None,
    request: Request = None,
    db: Session = Depends(get_db),
    current_user=None
):
    """Registra un contacto/lead de un listing (no requiere autenticación)"""
    try:
        from sqlalchemy import text
        import json
        
        listing_uuid = uuid.UUID(listing_id)
        user_agent = request.headers.get('user-agent', '') if request else ''
        ip_address = request.client.host if request and request.client else None
        
        # Preparar propiedades como JSON
        properties_dict = {'contact_type': contact_type, 'ip_address': ip_address}
        properties_json = json.dumps(properties_dict)
        
        # Registrar evento
        event_data = {
            'user_id': getattr(current_user, 'id', None) if current_user else None,
            'session_id': session_id,
            'event_type': 'contact',
            'listing_id': listing_uuid,
            'properties_json': properties_json,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'created_at': datetime.utcnow(),
        }
        
        db.execute(text("""
            INSERT INTO analytics.events 
            (user_id, session_id, event_type, listing_id, properties, ip_address, user_agent, created_at)
            VALUES (:user_id, :session_id, :event_type, :listing_id, CAST(:properties_json AS jsonb), :ip_address, :user_agent, :created_at)
        """), event_data)
        
        # Incrementar contador
        db.execute(text("UPDATE core.listings SET leads_count = leads_count + 1 WHERE id = :listing_id"), 
                  {'listing_id': listing_uuid})
        
        db.commit()
        return {"message": "Contact tracked"}
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/listings/{listing_id}/stats")
async def get_listing_stats(
    listing_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Obtiene estadísticas detalladas de un listing (solo propietario)"""
    try:
        from sqlalchemy import text
        
        listing_uuid = uuid.UUID(listing_id)
        user_id = getattr(current_user, 'id', current_user.get('id') if isinstance(current_user, dict) else None)
        
        # Verificar pertenencia
        listing = db.execute(text("""
            SELECT owner_user_id, views_count, leads_count, favorites_count
            FROM core.listings WHERE id = :listing_id
        """), {'listing_id': listing_uuid}).fetchone()
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        if listing[0] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        # Estadísticas 30 días (días completos solamente - excluir hoy)
        stats = db.execute(text("""
            SELECT 
                COUNT(*) FILTER (WHERE event_type = 'view') as views_30d,
                COUNT(*) FILTER (WHERE event_type = 'contact') as contacts_30d,
                COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'view' AND DATE(created_at) <= CURRENT_DATE - 1) as unique_visitors,
                COUNT(*) FILTER (WHERE event_type = 'view' AND created_at >= NOW() - INTERVAL '7 days') as views_7d
            FROM analytics.events
            WHERE listing_id = :listing_id 
              AND created_at >= NOW() - INTERVAL '30 days'
              AND DATE(created_at) <= CURRENT_DATE - 1
        """), {'listing_id': listing_uuid}).fetchone()
        
        # Vistas y contactos diarios últimos 30 días (incluir hasta ayer)
        daily = db.execute(text("""
            SELECT 
                DATE(created_at) as date, 
                COUNT(*) FILTER (WHERE event_type = 'view') as views,
                COUNT(*) FILTER (WHERE event_type = 'contact') as contacts
            FROM analytics.events
            WHERE listing_id = :listing_id 
              AND created_at >= NOW() - INTERVAL '30 days'
              AND DATE(created_at) <= CURRENT_DATE - 1
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        """), {'listing_id': listing_uuid}).fetchall()
        
        return {
            "listing_id": listing_id,
            "total_views": listing[1],
            "total_leads": listing[2],
            "total_favorites": listing[3],
            "last_30_days": {
                "views": stats[0] if stats else 0,
                "contacts": stats[1] if stats else 0,
                "unique_visitors": stats[2] if stats else 0,
            },
            "last_7_days": {"views": stats[3] if stats else 0},
            "daily_stats": [{"date": str(r[0]), "views": r[1], "contacts": r[2]} for r in daily]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
