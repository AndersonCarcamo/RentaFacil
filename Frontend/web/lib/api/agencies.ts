// API functions for agency management
import { API_BASE_URL, authenticatedRequest, publicRequest } from './auth';

export interface Agency {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  description: string | null;
  logo_url: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get the agency associated with the current user
 */
export async function getMyAgency(): Promise<Agency> {
  const response = await authenticatedRequest(
    `${API_BASE_URL}/v1/agencies/me/agency`,
    {
      method: 'GET',
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    
    // Handle specific error cases
    if (response.status === 404) {
      throw new Error('User is not associated with any agency');
    }
    
    throw new Error(error.detail || 'Failed to fetch agency');
  }

  return await response.json();
}

/**
 * Get all agencies (public endpoint - no authentication required)
 */
export async function getAgencies(verified?: boolean): Promise<Agency[]> {
  const url = new URL(`${API_BASE_URL}/v1/agencies`);
  if (verified !== undefined) {
    url.searchParams.append('verified', String(verified));
  }

  const response = await publicRequest(url.toString(), {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to fetch agencies');
  }

  return await response.json();
}

/**
 * Get agency by ID (public endpoint - no authentication required)
 */
export async function getAgency(agencyId: string): Promise<Agency> {
  const response = await publicRequest(
    `${API_BASE_URL}/v1/agencies/${agencyId}`,
    {
      method: 'GET',
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to fetch agency');
  }

  return await response.json();
}
