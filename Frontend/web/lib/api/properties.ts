// API utilities for properties/listings
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface PropertyFilters {
  operation_type?: 'rent' | 'sale'
  property_type?: string
  city?: string
  district?: string
  min_price?: number
  max_price?: number
  bedrooms?: number
  bathrooms?: number
  min_area?: number
  max_area?: number
  min_age_years?: number
  max_age_years?: number
  verified?: boolean
  furnished?: boolean
  rental_mode?: 'full_property' | 'private_room' | 'shared_room'
  sort?: string
  page?: number
  limit?: number
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
}

/**
 * Fetch properties with optional filters
 */
export async function fetchProperties(filters?: PropertyFilters): Promise<PropertyResponse[]> {
  try {
    const url = new URL(`${API_BASE_URL}/v1/listings/`)
    
    // Add filters as query parameters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString())
        }
      })
    }
    
    console.log('🔍 Fetching properties from:', url.toString())
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
    console.log('✅ Properties received:', data.length)
    console.log('✅ First property sample:', data[0] ? {
      id: data[0].id,
      title: data[0].title,
      status: data[0].status
    } : 'No properties')
    return data as PropertyResponse[]
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