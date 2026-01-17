import { apiService } from './apiService';

// API utilities for properties/listings
export interface PropertyFilters {
  q?: string; // Búsqueda por texto
  location?: string;
  department?: string;
  province?: string;
  district?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  operation?: 'sale' | 'rent' | 'temp_rent' | 'auction' | 'exchange';
  property_type?: string;
  advertiser_type?: string;
  min_price?: number;
  max_price?: number;
  currency?: string;
  min_bedrooms?: number;
  max_bedrooms?: number;
  min_bathrooms?: number;
  max_bathrooms?: number;
  min_area_built?: number;
  max_area_built?: number;
  min_area_total?: number;
  max_area_total?: number;
  min_parking_spots?: number;
  rental_term?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  min_age_years?: number;
  max_age_years?: number;
  has_media?: boolean;
  pet_friendly?: boolean;
  furnished?: boolean;
  rental_mode?: 'full_property' | 'private_room' | 'shared_room';
  rental_model?: 'traditional' | 'airbnb';
  airbnb_eligible?: boolean;
  min_airbnb_score?: number;
  amenities?: string[];
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PropertyResponse {
  id: string;
  title: string;
  description?: string;
  operation: string;
  property_type: string;
  price: number;
  currency: string;
  area_built?: number;
  area_total?: number;
  bedrooms?: number;
  bathrooms?: number;
  parking_spots?: number;
  pet_friendly?: boolean;
  furnished?: boolean;
  rental_mode?: string;
  rental_term?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  rental_model?: 'traditional' | 'airbnb';
  airbnb_score?: number;
  airbnb_eligible?: boolean;
  airbnb_opted_out?: boolean;
  is_airbnb_available?: boolean;
  address?: string;
  department?: string;
  province?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  status: string;
  verification_status: string;
  owner_user_id: string;
  agency_id?: string;
  views_count: number;
  leads_count: number;
  favorites_count: number;
  has_media: boolean;
  created_at: string;
  updated_at: string;
  published_at?: string;
  amenities?: string[];
  age_years?: number;
  floor_number?: number;
  total_floors?: number;
  maintenance_fee?: number;
  hoa_fee?: number;
  utilities_included?: boolean;
  contact_whatsapp_phone_e164?: string;
  contact_phone_e164?: string;
  contact_email?: string;
  contact_name?: string;
  images?: Array<{
    url: string;
    thumbnail_url?: string;
    order: number;
  }>;
}

/**
 * Fetch properties with optional filters using the search endpoint
 */
export async function fetchProperties(filters?: PropertyFilters): Promise<PropertyResponse[]> {
  try {
    console.log('🔍 Fetching properties with filters:', filters);
    
    // Build query params
    const params: any = {};
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            // For arrays, join with commas or send multiple times
            params[key] = value.join(',');
          } else {
            params[key] = value;
          }
        }
      });
    }
    
    const response = await apiService.get<any>('/search', params);
    
    // El endpoint de search puede retornar un objeto con propiedades en 'data'
    const properties = response.data || response.results || response.listings || response;
    console.log('✅ Search results received:', Array.isArray(properties) ? properties.length : 0);
    
    if (!Array.isArray(properties)) {
      console.warn('⚠️ Unexpected response format:', response);
      return [];
    }
    
    return properties as PropertyResponse[];
  } catch (error) {
    console.error('💥 Error fetching properties:', error);
    throw error;
  }
}

/**
 * Fetch a single property by ID
 */
export async function fetchProperty(id: string): Promise<PropertyResponse> {
  try {
    const response = await apiService.get<PropertyResponse>(`/listings/${id}`);
    return response;
  } catch (error) {
    console.error('Error fetching property:', error);
    throw error;
  }
}

/**
 * Get search suggestions for autocompletion
 */
export async function getSearchSuggestions(query: string, type?: string): Promise<string[]> {
  try {
    const params: any = { q: query };
    if (type) {
      params.type = type;
    }
    
    const response = await apiService.get<any>('/search/suggestions', params);
    return response.suggestions || [];
  } catch (error) {
    console.error('Error fetching search suggestions:', error);
    return [];
  }
}

/**
 * Format price with currency
 */
export function formatPrice(price: number, currency: string = 'PEN'): string {
  const currencySymbol = currency === 'USD' ? '$' : 'S/';
  return `${currencySymbol} ${price.toLocaleString('es-PE')}`;
}

/**
 * Get property type label in Spanish
 */
export function getPropertyTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    apartment: 'Departamento',
    house: 'Casa',
    office: 'Oficina',
    land: 'Terreno',
    commercial: 'Local Comercial',
    warehouse: 'Almacén',
    room: 'Habitación',
    studio: 'Estudio',
  };
  return typeMap[type] || type;
}

/**
 * Get operation label in Spanish
 */
export function getOperationLabel(operation: string): string {
  const operationMap: Record<string, string> = {
    rent: 'Alquiler',
    sale: 'Venta',
    temp_rent: 'Alquiler Temporal',
  };
  return operationMap[operation] || operation;
}
