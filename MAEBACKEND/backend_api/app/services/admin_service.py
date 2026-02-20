from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, asc, text
from typing import List, Optional, Dict, Any, Tuple
from uuid import UUID
from datetime import datetime, timedelta
from fastapi import HTTPException, Request

from app.models.admin import (
    AuditLog, AdminAction, SystemMetric, SystemHealth, 
    UserSuspension, ListingFlag, ConfigurationSetting,
    AuditActionType, UserStatus, ListingFlagReason, SystemStatus
)
from app.models.auth import User
from app.models.listing import Listing
from app.schemas.admin import (
    AdminDashboardResponse, DashboardStats, SystemHealthSummary,
    UserSuspensionCreate, ListingFlagCreate, AuditLogCreate,
    UserFilters, ListingFilters, AuditLogFilters
)
from app.core.exceptions import NotFoundError, ValidationError


class AdminService:
    """Servicio para funciones administrativas"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Dashboard Methods
    def get_dashboard_data(self) -> AdminDashboardResponse:
        """Obtener datos completos del dashboard administrativo"""
        
        # Calcular estadísticas principales
        stats = self._calculate_dashboard_stats()
        
        # Obtener estado del sistema
        system_health = self._get_system_health_summary()
        
        # Actividades recientes
        recent_activities = self._get_recent_activities(limit=10)
        
        # Alertas del sistema
        alerts = self._get_system_alerts()
        
        return AdminDashboardResponse(
            stats=stats,
            system_health=system_health,
            recent_activities=recent_activities,
            alerts=alerts
        )
    
    def _calculate_dashboard_stats(self) -> DashboardStats:
        """Calcular estadísticas del dashboard"""
        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        month_start = today_start - timedelta(days=30)
        
        stats = DashboardStats()
        
        # Estadísticas de usuarios
        users_query = self.db.query(User)
        stats.total_users = users_query.count()
        stats.active_users = users_query.filter(User.is_active == True).count()
        stats.new_users_today = users_query.filter(User.created_at >= today_start).count()
        stats.new_users_week = users_query.filter(User.created_at >= week_start).count()
        
        # Usuarios suspendidos (esto requeriría una relación o campo en User)
        suspended_query = self.db.query(UserSuspension).filter(
            UserSuspension.is_active == True
        )
        stats.suspended_users = suspended_query.count()
        
        # Estadísticas de listings
        listings_query = self.db.query(Listing)
        stats.total_listings = listings_query.count()
        stats.active_listings = listings_query.filter(Listing.status == 'active').count()
        stats.pending_listings = listings_query.filter(Listing.status == 'pending').count()
        stats.new_listings_today = listings_query.filter(Listing.created_at >= today_start).count()
        stats.new_listings_week = listings_query.filter(Listing.created_at >= week_start).count()
        
        # Listings flagged
        stats.flagged_listings = self.db.query(ListingFlag).filter(
            ListingFlag.is_resolved == False
        ).count()
        
        # Estadísticas financieras (placeholder - necesitaría integración con sistema de pagos)
        stats.total_revenue = self._calculate_total_revenue()
        stats.revenue_today = self._calculate_revenue_for_period(today_start, now)
        stats.revenue_week = self._calculate_revenue_for_period(week_start, now)
        stats.revenue_month = self._calculate_revenue_for_period(month_start, now)
        
        # Suscripciones (placeholder - necesitaría modelo de subscripciones)
        stats.active_subscriptions = 0
        stats.expired_subscriptions = 0
        
        # Verificaciones pendientes (de nuestro sistema de verificaciones)
        try:
            from app.models.verification import Verification, VerificationStatus
            stats.pending_verifications = self.db.query(Verification).filter(
                Verification.status == VerificationStatus.PENDING
            ).count()
        except ImportError:
            stats.pending_verifications = 0
        
        stats.unresolved_flags = stats.flagged_listings
        
        return stats
    
    def _get_system_health_summary(self) -> SystemHealthSummary:
        """Obtener resumen del estado del sistema"""
        components = self.db.query(SystemHealth).filter(
            SystemHealth.enabled == True
        ).all()
        
        if not components:
            return SystemHealthSummary(
                overall_status=SystemStatus.HEALTHY,
                components=[],
                uptime_percentage=100.0
            )
        
        # Determinar estado general
        statuses = [comp.status for comp in components]
        if SystemStatus.CRITICAL in statuses:
            overall_status = SystemStatus.CRITICAL
        elif SystemStatus.WARNING in statuses:
            overall_status = SystemStatus.WARNING
        elif SystemStatus.MAINTENANCE in statuses:
            overall_status = SystemStatus.MAINTENANCE
        else:
            overall_status = SystemStatus.HEALTHY
        
        # Calcular uptime promedio
        uptimes = [comp.uptime_percentage or 0 for comp in components]
        avg_uptime = sum(uptimes) / len(uptimes) if uptimes else 100.0
        
        # Convertir componentes a dict
        components_data = [
            {
                "name": comp.component_name,
                "type": comp.component_type,
                "status": comp.status.value,
                "uptime": comp.uptime_percentage,
                "last_check": comp.last_check_at
            }
            for comp in components
        ]
        
        return SystemHealthSummary(
            overall_status=overall_status,
            components=components_data,
            uptime_percentage=avg_uptime
        )
    
    def _get_recent_activities(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Obtener actividades recientes"""
        recent_logs = self.db.query(AuditLog).order_by(
            desc(AuditLog.created_at)
        ).limit(limit).all()
        
        activities = []
        for log in recent_logs:
            activities.append({
                "id": str(log.id),
                "action": log.action_type.value if log.action_type else "unknown",
                "description": log.action_description,
                "user_email": log.user_email,
                "timestamp": log.created_at,
                "severity": log.severity,
                "category": log.category
            })
        
        return activities
    
    def _get_system_alerts(self) -> List[Dict[str, Any]]:
        """Obtener alertas del sistema"""
        alerts = []
        
        # Alertas de componentes críticos
        critical_components = self.db.query(SystemHealth).filter(
            SystemHealth.status == SystemStatus.CRITICAL
        ).all()
        
        for comp in critical_components:
            alerts.append({
                "type": "critical",
                "title": f"Componente crítico: {comp.component_name}",
                "message": comp.status_message or "Estado crítico detectado",
                "timestamp": comp.last_check_at,
                "component": comp.component_name
            })
        
        # Alertas de usuarios suspendidos recientes
        recent_suspensions = self.db.query(UserSuspension).filter(
            and_(
                UserSuspension.is_active == True,
                UserSuspension.suspended_at >= datetime.utcnow() - timedelta(hours=24)
            )
        ).count()
        
        if recent_suspensions > 0:
            alerts.append({
                "type": "warning",
                "title": "Nuevas suspensiones",
                "message": f"{recent_suspensions} usuarios suspendidos en las últimas 24h",
                "timestamp": datetime.utcnow(),
                "component": "user_management"
            })
        
        return alerts
    
    def _calculate_total_revenue(self) -> float:
        """Calcular revenue total (placeholder)"""
        # TODO: Implementar cálculo real basado en modelo de pagos
        return 0.0
    
    def _calculate_revenue_for_period(self, start: datetime, end: datetime) -> float:
        """Calcular revenue para período específico (placeholder)"""
        # TODO: Implementar cálculo real basado en modelo de pagos
        return 0.0
    
    # User Management Methods
    def get_users_for_admin(
        self,
        filters: Optional[UserFilters] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[User], int]:
        """Obtener usuarios para administración"""
        query = self.db.query(User)
        
        # Aplicar filtros
        if filters:
            if filters.role:
                query = query.filter(User.role.in_(filters.role))
            
            if filters.status:
                # Esto requeriría un campo status en User o lógica adicional
                pass
            
            if filters.search:
                search_term = f"%{filters.search}%"
                query = query.filter(
                    or_(
                        User.full_name.ilike(search_term),
                        User.email.ilike(search_term),
                        User.phone_number.ilike(search_term)
                    )
                )
            
            if filters.created_from:
                query = query.filter(User.created_at >= filters.created_from)
            
            if filters.created_to:
                query = query.filter(User.created_at <= filters.created_to)
        
        # Contar total
        total = query.count()
        
        # Obtener usuarios paginados
        users = query.order_by(desc(User.created_at)).offset(skip).limit(limit).all()
        
        return users, total
    
    def suspend_user(
        self,
        user_id: UUID,
        suspension_data: UserSuspensionCreate,
        admin_id: UUID
    ) -> UserSuspension:
        """Suspender usuario"""
        
        # Verificar que el usuario existe
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise NotFoundError("Usuario no encontrado")
        
        # Verificar que no está ya suspendido
        existing_suspension = self.db.query(UserSuspension).filter(
            and_(
                UserSuspension.user_id == user_id,
                UserSuspension.is_active == True
            )
        ).first()
        
        if existing_suspension:
            raise ValidationError("El usuario ya está suspendido")
        
        # Calcular fecha de expiración
        expires_at = None
        if suspension_data.duration:
            expires_at = datetime.utcnow() + timedelta(days=suspension_data.duration)
        
        # Crear suspensión
        suspension = UserSuspension(
            user_id=user_id,
            suspended_by=admin_id,
            reason=suspension_data.reason,
            duration_days=suspension_data.duration,
            notes=suspension_data.notes,
            expires_at=expires_at
        )
        
        self.db.add(suspension)
        
        # Log de auditoría
        self.log_audit_action(
            admin_id,
            AuditActionType.USER_SUSPEND,
            f"Usuario suspendido: {user.email}",
            target_type="user",
            target_id=user_id,
            extra_data={
                "reason": suspension_data.reason,
                "duration_days": suspension_data.duration
            }
        )
        
        self.db.commit()
        return suspension
    
    def unsuspend_user(self, user_id: UUID, admin_id: UUID) -> bool:
        """Quitar suspensión de usuario"""
        
        # Buscar suspensión activa
        suspension = self.db.query(UserSuspension).filter(
            and_(
                UserSuspension.user_id == user_id,
                UserSuspension.is_active == True
            )
        ).first()
        
        if not suspension:
            raise NotFoundError("No se encontró suspensión activa para este usuario")
        
        # Desactivar suspensión
        suspension.is_active = False
        suspension.lifted_at = datetime.utcnow()
        suspension.lifted_by = admin_id
        
        # Obtener usuario para log
        user = self.db.query(User).filter(User.id == user_id).first()
        
        # Log de auditoría
        self.log_audit_action(
            admin_id,
            AuditActionType.USER_UNSUSPEND,
            f"Suspensión removida: {user.email if user else user_id}",
            target_type="user",
            target_id=user_id
        )
        
        self.db.commit()
        return True
    
    # Listing Management Methods
    def get_listings_for_admin(
        self,
        filters: Optional[ListingFilters] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[Listing], int]:
        """Obtener listings para administración"""
        query = self.db.query(Listing)
        
        # Aplicar filtros
        if filters:
            if filters.status:
                query = query.filter(Listing.status.in_(filters.status))
            
            if filters.property_type:
                query = query.filter(Listing.property_type.in_(filters.property_type))
            
            if filters.listing_type:
                query = query.filter(Listing.listing_type.in_(filters.listing_type))
            
            if filters.owner_id:
                query = query.filter(Listing.owner_id == filters.owner_id)
            
            if filters.search:
                search_term = f"%{filters.search}%"
                query = query.filter(
                    or_(
                        Listing.title.ilike(search_term),
                        Listing.description.ilike(search_term),
                        Listing.location.ilike(search_term)
                    )
                )
            
            if filters.created_from:
                query = query.filter(Listing.created_at >= filters.created_from)
            
            if filters.created_to:
                query = query.filter(Listing.created_at <= filters.created_to)
            
            if filters.flagged is not None:
                if filters.flagged:
                    # Solo listings con flags activos
                    query = query.join(ListingFlag).filter(
                        ListingFlag.is_resolved == False
                    )
                else:
                    # Solo listings sin flags o con flags resueltos
                    query = query.outerjoin(ListingFlag).filter(
                        or_(
                            ListingFlag.id.is_(None),
                            ListingFlag.is_resolved == True
                        )
                    )
        
        # Contar total
        total = query.count()
        
        # Obtener listings paginados
        listings = query.order_by(desc(Listing.created_at)).offset(skip).limit(limit).all()
        
        return listings, total
    
    def flag_listing(
        self,
        listing_id: UUID,
        flag_data: ListingFlagCreate,
        admin_id: UUID
    ) -> ListingFlag:
        """Marcar listing como problemático"""
        
        # Verificar que el listing existe
        listing = self.db.query(Listing).filter(Listing.id == listing_id).first()
        if not listing:
            raise NotFoundError("Listing no encontrado")
        
        # Crear flag
        flag = ListingFlag(
            listing_id=listing_id,
            admin_id=admin_id,
            reason=flag_data.reason,
            description=flag_data.notes,
            status="pending"
        )
        
        self.db.add(flag)
        
        # Log de auditoría
        self.log_audit_action(
            admin_id,
            AuditActionType.LISTING_FLAG,
            f"Listing marcado: {listing.title}",
            target_type="listing",
            target_id=listing_id,
            extra_data={
                "reason": flag_data.reason.value,
                "notes": flag_data.notes
            }
        )
        
        self.db.commit()
        return flag
    
    # System Health Methods
    def get_system_health(self) -> List[SystemHealth]:
        """Obtener estado de salud de todos los componentes"""
        return self.db.query(SystemHealth).order_by(SystemHealth.component_name).all()
    
    def update_component_health(
        self,
        component_name: str,
        status: SystemStatus,
        status_message: Optional[str] = None,
        response_time_ms: Optional[float] = None,
        error_count: int = 0
    ):
        """Actualizar estado de salud de un componente"""
        component = self.db.query(SystemHealth).filter(
            SystemHealth.component_name == component_name
        ).first()
        
        if component:
            component.status = status
            component.status_message = status_message
            component.response_time_ms = response_time_ms
            component.error_count = error_count
            component.last_check_at = datetime.utcnow()
            
            if status == SystemStatus.HEALTHY:
                component.last_healthy_at = datetime.utcnow()
        else:
            # Crear nuevo componente
            component = SystemHealth(
                component_name=component_name,
                component_type="unknown",
                status=status,
                status_message=status_message,
                response_time_ms=response_time_ms,
                error_count=error_count
            )
            self.db.add(component)
        
        self.db.commit()
    
    def get_system_metrics(
        self,
        metric_name: Optional[str] = None,
        service: Optional[str] = None,
        hours: int = 24
    ) -> List[SystemMetric]:
        """Obtener métricas del sistema"""
        query = self.db.query(SystemMetric)
        
        if metric_name:
            query = query.filter(SystemMetric.metric_name == metric_name)
        
        if service:
            query = query.filter(SystemMetric.service == service)
        
        # Filtrar por tiempo
        since = datetime.utcnow() - timedelta(hours=hours)
        query = query.filter(SystemMetric.timestamp >= since)
        
        return query.order_by(desc(SystemMetric.timestamp)).all()
    
    # Audit Log Methods
    def log_audit_action(
        self,
        user_id: Optional[UUID],
        action_type: AuditActionType,
        description: str,
        request: Optional[Request] = None,
        target_type: Optional[str] = None,
        target_id: Optional[UUID] = None,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        extra_data: Optional[Dict[str, Any]] = None,
        severity: str = "info"
    ) -> AuditLog:
        """Registrar acción en el log de auditoría"""
        
        # Obtener información del usuario si es posible
        user_email = None
        user_role = None
        if user_id:
            user = self.db.query(User).filter(User.id == user_id).first()
            if user:
                user_email = user.email
                user_role = getattr(user, 'role', None)
        
        # Obtener información de la request si está disponible
        ip_address = None
        user_agent = None
        request_method = None
        request_path = None
        
        if request:
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")
            request_method = request.method
            request_path = str(request.url.path)
        
        # Crear entrada de auditoría
        audit_log = AuditLog(
            action_type=action_type,
            action_description=description,
            user_id=user_id,
            user_email=user_email,
            user_role=user_role,
            target_type=target_type,
            target_id=target_id,
            ip_address=ip_address,
            user_agent=user_agent,
            request_method=request_method,
            request_path=request_path,
            old_values=old_values or {},
            new_values=new_values or {},
            extra_data=extra_data or {},
            severity=severity
        )
        
        self.db.add(audit_log)
        self.db.commit()
        return audit_log
    
    def get_audit_logs(
        self,
        filters: Optional[AuditLogFilters] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[AuditLog], int]:
        """Obtener logs de auditoría"""
        query = self.db.query(AuditLog)
        
        # Aplicar filtros
        if filters:
            if filters.action:
                query = query.filter(AuditLog.action_type.in_(filters.action))
            
            if filters.user_id:
                query = query.filter(AuditLog.user_id == filters.user_id)
            
            if filters.target_type:
                query = query.filter(AuditLog.target_type == filters.target_type)
            
            if filters.target_id:
                query = query.filter(AuditLog.target_id == filters.target_id)
            
            if filters.severity:
                query = query.filter(AuditLog.severity.in_(filters.severity))
            
            if filters.category:
                query = query.filter(AuditLog.category.in_(filters.category))
            
            if filters.from_date:
                query = query.filter(AuditLog.created_at >= filters.from_date)
            
            if filters.to_date:
                query = query.filter(AuditLog.created_at <= filters.to_date)
            
            if filters.search:
                search_term = f"%{filters.search}%"
                query = query.filter(
                    or_(
                        AuditLog.action_description.ilike(search_term),
                        AuditLog.user_email.ilike(search_term)
                    )
                )
        
        # Contar total
        total = query.count()
        
        # Obtener logs paginados
        logs = query.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()
        
        return logs, total
