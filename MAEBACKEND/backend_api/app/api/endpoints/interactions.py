from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid

from app.core.database import get_db
from app.api.deps import get_current_user
from app.services.interaction_service import InteractionService
from app.schemas.interactions import (
    CreateLeadRequest, UpdateLeadRequest, LeadNoteRequest,
    CreateReviewRequest, UpdateReviewRequest,
    FavoriteResponse, FavoriteWithListing, LeadResponse, LeadDetailResponse,
    ReviewResponse, ReviewDetailResponse, LeadNoteResponse,
    PaginatedFavorites, PaginatedLeads, PaginatedReviews
)
from app.core.exceptions import BusinessLogicError

router = APIRouter()

# =================== FAVORITES ===================

@router.get("/favorites", response_model=PaginatedFavorites, summary="Obtener favoritos")
async def get_favorites(
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(20, ge=1, le=100, description="Elementos por página"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener favoritos del usuario"""
    try:
        service = InteractionService(db)
        user_id = str(current_user.get("user_id", current_user.get("id")))
        favorites, total = service.get_user_favorites(user_id, page, limit)
        
        pages = (total + limit - 1) // limit
        
        # Construir respuesta con datos del listing
        favorites_with_listing = []
        for fav in favorites:
            listing_data = service.get_listing_for_favorite(fav)
            favorites_with_listing.append(
                FavoriteWithListing(
                    id=fav.id,
                    user_id=fav.user_id,
                    listing_id=fav.listing_id,
                    created_at=fav.created_at,
                    listing=listing_data
                )
            )
        
        return PaginatedFavorites(
            data=favorites_with_listing,
            total=total,
            page=page,
            limit=limit,
            pages=pages,
            has_next=page < pages,
            has_prev=page > 1
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting favorites: {str(e)}")


@router.post("/favorites/{listing_id}", 
            response_model=FavoriteResponse, 
            status_code=status.HTTP_201_CREATED,
            summary="Agregar a favoritos")
async def add_to_favorites(
    listing_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Agregar propiedad a favoritos"""
    try:
        service = InteractionService(db)
        user_id = str(current_user.get("user_id", current_user.get("id")))
        favorite = service.add_to_favorites(user_id, listing_id)
        
        return FavoriteResponse(
            id=favorite.id,
            user_id=favorite.user_id,
            listing_id=favorite.listing_id,
            created_at=favorite.created_at
        )
        
    except BusinessLogicError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding to favorites: {str(e)}")


@router.delete("/favorites/{listing_id}", summary="Remover de favoritos")
async def remove_from_favorites(
    listing_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remover propiedad de favoritos"""
    try:
        service = InteractionService(db)
        user_id = str(current_user.get("user_id", current_user.get("id")))
        success = service.remove_from_favorites(user_id, listing_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Favorite not found")
        
        return {"message": "Removed from favorites successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error removing from favorites: {str(e)}")


# =================== LEADS ===================

@router.get("/leads", response_model=PaginatedLeads, summary="Obtener leads (para agentes/propietarios)")
async def get_leads(
    listing_id: Optional[str] = Query(None, description="Filtrar por propiedad"),
    status: Optional[str] = Query(None, description="Filtrar por estado"),
    source: Optional[str] = Query(None, description="Filtrar por fuente"),
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(20, ge=1, le=100, description="Elementos por página"),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener leads para propietarios/agentes"""
    try:
        service = InteractionService(db)
        user_id = str(current_user.get("user_id", current_user.get("id")))
        leads, total = service.get_leads(user_id, listing_id, status, source, page, limit)
        
        pages = (total + limit - 1) // limit
        
        leads_response = []
        for lead in leads:
            leads_response.append(
                LeadResponse(
                    id=lead.id,
                    listing_id=lead.listing_id,
                    user_id=lead.user_id,
                    contact_name=lead.contact_name,
                    contact_email=lead.contact_email,
                    contact_phone=lead.contact_phone,
                    message=lead.message,
                    status=lead.status,
                    source=lead.source,
                    utm_source=lead.utm_source,
                    utm_medium=lead.utm_medium,
                    utm_campaign=lead.utm_campaign,
                    preferred_contact_time=lead.preferred_contact_time,
                    notes=lead.notes,
                    follow_up_date=lead.follow_up_date,
                    created_at=lead.created_at,
                    updated_at=lead.updated_at
                )
            )
        
        return PaginatedLeads(
            data=leads_response,
            total=total,
            page=page,
            limit=limit,
            pages=pages,
            has_next=page < pages,
            has_prev=page > 1
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting leads: {str(e)}")


@router.post("/leads", 
            response_model=LeadResponse, 
            status_code=status.HTTP_201_CREATED,
            summary="Crear lead")
async def create_lead(
    lead_data: CreateLeadRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Crear nuevo lead"""
    try:
        service = InteractionService(db)
        user_id = None
        if current_user:
            user_id = str(current_user.get("user_id", current_user.get("id")))
        
        lead = service.create_lead(lead_data, user_id)
        
        return LeadResponse(
            id=lead.id,
            listing_id=lead.listing_id,
            user_id=lead.user_id,
            contact_name=lead.contact_name,
            contact_email=lead.contact_email,
            contact_phone=lead.contact_phone,
            message=lead.message,
            status=lead.status,
            source=lead.source,
            utm_source=lead.utm_source,
            utm_medium=lead.utm_medium,
            utm_campaign=lead.utm_campaign,
            preferred_contact_time=lead.preferred_contact_time,
            notes=lead.notes,
            follow_up_date=lead.follow_up_date,
            created_at=lead.created_at,
            updated_at=lead.updated_at
        )
        
    except BusinessLogicError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating lead: {str(e)}")


@router.get("/leads/{lead_id}", response_model=LeadDetailResponse, summary="Obtener lead por ID")
async def get_lead(
    lead_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener lead por ID"""
    try:
        service = InteractionService(db)
        user_id = str(current_user.get("user_id", current_user.get("id")))
        lead_details = service.get_lead_with_details(lead_id, user_id)
        
        if not lead_details:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        lead = lead_details["lead"]
        
        return LeadDetailResponse(
            id=lead.id,
            listing_id=lead.listing_id,
            user_id=lead.user_id,
            contact_name=lead.contact_name,
            contact_email=lead.contact_email,
            contact_phone=lead.contact_phone,
            message=lead.message,
            status=lead.status,
            source=lead.source,
            utm_source=lead.utm_source,
            utm_medium=lead.utm_medium,
            utm_campaign=lead.utm_campaign,
            preferred_contact_time=lead.preferred_contact_time,
            notes=lead.notes,
            follow_up_date=lead.follow_up_date,
            created_at=lead.created_at,
            updated_at=lead.updated_at,
            listing=lead_details["listing"],
            user=None,  # Placeholder
            notes_history=lead_details["notes_history"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting lead: {str(e)}")


@router.put("/leads/{lead_id}", response_model=LeadResponse, summary="Actualizar lead")
async def update_lead(
    lead_id: str,
    update_data: UpdateLeadRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualizar lead"""
    try:
        service = InteractionService(db)
        user_id = str(current_user.get("user_id", current_user.get("id")))
        lead = service.update_lead(lead_id, user_id, update_data)
        
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        return LeadResponse(
            id=lead.id,
            listing_id=lead.listing_id,
            user_id=lead.user_id,
            contact_name=lead.contact_name,
            contact_email=lead.contact_email,
            contact_phone=lead.contact_phone,
            message=lead.message,
            status=lead.status,
            source=lead.source,
            utm_source=lead.utm_source,
            utm_medium=lead.utm_medium,
            utm_campaign=lead.utm_campaign,
            preferred_contact_time=lead.preferred_contact_time,
            notes=lead.notes,
            follow_up_date=lead.follow_up_date,
            created_at=lead.created_at,
            updated_at=lead.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating lead: {str(e)}")


@router.post("/leads/{lead_id}/notes", 
            response_model=LeadNoteResponse, 
            status_code=status.HTTP_201_CREATED,
            summary="Agregar nota al lead")
async def add_lead_note(
    lead_id: str,
    note_data: LeadNoteRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Agregar nota al lead"""
    try:
        service = InteractionService(db)
        user_id = str(current_user.get("user_id", current_user.get("id")))
        note = service.add_lead_note(lead_id, user_id, note_data)
        
        if not note:
            raise HTTPException(status_code=404, detail="Lead not found")
        
        return LeadNoteResponse(
            id=note.id,
            lead_id=note.lead_id,
            user_id=note.user_id,
            content=note.content,
            created_at=note.created_at,
            user={"name": "Usuario Actual"}  # Placeholder
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error adding note: {str(e)}")


# =================== REVIEWS ===================

@router.get("/reviews", response_model=PaginatedReviews, summary="Obtener reseñas")
async def get_reviews(
    listing_id: Optional[str] = Query(None, description="Filtrar por propiedad"),
    agent_id: Optional[str] = Query(None, description="Filtrar por agente"),
    agency_id: Optional[str] = Query(None, description="Filtrar por agencia"),
    page: int = Query(1, ge=1, description="Número de página"),
    limit: int = Query(20, ge=1, le=100, description="Elementos por página"),
    db: Session = Depends(get_db)
):
    """Obtener reseñas"""
    try:
        service = InteractionService(db)
        reviews, total = service.get_reviews(listing_id, agent_id, agency_id, page, limit)
        
        pages = (total + limit - 1) // limit
        
        reviews_response = []
        for review in reviews:
            review_data = service.get_review_with_user(review)
            reviews_response.append(ReviewDetailResponse(**review_data))
        
        return PaginatedReviews(
            data=reviews_response,
            total=total,
            page=page,
            limit=limit,
            pages=pages,
            has_next=page < pages,
            has_prev=page > 1
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting reviews: {str(e)}")


@router.post("/reviews", 
            response_model=ReviewResponse, 
            status_code=status.HTTP_201_CREATED,
            summary="Crear reseña")
async def create_review(
    review_data: CreateReviewRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Crear reseña"""
    try:
        service = InteractionService(db)
        user_id = str(current_user.get("user_id", current_user.get("id")))
        review = service.create_review(review_data, user_id)
        
        return ReviewResponse(
            id=review.id,
            user_id=review.user_id,
            target_type=review.target_type,
            target_id=review.target_id,
            rating=review.rating,
            comment=review.comment,
            status=review.status,
            helpful_count=review.helpful_count,
            created_at=review.created_at,
            updated_at=review.updated_at
        )
        
    except BusinessLogicError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating review: {str(e)}")


@router.put("/reviews/{review_id}", response_model=ReviewResponse, summary="Actualizar reseña")
async def update_review(
    review_id: str,
    update_data: UpdateReviewRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Actualizar reseña"""
    try:
        service = InteractionService(db)
        user_id = str(current_user.get("user_id", current_user.get("id")))
        review = service.update_review(review_id, user_id, update_data)
        
        if not review:
            raise HTTPException(status_code=404, detail="Review not found")
        
        return ReviewResponse(
            id=review.id,
            user_id=review.user_id,
            target_type=review.target_type,
            target_id=review.target_id,
            rating=review.rating,
            comment=review.comment,
            status=review.status,
            helpful_count=review.helpful_count,
            created_at=review.created_at,
            updated_at=review.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating review: {str(e)}")


@router.delete("/reviews/{review_id}", summary="Eliminar reseña")
async def delete_review(
    review_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Eliminar reseña"""
    try:
        service = InteractionService(db)
        user_id = str(current_user.get("user_id", current_user.get("id")))
        success = service.delete_review(review_id, user_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Review not found")
        
        return {"message": "Review deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting review: {str(e)}")
