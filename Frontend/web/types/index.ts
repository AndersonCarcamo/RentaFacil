/**
 * Tipos TypeScript para la aplicación EasyRent
 * Definiciones de interfaces y tipos comunes
 */

// Tipos base
export type Currency = 'PEN' | 'USD'
export type PropertyType = 'apartment' | 'house' | 'studio' | 'office' | 'room'
export type PropertyStatus = 'available' | 'rented' | 'maintenance' | 'draft'
export type UserRole = 'tenant' | 'landlord' | 'agent' | 'admin'

// Ubicación
export interface Location {
  address: string
  district: string
  city: string
  region: string
  country: string
  coordinates?: {
    lat: number
    lng: number
  }
  zipCode?: string
}

// Usuario
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  avatar?: string
  role: UserRole
  verified: boolean
  rating?: number
  reviewsCount?: number
  joinedAt: string
  lastActive?: string
}

// Propietario/Agente
export interface Agency {
  id: string
  name: string
  description?: string
  logo?: string
  phone: string
  email: string
  website?: string
  address: string
  verified: boolean
  rating: number
  reviewsCount: number
  propertiesCount: number
  foundedYear?: number
}

// Propiedad
export interface Property {
  id: string
  title: string
  description: string
  price: number
  currency: Currency
  location: string // Para display simple
  fullLocation?: Location // Para datos completos
  propertyType?: PropertyType
  bedrooms: number
  bathrooms: number
  area: number // en m²
  images: string[]
  amenities: string[]
  features?: string[]
  rating: number
  reviews: number
  isVerified: boolean
  isFavorite: boolean
  views: number
  status?: PropertyStatus
  availableFrom?: string
  minimumStay?: number // en meses
  deposit?: number
  utilities?: {
    water: boolean
    electricity: boolean
    gas: boolean
    internet: boolean
    cable: boolean
  }
  rules?: string[]
  agency?: Agency
  owner?: User
  createdAt?: string
  updatedAt?: string
}

// Ciudad para exploración
export interface City {
  name: string
  properties: number
  image: string
  region?: string
  averagePrice?: number
}

// Filtros de búsqueda
export interface SearchFilters {
  query?: string
  location?: string
  priceMin?: number
  priceMax?: number
  bedrooms?: number[]
  bathrooms?: number[]
  propertyType?: PropertyType[]
  amenities?: string[]
  areaMin?: number
  areaMax?: number
  verified?: boolean
  availableFrom?: string
  sortBy?: 'price' | 'rating' | 'newest' | 'views' | 'area'
  sortOrder?: 'asc' | 'desc'
}

// Resultados de búsqueda
export interface SearchResult {
  properties: Property[]
  total: number
  page: number
  limit: number
  hasMore: boolean
  filters: SearchFilters
}

// Reseña
export interface Review {
  id: string
  userId: string
  user: Pick<User, 'firstName' | 'lastName' | 'avatar'>
  propertyId: string
  rating: number
  title: string
  comment: string
  pros?: string[]
  cons?: string[]
  photos?: string[]
  helpful: number
  verified: boolean
  createdAt: string
  response?: {
    text: string
    date: string
    from: 'owner' | 'agency'
  }
}

// Favoritos
export interface Favorite {
  id: string
  userId: string
  propertyId: string
  createdAt: string
  property?: Property
}

// Mensaje/Consulta
export interface Message {
  id: string
  fromUserId: string
  toUserId: string
  propertyId?: string
  subject: string
  message: string
  read: boolean
  createdAt: string
  responses?: Message[]
}

// Solicitud de alquiler
export interface RentalRequest {
  id: string
  propertyId: string
  userId: string
  message: string
  moveInDate: string
  lengthOfStay: number // en meses
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  createdAt: string
  property?: Property
  user?: User
}

// Configuración de notificaciones
export interface NotificationSettings {
  email: {
    newMessages: boolean
    priceAlerts: boolean
    newProperties: boolean
    reviews: boolean
    marketing: boolean
  }
  push: {
    newMessages: boolean
    favorites: boolean
    recommendations: boolean
  }
}

