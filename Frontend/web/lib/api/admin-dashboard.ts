/**
 * Admin Dashboard API Client
 * Cliente TypeScript para consumir los endpoints del panel de administración
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ==================== TIPOS ====================

export interface AdminOverview {
  users: {
    total: number;
    active_7d: number;
    new_today: number;
    growth_percentage: number;
    trend?: Array<{ date: string; value: number }>;
  };
  listings: {
    total: number;
    active: number;
    new_today: number;
    growth_percentage: number;
    trend?: Array<{ date: string; value: number }>;
  };
  finances: {
    mrr: number;
    current_month_revenue: number;
    revenue_growth_percentage: number;
    active_subscriptions: number;
    subscriptions_growth_percentage: number;
    revenue_trend?: Array<{ date: string; value: number }>;
  };
  analytics: {
    total_views_month: number;
    views_growth_percentage: number;
  };
  bookings: {
    active: number;
  };
  alerts: {
    pending_verifications: number;
    failed_payments_24h: number;
    critical_count: number;
  };
  generated_at: string;
}

export interface DailyEvent {
  date: string;
  views: number;
  contacts: number;
  searches: number;
  favorites: number;
}

export interface TopSearch {
  term: string;
  count: number;
}

export interface TopListing {
  listing_id: string;
  title: string;
  views: number;
  unique_visitors: number;
}

export interface AnalyticsSummary {
  period: {
    days: number;
    start_date: string;
    end_date: string;
  };
  daily_events: DailyEvent[];
  top_searches: TopSearch[];
  top_listings: TopListing[];
  event_distribution: Record<string, number>;
  conversion: {
    views: number;
    contacts: number;
    rate_percentage: number;
  };
}

export interface PlanMRR {
  plan_name: string;
  price: number;
  subscriptions: number;
  mrr: number;
}

export interface Transaction {
  id: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  user_email: string;
  user_name: string;
}

export interface FinancesSummary {
  mrr: {
    total: number;
    change: number;
    growth_percentage: number;
    active_subscriptions: number;
    trend?: Array<{ date: string; value: number }>;
  };
  mrr_by_plan: Record<string, number>;
  total_revenue: {
    amount: number;
    change: number;
    growth_percentage: number;
    transaction_count: number;
  };
  churn: {
    rate: number;
    cancelled: number;
    active_at_month_start: number;
  };
}

export interface TopProperty {
  listing_id: string;
  title: string;
  booking_count: number;
  total_revenue: number;
  platform_fees: number;
}

export interface BookingsSummary {
  bookings_by_status: Record<string, {
    count: number;
    total_value: number;
  }>;
  platform_fees: {
    total: number;
    booking_count: number;
  };
  top_properties: TopProperty[];
  cancellation_rate: number;
}

export interface UsersStats {
  total: number;
  by_role: {
    user: number;
    agent: number;
    admin: number;
  };
  by_verification: {
    email_verified: number;
    phone_verified: number;
    fully_verified: number;
    not_verified: number;
  };
  by_status: {
    active: number;
    suspended: number;
  };
  by_activity: {
    active_last_week: number;
    new_today: number;
    new_this_week: number;
    new_this_month: number;
  };
  by_subscription: Record<string, number>;
}

export interface UserInList {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: 'user' | 'agent' | 'admin';
  is_active: boolean;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  created_at: string;
  last_login: string | null;
  avatar_url: string | null;
  first_name: string;
  last_name: string;
}

export interface UsersListResponse {
  data: UserInList[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface UsersListFilters {
  role?: string;
  is_active?: boolean;
  is_verified?: string;
  activity?: string;
  plan?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ==================== FUNCIONES API ====================

/**
 * Obtener token de autenticación
 */
function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('access_token') || '';
}

/**
 * Obtener resumen general del dashboard
 */
export async function getAdminOverview(): Promise<AdminOverview> {
  const response = await fetch(`${API_BASE_URL}/v1/admin/overview`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No autorizado. Debes iniciar sesión como administrador.');
    }
    if (response.status === 403) {
      throw new Error('Acceso denegado. Se requieren permisos de administrador.');
    }
    const error = await response.json().catch(() => ({ detail: 'Error al cargar overview' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Obtener resumen de analytics
 * @param days Número de días a analizar (default: 30)
 */
export async function getAnalyticsSummary(days: number = 30): Promise<AnalyticsSummary> {
  const response = await fetch(`${API_BASE_URL}/v1/admin/analytics/summary?days=${days}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('No autorizado. Debes iniciar sesión como administrador.');
    }
    if (response.status === 403) {
      throw new Error('Acceso denegado. Se requieren permisos de administrador.');
    }
    const error = await response.json().catch(() => ({ detail: 'Error al cargar analytics' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Obtener resumen financiero
 */
export async function getFinancesSummary(): Promise<FinancesSummary> {
  const response = await fetch(`${API_BASE_URL}/v1/admin/finances/summary`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Error al cargar finanzas' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Obtener resumen de reservas (bookings)
 */
export async function getBookingsSummary(): Promise<BookingsSummary> {
  const response = await fetch(`${API_BASE_URL}/v1/admin/bookings/summary`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Error al cargar bookings' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Obtener estadísticas de usuarios para el tree de clasificación
 */
export async function getUsersStats(): Promise<UsersStats> {
  const response = await fetch(`${API_BASE_URL}/v1/admin/users/stats`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Error al cargar estadísticas de usuarios' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Obtener lista de usuarios con filtros aplicados en backend
 */
export async function getUsersList(filters: UsersListFilters = {}): Promise<UsersListResponse> {
  const params = new URLSearchParams();
  
  if (filters.role) params.append('role', filters.role);
  if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
  if (filters.is_verified) params.append('is_verified', filters.is_verified);
  if (filters.activity) params.append('activity', filters.activity);
  if (filters.plan) params.append('plan', filters.plan);
  if (filters.search) params.append('search', filters.search);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const response = await fetch(`${API_BASE_URL}/v1/admin/users/list?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Error al cargar usuarios' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}
