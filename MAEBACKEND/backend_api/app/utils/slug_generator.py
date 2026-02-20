"""
Utilidad para generar slugs únicos para propiedades
"""
import re
import unicodedata
from typing import Optional
from sqlalchemy.orm import Session
from app.models.listing import Listing


def slugify(text: str, max_length: int = 100) -> str:
    """
    Convertir texto a slug URL-friendly.
    
    Args:
        text: Texto a convertir
        max_length: Longitud máxima del slug
        
    Returns:
        Slug generado
        
    Examples:
        >>> slugify("Departamento en Barranco con Vista al Mar")
        'departamento-en-barranco-con-vista-al-mar'
        
        >>> slugify("Casa 3 Dorm. - Miraflores")
        'casa-3-dorm-miraflores'
    """
    # Normalizar unicode (remover acentos)
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    
    # Convertir a minúsculas
    text = text.lower()
    
    # Remover caracteres no alfanuméricos excepto espacios y guiones
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    
    # Reemplazar espacios y guiones múltiples con un solo guión
    text = re.sub(r'[-\s]+', '-', text)
    
    # Remover guiones al inicio y final
    text = text.strip('-')
    
    # Limitar longitud
    text = text[:max_length]
    
    # Asegurar que no termina con guión después del recorte
    text = text.rstrip('-')
    
    return text


def generate_listing_slug(
    title: str,
    property_type: Optional[str] = None,
    district: Optional[str] = None,
    bedrooms: Optional[int] = None
) -> str:
    """
    Generar slug base para una propiedad.
    
    Args:
        title: Título de la propiedad
        property_type: Tipo de propiedad (apartment, house, etc.)
        district: Distrito
        bedrooms: Número de dormitorios
        
    Returns:
        Slug base generado
        
    Examples:
        >>> generate_listing_slug("Departamento Moderno", "apartment", "Barranco", 3)
        'apartment-barranco-3-dorm-departamento-moderno'
    """
    parts = []
    
    # Agregar tipo de propiedad
    if property_type:
        parts.append(slugify(property_type))
    
    # Agregar distrito
    if district:
        parts.append(slugify(district))
    
    # Agregar número de dormitorios
    if bedrooms:
        parts.append(f"{bedrooms}-dorm")
    
    # Agregar título (primeras palabras)
    title_slug = slugify(title, max_length=50)
    if title_slug:
        parts.append(title_slug)
    
    # Unir todas las partes
    base_slug = '-'.join(parts)
    
    # Limitar longitud total
    return slugify(base_slug, max_length=100)


def ensure_unique_slug(db: Session, base_slug: str, listing_id: Optional[str] = None) -> str:
    """
    Asegurar que el slug es único en la base de datos.
    Si ya existe, agregar contador al final.
    
    Args:
        db: Sesión de base de datos
        base_slug: Slug base a verificar
        listing_id: ID del listing actual (para excluir en la búsqueda)
        
    Returns:
        Slug único
        
    Examples:
        Si 'apartment-barranco' ya existe, retornará 'apartment-barranco-1'
    """
    slug = base_slug
    counter = 1
    
    while True:
        # Verificar si el slug ya existe
        query = db.query(Listing).filter(Listing.slug == slug)
        
        # Excluir el listing actual si estamos actualizando
        if listing_id:
            query = query.filter(Listing.id != listing_id)
        
        exists = query.first() is not None
        
        if not exists:
            return slug
        
        # Si existe, agregar contador
        slug = f"{base_slug}-{counter}"
        counter += 1
        
        # Limitar longitud después de agregar contador
        slug = slug[:100]
        
        # Prevenir loop infinito
        if counter > 1000:
            # Agregar UUID corto como fallback
            import uuid
            unique_suffix = str(uuid.uuid4())[:8]
            return f"{base_slug[:90]}-{unique_suffix}"


def generate_and_save_slug(db: Session, listing: Listing) -> str:
    """
    Generar y guardar slug para un listing.
    
    Args:
        db: Sesión de base de datos
        listing: Objeto Listing
        
    Returns:
        Slug generado y guardado
    """
    # Generar slug base
    base_slug = generate_listing_slug(
        title=listing.title,
        property_type=listing.property_type,
        district=listing.district,
        bedrooms=listing.bedrooms
    )
    
    # Asegurar unicidad
    unique_slug = ensure_unique_slug(db, base_slug, str(listing.id))
    
    # Guardar en el listing
    listing.slug = unique_slug
    db.commit()
    db.refresh(listing)
    
    return unique_slug


def regenerate_all_slugs(db: Session, force: bool = False):
    """
    Regenerar slugs para todas las propiedades.
    
    Args:
        db: Sesión de base de datos
        force: Si es True, regenera incluso si ya tiene slug
        
    Returns:
        Cantidad de slugs generados
    """
    if force:
        listings = db.query(Listing).all()
    else:
        listings = db.query(Listing).filter(
            (Listing.slug == None) | (Listing.slug == '')
        ).all()
    
    count = 0
    for listing in listings:
        try:
            generate_and_save_slug(db, listing)
            count += 1
            print(f"✓ Generated slug for: {listing.title} → {listing.slug}")
        except Exception as e:
            print(f"✗ Error generating slug for {listing.title}: {str(e)}")
    
    return count
