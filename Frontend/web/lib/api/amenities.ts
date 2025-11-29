// API functions for amenities
import { API_BASE_URL, authenticatedRequest } from './auth';

export interface Amenity {
  id: number;
  name: string;
  icon?: string;
}

export interface ListingAmenity {
  listing_id: string;
  listing_created_at: string;
  amenity_id: number;
  amenity?: Amenity; // Populated when fetching
}

/**
 * Get all available amenities
 */
export async function getAmenities(): Promise<Amenity[]> {
  const response = await fetch(`${API_BASE_URL}/amenities`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch amenities');
  }

  return response.json();
}

/**
 * Get amenities for a specific listing
 */
export async function getListingAmenities(listingId: string): Promise<Amenity[]> {
  const response = await fetch(`${API_BASE_URL}/listings/${listingId}/amenities`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch listing amenities');
  }

  return response.json();
}

/**
 * Update amenities for a listing (requires authentication)
 */
export async function updateListingAmenities(
  listingId: string,
  amenityIds: number[]
): Promise<void> {
  const response = await authenticatedRequest(
    `${API_BASE_URL}/listings/${listingId}/amenities`,
    {
      method: 'PUT',
      body: JSON.stringify({ amenity_ids: amenityIds }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to update amenities');
  }
}

/**
 * Add amenities to a listing (requires authentication)
 */
export async function addListingAmenities(
  listingId: string,
  amenityIds: number[]
): Promise<void> {
  const response = await authenticatedRequest(
    `${API_BASE_URL}/listings/${listingId}/amenities`,
    {
      method: 'POST',
      body: JSON.stringify({ amenity_ids: amenityIds }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to add amenities');
  }
}

/**
 * Remove amenities from a listing (requires authentication)
 */
export async function removeListingAmenities(
  listingId: string,
  amenityIds: number[]
): Promise<void> {
  const response = await authenticatedRequest(
    `${API_BASE_URL}/listings/${listingId}/amenities`,
    {
      method: 'DELETE',
      body: JSON.stringify({ amenity_ids: amenityIds }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to remove amenities');
  }
}
