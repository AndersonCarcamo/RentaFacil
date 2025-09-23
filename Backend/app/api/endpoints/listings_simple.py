from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from typing import List, Dict, Any
import json

router = APIRouter()

@router.get("/", summary="Listar propiedades (simple)")
async def list_listings_simple(db: Session = Depends(get_db)):
    """
    Endpoint simple para listar propiedades publicadas.
    Evita problemas de importación de modelos complejos.
    """
    try:
        # Consulta SQL directa para evitar problemas con modelos ORM
        query = text("""
            SELECT 
                id::text as id,
                title,
                description,
                operation,
                property_type,
                price,
                currency,
                area_built,
                area_total,
                bedrooms,
                bathrooms,
                parking_spots,
                pet_friendly,
                furnished,
                rental_mode,
                airbnb_score,
                airbnb_eligible,
                airbnb_opted_out,
                address,
                department,
                province,
                district,
                latitude,
                longitude,
                status,
                verification_status,
                owner_user_id::text as owner_user_id,
                COALESCE(agency_id::text, null) as agency_id,
                views_count,
                leads_count,
                favorites_count,
                has_media,
                created_at,
                updated_at,
                published_at
            FROM core.listings 
            WHERE status = 'published' 
                AND verification_status = 'verified'
            ORDER BY views_count DESC, created_at DESC
            LIMIT 20
        """)
        
        result = db.execute(query)
        rows = result.fetchall()
        
        # Convertir a lista de diccionarios
        listings = []
        for row in rows:
            listing_dict = dict(row._mapping)
            # Convertir valores decimales a float para JSON
            for key, value in listing_dict.items():
                if hasattr(value, '__float__'):
                    listing_dict[key] = float(value)
            listings.append(listing_dict)
        
        return listings
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing properties: {str(e)}")