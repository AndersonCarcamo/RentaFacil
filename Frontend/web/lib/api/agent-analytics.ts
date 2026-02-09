/**
 * Agent Analytics API Client
 * ===========================
 * Cliente para consumir endpoints de analytics de agentes
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Helper para hacer peticiones autenticadas
 */
async function authenticatedRequest(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
}

// ==================== INTERFACES ====================

export interface AgentStats {
  agent_id: string;
  total_listings: number;
  active_listings: number;
  total_views: number;
  total_contacts: number;
  last_30_days: {
    views: number;
    contacts: number;
    unique_visitors: number;
    conversion_rate: number;
  };
  daily_stats: Array<{
    date: string;
    views: number;
    contacts: number;
  }>;
  listings_performance: Array<{
    listing_id: string;
    title: string;
    status: string;
    views: number;
    contacts: number;
    unique_visitors: number;
    conversion_rate: number;
  }>;
}

export interface ListingComparison {
  listing_id: string;
  title: string;
  district: string;
  operation: string;
  property_type: string;
  price: number;
  status: string;
  days_published: number;
  total_views: number;
  total_contacts: number;
  unique_visitors: number;
  views_7d: number;
  contacts_7d: number;
  conversion_rate: number;
  avg_views_per_day: number;
  avg_contacts_per_day: number;
}

export interface AgentListingsComparison {
  agent_id: string;
  total_listings: number;
  listings: ListingComparison[];
}

export interface AgencyOverview {
  agency_id: string;
  overview: {
    total_agents: number;
    total_listings: number;
    active_listings: number;
    total_views: number;
    total_contacts: number;
    conversion_rate: number;
  };
  agents_performance: Array<{
    agent_id: string;
    agent_name: string;
    email: string;
    role: string;
    total_listings: number;
    active_listings: number;
    total_views: number;
    total_contacts: number;
    conversion_rate: number;
  }>;
  daily_trend: Array<{
    date: string;
    views: number;
    contacts: number;
  }>;
}

// ==================== API FUNCTIONS ====================

/**
 * Get agent analytics stats
 * Estadísticas agregadas de todas las propiedades del agente
 */
export async function getAgentStats(agentId: string): Promise<AgentStats> {
  const response = await authenticatedRequest(
    `${API_BASE_URL}/v1/analytics/agents/${agentId}/stats`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to fetch agent stats');
  }

  return await response.json();
}

/**
 * Get agent listings comparison
 * Comparativa detallada de todas las propiedades del agente
 */
export async function getAgentListingsComparison(
  agentId: string
): Promise<AgentListingsComparison> {
  const response = await authenticatedRequest(
    `${API_BASE_URL}/v1/analytics/agents/${agentId}/listings-comparison`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to fetch listings comparison');
  }

  return await response.json();
}

/**
 * Get agency analytics overview
 * Vista general de toda la agencia (solo owner/admin)
 */
export async function getAgencyOverview(agencyId: string): Promise<AgencyOverview> {
  const response = await authenticatedRequest(
    `${API_BASE_URL}/v1/analytics/agencies/${agencyId}/overview`
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || 'Failed to fetch agency overview');
  }

  return await response.json();
}
