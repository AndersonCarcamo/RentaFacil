// API functions for subscription plans and user subscriptions
import { API_BASE_URL, authenticatedRequest } from './auth';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: {
    max_listings?: number;
    max_images?: number;
    max_videos?: number;
    [key: string]: any;
  };
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  billing_cycle: 'monthly' | 'yearly';
  start_date: string;
  current_period_start: string;
  current_period_end: string;
  cancelled_at?: string;
  pause_until?: string;
  auto_renewal: boolean;
  cancel_at_period_end: boolean;
  plan: SubscriptionPlan;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionUsage {
  id: string;
  subscription_id: string;
  period_start: string;
  period_end: string;
  listings_used: number;
  images_uploaded: number;
  videos_uploaded: number;
  api_calls: number;
  limits_snapshot: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Get all available subscription plans
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  try {
    const response = await authenticatedRequest(`${API_BASE_URL}/v1/subscriptions/plans`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Error fetching plans: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    throw error;
  }
}

/**
 * Get current user's active subscription
 */
export async function getCurrentSubscription(): Promise<UserSubscription | null> {
  try {
    const response = await authenticatedRequest(`${API_BASE_URL}/v1/subscriptions/current`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (response.status === 404) {
      // User has no active subscription
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error fetching subscription: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    throw error;
  }
}

/**
 * Get subscription usage for current period
 */
export async function getSubscriptionUsage(): Promise<SubscriptionUsage | null> {
  try {
    const response = await authenticatedRequest(`${API_BASE_URL}/v1/subscriptions/usage/current`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (response.status === 404) {
      // No usage data found
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error fetching usage: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching subscription usage:', error);
    throw error;
  }
}

/**
 * Create a new subscription for the user
 */
export async function createSubscription(planId: string, billingCycle: 'monthly' | 'yearly'): Promise<UserSubscription> {
  try {
    const response = await authenticatedRequest(`${API_BASE_URL}/v1/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        plan_id: planId,
        billing_cycle: billingCycle,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Error creating subscription: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

/**
 * Cancel current subscription
 */
export async function cancelSubscription(cancelAtPeriodEnd: boolean = true): Promise<UserSubscription> {
  try {
    const response = await authenticatedRequest(`${API_BASE_URL}/v1/subscriptions/current/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        cancel_at_period_end: cancelAtPeriodEnd,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || `Error cancelling subscription: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

/**
 * Get default/free plan for users without subscription
 */
export function getDefaultPlan(): Pick<SubscriptionPlan, 'name' | 'limits' | 'features'> {
  return {
    name: 'Free',
    limits: {
      max_listings: 3,
    },
    features: [
      '3 propiedades activas',
      'Estadísticas básicas',
      'Soporte por email',
    ],
  };
}
