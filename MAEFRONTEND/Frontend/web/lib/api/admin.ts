/**
 * API functions for admin plan and user management
 */

import { apiClient } from './client';

// ==================== TYPES ====================

export interface PlanLimits {
  max_listings?: number;
  max_images?: number;
  max_videos?: number;
  featured_listings?: number;
  analytics_access?: boolean;
  priority_support?: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: PlanLimits;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlanUpdate {
  name?: string;
  description?: string;
  price_monthly?: number;
  price_yearly?: number;
  features?: string[];
  limits?: Record<string, any>;
  active?: boolean;
  sort_order?: number;
}

export interface AdminUser {
  email: string;
  addedDate: string;
  addedBy?: string;
  isSystemAdmin: boolean;
}

export interface AdminUserCreate {
  email: string;
}

export interface AdminOverviewStats {
  totalUsers: number;
  activeListings: number;
  premiumSubscriptions: number;
  monthlyRevenue: number;
  lastUpdated: string;
}

// ==================== PLAN MANAGEMENT ====================

/**
 * Get all subscription plans (admin only)
 */
export async function getAdminPlans(includeInactive: boolean = false): Promise<SubscriptionPlan[]> {
  const response = await apiClient.get('/admin/plans', {
    params: { include_inactive: includeInactive }
  });
  return response.data;
}

/**
 * Get details of a specific plan (admin only)
 */
export async function getAdminPlanDetails(planId: string): Promise<SubscriptionPlan> {
  const response = await apiClient.get(`/admin/plans/${planId}`);
  return response.data;
}

/**
 * Update a subscription plan (admin only)
 */
export async function updateAdminPlan(
  planId: string,
  planData: SubscriptionPlanUpdate
): Promise<SubscriptionPlan> {
  const response = await apiClient.put(`/admin/plans/${planId}`, planData);
  return response.data;
}

/**
 * Create a new subscription plan (admin only)
 */
export async function createAdminPlan(planData: SubscriptionPlanUpdate): Promise<SubscriptionPlan> {
  const response = await apiClient.post('/admin/plans', planData);
  return response.data;
}

/**
 * Delete (deactivate) a subscription plan (admin only)
 */
export async function deleteAdminPlan(planId: string): Promise<{ message: string }> {
  const response = await apiClient.delete(`/admin/plans/${planId}`);
  return response.data;
}

// ==================== ADMIN USER MANAGEMENT ====================

/**
 * Get all admin users (admin only)
 */
export async function getAdminUsers(): Promise<AdminUser[]> {
  const response = await apiClient.get('/admin/admins');
  return response.data;
}

/**
 * Add a new admin user (admin only)
 */
export async function addAdminUser(email: string): Promise<AdminUser> {
  const response = await apiClient.post('/admin/admins', { email });
  return response.data;
}

/**
 * Remove admin privileges from a user (admin only)
 */
export async function removeAdminUser(email: string): Promise<{ message: string }> {
  const response = await apiClient.delete(`/admin/admins/${encodeURIComponent(email)}`);
  return response.data;
}

// ==================== ADMIN STATISTICS ====================

/**
 * Get overview statistics for admin dashboard
 */
export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const response = await apiClient.get('/admin/stats/overview');
  return response.data;
}

// ==================== ERROR HANDLING ====================

export class AdminAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AdminAPIError';
  }
}
