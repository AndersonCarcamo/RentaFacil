from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc, asc, text
from typing import List, Tuple, Optional, Dict, Any, Union
from datetime import datetime, timedelta, date
from decimal import Decimal
import uuid
import json
import csv
import os

from app.models.analytics import (
    AnalyticsEvent, ListingView, SearchQuery, PerformanceMetric, 
    ReportGeneration, UserActivity
)
from app.models.listing import Listing
from app.models.subscription import Subscription, PaymentHistory
from app.schemas.analytics import (
    DashboardResponse, DashboardMetrics, ChartDataPoint,
    ListingAnalyticsResponse, ListingMetrics,
    UserAnalyticsResponse, UserMetrics,
    RevenueAnalyticsResponse, RevenueMetrics,
    PerformanceAnalyticsResponse, PerformanceMetrics,
    ReportRequest, ReportResponse, AnalyticsEventRequest,
    AnalyticsPeriod, ReportFormat, Granularity, MetricType
)
from app.core.exceptions import BusinessLogicError


class AnalyticsService:
    """Servicio para gestión de analytics y reportes"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # =================== HELPER METHODS ===================
    
    def _get_period_dates(self, period: str) -> Tuple[datetime, datetime]:
        """Obtener fechas de inicio y fin para un período"""
        end_date = datetime.utcnow()
        
        if period == AnalyticsPeriod.SEVEN_DAYS:
            start_date = end_date - timedelta(days=7)
        elif period == AnalyticsPeriod.THIRTY_DAYS:
            start_date = end_date - timedelta(days=30)
        elif period == AnalyticsPeriod.NINETY_DAYS:
            start_date = end_date - timedelta(days=90)
        elif period == AnalyticsPeriod.ONE_YEAR:
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=30)  # Default
        
        return start_date, end_date
    
    def _calculate_change_percentage(self, current: Union[int, float, Decimal], previous: Union[int, float, Decimal]) -> float:
        """Calcular cambio porcentual"""
        if not previous or previous == 0:
            return 0.0
        return float(((current - previous) / previous) * 100)
    
    def _generate_chart_data(self, data: List[Tuple], granularity: str = "daily") -> List[ChartDataPoint]:
        """Generar datos para gráficos"""
        chart_data = []
        for date_value, count in data:
            chart_data.append(ChartDataPoint(
                date=date_value,
                value=count
            ))
        return chart_data
    
    # =================== DASHBOARD ANALYTICS ===================
    
    def get_dashboard_analytics(self, user_id: str, period: str = "30d") -> DashboardResponse:
        """Obtener métricas del dashboard principal"""
        start_date, end_date = self._get_period_dates(period)
        prev_start = start_date - (end_date - start_date)
        
        # Métricas principales
        current_metrics = self._get_period_metrics(user_id, start_date, end_date)
        previous_metrics = self._get_period_metrics(user_id, prev_start, start_date)
        
        # Calcular cambios porcentuales
        metrics = DashboardMetrics(
            total_listings=current_metrics["total_listings"],
            active_listings=current_metrics["active_listings"],
            total_views=current_metrics["total_views"],
            total_leads=current_metrics["total_leads"],
            conversion_rate=current_metrics["conversion_rate"],
            revenue=current_metrics["revenue"],
            listings_change=self._calculate_change_percentage(
                current_metrics["total_listings"], previous_metrics["total_listings"]
            ),
            views_change=self._calculate_change_percentage(
                current_metrics["total_views"], previous_metrics["total_views"]
            ),
            leads_change=self._calculate_change_percentage(
                current_metrics["total_leads"], previous_metrics["total_leads"]
            ),
            revenue_change=self._calculate_change_percentage(
                current_metrics["revenue"], previous_metrics["revenue"]
            )
        )
        
        # Datos de gráficos
        views_chart = self._get_views_chart_data(user_id, start_date, end_date)
        leads_chart = self._get_leads_chart_data(user_id, start_date, end_date)
        revenue_chart = self._get_revenue_chart_data(user_id, start_date, end_date)
        
        # Top listings
        top_listings = self._get_top_listings(user_id, start_date, end_date)
        
        # Actividad reciente
        recent_activity = self._get_recent_activity(user_id, limit=10)
        
        return DashboardResponse(
            period=period,
            metrics=metrics,
            views_chart=views_chart,
            leads_chart=leads_chart,
            revenue_chart=revenue_chart,
            top_listings=top_listings,
            recent_activity=recent_activity
        )
    
    def _get_period_metrics(self, user_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Obtener métricas para un período específico"""
        # Total de listings del usuario
        total_listings = self.db.query(Listing).filter(
            and_(
                Listing.user_id == user_id,
                Listing.created_at >= start_date,
                Listing.created_at <= end_date
            )
        ).count()
        
        # Listings activos
        active_listings = self.db.query(Listing).filter(
            and_(
                Listing.user_id == user_id,
                Listing.status == "active",
                Listing.created_at <= end_date
            )
        ).count()
        
        # Total de vistas
        total_views = self.db.query(ListingView).join(Listing).filter(
            and_(
                Listing.user_id == user_id,
                ListingView.viewed_at >= start_date,
                ListingView.viewed_at <= end_date
            )
        ).count()
        
        # Total de leads (asumiendo que existe la tabla)
        total_leads = 0  # Placeholder - implementar cuando esté la tabla de leads
        
        # Tasa de conversión
        conversion_rate = (total_leads / total_views * 100) if total_views > 0 else 0
        
        # Revenue (placeholder)
        revenue = Decimal("0.00")
        
        return {
            "total_listings": total_listings,
            "active_listings": active_listings,
            "total_views": total_views,
            "total_leads": total_leads,
            "conversion_rate": conversion_rate,
            "revenue": revenue
        }
    
    # =================== LISTING ANALYTICS ===================
    
    def get_listing_analytics(self, user_id: str, listing_id: Optional[str] = None, period: str = "30d") -> ListingAnalyticsResponse:
        """Obtener analytics de listings"""
        start_date, end_date = self._get_period_dates(period)
        
        # Query base
        query = self.db.query(Listing).filter(Listing.user_id == user_id)
        if listing_id:
            query = query.filter(Listing.id == listing_id)
        
        listings = query.all()
        
        # Métricas por listing
        listing_metrics = []
        for listing in listings:
            metrics = self._get_listing_metrics(str(listing.id), start_date, end_date)
            listing_metrics.append(ListingMetrics(
                listing_id=listing.id,
                title=listing.title,
                **metrics
            ))
        
        # Resumen general
        summary = self._get_listings_summary(user_id, start_date, end_date)
        
        # Vistas por día
        views_by_day = self._get_listing_views_by_day(user_id, start_date, end_date, listing_id)
        
        # Fuentes de tráfico
        traffic_sources = self._get_traffic_sources(user_id, start_date, end_date, listing_id)
        
        return ListingAnalyticsResponse(
            period=period,
            listings=listing_metrics,
            summary=summary,
            views_by_day=views_by_day,
            traffic_sources=traffic_sources
        )
    
    def _get_listing_metrics(self, listing_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Obtener métricas de un listing específico"""
        # Total de vistas
        total_views = self.db.query(ListingView).filter(
            and_(
                ListingView.listing_id == listing_id,
                ListingView.viewed_at >= start_date,
                ListingView.viewed_at <= end_date
            )
        ).count()
        
        # Vistas únicas (por IP única)
        unique_views = self.db.query(ListingView.ip_address).filter(
            and_(
                ListingView.listing_id == listing_id,
                ListingView.viewed_at >= start_date,
                ListingView.viewed_at <= end_date
            )
        ).distinct().count()
        
        # Tiempo promedio en página
        avg_time = self.db.query(func.avg(ListingView.time_spent)).filter(
            and_(
                ListingView.listing_id == listing_id,
                ListingView.viewed_at >= start_date,
                ListingView.viewed_at <= end_date,
                ListingView.time_spent > 0
            )
        ).scalar() or 0
        
        # Días en el mercado
        listing = self.db.query(Listing).filter(Listing.id == listing_id).first()
        days_on_market = (datetime.utcnow() - listing.created_at).days if listing else 0
        
        return {
            "total_views": total_views,
            "unique_views": unique_views,
            "total_leads": 0,  # Placeholder
            "conversion_rate": 0.0,  # Placeholder
            "avg_time_on_page": float(avg_time),
            "days_on_market": days_on_market
        }
    
    # =================== USER ANALYTICS (ADMIN) ===================
    
    def get_user_analytics(self, period: str = "30d") -> UserAnalyticsResponse:
        """Obtener analytics de usuarios (solo admin)"""
        start_date, end_date = self._get_period_dates(period)
        
        # Métricas de usuarios
        metrics = self._get_user_metrics(start_date, end_date)
        
        # Registros por día
        registrations_by_day = self._get_registrations_by_day(start_date, end_date)
        
        # Tipos de usuario
        user_types = self._get_user_types_distribution()
        
        # Distribución geográfica
        geographic_distribution = self._get_geographic_distribution()
        
        return UserAnalyticsResponse(
            period=period,
            metrics=UserMetrics(**metrics),
            registrations_by_day=registrations_by_day,
            user_types=user_types,
            geographic_distribution=geographic_distribution
        )
    
    # =================== REVENUE ANALYTICS (ADMIN) ===================
    
    def get_revenue_analytics(self, period: str = "30d", granularity: str = "daily") -> RevenueAnalyticsResponse:
        """Obtener analytics de ingresos (solo admin)"""
        start_date, end_date = self._get_period_dates(period)
        
        # Métricas de ingresos
        metrics = self._get_revenue_metrics(start_date, end_date)
        
        # Ingresos por período
        revenue_by_period = self._get_revenue_by_period(start_date, end_date, granularity)
        
        # Ingresos por plan
        revenue_by_plan = self._get_revenue_by_plan(start_date, end_date)
        
        # Crecimiento de suscripciones
        subscription_growth = self._get_subscription_growth(start_date, end_date)
        
        return RevenueAnalyticsResponse(
            period=period,
            granularity=granularity,
            metrics=RevenueMetrics(**metrics),
            revenue_by_period=revenue_by_period,
            revenue_by_plan=revenue_by_plan,
            subscription_growth=subscription_growth
        )
    
    # =================== PERFORMANCE ANALYTICS ===================
    
    def get_performance_analytics(self, metric: Optional[str] = None, period: str = "30d") -> PerformanceAnalyticsResponse:
        """Obtener analytics de rendimiento"""
        start_date, end_date = self._get_period_dates(period)
        
        # Métricas de rendimiento
        metrics = self._get_performance_metrics(metric, start_date, end_date)
        
        # Datos de tendencia
        trend_data = self._get_trend_data(metric or "views", start_date, end_date)
        
        # Benchmarks
        benchmarks = self._get_industry_benchmarks()
        
        return PerformanceAnalyticsResponse(
            period=period,
            metrics=metrics,
            trend_data=trend_data,
            benchmarks=benchmarks
        )
    
    # =================== REPORTS ===================
    
    def generate_listings_report(self, user_id: str, format: str, from_date: Optional[date], to_date: Optional[date]) -> ReportResponse:
        """Generar reporte de listings"""
        report = ReportGeneration(
            user_id=user_id,
            report_type="listings",
            report_format=format,
            from_date=datetime.combine(from_date, datetime.min.time()) if from_date else None,
            to_date=datetime.combine(to_date, datetime.max.time()) if to_date else None,
            status="pending"
        )
        
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)
        
        # Aquí se implementaría la lógica para generar el reporte en background
        # Por ahora, marcamos como completado inmediatamente
        report.status = "completed"
        report.completed_at = datetime.utcnow()
        report.file_path = f"/reports/listings_{report.id}.{format}"
        self.db.commit()
        
        return ReportResponse(
            id=report.id,
            report_type=report.report_type,
            format=report.report_format,
            status=report.status,
            file_path=report.file_path,
            download_url=f"/api/v1/reports/{report.id}/download" if report.status == "completed" else None,
            requested_at=report.requested_at,
            completed_at=report.completed_at,
            expires_at=report.expires_at
        )
    
    def generate_revenue_report(self, user_id: str, format: str, from_date: Optional[date], to_date: Optional[date]) -> ReportResponse:
        """Generar reporte de ingresos (solo admin)"""
        report = ReportGeneration(
            user_id=user_id,
            report_type="revenue",
            report_format=format,
            from_date=datetime.combine(from_date, datetime.min.time()) if from_date else None,
            to_date=datetime.combine(to_date, datetime.max.time()) if to_date else None,
            status="pending"
        )
        
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)
        
        # Simulamos completar el reporte
        report.status = "completed"
        report.completed_at = datetime.utcnow()
        report.file_path = f"/reports/revenue_{report.id}.{format}"
        self.db.commit()
        
        return ReportResponse(
            id=report.id,
            report_type=report.report_type,
            format=report.report_format,
            status=report.status,
            file_path=report.file_path,
            download_url=f"/api/v1/reports/{report.id}/download" if report.status == "completed" else None,
            requested_at=report.requested_at,
            completed_at=report.completed_at,
            expires_at=report.expires_at
        )
    
    # =================== ANALYTICS EVENTS ===================
    
    def track_event(self, user_id: Optional[str], event_data: AnalyticsEventRequest, ip_address: str, user_agent: str) -> None:
        """Registrar evento de analytics"""
        event = AnalyticsEvent(
            event_type=event_data.event_type,
            event_category=event_data.event_category,
            event_action=event_data.event_action,
            event_label=event_data.event_label,
            user_id=user_id,
            listing_id=event_data.listing_id,
            session_id=event_data.session_id,
            ip_address=ip_address,
            user_agent=user_agent,
            page_url=event_data.page_url,
            referrer=event_data.referrer,
            duration=event_data.duration,
            value=event_data.value,
            properties=event_data.properties or {}
        )
        
        self.db.add(event)
        self.db.commit()
    
    def track_listing_view(self, listing_id: str, user_id: Optional[str], session_id: str, ip_address: str, user_agent: str, referrer: Optional[str] = None) -> None:
        """Registrar vista de listing"""
        view = ListingView(
            listing_id=listing_id,
            user_id=user_id,
            session_id=session_id,
            ip_address=ip_address,
            user_agent=user_agent,
            referrer=referrer
        )
        
        self.db.add(view)
        self.db.commit()
    
    # =================== HELPER METHODS FOR PLACEHOLDERS ===================
    
    def _get_views_chart_data(self, user_id: str, start_date: datetime, end_date: datetime) -> List[ChartDataPoint]:
        """Obtener datos del gráfico de vistas"""
        # Placeholder - implementar consulta real
        return []
    
    def _get_leads_chart_data(self, user_id: str, start_date: datetime, end_date: datetime) -> List[ChartDataPoint]:
        """Obtener datos del gráfico de leads"""
        # Placeholder - implementar consulta real
        return []
    
    def _get_revenue_chart_data(self, user_id: str, start_date: datetime, end_date: datetime) -> List[ChartDataPoint]:
        """Obtener datos del gráfico de ingresos"""
        # Placeholder - implementar consulta real
        return []
    
    def _get_top_listings(self, user_id: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Obtener top listings por vistas"""
        # Placeholder - implementar consulta real
        return []
    
    def _get_recent_activity(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Obtener actividad reciente"""
        # Placeholder - implementar consulta real
        return []
    
    def _get_listings_summary(self, user_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Obtener resumen de listings"""
        return {}
    
    def _get_listing_views_by_day(self, user_id: str, start_date: datetime, end_date: datetime, listing_id: Optional[str]) -> List[ChartDataPoint]:
        """Obtener vistas por día"""
        return []
    
    def _get_traffic_sources(self, user_id: str, start_date: datetime, end_date: datetime, listing_id: Optional[str]) -> List[Dict[str, Any]]:
        """Obtener fuentes de tráfico"""
        return []
    
    def _get_user_metrics(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Obtener métricas de usuarios"""
        return {
            "total_users": 0,
            "new_users": 0,
            "active_users": 0,
            "returning_users": 0,
            "avg_session_duration": 0.0
        }
    
    def _get_registrations_by_day(self, start_date: datetime, end_date: datetime) -> List[ChartDataPoint]:
        """Obtener registros por día"""
        return []
    
    def _get_user_types_distribution(self) -> List[Dict[str, Any]]:
        """Obtener distribución de tipos de usuario"""
        return []
    
    def _get_geographic_distribution(self) -> List[Dict[str, Any]]:
        """Obtener distribución geográfica"""
        return []
    
    def _get_revenue_metrics(self, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Obtener métricas de ingresos"""
        return {
            "total_revenue": Decimal("0.00"),
            "subscription_revenue": Decimal("0.00"),
            "avg_revenue_per_user": Decimal("0.00"),
            "monthly_recurring_revenue": Decimal("0.00")
        }
    
    def _get_revenue_by_period(self, start_date: datetime, end_date: datetime, granularity: str) -> List[ChartDataPoint]:
        """Obtener ingresos por período"""
        return []
    
    def _get_revenue_by_plan(self, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Obtener ingresos por plan"""
        return []
    
    def _get_subscription_growth(self, start_date: datetime, end_date: datetime) -> List[ChartDataPoint]:
        """Obtener crecimiento de suscripciones"""
        return []
    
    def _get_performance_metrics(self, metric: Optional[str], start_date: datetime, end_date: datetime) -> List[PerformanceMetrics]:
        """Obtener métricas de rendimiento"""
        return []
    
    def _get_trend_data(self, metric: str, start_date: datetime, end_date: datetime) -> List[ChartDataPoint]:
        """Obtener datos de tendencia"""
        return []
    
    def _get_industry_benchmarks(self) -> Dict[str, Any]:
        """Obtener benchmarks de la industria"""
        return {
            "avg_conversion_rate": 2.5,
            "avg_time_on_site": 180,
            "bounce_rate": 65.0
        }
