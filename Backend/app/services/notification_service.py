from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, asc
from typing import List, Optional, Dict, Any, Tuple
from uuid import UUID
from datetime import datetime, timedelta
from fastapi import HTTPException

from app.models.notification import (
    Notification, NotificationSettings, NotificationTemplate,
    NotificationDelivery, NotificationQueue,
    NotificationType, NotificationPriority, DeliveryMethod, NotificationStatus
)
from app.schemas.notifications import (
    NotificationCreate, NotificationUpdate, NotificationFilters,
    NotificationSettingsCreate, NotificationSettingsUpdate,
    NotificationStats, BulkNotificationCreate,
    NotificationMarkRead
)
from app.core.exceptions import NotFoundError, ValidationError


class NotificationService:
    """Servicio para gestión de notificaciones"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Métodos de notificaciones
    def create_notification(
        self, 
        notification_data: NotificationCreate, 
        sender_id: Optional[UUID] = None
    ) -> Notification:
        """Crear nueva notificación"""
        import logging
        logger = logging.getLogger(__name__)
        
        # Si no se especifica user_id, usar sender_id
        user_id = notification_data.user_id or sender_id
        if not user_id:
            raise ValidationError("Se requiere especificar el usuario destinatario")
        
        logger.info(f"🔔 Creando notificación para user_id: {user_id}")
        logger.info(f"   Tipo: {notification_data.notification_type}, Categoría: {notification_data.category}")
        logger.info(f"   Título: {notification_data.title}")
        
        # Verificar configuración del usuario
        user_settings = self.get_notification_settings(user_id)
        if not user_settings:
            logger.warning(f"⚠️ Usuario {user_id} no tiene configuraciones de notificación, usando configuración por defecto")
            # Crear configuración por defecto si no existe
            try:
                user_settings = self._create_default_settings(user_id)
                logger.info(f"✅ Configuraciones por defecto creadas para usuario {user_id}")
            except Exception as e:
                logger.error(f"❌ Error creando configuraciones por defecto: {e}")
                # Continuar sin configuraciones
                user_settings = None
        
        if user_settings and not user_settings.enabled:
            # Usuario tiene notificaciones deshabilitadas
            logger.warning(f"⚠️ Usuario {user_id} tiene notificaciones deshabilitadas")
            raise ValidationError("El usuario tiene las notificaciones deshabilitadas")
        
        # Crear notificación
        notification = Notification(
            user_id=user_id,
            notification_type=notification_data.notification_type,
            category=notification_data.category,
            title=notification_data.title,
            message=notification_data.message,
            summary=notification_data.summary,
            priority=notification_data.priority,
            related_entity_type=notification_data.related_entity_type,
            related_entity_id=notification_data.related_entity_id,
            action_url=notification_data.action_url,
            action_data=notification_data.action_data or {},
            extra_data=notification_data.extra_data or {},
            delivery_methods=notification_data.delivery_methods or [DeliveryMethod.IN_APP],
            expires_at=notification_data.expires_at
        )
        
        logger.info(f"💾 Agregando notificación a la base de datos...")
        self.db.add(notification)
        self.db.flush()
        logger.info(f"✅ Notificación guardada con ID: {notification.id}")
        
        # Agregar a la cola de envío
        logger.info(f"📤 Agregando a cola de envío...")
        self._add_to_notification_queue(notification)
        
        logger.info(f"💾 Haciendo commit...")
        self.db.commit()
        logger.info(f"✅✅✅ Notificación creada exitosamente - ID: {notification.id}, User: {user_id}")
        return notification
    
    def get_notification(self, notification_id: UUID, user_id: UUID) -> Optional[Notification]:
        """Obtener notificación por ID (solo del usuario)"""
        return self.db.query(Notification).filter(
            and_(
                Notification.id == notification_id,
                Notification.user_id == user_id
            )
        ).first()
    
    def get_user_notifications(
        self,
        user_id: UUID,
        filters: Optional[NotificationFilters] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[Notification], int]:
        """Obtener notificaciones del usuario"""
        query = self.db.query(Notification).filter(Notification.user_id == user_id)
        
        # Aplicar filtros
        if filters:
            if filters.notification_type:
                query = query.filter(Notification.notification_type.in_(filters.notification_type))
            
            if filters.status:
                query = query.filter(Notification.status.in_(filters.status))
            
            if filters.priority:
                query = query.filter(Notification.priority.in_(filters.priority))
            
            if filters.category:
                query = query.filter(Notification.category == filters.category)
            
            if filters.read is not None:
                if filters.read:
                    query = query.filter(Notification.read_at.isnot(None))
                else:
                    query = query.filter(Notification.read_at.is_(None))
            
            if filters.created_from:
                query = query.filter(Notification.created_at >= filters.created_from)
            
            if filters.created_to:
                query = query.filter(Notification.created_at <= filters.created_to)
            
            if filters.search:
                search_term = f"%{filters.search}%"
                query = query.filter(
                    or_(
                        Notification.title.ilike(search_term),
                        Notification.message.ilike(search_term)
                    )
                )
        
        # Filtrar notificaciones no expiradas
        query = query.filter(
            or_(
                Notification.expires_at.is_(None),
                Notification.expires_at > datetime.utcnow()
            )
        )
        
        # Contar total
        total = query.count()
        
        # Ordenar por fecha (más recientes primero)
        notifications = query.order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()
        
        return notifications, total
    
    def mark_as_read(self, user_id: UUID, mark_read_data: NotificationMarkRead) -> int:
        """Marcar notificaciones como leídas"""
        query = self.db.query(Notification).filter(
            and_(
                Notification.user_id == user_id,
                Notification.read_at.is_(None)  # Solo las no leídas
            )
        )
        
        # Si se especifican IDs específicos
        if mark_read_data.notification_ids:
            query = query.filter(Notification.id.in_(mark_read_data.notification_ids))
        
        notifications = query.all()
        count = len(notifications)
        
        # Marcar como leídas
        for notification in notifications:
            notification.read_at = datetime.utcnow()
            if notification.status == NotificationStatus.DELIVERED:
                notification.status = NotificationStatus.READ
        
        self.db.commit()
        return count
    
    def get_unread_count(self, user_id: UUID) -> int:
        """Obtener cantidad de notificaciones no leídas"""
        return self.db.query(Notification).filter(
            and_(
                Notification.user_id == user_id,
                Notification.read_at.is_(None),
                or_(
                    Notification.expires_at.is_(None),
                    Notification.expires_at > datetime.utcnow()
                )
            )
        ).count()
    
    def delete_notification(self, notification_id: UUID, user_id: UUID) -> bool:
        """Eliminar notificación (solo del usuario)"""
        notification = self.get_notification(notification_id, user_id)
        if not notification:
            return False
        
        self.db.delete(notification)
        self.db.commit()
        return True
    
    # Métodos de configuración
    def get_notification_settings(self, user_id: UUID) -> Optional[NotificationSettings]:
        """Obtener configuración de notificaciones del usuario"""
        return self.db.query(NotificationSettings).filter(
            NotificationSettings.user_id == user_id
        ).first()
    
    def create_notification_settings(
        self, 
        user_id: UUID, 
        settings_data: NotificationSettingsCreate
    ) -> NotificationSettings:
        """Crear configuración de notificaciones"""
        
        # Verificar que no existan ya configuraciones
        existing = self.get_notification_settings(user_id)
        if existing:
            raise ValidationError("Ya existen configuraciones para este usuario")
        
        settings = NotificationSettings(
            user_id=user_id,
            enabled=settings_data.enabled,
            quiet_hours_enabled=settings_data.quiet_hours_enabled,
            quiet_hours_start=settings_data.quiet_hours_start,
            quiet_hours_end=settings_data.quiet_hours_end,
            timezone=settings_data.timezone,
            digest_frequency=settings_data.digest_frequency,
            digest_time=settings_data.digest_time,
            marketing_emails=settings_data.marketing_emails,
            newsletter_subscription=settings_data.newsletter_subscription,
            system_notifications=self._convert_method_settings(settings_data.system_notifications),
            verification_notifications=self._convert_method_settings(settings_data.verification_notifications),
            listing_notifications=self._convert_method_settings(settings_data.listing_notifications),
            subscription_notifications=self._convert_method_settings(settings_data.subscription_notifications),
            message_notifications=self._convert_method_settings(settings_data.message_notifications),
            lead_notifications=self._convert_method_settings(settings_data.lead_notifications),
            review_notifications=self._convert_method_settings(settings_data.review_notifications),
            payment_notifications=self._convert_method_settings(settings_data.payment_notifications),
            security_notifications=self._convert_method_settings(settings_data.security_notifications)
        )
        
        self.db.add(settings)
        self.db.commit()
        return settings
    
    def update_notification_settings(
        self, 
        user_id: UUID, 
        settings_data: NotificationSettingsUpdate
    ) -> NotificationSettings:
        """Actualizar configuración de notificaciones"""
        settings = self.get_notification_settings(user_id)
        if not settings:
            raise NotFoundError("Configuración no encontrada")
        
        # Actualizar campos
        update_dict = settings_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            if field.endswith('_notifications') and value is not None:
                # Convertir NotificationMethodSettings a dict
                value = self._convert_method_settings(value)
            setattr(settings, field, value)
        
        self.db.commit()
        return settings
    
    def get_or_create_notification_settings(self, user_id: UUID) -> NotificationSettings:
        """Obtener o crear configuración por defecto"""
        settings = self.get_notification_settings(user_id)
        if not settings:
            default_settings = NotificationSettingsCreate()
            settings = self.create_notification_settings(user_id, default_settings)
        return settings
    
    # Métodos de estadísticas
    def get_notification_stats(self, user_id: UUID) -> NotificationStats:
        """Obtener estadísticas de notificaciones del usuario"""
        query = self.db.query(Notification).filter(Notification.user_id == user_id)
        
        # Filtrar no expiradas
        query = query.filter(
            or_(
                Notification.expires_at.is_(None),
                Notification.expires_at > datetime.utcnow()
            )
        )
        
        stats = NotificationStats()
        
        # Estadísticas generales
        stats.total_notifications = query.count()
        stats.unread_notifications = query.filter(Notification.read_at.is_(None)).count()
        stats.read_notifications = query.filter(Notification.read_at.isnot(None)).count()
        
        # Por tipo
        type_stats = query.with_entities(
            Notification.notification_type,
            func.count(Notification.id)
        ).group_by(Notification.notification_type).all()
        
        stats.by_type = {str(notif_type): count for notif_type, count in type_stats}
        
        # Por prioridad
        priority_stats = query.with_entities(
            Notification.priority,
            func.count(Notification.id)
        ).group_by(Notification.priority).all()
        
        stats.by_priority = {str(priority): count for priority, count in priority_stats}
        
        # Por estado
        status_stats = query.with_entities(
            Notification.status,
            func.count(Notification.id)
        ).group_by(Notification.status).all()
        
        stats.by_status = {str(status): count for status, count in status_stats}
        
        # Recientes (últimos 7 días)
        week_ago = datetime.utcnow() - timedelta(days=7)
        stats.recent_count = query.filter(Notification.created_at >= week_ago).count()
        
        return stats
    
    # Métodos de envío masivo
    def create_bulk_notifications(
        self, 
        bulk_data: BulkNotificationCreate,
        sender_id: UUID
    ) -> Dict[str, Any]:
        """Crear notificaciones masivas"""
        
        # Determinar usuarios destinatarios
        if bulk_data.user_ids:
            target_users = bulk_data.user_ids
        else:
            # Obtener usuarios activos basado en filtros
            target_users = self._get_users_by_filters(bulk_data.user_filters or {})
        
        if not target_users:
            raise ValidationError("No se encontraron usuarios destinatarios")
        
        notifications_created = 0
        failed_count = 0
        errors = []
        
        for user_id in target_users:
            try:
                # Verificar configuración del usuario
                user_settings = self.get_notification_settings(user_id)
                if not user_settings or not user_settings.enabled:
                    continue
                
                # Crear notificación individual
                notification_data = NotificationCreate(
                    user_id=user_id,
                    title=bulk_data.title,
                    message=bulk_data.message,
                    notification_type=bulk_data.notification_type,
                    category=bulk_data.category,
                    priority=bulk_data.priority,
                    delivery_methods=bulk_data.delivery_methods,
                    expires_at=bulk_data.expires_at
                )
                
                self.create_notification(notification_data, sender_id)
                notifications_created += 1
                
            except Exception as e:
                failed_count += 1
                errors.append(f"Usuario {user_id}: {str(e)}")
        
        return {
            "total_users": len(target_users),
            "notifications_created": notifications_created,
            "failed_count": failed_count,
            "errors": errors[:10]  # Limitar errores mostrados
        }
    
    # Métodos de plantillas
    def get_notification_templates(
        self,
        notification_type: Optional[NotificationType] = None,
        active_only: bool = True
    ) -> List[NotificationTemplate]:
        """Obtener plantillas de notificación"""
        query = self.db.query(NotificationTemplate)
        
        if notification_type:
            query = query.filter(NotificationTemplate.notification_type == notification_type)
        
        if active_only:
            query = query.filter(NotificationTemplate.active == True)
        
        return query.order_by(NotificationTemplate.name).all()
    
    def create_from_template(
        self,
        template_key: str,
        user_id: UUID,
        variables: Dict[str, Any],
        sender_id: Optional[UUID] = None
    ) -> Notification:
        """Crear notificación desde plantilla"""
        template = self.db.query(NotificationTemplate).filter(
            NotificationTemplate.template_key == template_key,
            NotificationTemplate.active == True
        ).first()
        
        if not template:
            raise NotFoundError(f"Plantilla '{template_key}' no encontrada")
        
        # Validar variables requeridas
        missing_vars = [var for var in template.required_variables if var not in variables]
        if missing_vars:
            raise ValidationError(f"Variables requeridas faltantes: {', '.join(missing_vars)}")
        
        # Procesar plantillas
        try:
            title = self._process_template(template.title_template, variables)
            message = self._process_template(template.message_template, variables)
            summary = None
            if template.summary_template:
                summary = self._process_template(template.summary_template, variables)
        except Exception as e:
            raise ValidationError(f"Error procesando plantilla: {str(e)}")
        
        # Crear notificación
        notification_data = NotificationCreate(
            user_id=user_id,
            title=title,
            message=message,
            summary=summary,
            notification_type=template.notification_type,
            category=template.category,
            priority=template.default_priority,
            delivery_methods=template.default_delivery_methods
        )
        
        return self.create_notification(notification_data, sender_id)
    
    # Métodos privados
    def _create_default_settings(self, user_id: UUID) -> NotificationSettings:
        """Crear configuraciones de notificación por defecto para un usuario"""
        default_method_settings = {
            "in_app": True,
            "email": True,
            "push": False,
            "sms": False
        }
        
        settings = NotificationSettings(
            user_id=user_id,
            enabled=True,  # Habilitado por defecto
            quiet_hours_enabled=False,
            timezone="America/Lima",
            digest_frequency="instant",
            marketing_emails=True,
            newsletter_subscription=True,
            system_notifications=default_method_settings,
            verification_notifications=default_method_settings,
            listing_notifications=default_method_settings,
            subscription_notifications=default_method_settings,
            message_notifications=default_method_settings,
            lead_notifications=default_method_settings,
            review_notifications=default_method_settings,
            payment_notifications=default_method_settings,
            security_notifications=default_method_settings
        )
        
        self.db.add(settings)
        self.db.flush()  # No commit aún, se hará después
        return settings
    
    def _add_to_notification_queue(self, notification: Notification):
        """Agregar notificación a la cola de envío"""
        priority_score = self._calculate_notification_priority_score(notification.priority)
        
        queue_item = NotificationQueue(
            notification_id=notification.id,
            priority_score=priority_score,
            scheduled_for=datetime.utcnow()
        )
        
        self.db.add(queue_item)
    
    def _calculate_notification_priority_score(self, priority: NotificationPriority) -> int:
        """Calcular score de prioridad"""
        scores = {
            NotificationPriority.URGENT: 1000,
            NotificationPriority.HIGH: 100,
            NotificationPriority.MEDIUM: 50,
            NotificationPriority.LOW: 10
        }
        return scores.get(priority, 50)
    
    def _convert_method_settings(self, method_settings) -> Dict[str, bool]:
        """Convertir NotificationMethodSettings a dict"""
        if isinstance(method_settings, dict):
            return method_settings
        return method_settings.model_dump()
    
    def _get_users_by_filters(self, filters: Dict[str, Any]) -> List[UUID]:
        """Obtener usuarios basado en filtros (placeholder)"""
        # TODO: Implementar filtros específicos según necesidades
        # Por ahora retorna lista vacía
        return []
    
    def _process_template(self, template: str, variables: Dict[str, Any]) -> str:
        """Procesar plantilla con variables"""
        # Implementación simple de reemplazo de variables
        # Formato: {variable_name}
        processed = template
        for key, value in variables.items():
            placeholder = f"{{{key}}}"
            processed = processed.replace(placeholder, str(value))
        
        return processed
    
    # Métodos de limpieza
    def cleanup_expired_notifications(self) -> int:
        """Limpiar notificaciones expiradas"""
        expired = self.db.query(Notification).filter(
            and_(
                Notification.expires_at.isnot(None),
                Notification.expires_at < datetime.utcnow()
            )
        ).all()
        
        count = len(expired)
        for notification in expired:
            self.db.delete(notification)
        
        if count > 0:
            self.db.commit()
        
        return count
    
    def cleanup_old_read_notifications(self, days: int = 30) -> int:
        """Limpiar notificaciones leídas antiguas"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        old_notifications = self.db.query(Notification).filter(
            and_(
                Notification.read_at.isnot(None),
                Notification.read_at < cutoff_date
            )
        ).all()
        
        count = len(old_notifications)
        for notification in old_notifications:
            self.db.delete(notification)
        
        if count > 0:
            self.db.commit()
        
        return count
