import { Property, Currency, PropertyType } from '@/types';
import { PropertyResponse } from '@/lib/api/properties';

/**
 * Obtiene las URLs de las imágenes de una propiedad desde la API
 */
export const getPropertyImageUrls = (apiProperty: PropertyResponse): string[] => {
  if (apiProperty.images && apiProperty.images.length > 0) {
    // Ordenar por is_main primero, luego por display_order
    const sortedImages = [...apiProperty.images].sort((a, b) => {
      if (a.is_main && !b.is_main) return -1;
      if (!a.is_main && b.is_main) return 1;
      return (a.display_order || 0) - (b.display_order || 0);
    });
    
    // Construir las URLs completas
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return sortedImages.map(img => {
      const imageUrl = img.medium_url || img.original_url || img.url;
      return imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`;
    });
  }
  
  // Si no hay imágenes, retornar placeholder
  return ['/images/properties/property-placeholder.svg'];
};

/**
 * Convierte PropertyResponse de la API a Property del frontend
 */
export const convertToProperty = (apiProperty: PropertyResponse): Property => {
  // Mapear currency de string a Currency type
  const currency: Currency = (apiProperty.currency === 'USD' || apiProperty.currency === 'PEN') 
    ? apiProperty.currency as Currency 
    : 'PEN';
  
  // Mapear property_type de string a PropertyType
  const propertyTypeMap: { [key: string]: PropertyType } = {
    'apartment': 'apartment',
    'house': 'house', 
    'studio': 'studio',
    'office': 'office',
    'room': 'room',
    'TipoAirbnb': 'room'
  };
  const propertyType = propertyTypeMap[apiProperty.property_type] || undefined;
  
  return {
    id: apiProperty.id,
    title: apiProperty.title,
    description: apiProperty.description || 'Propiedad disponible',
    price: Number(apiProperty.price),
    currency,
    location: `${apiProperty.district || ''}, ${apiProperty.department || ''}`.replace(/^,\s*/, ''),
    propertyType,
    bedrooms: apiProperty.bedrooms || 0,
    bathrooms: apiProperty.bathrooms || 0,
    area: Number(apiProperty.area_built || apiProperty.area_total || 0),
    images: getPropertyImageUrls(apiProperty),
    amenities: [
      ...(apiProperty.furnished ? ['Amoblado'] : []),
      ...(apiProperty.parking_spots ? [`${apiProperty.parking_spots} estacionamiento(s)`] : []),
      ...(apiProperty.pet_friendly ? ['Pet Friendly'] : []),
      ...(apiProperty.is_airbnb_available ? ['Apto Airbnb'] : [])
    ],
    rating: 4.5,
    reviews: 0,
    isFavorite: false,
    isVerified: apiProperty.verification_status === 'verified',
    furnished: apiProperty.furnished || false,
    petFriendly: apiProperty.pet_friendly || false,
    availableFrom: new Date().toISOString(),
    views: apiProperty.views_count || 0
  };
};
