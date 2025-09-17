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
