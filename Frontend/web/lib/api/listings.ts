// API functions for listings/properties
import { API_BASE_URL, authenticatedRequest } from './auth';

export interface Listing {
  id: string;
  title: string;
  description?: string;
  operation: string; // rent, sale, temp_rent
  property_type: string;
  price: number;
  currency: string;
  
  // Area information
  area_built?: number;
  area_total?: number;
  
  // Property details
  bedrooms?: number;
  bathrooms?: number;
  parking_spots?: number;
  floors?: number;
  floor_number?: number;
  age_years?: number;
  pet_friendly?: boolean;
  furnished?: boolean;
  rental_mode?: string; // full_property, private_room, shared_room
  rental_term?: string; // daily, weekly, monthly, yearly
  rental_model?: string; // traditional or airbnb
  airbnb_score?: number;
  airbnb_eligible?: boolean;
  airbnb_opted_out?: boolean;
  is_airbnb_available?: boolean;
  
  // Location
  address?: string;
  department?: string;
  province?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  
  // Airbnb-specific fields
  smoking_allowed?: boolean;
  deposit_required?: boolean;
  deposit_amount?: number;
  minimum_stay_nights?: number;
  maximum_stay_nights?: number;
  check_in_time?: string;
  check_out_time?: string;
  max_guests?: number;
  cleaning_included?: boolean;
  cleaning_fee?: number;
  utilities_included?: boolean;
  internet_included?: boolean;
  house_rules?: string;
  cancellation_policy?: string;
  available_from?: string;
  
  // Contact information
  contact_name?: string;
  contact_phone_e164?: string;
  contact_whatsapp_phone_e164?: string;
  contact_whatsapp_link?: string;
  
  // Media
  images?: ListingImage[];
  amenities?: Array<{ id: number; name: string; icon?: string }>;
  
  // Status and metadata
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
}

export interface ListingImage {
  id: string;
  url: string;
  caption?: string;
  display_order: number;
  is_main: boolean;
}

export interface CreateListingRequest {
  title: string;
  description?: string;
  property_type: string;
  rental_type: string;
  rental_term?: string;
  price_amount: number;
  price_currency?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state_province?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  bedrooms?: number;
  bathrooms?: number;
  area_size?: number;
  area_unit?: string;
  status?: string;
}

/**
 * Get all listings for the current user
 */
export async function getMyListings(status?: string): Promise<Listing[]> {
  try {
    const url = status 
      ? `${API_BASE_URL}/v1/listings/my?status=${status}`
      : `${API_BASE_URL}/v1/listings/my`;

    const response = await authenticatedRequest(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Error fetching listings: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching my listings:', error);
    throw error;
  }
}

/**
 * Get a single listing by ID
 */
export async function getListing(listingId: string): Promise<Listing> {
  try {
    const response = await authenticatedRequest(`${API_BASE_URL}/v1/listings/${listingId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Error fetching listing: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching listing:', error);
    throw error;
  }
}

/**
 * Create a new listing
 */
export async function createListing(data: CreateListingRequest): Promise<Listing> {
  try {
    const response = await authenticatedRequest(`${API_BASE_URL}/v1/listings/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Error creating listing: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating listing:', error);
    throw error;
  }
}

/**
 * Update an existing listing
 */
export async function updateListing(listingId: string, data: Partial<CreateListingRequest>): Promise<Listing> {
  try {
    const response = await authenticatedRequest(`${API_BASE_URL}/v1/listings/${listingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Error updating listing: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating listing:', error);
    throw error;
  }
}

/**
 * Delete a listing
 */
export async function deleteListing(listingId: string): Promise<void> {
  try {
    const response = await authenticatedRequest(`${API_BASE_URL}/v1/listings/${listingId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Error deleting listing: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting listing:', error);
    throw error;
  }
}

/**
 * Publish a listing
 */
export async function publishListing(listingId: string): Promise<Listing> {
  try {
    const response = await authenticatedRequest(`${API_BASE_URL}/v1/listings/${listingId}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Error publishing listing: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error publishing listing:', error);
    throw error;
  }
}

/**
 * Unpublish a listing
 */
export async function unpublishListing(listingId: string): Promise<Listing> {
  try {
    const response = await authenticatedRequest(`${API_BASE_URL}/v1/listings/${listingId}/unpublish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Error unpublishing listing: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error unpublishing listing:', error);
    throw error;
  }
}

/**
 * Get images for a listing
 */
export async function getListingImages(listingId: string): Promise<ListingImage[]> {
  try {
    const response = await authenticatedRequest(`${API_BASE_URL}/v1/media/listings/${listingId}/images`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Error fetching images: ${response.status}`);
    }

    const data = await response.json();
    return data.images || [];
  } catch (error) {
    console.error('Error fetching listing images:', error);
    throw error;
  }
}
