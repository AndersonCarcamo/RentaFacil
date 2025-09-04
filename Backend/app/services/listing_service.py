from sqlalchemy.orm import Session
from app.models.listing import Listing, ListingStatus, OperationType, PropertyType
from app.schemas.listings import CreateListingRequest, UpdateListingRequest
from typing import List, Optional
import uuid
from sqlalchemy.sql import func

class ListingService:
    def __init__(self, db: Session):
        self.db = db

    def list_listings(self, filters: dict = None) -> List[Listing]:
        query = self.db.query(Listing).filter(Listing.deleted_at.is_(None))
        if filters:
            for key, value in filters.items():
                if hasattr(Listing, key) and value is not None:
                    query = query.filter(getattr(Listing, key) == value)
        return query.all()

    def get_listing(self, listing_id: str) -> Optional[Listing]:
        return self.db.query(Listing).filter(Listing.id == uuid.UUID(listing_id), Listing.deleted_at.is_(None)).first()

    def create_listing(self, data: CreateListingRequest, owner_id: str) -> Listing:
        listing = Listing(
            title=data.title,
            description=data.description,
            operation_type=data.operation_type,
            property_type=data.property_type,
            price=data.price,
            area=data.area,
            address=data.address,
            city=data.city,
            district=data.district,
            bedrooms=data.bedrooms,
            bathrooms=data.bathrooms,
            age_years=data.age_years,
            features=','.join(data.features) if data.features else None,
            amenities=','.join(data.amenities) if data.amenities else None,
            owner_id=uuid.UUID(owner_id),
            status=ListingStatus.DRAFT
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
            if field in ['features', 'amenities'] and value:
                value = ','.join(value)
            setattr(listing, field, value)
        self.db.commit()
        self.db.refresh(listing)
        return listing

    def delete_listing(self, listing_id: str) -> bool:
        listing = self.get_listing(listing_id)
        if not listing:
            return False
        listing.deleted_at = func.now()
        self.db.commit()
        return True

    def change_status(self, listing_id: str, status: ListingStatus) -> Optional[Listing]:
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
        listing.status = ListingStatus.PUBLISHED
        listing.published_at = func.now()
        self.db.commit()
        self.db.refresh(listing)
        return listing

    def unpublish_listing(self, listing_id: str) -> Optional[Listing]:
        listing = self.get_listing(listing_id)
        if not listing:
            return None
        listing.status = ListingStatus.UNPUBLISHED
        self.db.commit()
        self.db.refresh(listing)
        return listing

    def duplicate_listing(self, listing_id: str) -> Optional[Listing]:
        original = self.get_listing(listing_id)
        if not original:
            return None
        new_listing = Listing(
            title=original.title + " (Duplicado)",
            description=original.description,
            operation_type=original.operation_type,
            property_type=original.property_type,
            price=original.price,
            area=original.area,
            address=original.address,
            city=original.city,
            district=original.district,
            bedrooms=original.bedrooms,
            bathrooms=original.bathrooms,
            age_years=original.age_years,
            features=original.features,
            amenities=original.amenities,
            owner_id=original.owner_id,
            status=ListingStatus.DRAFT
        )
        self.db.add(new_listing)
        self.db.commit()
        self.db.refresh(new_listing)
        return new_listing

    def list_my_listings(self, owner_id: str, status: Optional[str] = None) -> List[Listing]:
        query = self.db.query(Listing).filter(Listing.owner_id == uuid.UUID(owner_id), Listing.deleted_at.is_(None))
        if status:
            query = query.filter(Listing.status == status)
        return query.all()
