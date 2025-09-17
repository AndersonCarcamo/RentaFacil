from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, asc
from typing import List, Optional, Dict, Any, Tuple
from uuid import UUID
from datetime import datetime, timedelta
from fastapi import HTTPException

from app.models.verification import (
    Verification, ModerationQueue, VerificationDocument, 
    ModerationAction, VerificationTemplate,
    VerificationStatus, VerificationType, ModerationPriority
)
from app.schemas.verifications import (
    VerificationCreate, VerificationUpdate, VerificationFilters,
    ModerationAssignment, ModerationActionCreate, VerificationStats
)
from app.core.exceptions import NotFoundError, ValidationError


class VerificationService:
    """Servicio para gestión de verificaciones y moderación"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Métodos de verificación
    def create_verification(self, verification_data: VerificationCreate, requester_id: UUID) -> Verification:
        """Crear nueva solicitud de verificación"""
        
        # Verificar que no existe ya una verificación pendiente para la misma entidad
        existing = self.db.query(Verification).filter(
            and_(
                Verification.target_type == verification_data.target_type,
                Verification.target_id == verification_data.target_id,
                Verification.status.in_([VerificationStatus.PENDING, VerificationStatus.UNDER_REVIEW])
            )
        ).first()
        
        if existing:
            raise ValidationError("Ya existe una verificación pendiente para esta entidad")
        
        # Crear la verificación
        verification = Verification(
            target_type=verification_data.target_type,
            target_id=verification_data.target_id,
            priority=verification_data.priority,
            requester_id=requester_id,
            requester_notes=verification_data.requester_notes,
            documents=verification_data.documents or [],
            verification_data=verification_data.verification_data or {}
        )
        
        self.db.add(verification)
        self.db.flush()
        
        # Agregar a la cola de moderación
        self._add_to_moderation_queue(verification)
        
        # Registrar acción
        self._log_moderation_action(
            verification.id,
            requester_id,
            "verification_requested",
            "Solicitud de verificación creada",
            {"target_type": verification_data.target_type.value}
        )
        
        self.db.commit()
        return verification
    
    def get_verification(self, verification_id: UUID, user_id: Optional[UUID] = None) -> Optional[Verification]:
        """Obtener verificación por ID"""
        query = self.db.query(Verification).filter(Verification.id == verification_id)
        
        # Si se proporciona user_id, verificar que tenga acceso
        if user_id:
            query = query.filter(
                or_(
                    Verification.requester_id == user_id,
                    Verification.moderator_id == user_id
                )
            )
        
        return query.first()
    
    def get_verifications(
        self, 
        filters: Optional[VerificationFilters] = None,
        user_id: Optional[UUID] = None,
        is_moderator: bool = False,
        skip: int = 0, 
        limit: int = 50
    ) -> Tuple[List[Verification], int]:
        """Obtener lista de verificaciones con filtros"""
        query = self.db.query(Verification)
        
        # Filtros de acceso
        if not is_moderator and user_id:
            # Usuario normal solo ve sus propias verificaciones
            query = query.filter(Verification.requester_id == user_id)
        
        # Aplicar filtros
        if filters:
            if filters.status:
                query = query.filter(Verification.status.in_(filters.status))
            
            if filters.verification_type:
                query = query.filter(Verification.target_type.in_(filters.verification_type))
            
            if filters.priority:
                query = query.filter(Verification.priority.in_(filters.priority))
            
            if filters.requester_id:
                query = query.filter(Verification.requester_id == filters.requester_id)
            
            if filters.moderator_id:
                query = query.filter(Verification.moderator_id == filters.moderator_id)
            
            if filters.assigned is not None:
                if filters.assigned:
                    query = query.filter(Verification.moderator_id.isnot(None))
                else:
                    query = query.filter(Verification.moderator_id.is_(None))
            
            if filters.created_from:
                query = query.filter(Verification.created_at >= filters.created_from)
            
            if filters.created_to:
                query = query.filter(Verification.created_at <= filters.created_to)
            
            if filters.search:
                search_term = f"%{filters.search}%"
                query = query.filter(
                    or_(
                        Verification.requester_notes.ilike(search_term),
                        Verification.moderator_notes.ilike(search_term)
                    )
                )
        
        # Contar total
        total = query.count()
        
        # Ordenar y paginar
        verifications = query.order_by(desc(Verification.created_at)).offset(skip).limit(limit).all()
        
        return verifications, total
    
    def update_verification(
        self, 
        verification_id: UUID, 
        update_data: VerificationUpdate, 
        moderator_id: UUID
    ) -> Verification:
        """Actualizar verificación (solo moderadores)"""
        verification = self.get_verification(verification_id)
        if not verification:
            raise NotFoundError("Verificación no encontrada")
        
        previous_status = verification.status
        
        # Actualizar campos
        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(verification, field, value)
        
        # Si se asigna moderador
        if not verification.moderator_id and moderator_id:
            verification.moderator_id = moderator_id
            verification.assigned_at = datetime.utcnow()
        
        # Si cambia el estado
        if update_data.status and update_data.status != previous_status:
            if update_data.status == VerificationStatus.UNDER_REVIEW:
                verification.review_started_at = datetime.utcnow()
            elif update_data.status in [VerificationStatus.APPROVED, VerificationStatus.REJECTED]:
                verification.review_completed_at = datetime.utcnow()
                # Remover de la cola
                self._remove_from_moderation_queue(verification_id)
        
        # Registrar acción
        if update_data.status and update_data.status != previous_status:
            self._log_moderation_action(
                verification_id,
                moderator_id,
                "status_change",
                f"Estado cambiado de {previous_status} a {update_data.status}",
                {
                    "previous_status": previous_status.value if previous_status else None,
                    "new_status": update_data.status.value
                }
            )
        
        self.db.commit()
        return verification
    
    # Métodos de cola de moderación
    def get_moderation_queue(
        self, 
        assigned_to: Optional[UUID] = None,
        skip: int = 0, 
        limit: int = 50
    ) -> Tuple[List[ModerationQueue], int]:
        """Obtener cola de moderación"""
        query = self.db.query(ModerationQueue)
        
        if assigned_to:
            query = query.filter(ModerationQueue.assigned_to == assigned_to)
        
        total = query.count()
        
        # Ordenar por prioridad y fecha
        queue_items = query.order_by(
            desc(ModerationQueue.priority_score),
            asc(ModerationQueue.created_at)
        ).offset(skip).limit(limit).all()
        
        return queue_items, total
    
    def assign_moderation(self, verification_id: UUID, assignment: ModerationAssignment) -> ModerationQueue:
        """Asignar verificación a moderador"""
        verification = self.get_verification(verification_id)
        if not verification:
            raise NotFoundError("Verificación no encontrada")
        
        # Actualizar verificación
        verification.moderator_id = assignment.moderator_id
        verification.assigned_at = datetime.utcnow()
        
        # Actualizar cola
        queue_item = self.db.query(ModerationQueue).filter(
            ModerationQueue.verification_id == verification_id
        ).first()
        
        if queue_item:
            queue_item.assigned_to = assignment.moderator_id
            queue_item.assigned_at = datetime.utcnow()
            queue_item.estimated_completion = assignment.estimated_completion
            
            if assignment.priority:
                queue_item.priority = assignment.priority
                queue_item.priority_score = self._calculate_priority_score(assignment.priority)
        
        # Registrar acción
        self._log_moderation_action(
            verification_id,
            assignment.moderator_id,
            "assign",
            "Verificación asignada al moderador"
        )
        
        self.db.commit()
        return queue_item
    
    def start_processing(self, verification_id: UUID, moderator_id: UUID) -> ModerationQueue:
        """Iniciar procesamiento de verificación"""
        queue_item = self.db.query(ModerationQueue).filter(
            ModerationQueue.verification_id == verification_id
        ).first()
        
        if not queue_item:
            raise NotFoundError("Item no encontrado en la cola")
        
        if queue_item.assigned_to != moderator_id:
            raise ValidationError("Solo el moderador asignado puede iniciar el procesamiento")
        
        queue_item.processing_started = True
        queue_item.processing_started_at = datetime.utcnow()
        
        # Actualizar estado de verificación
        verification = self.get_verification(verification_id)
        if verification and verification.status == VerificationStatus.PENDING:
            verification.status = VerificationStatus.UNDER_REVIEW
            verification.review_started_at = datetime.utcnow()
        
        # Registrar acción
        self._log_moderation_action(
            verification_id,
            moderator_id,
            "review_start",
            "Revisión iniciada"
        )
        
        self.db.commit()
        return queue_item
    
    # Métodos de documentos
    def add_document(
        self, 
        verification_id: UUID, 
        document_type: str,
        file_path: str,
        file_name: str,
        uploaded_by: UUID,
        file_size: Optional[int] = None,
        mime_type: Optional[str] = None
    ) -> VerificationDocument:
        """Agregar documento a verificación"""
        verification = self.get_verification(verification_id)
        if not verification:
            raise NotFoundError("Verificación no encontrada")
        
        document = VerificationDocument(
            verification_id=verification_id,
            document_type=document_type,
            file_path=file_path,
            file_name=file_name,
            file_size=file_size,
            mime_type=mime_type,
            uploaded_by=uploaded_by
        )
        
        self.db.add(document)
        
        # Registrar acción
        self._log_moderation_action(
            verification_id,
            uploaded_by,
            "document_add",
            f"Documento agregado: {document_type}",
            {"document_type": document_type, "file_name": file_name}
        )
        
        self.db.commit()
        return document
    
    def verify_document(
        self, 
        document_id: UUID, 
        verified: bool, 
        moderator_id: UUID,
        notes: Optional[str] = None
    ) -> VerificationDocument:
        """Verificar documento"""
        document = self.db.query(VerificationDocument).filter(
            VerificationDocument.id == document_id
        ).first()
        
        if not document:
            raise NotFoundError("Documento no encontrado")
        
        document.verified = verified
        document.verification_notes = notes
        
        # Registrar acción
        action_type = "document_approve" if verified else "document_reject"
        self._log_moderation_action(
            document.verification_id,
            moderator_id,
            action_type,
            f"Documento {'aprobado' if verified else 'rechazado'}: {document.document_type}",
            {"document_id": str(document_id), "verified": verified}
        )
        
        self.db.commit()
        return document
    
    # Métodos de estadísticas
    def get_verification_stats(
        self, 
        user_id: Optional[UUID] = None,
        is_moderator: bool = False
    ) -> VerificationStats:
        """Obtener estadísticas de verificaciones"""
        query = self.db.query(Verification)
        
        if not is_moderator and user_id:
            query = query.filter(Verification.requester_id == user_id)
        
        stats = VerificationStats()
        
        # Estadísticas generales
        stats.total_verifications = query.count()
        stats.pending_verifications = query.filter(Verification.status == VerificationStatus.PENDING).count()
        stats.approved_verifications = query.filter(Verification.status == VerificationStatus.APPROVED).count()
        stats.rejected_verifications = query.filter(Verification.status == VerificationStatus.REJECTED).count()
        stats.under_review_verifications = query.filter(Verification.status == VerificationStatus.UNDER_REVIEW).count()
        
        # Por tipo
        type_stats = self.db.query(
            Verification.target_type,
            func.count(Verification.id)
        ).group_by(Verification.target_type).all()
        
        stats.by_type = {str(type_name): count for type_name, count in type_stats}
        
        # Por prioridad
        priority_stats = self.db.query(
            Verification.priority,
            func.count(Verification.id)
        ).group_by(Verification.priority).all()
        
        stats.by_priority = {str(priority): count for priority, count in priority_stats}
        
        # Tiempo promedio de procesamiento
        completed_verifications = query.filter(
            and_(
                Verification.review_started_at.isnot(None),
                Verification.review_completed_at.isnot(None)
            )
        ).all()
        
        if completed_verifications:
            total_hours = 0
            for verification in completed_verifications:
                diff = verification.review_completed_at - verification.review_started_at
                total_hours += diff.total_seconds() / 3600
            
            stats.average_processing_time_hours = total_hours / len(completed_verifications)
        
        # Longitud de la cola
        stats.queue_length = self.db.query(ModerationQueue).count()
        
        return stats
    
    # Métodos privados
    def _add_to_moderation_queue(self, verification: Verification) -> ModerationQueue:
        """Agregar verificación a la cola de moderación"""
        priority_score = self._calculate_priority_score(verification.priority)
        
        queue_item = ModerationQueue(
            verification_id=verification.id,
            priority=verification.priority,
            priority_score=priority_score
        )
        
        self.db.add(queue_item)
        return queue_item
    
    def _remove_from_moderation_queue(self, verification_id: UUID):
        """Remover verificación de la cola"""
        queue_item = self.db.query(ModerationQueue).filter(
            ModerationQueue.verification_id == verification_id
        ).first()
        
        if queue_item:
            self.db.delete(queue_item)
    
    def _calculate_priority_score(self, priority: ModerationPriority) -> int:
        """Calcular score de prioridad para ordenamiento"""
        scores = {
            ModerationPriority.HIGH: 100,
            ModerationPriority.MEDIUM: 50,
            ModerationPriority.LOW: 10
        }
        return scores.get(priority, 50)
    
    def _log_moderation_action(
        self,
        verification_id: UUID,
        moderator_id: UUID,
        action_type: str,
        description: Optional[str] = None,
        action_data: Optional[Dict[str, Any]] = None
    ):
        """Registrar acción de moderación"""
        action = ModerationAction(
            verification_id=verification_id,
            moderator_id=moderator_id,
            action_type=action_type,
            action_description=description,
            action_data=action_data or {}
        )
        
        self.db.add(action)
    
    def get_moderation_actions(
        self, 
        verification_id: Optional[UUID] = None,
        moderator_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 50
    ) -> Tuple[List[ModerationAction], int]:
        """Obtener historial de acciones de moderación"""
        query = self.db.query(ModerationAction)
        
        if verification_id:
            query = query.filter(ModerationAction.verification_id == verification_id)
        
        if moderator_id:
            query = query.filter(ModerationAction.moderator_id == moderator_id)
        
        total = query.count()
        actions = query.order_by(desc(ModerationAction.created_at)).offset(skip).limit(limit).all()
        
        return actions, total
    
    # Métodos para plantillas
    def get_verification_templates(
        self, 
        verification_type: Optional[VerificationType] = None,
        active_only: bool = True
    ) -> List[VerificationTemplate]:
        """Obtener plantillas de verificación"""
        query = self.db.query(VerificationTemplate)
        
        if verification_type:
            query = query.filter(VerificationTemplate.verification_type == verification_type)
        
        if active_only:
            query = query.filter(VerificationTemplate.active == True)
        
        return query.order_by(VerificationTemplate.name).all()
