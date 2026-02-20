"""
Airbnb Validation Endpoint for FastAPI
Add this to your FastAPI app to validate Airbnb eligibility
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any, Optional
import uuid
from pydantic import BaseModel
from app.core.database import get_db
from app.api.deps import get_current_user

router = APIRouter(prefix="/listings", tags=["listings"])

class AirbnbValidationResponse(BaseModel):
    success: bool
    listing_id: str
    validation: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    timestamp: str

class AirbnbSearchFilters(BaseModel):
    style: Optional[str] = None  # 'airbnb', 'traditional', etc.
    can_be_airbnb: Optional[bool] = None
    min_score: Optional[int] = None
    district: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    property_type: Optional[str] = None
    limit: Optional[int] = 20

@router.get("/validate-airbnb/{listing_id}", response_model=AirbnbValidationResponse)
async def validate_airbnb_listing(
    listing_id: str,
    db: Session = Depends(get_db)
):
    """
    Validate if a listing can be used as Airbnb-style rental.
    
    Returns detailed analysis including:
    - Can be Airbnb (boolean)
    - Airbnb score (0-100)
    - Missing requirements
    - Suggestions for improvement
    - Current rental style classification
    """
    try:
        # Validate UUID format
        listing_uuid = uuid.UUID(listing_id)
        
        # Call the PostgreSQL function
        result = db.execute(
            text("SELECT core.validate_airbnb_listing(:listing_id)"),
            {"listing_id": str(listing_uuid)}
        ).scalar()
        
        if result is None:
            raise HTTPException(status_code=404, detail="Listing not found")
            
        return AirbnbValidationResponse(**result)
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid listing ID format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation failed: {str(e)}")

@router.post("/search-airbnb")
async def search_airbnb_properties(
    filters: AirbnbSearchFilters,
    db: Session = Depends(get_db)
):
    """
    Search properties with Airbnb-specific filters.
    
    Allows filtering by:
    - Rental style (airbnb, traditional, etc.)
    - Airbnb eligibility
    - Minimum Airbnb score
    - Standard filters (location, price, type)
    """
    try:
        query = text("""
            SELECT * FROM core.search_airbnb_properties(
                :style, :can_be_airbnb, :min_score, :district,
                :min_price, :max_price, :property_type, :limit
            )
        """)
        
        result = db.execute(query, {
            "style": filters.style,
            "can_be_airbnb": filters.can_be_airbnb,
            "min_score": filters.min_score,
            "district": filters.district,
            "min_price": filters.min_price,
            "max_price": filters.max_price,
            "property_type": filters.property_type,
            "limit": filters.limit
        }).fetchall()
        
        # Convert to list of dictionaries
        properties = []
        for row in result:
            properties.append({
                "id": str(row.id),
                "created_at": row.created_at.isoformat(),
                "title": row.title,
                "price": float(row.price),
                "property_type": row.property_type,
                "district": row.district,
                "rental_style": row.rental_style,
                "can_be_airbnb": row.can_be_airbnb,
                "airbnb_score": row.airbnb_score
            })
        
        return {
            "success": True,
            "total_results": len(properties),
            "properties": properties,
            "filters_applied": filters.dict(exclude_none=True)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.get("/airbnb-stats")
async def get_airbnb_statistics(db: Session = Depends(get_db)):
    """
    Get general statistics about Airbnb-eligible properties.
    """
    try:
        query = text("""
            SELECT 
                COUNT(*) as total_listings,
                COUNT(*) FILTER (WHERE can_be_airbnb_quick = true) as airbnb_eligible,
                COUNT(*) FILTER (WHERE rental_style = 'airbnb') as current_airbnb,
                COUNT(*) FILTER (WHERE rental_style = 'traditional') as traditional,
                COUNT(*) FILTER (WHERE furnished = true) as furnished_total,
                AVG(CASE WHEN furnished = true THEN price ELSE NULL END) as avg_furnished_price,
                AVG(CASE WHEN furnished = false THEN price ELSE NULL END) as avg_unfurnished_price
            FROM core.v_listings_airbnb_analysis 
            WHERE status = 'published'
        """)
        
        result = db.execute(query).fetchone()
        
        return {
            "success": True,
            "statistics": {
                "total_listings": result.total_listings,
                "airbnb_eligible": result.airbnb_eligible,
                "current_airbnb_style": result.current_airbnb,
                "traditional_style": result.traditional,
                "furnished_properties": result.furnished_total,
                "eligibility_rate": round((result.airbnb_eligible / result.total_listings) * 100, 2) if result.total_listings > 0 else 0,
                "pricing": {
                    "avg_furnished_price": float(result.avg_furnished_price or 0),
                    "avg_unfurnished_price": float(result.avg_unfurnished_price or 0),
                    "furnished_premium": round(
                        ((result.avg_furnished_price - result.avg_unfurnished_price) / result.avg_unfurnished_price) * 100, 2
                    ) if result.avg_unfurnished_price and result.avg_furnished_price else 0
                }
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stats failed: {str(e)}")

# Usage examples in your main app:
"""
from fastapi import FastAPI
from .endpoints import airbnb_validation

app = FastAPI()
app.include_router(airbnb_validation.router)

# Then you can call:
# GET /listings/validate-airbnb/{listing_id}
# POST /listings/search-airbnb
# GET /listings/airbnb-stats
"""
