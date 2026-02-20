from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, date
from decimal import Decimal
import uuid
from enum import Enum


# Enums
class AnalyticsPeriod(str, Enum):
    """Períodos de tiempo para analytics"""
    SEVEN_DAYS = "7d"
    THIRTY_DAYS = "30d"
    NINETY_DAYS = "90d"
    ONE_YEAR = "1y"


class ReportFormat(str, Enum):
    """Formatos de reporte"""
    JSON = "json"
    CSV = "csv"
    PDF = "pdf"


class Granularity(str, Enum):
    """Granularidad temporal"""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class MetricType(str, Enum):
    """Tipos de métricas"""
    VIEWS = "views"
    LEADS = "leads"
    CONVERSION_RATE = "conversion_rate"
    AVG_DAYS_ON_MARKET = "avg_days_on_market"


class ReportStatus(str, Enum):
    """Estados de reportes"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


# =================== DASHBOARD SCHEMAS ===================

class DashboardMetrics(BaseModel):
    """Métricas principales del dashboard"""
    total_listings: int = Field(..., description="Total de listings")
    active_listings: int = Field(..., description="Listings activos")
    total_views: int = Field(..., description="Total de vistas")
    total_leads: int = Field(..., description="Total de leads")
    conversion_rate: float = Field(..., description="Tasa de conversión")
    revenue: Decimal = Field(..., description="Ingresos del período")
    
    # Comparación con período anterior
    listings_change: float = Field(0, description="Cambio porcentual en listings")
    views_change: float = Field(0, description="Cambio porcentual en vistas")
    leads_change: float = Field(0, description="Cambio porcentual en leads")
    revenue_change: float = Field(0, description="Cambio porcentual en ingresos")


class ChartDataPoint(BaseModel):
    """Punto de datos para gráficos"""
    date: datetime = Field(..., description="Fecha del punto")
    value: Union[int, float, Decimal] = Field(..., description="Valor")
    label: Optional[str] = Field(None, description="Etiqueta opcional")


class DashboardResponse(BaseModel):
    """Respuesta completa del dashboard"""
    period: str = Field(..., description="Período analizado")
    metrics: DashboardMetrics = Field(..., description="Métricas principales")
    views_chart: List[ChartDataPoint] = Field(..., description="Datos del gráfico de vistas")
    leads_chart: List[ChartDataPoint] = Field(..., description="Datos del gráfico de leads")
    revenue_chart: List[ChartDataPoint] = Field(..., description="Datos del gráfico de ingresos")
    top_listings: List[Dict[str, Any]] = Field(..., description="Top listings por vistas")
    recent_activity: List[Dict[str, Any]] = Field(..., description="Actividad reciente")


# =================== LISTING ANALYTICS SCHEMAS ===================

class ListingMetrics(BaseModel):
    """Métricas de un listing específico"""
    listing_id: uuid.UUID = Field(..., description="ID del listing")
    title: str = Field(..., description="Título del listing")
    total_views: int = Field(..., description="Total de vistas")
    unique_views: int = Field(..., description="Vistas únicas")
    total_leads: int = Field(..., description="Total de leads")
    conversion_rate: float = Field(..., description="Tasa de conversión")
    avg_time_on_page: float = Field(..., description="Tiempo promedio en página (segundos)")
    days_on_market: int = Field(..., description="Días en el mercado")


class ListingAnalyticsResponse(BaseModel):
    """Respuesta de analytics de listings"""
    period: str = Field(..., description="Período analizado")
    listings: List[ListingMetrics] = Field(..., description="Métricas por listing")
    summary: Dict[str, Any] = Field(..., description="Resumen general")
    views_by_day: List[ChartDataPoint] = Field(..., description="Vistas por día")
    traffic_sources: List[Dict[str, Any]] = Field(..., description="Fuentes de tráfico")


# =================== USER ANALYTICS SCHEMAS ===================

class UserMetrics(BaseModel):
    """Métricas de usuarios"""
    total_users: int = Field(..., description="Total de usuarios")
    new_users: int = Field(..., description="Usuarios nuevos")
    active_users: int = Field(..., description="Usuarios activos")
    returning_users: int = Field(..., description="Usuarios recurrentes")
    avg_session_duration: float = Field(..., description="Duración promedio de sesión")


class UserAnalyticsResponse(BaseModel):
    """Respuesta de analytics de usuarios"""
    period: str = Field(..., description="Período analizado")
    metrics: UserMetrics = Field(..., description="Métricas de usuarios")
    registrations_by_day: List[ChartDataPoint] = Field(..., description="Registros por día")
    user_types: List[Dict[str, Any]] = Field(..., description="Distribución de tipos de usuario")
    geographic_distribution: List[Dict[str, Any]] = Field(..., description="Distribución geográfica")


# =================== REVENUE ANALYTICS SCHEMAS ===================

class RevenueMetrics(BaseModel):
    """Métricas de ingresos"""
    total_revenue: Decimal = Field(..., description="Ingresos totales")
    subscription_revenue: Decimal = Field(..., description="Ingresos por suscripciones")
    avg_revenue_per_user: Decimal = Field(..., description="Ingreso promedio por usuario")
    monthly_recurring_revenue: Decimal = Field(..., description="Ingresos mensuales recurrentes")


class RevenueAnalyticsResponse(BaseModel):
    """Respuesta de analytics de ingresos"""
    period: str = Field(..., description="Período analizado")
    granularity: str = Field(..., description="Granularidad temporal")
    metrics: RevenueMetrics = Field(..., description="Métricas de ingresos")
    revenue_by_period: List[ChartDataPoint] = Field(..., description="Ingresos por período")
    revenue_by_plan: List[Dict[str, Any]] = Field(..., description="Ingresos por plan")
    subscription_growth: List[ChartDataPoint] = Field(..., description="Crecimiento de suscripciones")


# =================== PERFORMANCE ANALYTICS SCHEMAS ===================

class PerformanceMetrics(BaseModel):
    """Métricas de rendimiento"""
    metric_type: str = Field(..., description="Tipo de métrica")
    total_value: Union[int, float] = Field(..., description="Valor total")
    average_value: Union[int, float] = Field(..., description="Valor promedio")
    change_percentage: float = Field(..., description="Cambio porcentual")
    trend: str = Field(..., description="Tendencia (up, down, stable)")


class PerformanceAnalyticsResponse(BaseModel):
    """Respuesta de analytics de rendimiento"""
    period: str = Field(..., description="Período analizado")
    metrics: List[PerformanceMetrics] = Field(..., description="Métricas de rendimiento")
    trend_data: List[ChartDataPoint] = Field(..., description="Datos de tendencia")
    benchmarks: Dict[str, Any] = Field(..., description="Benchmarks de la industria")


# =================== REPORT SCHEMAS ===================

class ReportRequest(BaseModel):
    """Solicitud de reporte"""
    report_type: str = Field(..., description="Tipo de reporte")
    format: ReportFormat = Field(ReportFormat.JSON, description="Formato del reporte")
    from_date: Optional[date] = Field(None, description="Fecha de inicio")
    to_date: Optional[date] = Field(None, description="Fecha de fin")
    filters: Optional[Dict[str, Any]] = Field(None, description="Filtros adicionales")


class ReportResponse(BaseModel):
    """Respuesta de reporte"""
    id: uuid.UUID = Field(..., description="ID del reporte")
    report_type: str = Field(..., description="Tipo de reporte")
    format: str = Field(..., description="Formato del reporte")
    status: ReportStatus = Field(..., description="Estado del reporte")
    file_path: Optional[str] = Field(None, description="Ruta del archivo")
    file_size: Optional[int] = Field(None, description="Tamaño del archivo")
    download_url: Optional[str] = Field(None, description="URL de descarga")
    requested_at: datetime = Field(..., description="Fecha de solicitud")
    completed_at: Optional[datetime] = Field(None, description="Fecha de completado")
    expires_at: Optional[datetime] = Field(None, description="Fecha de expiración")
    
    model_config = {"from_attributes": True}


class ListingsReportData(BaseModel):
    """Datos del reporte de listings"""
    listings: List[Dict[str, Any]] = Field(..., description="Datos de listings")
    summary: Dict[str, Any] = Field(..., description="Resumen del reporte")
    generated_at: datetime = Field(..., description="Fecha de generación")


class RevenueReportData(BaseModel):
    """Datos del reporte de ingresos"""
    revenue_data: List[Dict[str, Any]] = Field(..., description="Datos de ingresos")
    totals: Dict[str, Decimal] = Field(..., description="Totales")
    period_comparison: Dict[str, Any] = Field(..., description="Comparación de períodos")
    generated_at: datetime = Field(..., description="Fecha de generación")


# =================== ANALYTICS EVENT SCHEMAS ===================

class AnalyticsEventRequest(BaseModel):
    """Solicitud para crear evento de analytics"""
    event_type: str = Field(..., description="Tipo de evento")
    event_category: str = Field(..., description="Categoría del evento")
    event_action: str = Field(..., description="Acción del evento")
    event_label: Optional[str] = Field(None, description="Etiqueta del evento")
    listing_id: Optional[uuid.UUID] = Field(None, description="ID del listing")
    session_id: Optional[str] = Field(None, description="ID de sesión")
    page_url: Optional[str] = Field(None, description="URL de la página")
    referrer: Optional[str] = Field(None, description="Referrer")
    duration: Optional[int] = Field(None, description="Duración en segundos")
    value: Optional[Decimal] = Field(None, description="Valor monetario")
    properties: Optional[Dict[str, Any]] = Field(None, description="Propiedades adicionales")


class AnalyticsEventResponse(BaseModel):
    """Respuesta de evento de analytics"""
    id: uuid.UUID = Field(..., description="ID del evento")
    event_type: str = Field(..., description="Tipo de evento")
    event_category: str = Field(..., description="Categoría del evento")
    event_action: str = Field(..., description="Acción del evento")
    created_at: datetime = Field(..., description="Fecha de creación")
    
    model_config = {"from_attributes": True}


# =================== SEARCH ANALYTICS SCHEMAS ===================

class SearchQueryResponse(BaseModel):
    """Respuesta de consulta de búsqueda"""
    id: uuid.UUID = Field(..., description="ID de la consulta")
    query_text: Optional[str] = Field(None, description="Texto de búsqueda")
    filters: Dict[str, Any] = Field(..., description="Filtros aplicados")
    results_count: int = Field(..., description="Cantidad de resultados")
    results_clicked: int = Field(..., description="Resultados clickeados")
    searched_at: datetime = Field(..., description="Fecha de búsqueda")
    
    model_config = {"from_attributes": True}


class SearchAnalyticsResponse(BaseModel):
    """Respuesta de analytics de búsquedas"""
    period: str = Field(..., description="Período analizado")
    total_searches: int = Field(..., description="Total de búsquedas")
    popular_queries: List[Dict[str, Any]] = Field(..., description="Consultas populares")
    popular_filters: List[Dict[str, Any]] = Field(..., description="Filtros populares")
    search_trends: List[ChartDataPoint] = Field(..., description="Tendencias de búsqueda")
    zero_result_queries: List[Dict[str, Any]] = Field(..., description="Consultas sin resultados")
