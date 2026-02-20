// Types principales de la aplicación

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  nationalId?: string;
  nationalIdType?: string;
  role: 'USER' | 'LANDLORD' | 'AGENT';
  profilePictureUrl?: string;
  agencyName?: string;
  agencyRuc?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency: 'PEN' | 'USD';
  location: string;
  district?: string;
  department?: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  amenities: string[];
  rating?: number;
  reviews?: number;
  isVerified: boolean;
  isFavorite: boolean;
  views?: number;
  propertyType?: string;
  rentalType?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  nationalId: string;
  nationalIdType: string;
  role: 'USER' | 'LANDLORD' | 'AGENT';
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  profilePicture?: any; // File or URI
  agencyName?: string;
  agencyRuc?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

export interface SearchFilters {
  query?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  rentalType?: string;
  district?: string;
  department?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

// Navigation Types
export type RootStackParamList = {
  Login: { registered?: string } | undefined;
  Register: { type?: string } | undefined;
  Home: undefined;
  HomeScreen: undefined;
  MainTabs: undefined;
  Search: undefined;
  SearchScreen: {
    mode?: 'alquiler' | 'comprar' | 'proyecto' | 'tipo_Airbnb';
    location?: string;
    propertyType?: string;
    useGeolocation?: boolean;
  } | undefined;
  SearchResultsScreen: {
    mode?: 'alquiler' | 'comprar' | 'proyecto' | 'tipo_Airbnb';
    location?: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    minArea?: number;
    maxArea?: number;
    furnished?: boolean;
    verified?: boolean;
    petFriendly?: boolean;
  } | undefined;
  Favorites: undefined;
  Profile: undefined;
};
