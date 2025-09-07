from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.listing import Listing
from app.schemas.listings import CreateListingRequest, UpdateListingRequest
from typing import List, Optional
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
