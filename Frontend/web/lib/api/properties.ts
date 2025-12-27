// API utilities for properties/listings
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface PropertyFilters {
  q?: string // Búsqueda por texto
  location?: string
  department?: string
  province?: string
  district?: string
  lat?: number
  lng?: number
  radius?: number
  operation?: 'sale' | 'rent' | 'temp_rent' | 'auction' | 'exchange'
  property_type?: string
  advertiser_type?: string
  min_price?: number
  max_price?: number
  currency?: string
  min_bedrooms?: number
  max_bedrooms?: number
  min_bathrooms?: number
  max_bathrooms?: number
  min_area_built?: number
  max_area_built?: number
  min_area_total?: number
  max_area_total?: number
  min_parking_spots?: number
  rental_term?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  min_age_years?: number
  max_age_years?: number
  has_media?: boolean
  pet_friendly?: boolean
  furnished?: boolean
  rental_mode?: 'full_property' | 'private_room' | 'shared_room'
  rental_model?: 'traditional' | 'airbnb'
  airbnb_eligible?: boolean
  min_airbnb_score?: number
  amenities?: string[]
  page?: number
  limit?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface PropertyResponse {
  id: string
  title: string
  description?: string
  operation: string
  property_type: string
  price: number
  currency: string
  area_built?: number
  area_total?: number
  bedrooms?: number
  bathrooms?: number
  parking_spots?: number
  pet_friendly?: boolean
  furnished?: boolean
  rental_mode?: string
  rental_term?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  rental_model?: 'traditional' | 'airbnb'
  airbnb_score?: number
  airbnb_eligible?: boolean
  airbnb_opted_out?: boolean
  is_airbnb_available?: boolean
  address?: string
  department?: string
  province?: string
  district?: string
  latitude?: number
  longitude?: number
  status: string
  verification_status: string
  owner_user_id: string
  agency_id?: string
  views_count: number
  leads_count: number
  favorites_count: number
  has_media: boolean
  created_at: string
  updated_at: string
  published_at?: string
  // Nuevos campos
  amenities?: string[]
  age_years?: number
  floor_number?: number
  total_floors?: number
  maintenance_fee?: number
  hoa_fee?: number
  utilities_included?: boolean
  contact_whatsapp_phone_e164?: string
  contact_phone_e164?: string
  contact_email?: string
  contact_name?: string
}

/**
 * Fetch properties with optional filters using the search endpoint
 */
export async function fetchProperties(filters?: PropertyFilters): Promise<PropertyResponse[]> {
  try {
    const url = new URL(`${API_BASE_URL}/v1/search`)
    
    // Add filters as query parameters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            // Handle array parameters (like amenities)
            value.forEach((item) => {
              url.searchParams.append(key, item.toString())
            })
          } else {
            url.searchParams.append(key, value.toString())
          }
        }
      })
    }
    
    console.log('🔍 Fetching properties from search endpoint:', url.toString())
    console.log('🔍 API_BASE_URL:', API_BASE_URL)
    console.log('🔍 Filters applied:', filters)
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // Add credentials if needed for CORS
      // credentials: 'include'
    })

    console.log('📡 Response status:', response.status)
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Error Response:', errorText)
      console.error('❌ Full response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: url.toString()
      })
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    // El endpoint de search retorna un objeto con propiedades en 'data'
    const properties = data.data || data.results || data.listings || data
    console.log('✅ Search results received:', properties.length)
    console.log('✅ Total results:', data.meta?.total_results || data.total || 'unknown')
    console.log('✅ Search time:', data.meta?.search_time || 'unknown')
    console.log('✅ First property sample:', properties[0] ? {
      id: properties[0].id,
      title: properties[0].title,
      status: properties[0].status
    } : 'No properties')
    
    return properties as PropertyResponse[]
  } catch (error) {
    console.error('💥 Error fetching properties:', error)
    console.error('💥 Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
}

/**
 * Fetch a single property by ID
 */
export async function fetchProperty(id: string): Promise<PropertyResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/listings/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Property not found')
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data as PropertyResponse
  } catch (error) {
    console.error('Error fetching property:', error)
    throw error
  }
}

/**
 * Get search suggestions for autocompletion
 */
export async function getSearchSuggestions(query: string, type?: string): Promise<string[]> {
  try {
    const url = new URL(`${API_BASE_URL}/v1/search/suggestions`)
    url.searchParams.append('q', query)
    if (type) {
      url.searchParams.append('type', type)
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.suggestions || []
  } catch (error) {
    console.error('Error fetching search suggestions:', error)
    return []
  }
}

/**
 * Get available filters based on current data
 */
export async function getAvailableFilters(location?: string): Promise<any> {
  try {
    const url = new URL(`${API_BASE_URL}/v1/search/filters`)
    if (location) {
      url.searchParams.append('location', location)
    }
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching available filters:', error)
    return {}
  }
}

/**
 * Example usage in a React component:
 * 
 * const [properties, setProperties] = useState<PropertyResponse[]>([])
 * const [loading, setLoading] = useState(true)
 * 
 * useEffect(() => {
 *   const loadProperties = async () => {
 *     try {
 *       const data = await fetchProperties({
 *         operation_type: 'rent',
 *         city: 'Lima',
 *         bedrooms: 2,
 *         limit: 10
 *       })
 *       setProperties(data)
 *     } catch (error) {
 *       console.error('Failed to load properties:', error)
 *     } finally {
 *       setLoading(false)
 *     }
 *   }
 *   
 *   loadProperties()
 * }, [])
 */

// Helper function to format price
export function formatPrice(price: number, currency: string = 'PEN'): string {
  const formatter = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: currency === 'PEN' ? 'PEN' : 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  return formatter.format(price)
}

// Helper function to get property type in Spanish
export function getPropertyTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    apartment: 'Departamento',
    house: 'Casa',
    office: 'Oficina',
    land: 'Terreno',
    commercial: 'Local Comercial',
    warehouse: 'Almacén',
  }
  return typeMap[type] || type
}

// Helper function to get operation type in Spanish
export function getOperationLabel(operation: string): string {
  const operationMap: Record<string, string> = {
    rent: 'Alquiler',
    sale: 'Venta',
    temp_rent: 'Alquiler Temporal',
  }
  return operationMap[operation] || operation
}