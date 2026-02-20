from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc
from typing import List, Optional, Tuple
from app.models.interactions import Favorite, Lead, LeadNote, Review
from app.models.listing import Listing
from app.schemas.interactions import (
    CreateLeadRequest, UpdateLeadRequest, LeadNoteRequest,
    CreateReviewRequest, UpdateReviewRequest, LeadStatus
)
from app.core.exceptions import BusinessLogicError
import uuid

class InteractionService:
    def __init__(self, db: Session):
        self.db = db

    # =================== FAVORITES ===================
    def get_user_favorites(
        self, 
        user_id: str, 
        page: int = 1, 
        limit: int = 20
    ) -> Tuple[List[Favorite], int]:
        """Obtiene los favoritos del usuario con paginación"""
        offset = (page - 1) * limit
        
        query = self.db.query(Favorite).filter(
            Favorite.user_id == user_id
        ).order_by(desc(Favorite.created_at))
        
        total = query.count()
        favorites = query.offset(offset).limit(limit).all()
        
        return favorites, total

    def add_to_favorites(self, user_id: str, listing_id: str) -> Favorite:
        """Agrega una propiedad a favoritos"""
        # Verificar si ya existe
        existing = self.db.query(Favorite).filter(
            and_(Favorite.user_id == user_id, Favorite.listing_id == listing_id)
        ).first()
        
        if existing:
            return existing
        
        # Verificar que la propiedad existe y obtener created_at
        listing = self.db.query(Listing).filter(Listing.id == listing_id).first()
        if not listing:
            raise BusinessLogicError("Listing not found")
        
        favorite = Favorite(
            user_id=user_id, 
            listing_id=listing_id,
            listing_created_at=listing.created_at
        )
        self.db.add(favorite)
        self.db.commit()
        self.db.refresh(favorite)
        return favorite

    def remove_from_favorites(self, user_id: str, listing_id: str) -> bool:
        """Remueve una propiedad de favoritos"""
        favorite = self.db.query(Favorite).filter(
            and_(Favorite.user_id == user_id, Favorite.listing_id == listing_id)
        ).first()
        
        if favorite:
            self.db.delete(favorite)
            self.db.commit()
            return True
        return False

    def is_favorite(self, user_id: str, listing_id: str) -> bool:
        """Verifica si una propiedad está en favoritos"""
        return self.db.query(Favorite).filter(
            and_(Favorite.user_id == user_id, Favorite.listing_id == listing_id)
        ).first() is not None

    def get_listing_for_favorite(self, favorite: Favorite) -> dict:
        """Obtiene los datos básicos del listing para el favorito"""
        listing = self.db.query(Listing).filter(Listing.id == favorite.listing_id).first()
        if not listing:
            return None
        
        return {
            "id": str(listing.id),
            "title": listing.title,
            "price": float(listing.price) if listing.price else None,
            "currency": listing.currency,
            "operation": listing.operation,
            "property_type": listing.property_type,
            "district": listing.district,
            "province": listing.province,
            "status": listing.status
        }

    # =================== LEADS ===================
    def get_leads(
        self, 
        user_id: str, 
        listing_id: Optional[str] = None,
        status: Optional[str] = None,
        source: Optional[str] = None,
        page: int = 1, 
        limit: int = 20
    ) -> Tuple[List[Lead], int]:
        """Obtiene leads para un propietario/agente"""
        offset = (page - 1) * limit
        
        # Query base - solo leads de propiedades del usuario
        query = self.db.query(Lead).join(Listing).filter(
            Listing.owner_user_id == user_id
        )
        
        # Aplicar filtros
        if listing_id:
            query = query.filter(Lead.listing_id == listing_id)
        if status:
            query = query.filter(Lead.status == status)
        if source:
            query = query.filter(Lead.source == source)
        
        query = query.order_by(desc(Lead.created_at))
        
        total = query.count()
        leads = query.offset(offset).limit(limit).all()
        
        return leads, total

    def create_lead(self, lead_data: CreateLeadRequest, user_id: Optional[str] = None) -> Lead:
        """Crea un nuevo lead"""
        # Verificar que la propiedad existe y está activa
        listing = self.db.query(Listing).filter(
            and_(Listing.id == str(lead_data.listing_id), Listing.status == 'published')
        ).first()
        
        if not listing:
            raise BusinessLogicError("Listing not found or not active")
        
        # Obtener información del usuario si está autenticado
        contact_name = None
        contact_email = None
        if user_id:
            # Aquí podrías obtener la info del usuario desde la base de datos
            # Por ahora usamos valores por defecto
            contact_name = "Usuario Registrado"
            contact_email = "usuario@email.com"
        
        lead = Lead(
            listing_id=str(lead_data.listing_id),
            listing_created_at=listing.created_at,
            user_id=user_id,
            contact_name=contact_name,
            contact_email=contact_email,
            contact_phone=lead_data.phone,
            message=lead_data.message,
            preferred_contact_time=lead_data.preferred_contact_time,
            utm_source=lead_data.utm_source,
            utm_medium=lead_data.utm_medium,
            utm_campaign=lead_data.utm_campaign,
            source="web"
        )
        
        self.db.add(lead)
        self.db.commit()
        self.db.refresh(lead)
        return lead

    def get_lead(self, lead_id: str, user_id: str) -> Optional[Lead]:
        """Obtiene un lead específico si pertenece al usuario"""
        return self.db.query(Lead).join(Listing).filter(
            and_(
                Lead.id == lead_id,
                Listing.owner_user_id == user_id
            )
        ).first()

    def update_lead(self, lead_id: str, user_id: str, update_data: UpdateLeadRequest) -> Optional[Lead]:
        """Actualiza un lead"""
        lead = self.get_lead(lead_id, user_id)
        if not lead:
            return None
        
        if update_data.status is not None:
            lead.status = update_data.status.value
        if update_data.notes is not None:
            lead.notes = update_data.notes
        if update_data.follow_up_date is not None:
            lead.follow_up_date = update_data.follow_up_date
        
        self.db.commit()
        self.db.refresh(lead)
        return lead

    def add_lead_note(self, lead_id: str, user_id: str, note_data: LeadNoteRequest) -> Optional[LeadNote]:
        """Agrega una nota a un lead"""
        # Verificar que el lead pertenece al usuario
        lead = self.get_lead(lead_id, user_id)
        if not lead:
            return None
        
        note = LeadNote(
            lead_id=lead_id,
            lead_created_at=lead.created_at,
            user_id=user_id,
            content=note_data.content
        )
        
        self.db.add(note)
        self.db.commit()
        self.db.refresh(note)
        return note

    def get_lead_with_details(self, lead_id: str, user_id: str) -> Optional[dict]:
        """Obtiene un lead con todos sus detalles"""
        lead = self.get_lead(lead_id, user_id)
        if not lead:
            return None
        
        # Obtener listing
        listing = self.db.query(Listing).filter(Listing.id == lead.listing_id).first()
        
        # Obtener notas
        notes = self.db.query(LeadNote).filter(LeadNote.lead_id == lead_id).order_by(LeadNote.created_at).all()
        
        return {
            "lead": lead,
            "listing": {
                "id": str(listing.id),
                "title": listing.title,
                "district": listing.district,
                "province": listing.province
            } if listing else None,
            "notes_history": [
                {
                    "id": str(note.id),
                    "content": note.content,
                    "created_at": note.created_at,
                    "user": {"name": "Usuario"}  # Placeholder
                } for note in notes
            ]
        }

    # =================== REVIEWS ===================
    def get_reviews(
        self,
        listing_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        agency_id: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[Review], int]:
        """Obtiene reseñas filtradas"""
        offset = (page - 1) * limit
        
        query = self.db.query(Review).filter(Review.status == 'published')
        
        # Aplicar filtros
        if listing_id:
            query = query.filter(
                and_(Review.target_type == 'listing', Review.target_id == listing_id)
            )
        if agent_id:
            query = query.filter(
                and_(Review.target_type == 'agent', Review.target_id == agent_id)
            )
        if agency_id:
            query = query.filter(
                and_(Review.target_type == 'agency', Review.target_id == agency_id)
            )
        
        query = query.order_by(desc(Review.created_at))
        
        total = query.count()
        reviews = query.offset(offset).limit(limit).all()
        
        return reviews, total

    def create_review(self, review_data: CreateReviewRequest, user_id: str) -> Review:
        """Crea una nueva reseña"""
        # Verificar que no existe ya una reseña del usuario para este target
        existing = self.db.query(Review).filter(
            and_(
                Review.user_id == user_id,
                Review.target_type == review_data.target_type.value,
                Review.target_id == str(review_data.target_id)
            )
        ).first()
        
        if existing:
            raise BusinessLogicError("User already reviewed this target")
        
        # Verificar que el target existe
        if review_data.target_type.value == 'listing':
            target = self.db.query(Listing).filter(Listing.id == str(review_data.target_id)).first()
            if not target:
                raise BusinessLogicError("Listing not found")
        
        review = Review(
            user_id=user_id,
            target_type=review_data.target_type.value,
            target_id=str(review_data.target_id),
            rating=review_data.rating,
            comment=review_data.comment
        )
        
        self.db.add(review)
        self.db.commit()
        self.db.refresh(review)
        return review

    def get_user_review(self, review_id: str, user_id: str) -> Optional[Review]:
        """Obtiene una reseña del usuario"""
        return self.db.query(Review).filter(
            and_(Review.id == review_id, Review.user_id == user_id)
        ).first()

    def update_review(self, review_id: str, user_id: str, update_data: UpdateReviewRequest) -> Optional[Review]:
        """Actualiza una reseña del usuario"""
        review = self.get_user_review(review_id, user_id)
        if not review:
            return None
        
        if update_data.rating is not None:
            review.rating = update_data.rating
        if update_data.comment is not None:
            review.comment = update_data.comment
        
        self.db.commit()
        self.db.refresh(review)
        return review

    def delete_review(self, review_id: str, user_id: str) -> bool:
        """Elimina una reseña del usuario"""
        review = self.get_user_review(review_id, user_id)
        if not review:
            return False
        
        self.db.delete(review)
        self.db.commit()
        return True

    def get_review_with_user(self, review: Review) -> dict:
        """Obtiene una reseña con datos del usuario"""
        return {
            "id": str(review.id),
            "user_id": str(review.user_id),
            "target_type": review.target_type,
            "target_id": str(review.target_id),
            "rating": review.rating,
            "comment": review.comment,
            "status": review.status,
            "helpful_count": review.helpful_count,
            "created_at": review.created_at,
            "updated_at": review.updated_at,
            "user": {
                "name": "Usuario Anónimo"  # Placeholder
            }
        }