// Alerta de precio
export interface PriceAlert {
  id: string
  userId: string
  location: string
  priceMax: number
  filters: Partial<SearchFilters>
  active: boolean
  createdAt: string
}

// Historial de búsquedas
export interface SearchHistory {
  id: string
  userId: string
  query: string
  filters: SearchFilters
  resultsCount: number
  createdAt: string
}

// Estadísticas de propiedad
export interface PropertyStats {
  views: number
  favorites: number
  inquiries: number
  applications: number
  averageRating: number
  totalReviews: number
  daysOnMarket: number
}

// Configuración de usuario
export interface UserPreferences {
  language: 'es' | 'en'
  currency: Currency
  notifications: NotificationSettings
  privacy: {
    showProfile: boolean
    showReviews: boolean
    allowMessages: boolean
  }
  search: {
    saveHistory: boolean
    personalized: boolean
  }
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
  pagination?: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: Record<string, any>
}

// Form types
export interface ContactForm {
  name: string
  email: string
  phone?: string
  propertyId?: string
  message: string
  preferredContact?: 'email' | 'phone' | 'whatsapp'
}

export interface SearchFormData {
  location: string
  priceRange: [number, number]
  bedrooms?: number
  moveInDate?: string
}

// SEO types
export interface SEOData {
  title: string
  description: string
  keywords?: string[]
  canonical?: string
  openGraph?: {
    title: string
    description: string
    image: string
    url: string
    type?: string
  }
  twitter?: {
    card: string
    title: string
    description: string
    image: string
  }
  structuredData?: Record<string, any>
}

// Component props types
export interface ComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface ButtonProps extends ComponentProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  disabled?: boolean
  loading?: boolean
  as?: React.ElementType
  href?: string
  onClick?: (event: React.MouseEvent) => void
}

export interface InputProps extends ComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel'
  placeholder?: string
  value?: string | number
  defaultValue?: string | number
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void
  disabled?: boolean
  required?: boolean
  error?: boolean
  errorMessage?: string
}

// Hook types
export interface UseSearchOptions {
  query?: string
  filters?: SearchFilters
  enabled?: boolean
  onSuccess?: (data: SearchResult) => void
  onError?: (error: ApiError) => void
}

export interface UsePropertyOptions {
  id: string
  enabled?: boolean
  onSuccess?: (data: Property) => void
  onError?: (error: ApiError) => void
}

// Store types (Zustand)
export interface AppState {
  user: User | null
  isAuthenticated: boolean
  favorites: string[]
  searchHistory: SearchHistory[]
  recentlyViewed: string[]
}

export interface SearchState {
  query: string
  filters: SearchFilters
  results: Property[]
  loading: boolean
  error: ApiError | null
  total: number
  hasMore: boolean
}

export interface UIState {
  theme: 'light' | 'dark' | 'system'
  sidebarOpen: boolean
  modalOpen: string | null
  toasts: Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    duration?: number
  }>
}

// Utility types
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type Partial<T> = { [P in keyof T]?: T[P] }
export type Required<T> = { [P in keyof T]-?: T[P] }
export type Nullable<T> = T | null
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Branded types para mayor type safety
export type PropertyId = string & { readonly brand: unique symbol }
export type UserId = string & { readonly brand: unique symbol }
export type Email = string & { readonly brand: unique symbol }

// Constants
export const PROPERTY_TYPES: Record<PropertyType, string> = {
  apartment: 'Departamento',
  house: 'Casa',
  studio: 'Estudio',
  office: 'Oficina',
  room: 'Habitación'
}

export const CURRENCIES: Record<Currency, { symbol: string; name: string }> = {
  PEN: { symbol: 'S/', name: 'Soles' },
  USD: { symbol: '$', name: 'Dólares' }
}

export const USER_ROLES: Record<UserRole, string> = {
  tenant: 'Inquilino',
  landlord: 'Propietario',
  agent: 'Agente',
  admin: 'Administrador'
}