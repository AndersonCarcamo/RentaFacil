// Constantes de la aplicación

// API
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/v1';

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@renta_facil:access_token',
  REFRESH_TOKEN: '@renta_facil:refresh_token',
  USER_DATA: '@renta_facil:user_data',
  PENDING_AVATAR: '@renta_facil:pending_avatar',
  SEARCH_HISTORY: '@renta_facil:search_history',
  FAVORITES: '@renta_facil:favorites',
} as const;

// Navegación
export const ROUTES = {
  // Auth
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  
  // Main
  HOME: 'Home',
  SEARCH: 'Search',
  FAVORITES: 'Favorites',
  PROFILE: 'Profile',
  
  // Properties
  PROPERTY_DETAILS: 'PropertyDetails',
  PROPERTY_LIST: 'PropertyList',
  
  // Booking
  BOOKING: 'Booking',
  MY_BOOKINGS: 'MyBookings',
  BOOKING_DETAILS: 'BookingDetails',
  
  // Dashboard
  DASHBOARD: 'Dashboard',
  ADD_PROPERTY: 'AddProperty',
  EDIT_PROPERTY: 'EditProperty',
  
  // Profile
  PROFILE_SETTINGS: 'ProfileSettings',
  VERIFICATION: 'Verification',
  PAYMENTS: 'Payments',
} as const;

// Colores del tema
export const COLORS = {
  primary: '#2563EB',      // blue-600
  primaryDark: '#1D4ED8',  // blue-700
  secondary: '#10B981',    // green-500
  danger: '#EF4444',       // red-500
  warning: '#F59E0B',      // amber-500
  success: '#10B981',      // green-500
  
  text: {
    primary: '#111827',    // gray-900
    secondary: '#6B7280',  // gray-500
    light: '#9CA3AF',      // gray-400
  },
  
  background: {
    primary: '#FFFFFF',
    secondary: '#F9FAFB',  // gray-50
    tertiary: '#F3F4F6',   // gray-100
  },
  
  border: {
    light: '#E5E7EB',      // gray-200
    medium: '#D1D5DB',     // gray-300
    dark: '#9CA3AF',       // gray-400
  },
} as const;

// Tamaños
export const SIZES = {
  // Padding y márgenes
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  
  // Tamaños de fuente
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
  
  // Border radius
  radius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
} as const;

// Validaciones
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PHONE_LENGTH: 9,
  DNI_LENGTH: 8,
  RUC_LENGTH: 11,
  
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^9\d{8}$/,
  DNI_REGEX: /^\d{8}$/,
  RUC_REGEX: /^\d{11}$/,
} as const;

// Tipos de documento
export const DOCUMENT_TYPES = [
  { value: 'DNI', label: 'DNI' },
  { value: 'CE', label: 'Carnet de Extranjería' },
  { value: 'PASSPORT', label: 'Pasaporte' },
] as const;

// Tipos de propiedad
export const PROPERTY_TYPES = [
  { value: 'house', label: 'Casa' },
  { value: 'apartment', label: 'Departamento' },
  { value: 'room', label: 'Habitación' },
  { value: 'studio', label: 'Estudio' },
  { value: 'office', label: 'Oficina' },
  { value: 'commercial', label: 'Local Comercial' },
] as const;

// Tipos de renta
export const RENTAL_TYPES = [
  { value: 'long_term', label: 'Largo Plazo' },
  { value: 'short_term', label: 'Corto Plazo' },
  { value: 'airbnb', label: 'Airbnb' },
] as const;

// Departamentos del Perú
export const DEPARTMENTS = [
  'Lima', 'Arequipa', 'Cusco', 'La Libertad', 'Piura',
  'Lambayeque', 'Junín', 'Ica', 'Áncash', 'Puno',
  'Cajamarca', 'Huánuco', 'Loreto', 'Ucayali', 'San Martín',
  'Tacna', 'Ayacucho', 'Amazonas', 'Apurímac', 'Huancavelica',
  'Moquegua', 'Pasco', 'Tumbes', 'Madre de Dios', 'Callao',
] as const;
