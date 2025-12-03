// API functions for agent management
import { API_BASE_URL, authenticatedRequest } from './auth';

export interface Agent {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  profile_picture_url: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
  agency_id: string;
  agency_role: string;
  joined_agency_at: string;
  listings_count: number;
  active_listings_count: number;
}

export interface AgentInvitation {
  id: string;
  agency_id: string;
  agency_name?: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  token: string;
  status: string;
  expires_at: string;
  created_at: string;
  invited_by_name?: string;
  invited_by_email?: string;
}

export interface AgentListResponse {
  agents: Agent[];
  total: number;
  active_count: number;
  inactive_count: number;
  pending_invitations: number;
}

export interface InviteAgentRequest {
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface UpdateAgentRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  is_active?: boolean;
}

export interface AcceptInvitationRequest {
  token: string;
  password: string;
  phone?: string;
}

export interface AcceptInvitationResponse {
  user_id: string;
  email: string;
  agency_id: string;
  agency_name: string;
  access_token: string;
  token_type: string;
}

/**
 * Invite a new agent to the agency
 */
export async function inviteAgent(
  agencyId: string,
  data: InviteAgentRequest
): Promise<AgentInvitation> {
  const response = await authenticatedRequest(
    `${API_BASE_URL}/v1/agencies/${agencyId}/agents/invite`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to invite agent');
  }

  return await response.json();
}

/**
 * Get all agents in the agency
 */
export async function getAgents(
  agencyId: string,
  includeInactive: boolean = false
): Promise<AgentListResponse> {
  const url = new URL(`${API_BASE_URL}/v1/agencies/${agencyId}/agents`);
  if (includeInactive) {
    url.searchParams.append('include_inactive', 'true');
  }

  const response = await authenticatedRequest(url.toString(), {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to fetch agents');
  }

  return await response.json();
}

/**
 * Get agent details
 */
export async function getAgentDetails(
  agencyId: string,
  agentId: string
): Promise<Agent> {
  const response = await authenticatedRequest(
    `${API_BASE_URL}/v1/agencies/${agencyId}/agents/${agentId}`,
    {
      method: 'GET',
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to fetch agent details');
  }

  return await response.json();
}

/**
 * Update agent information
 */
export async function updateAgent(
  agencyId: string,
  agentId: string,
  data: UpdateAgentRequest
): Promise<{ message: string }> {
  const response = await authenticatedRequest(
    `${API_BASE_URL}/v1/agencies/${agencyId}/agents/${agentId}`,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to update agent');
  }

  return await response.json();
}

/**
 * Remove agent from agency
 */
export async function removeAgent(
  agencyId: string,
  agentId: string
): Promise<void> {
  const response = await authenticatedRequest(
    `${API_BASE_URL}/v1/agencies/${agencyId}/agents/${agentId}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to remove agent');
  }
}

/**
 * Get pending invitations
 */
export async function getPendingInvitations(
  agencyId: string
): Promise<AgentInvitation[]> {
  const response = await authenticatedRequest(
    `${API_BASE_URL}/v1/agencies/${agencyId}/invitations`,
    {
      method: 'GET',
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to fetch invitations');
  }

  return await response.json();
}

/**
 * Revoke an invitation
 */
export async function revokeInvitation(
  agencyId: string,
  invitationId: string
): Promise<void> {
  const response = await authenticatedRequest(
    `${API_BASE_URL}/v1/agencies/${agencyId}/invitations/${invitationId}`,
    {
      method: 'DELETE',
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to revoke invitation');
  }
}

/**
 * Accept an agent invitation (public endpoint - no auth required)
 */
export async function acceptInvitation(
  data: AcceptInvitationRequest
): Promise<AcceptInvitationResponse> {
  const response = await fetch(`${API_BASE_URL}/v1/agencies/invitations/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to accept invitation');
  }

  return await response.json();
}

/**
 * Get agent's listings
 */
export async function getAgentListings(
  agencyId: string,
  agentId: string
): Promise<any[]> {
  const response = await authenticatedRequest(
    `${API_BASE_URL}/v1/agencies/${agencyId}/agents/${agentId}/listings`,
    {
      method: 'GET',
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to fetch agent listings');
  }

  return await response.json();
}
