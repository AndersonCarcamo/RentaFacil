from sqlalchemy import Column, String, Integer, DateTime, Numeric, Text, ForeignKey, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.core.database import Base


class AnalyticsEvent(Base):
    """Modelo para eventos de analytics"""
    __tablename__ = "analytics_events"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Información del evento
    event_type = Column(String(100), nullable=False, index=True)  # view, click, lead, etc.
    event_category = Column(String(50), nullable=False, index=True)  # listing, user, system
    event_action = Column(String(100), nullable=False)  # view_listing, create_lead, etc.
    event_label = Column(String(255))  # Etiqueta descriptiva opcional
    
    # Entidades relacionadas
    user_id = Column(UUID(as_uuid=True), ForeignKey("core.users.id"), index=True)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("core.listings.id"), index=True)
    session_id = Column(String(255), index=True)  # ID de sesión del usuario
    
    # Información técnica
    ip_address = Column(String(45))  # IPv4 o IPv6
    user_agent = Column(Text)
    referrer = Column(String(500))
    page_url = Column(String(500))
    
    # Información geográfica
    country = Column(String(2))  # Código de país ISO
    region = Column(String(100))
    city = Column(String(100))
    
    # Métricas del evento
    duration = Column(Integer)  # Duración en segundos (para eventos de tiempo)
    value = Column(Numeric(10, 2))  # Valor monetario asociado
    
    # Datos adicionales
    properties = Column(JSON, default=dict)  # Propiedades adicionales del evento
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class ListingView(Base):
    """Modelo para vistas de listings"""
    __tablename__ = "listing_views"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("core.listings.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("core.users.id"), index=True)
    
    # Información de la vista
    session_id = Column(String(255), index=True)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    referrer = Column(String(500))
    
    # Métricas de engagement
    time_spent = Column(Integer, default=0)  # Tiempo en segundos
    scroll_depth = Column(Integer, default=0)  # Porcentaje de scroll
    images_viewed = Column(Integer, default=0)  # Número de imágenes vistas
    contact_clicked = Column(Boolean, default=False)  # Si hizo clic en contactar
    
    # Información geográfica
    country = Column(String(2))
    region = Column(String(100))
    city = Column(String(100))
    
    # Timestamps
    viewed_at = Column(DateTime, default=datetime.utcnow, index=True)


class SearchQuery(Base):
    """Modelo para consultas de búsqueda"""
    __tablename__ = "search_queries"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("core.users.id"), index=True)
    session_id = Column(String(255), index=True)
    
    # Parámetros de búsqueda
    query_text = Column(String(500))  # Texto de búsqueda
    filters = Column(JSON, default=dict)  # Filtros aplicados
    sort_by = Column(String(50))
    location = Column(String(255))
    
    # Resultados
    results_count = Column(Integer, default=0)
    results_clicked = Column(Integer, default=0)
    
    # Información técnica
    ip_address = Column(String(45))
    user_agent = Column(Text)
    
    # Timestamps
    searched_at = Column(DateTime, default=datetime.utcnow, index=True)


class PerformanceMetric(Base):
    """Modelo para métricas de rendimiento agregadas"""
    __tablename__ = "performance_metrics"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Identificadores
    metric_type = Column(String(100), nullable=False, index=True)  # views, leads, revenue
    entity_type = Column(String(50), nullable=False, index=True)  # listing, user, agency, system
    entity_id = Column(UUID(as_uuid=True), index=True)  # ID de la entidad (opcional)
    
    # Período temporal
    period_type = Column(String(20), nullable=False, index=True)  # daily, weekly, monthly
    period_start = Column(DateTime, nullable=False, index=True)
    period_end = Column(DateTime, nullable=False)
    
    # Métricas
    total_count = Column(Integer, default=0)
    unique_count = Column(Integer, default=0)
    total_value = Column(Numeric(15, 2), default=0)
    average_value = Column(Numeric(10, 2), default=0)
    
    # Datos adicionales
    additional_data = Column(JSON, default=dict)
    
    # Timestamps
    calculated_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


class ReportGeneration(Base):
    """Modelo para generar y almacenar reportes"""
    __tablename__ = "report_generations"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("core.users.id"), nullable=False, index=True)
    
    # Información del reporte
    report_type = Column(String(100), nullable=False)  # listings, revenue, users
    report_format = Column(String(20), nullable=False)  # json, csv, pdf
    
    # Parámetros del reporte
    from_date = Column(DateTime)
    to_date = Column(DateTime)
    filters = Column(JSON, default=dict)
    
    # Estado del reporte
    status = Column(String(50), default="pending")  # pending, processing, completed, failed
    file_path = Column(String(500))  # Ruta del archivo generado
    file_size = Column(Integer)  # Tamaño del archivo en bytes
    download_count = Column(Integer, default=0)
    
    # Información adicional
    error_message = Column(Text)
    processing_time = Column(Integer)  # Tiempo de procesamiento en segundos
    
    # Timestamps
    requested_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    expires_at = Column(DateTime)  # Fecha de expiración del reporte
    
    # Relaciones
    # user = relationship("User", back_populates="reports")


class UserActivity(Base):
    """Modelo para actividad de usuarios"""
    __tablename__ = "user_activity"
    __table_args__ = {"schema": "core"}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("core.users.id"), nullable=False, index=True)
    
    # Información de la actividad
    activity_type = Column(String(100), nullable=False, index=True)  # login, logout, view, create
    activity_description = Column(String(500))
    entity_type = Column(String(50))  # listing, user, agency
    entity_id = Column(UUID(as_uuid=True))
    
    # Información técnica
    ip_address = Column(String(45))
    user_agent = Column(Text)
    session_id = Column(String(255))
    
    # Timestamps
    occurred_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relaciones
    # user = relationship("User", back_populates="activities")
