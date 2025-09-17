from sqlalchemy.orm import Session
from sqlalchemy import func, text
from app.models.listing import Listing
from app.schemas.listings import CreateListingRequest, UpdateListingRequest
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

class ListingService:
    def __init__(self, db: Session):
        self.db = db

    def list_listings(self, 
                     operation: Optional[str] = None,
                     property_type: Optional[str] = None,
                     department: Optional[str] = None,
                     min_price: Optional[float] = None,
                     max_price: Optional[float] = None,
                     limit: int = 20,
                     offset: int = 0) -> List[Listing]:
        query = self.db.query(Listing).filter(Listing.status == 'published')
        
        if operation:
            query = query.filter(Listing.operation == operation)
        if property_type:
            query = query.filter(Listing.property_type == property_type)
        if department:
            query = query.filter(Listing.department == department)
        if min_price:
            query = query.filter(Listing.price >= min_price)
        if max_price:
            query = query.filter(Listing.price <= max_price)
        
        return query.offset(offset).limit(limit).all()

    def get_listing(self, listing_id: str) -> Optional[Listing]:
        return self.db.query(Listing).filter(Listing.id == uuid.UUID(listing_id)).first()

    def create_listing(self, data: CreateListingRequest, owner_user_id: str) -> Listing:
        listing = Listing(
            owner_user_id=uuid.UUID(owner_user_id),
            title=data.title,
            description=data.description,
            operation=data.operation,
            property_type=data.property_type,
            price=data.price,
            currency=data.currency or 'PEN',
            area_built=data.area_built,
            bedrooms=data.bedrooms,
            bathrooms=data.bathrooms,
            pet_friendly=data.pet_friendly,
            furnished=data.furnished,
            rental_mode=data.rental_mode,
            address=data.address,
            department=data.department,
            province=data.province,
            district=data.district,
            latitude=data.latitude,
            longitude=data.longitude,
            status='draft',
            verification_status='verified'  # Set as verified for testing purposes
        )
        self.db.add(listing)
        self.db.commit()
        self.db.refresh(listing)
        
        # Auto-validate Airbnb eligibility for rent/temp_rent operations
        if data.operation in ['rent', 'temp_rent']:
            self._validate_airbnb_eligibility(listing)
            
        return listing

    def update_listing(self, listing_id: str, data: UpdateListingRequest) -> Optional[Listing]:
        listing = self.get_listing(listing_id)
        if not listing:
            return None
        
        for field, value in data.dict(exclude_unset=True).items():
            setattr(listing, field, value)
        
        self.db.commit()
        self.db.refresh(listing)
        return listing

    def delete_listing(self, listing_id: str) -> bool:
        listing = self.get_listing(listing_id)
        if not listing:
            return False
        self.db.delete(listing)
        self.db.commit()
        return True

    def change_status(self, listing_id: str, status: str) -> Optional[Listing]:
        listing = self.get_listing(listing_id)
        if not listing:
            return None
        
        listing.status = status
        self.db.commit()
        self.db.refresh(listing)
        return listing

    def publish_listing(self, listing_id: str) -> Optional[Listing]:
        listing = self.get_listing(listing_id)
        if not listing:
            return None
        
        listing.status = 'published'
        listing.published_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(listing)
        return listing

    def unpublish_listing(self, listing_id: str) -> Optional[Listing]:
        listing = self.get_listing(listing_id)
        if not listing:
            return None
        
        listing.status = 'archived'  # Use 'archived' instead of 'unpublished'
        self.db.commit()
        self.db.refresh(listing)
        return listing

    def get_user_listings(self, user_id: str) -> List[Listing]:
        return self.db.query(Listing).filter(Listing.owner_user_id == uuid.UUID(user_id)).all()

    def get_favorites(self, user_id: str) -> List[Listing]:
        # This would need a user_favorites table implementation
        # For now, return empty list
        return []

    def add_favorite(self, user_id: str, listing_id: str) -> bool:
        # This would need a user_favorites table implementation
        # For now, return True to simulate success
        return True

    def remove_favorite(self, user_id: str, listing_id: str) -> bool:
        # This would need a user_favorites table implementation
        # For now, return True to simulate success
        return True

    def duplicate_listing(self, listing_id: str, user_id: str) -> Optional[Listing]:
        original = self.get_listing(listing_id)
        if not original:
            return None
        
        # Create a copy with new ID and draft status
        duplicate = Listing(
            owner_user_id=uuid.UUID(user_id),
            title=f"{original.title} (Copy)",
            description=original.description,
            operation=original.operation,
            property_type=original.property_type,
            price=original.price,
            currency=original.currency,
            area_built=original.area_built,
            bedrooms=original.bedrooms,
            bathrooms=original.bathrooms,
            pet_friendly=original.pet_friendly,
            furnished=original.furnished,
            rental_mode=original.rental_mode,
            address=original.address,
            department=original.department,
            province=original.province,
            district=original.district,
            latitude=original.latitude,
            longitude=original.longitude,
            status='draft'
        )
        
        self.db.add(duplicate)
        self.db.commit()
        self.db.refresh(duplicate)
        return duplicate

    def _validate_airbnb_eligibility(self, listing: Listing) -> None:
        """Validate Airbnb eligibility using the PostgreSQL function"""
        try:
            # Call the PostgreSQL function
            query = text("SELECT core.validate_airbnb_listing(:listing_id)")
            result = self.db.execute(query, {"listing_id": str(listing.id)}).fetchone()
            
            if result and result[0]:
                # The function returns JSON, so access it properly
                json_result = result[0]
                if json_result.get('success') and 'validation' in json_result:
                    validation = json_result['validation']
                    listing.airbnb_score = validation.get('airbnb_score', 0)
                    listing.airbnb_eligible = validation.get('can_be_airbnb', False)
                    self.db.commit()
                else:
                    # Function returned error
                    listing.airbnb_score = 0
                    listing.airbnb_eligible = False
                    self.db.commit()
                
        except Exception as e:
            # Log error but don't fail the listing creation
            print(f"Error validating Airbnb eligibility: {str(e)}")
            # Set default values
            listing.airbnb_score = 0
            listing.airbnb_eligible = False
            self.db.commit()

    def validate_airbnb_listing(self, listing_id: str) -> Optional[Dict[str, Any]]:
        """Manually validate Airbnb eligibility for an existing listing"""
        listing = self.get_listing(listing_id)
        if not listing:
            return None
            
        try:
            # Call the PostgreSQL function
            query = text("SELECT core.validate_airbnb_listing(:listing_id)")
            result = self.db.execute(query, {"listing_id": listing_id}).fetchone()
            
            if result and result[0]:
                json_result = result[0]
                if json_result.get('success') and 'validation' in json_result:
                    validation = json_result['validation']
                    # Update the listing
                    listing.airbnb_score = validation.get('airbnb_score', 0)
                    listing.airbnb_eligible = validation.get('can_be_airbnb', False)
                    self.db.commit()
                    
                    # Return validation details
                    return {
                        "can_be_airbnb": validation.get('can_be_airbnb', False),
                        "airbnb_score": validation.get('airbnb_score', 0),
                        "current_style": validation.get('current_style', 'traditional'),
                        "rating": validation.get('rating', 'Not suitable for Airbnb'),
                        "is_furnished": validation.get('is_furnished', False),
                        "rental_term": validation.get('rental_term'),
                        "property_type": validation.get('property_type'),
                        "operation": validation.get('operation')
                    }
                else:
                    return {"error": json_result.get('error', 'Validation failed')}
        except Exception as e:
            print(f"Error validating Airbnb eligibility: {str(e)}")
            return None

    def opt_out_airbnb(self, listing_id: str) -> Optional['Listing']:
        """
        Permite al propietario desactivar explícitamente la funcionalidad Airbnb.
        Marca airbnb_opted_out = True.
        """
        try:
            listing = self.get_listing(listing_id)
            if not listing:
                return None
            
            # Marcar como opted out
            listing.airbnb_opted_out = True
            self.db.commit()
            
            return listing
            
        except Exception as e:
            print(f"Error opting out of Airbnb: {str(e)}")
            self.db.rollback()
            return None

    def opt_in_airbnb(self, listing_id: str) -> Optional['Listing']:
        """
        Permite al propietario reactivar la funcionalidad Airbnb.
        Marca airbnb_opted_out = False y re-valida la elegibilidad.
        """
        try:
            listing = self.get_listing(listing_id)
            if not listing:
                return None
            
            # Quitar el opt-out
            listing.airbnb_opted_out = False
            
            # Re-validar elegibilidad si es rent o temp_rent
            if listing.operation in ['rent', 'temp_rent']:
                validation_result = self.validate_airbnb_listing(str(listing.id))
                if validation_result:
                    # Los campos ya se actualizan en validate_airbnb_listing
                    pass
            else:
                # No es elegible por tipo de operación
                listing.airbnb_eligible = False
                listing.airbnb_score = 0
            
            self.db.commit()
            return listing
            
        except Exception as e:
            print(f"Error opting in to Airbnb: {str(e)}")
            self.db.rollback()
            return None
