/**
 * @file searchParamsMapper.ts
 * @description Utilities for mapping search parameters to API filters
 */

import type { PropertyFilters } from '@/lib/api/properties';

/**
 * Maps URL search parameters to PropertyFilters format expected by the API
 * 
 * Handles both GPS-based searches (lat/lng/radius) and text-based searches.
 * Converts frontend property types, rental modes, and age ranges to backend format.
 * 
 * @param params - URL search parameters from router.query
 * @returns PropertyFilters object ready for API consumption
 * 
 * @example
 * ```ts
 * const filters = mapSearchParamsToFilters({
 *   lat: '-12.0464',
 *   lng: '-77.0428',
 *   radius: '5',
 *   propertyType: 'apartment',
 *   minPrice: '1000'
 * });
 * // Returns: { lat: -12.0464, lng: -77.0428, radius: 5, property_type: 'apartment', min_price: 1000, ... }
 * ```
 */
export const mapSearchParamsToFilters = (params: any): PropertyFilters => {
  const filters: PropertyFilters = {}
  
  // ✨ GPS-based search: Latitude, Longitude, and Radius
  if (params.lat && params.lng) {
    filters.lat = Number(params.lat)
    filters.lng = Number(params.lng)
    filters.radius = params.radius ? Number(params.radius) : 5 // Default: 5km radius
    console.log('🎯 GPS location search:', {
      lat: filters.lat,
      lng: filters.lng,
      radius: filters.radius
    })
  }
  // Text-based search: Location name
  else if (params.location) {
    filters.q = params.location // General text search
    filters.location = params.location // Location filter
  }
  
  // Operation: rent or sale
  if (params.mode) {
    filters.operation = params.mode === 'alquiler' ? 'rent' : 
                      params.mode === 'comprar' ? 'sale' : 
                      params.mode === 'vender' ? 'sale' : 'rent'
  }
  
  // Property type mapping (frontend → backend)
  if (params.propertyType) {
    const propertyTypeMap: { [key: string]: string } = {
      'TipoAirbnb': 'room', // Map custom type to room
      'apartment': 'apartment',
      'house': 'house',
      'studio': 'studio',
      'room': 'room',
      'office': 'office',
      'commercial': 'commercial',
      'land': 'land',
      'warehouse': 'warehouse',
      'garage': 'garage',
      'other': 'other'
    }
    filters.property_type = propertyTypeMap[params.propertyType] || params.propertyType
  }
  
  // Price range
  if (params.minPrice) {
    filters.min_price = Number(params.minPrice)
  }
  if (params.maxPrice) {
    filters.max_price = Number(params.maxPrice)
  }
  
  // Minimum bedrooms and bathrooms
  if (params.bedrooms) {
    filters.min_bedrooms = Number(params.bedrooms)
  }
  if (params.bathrooms) {
    filters.min_bathrooms = Number(params.bathrooms)
  }
  
  // Area range (built area in m²)
  if (params.minArea) {
    filters.min_area_built = Number(params.minArea)
  }
  if (params.maxArea) {
    filters.max_area_built = Number(params.maxArea)
  }
  
  // Property age in years
  if (params.ageYears) {
    switch (params.ageYears) {
      case 'new':
        filters.max_age_years = 0
        break
      case '0-5':
        filters.min_age_years = 0
        filters.max_age_years = 5
        break
      case '5-10':
        filters.min_age_years = 5
        filters.max_age_years = 10
        break
      case '10-20':
        filters.min_age_years = 10
        filters.max_age_years = 20
        break
      case '20+':
        filters.min_age_years = 20
        break
    }
  }
  
  // Boolean filters
  if (params.furnished !== undefined) {
    filters.furnished = params.furnished
  }
  if (params.verified !== undefined) {
    // Note: 'verified' not directly supported, using 'has_media' as proxy
    filters.has_media = params.verified
  }
  if (params.petFriendly !== undefined) {
    filters.pet_friendly = params.petFriendly
  }
  
  // Rental mode mapping
  if (params.rentalMode) {
    switch (params.rentalMode) {
      case 'traditional':
        filters.rental_mode = 'full_property'
        break
      case 'shared':
        filters.rental_mode = 'shared_room'
        break
      case 'coliving':
      case 'private':
        filters.rental_mode = 'private_room'
        break
      case 'airbnb':
        filters.airbnb_eligible = true
        break
    }
  }
  
  // Default pagination and sorting
  filters.page = 1
  filters.limit = 20
  filters.sort_by = 'published_at'
  filters.sort_order = 'desc'
  
  return filters
}
