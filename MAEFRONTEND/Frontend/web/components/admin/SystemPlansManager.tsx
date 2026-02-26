/**
 * SystemPlansManager Component
 * Gestión de planes del sistema (core.plans) con CRUD completo
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  PencilIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

type PlanTier = 'free' | 'basic' | 'premium' | 'enterprise';
type PlanPeriod = 'monthly' | 'quarterly' | 'yearly' | 'permanent';
type PlanTargetType = 'individual' | 'agency' | 'both';

interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  tier: PlanTier;
  period: PlanPeriod;
  target_user_type: PlanTargetType;
  period_months: number;
  price_amount: number;
  price_currency: string;
  
  // Límites
  max_active_listings: number;
  listing_active_days: number;
  max_images_per_listing: number;
  max_videos_per_listing: number;
  max_video_seconds: number;
  max_image_width: number;
  max_image_height: number;
  
  // Características
  featured_listings: boolean;
  priority_support: boolean;
  analytics_access: boolean;
  api_access: boolean;
  
  // Flags
  is_active: boolean;
  is_default: boolean;
}

const TIER_LABELS = {
  free: 'Gratuito',
  basic: 'Básico',
  premium: 'Premium',
  enterprise: 'Empresarial'
};

const PERIOD_LABELS = {
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  yearly: 'Anual',
  permanent: 'Permanente'
};

const TARGET_TYPE_LABELS = {
  individual: 'Individuales',
  agency: 'Agencias',
  both: 'Ambos'
};

export default function SystemPlansManager() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [targetFilter, setTargetFilter] = useState<PlanTargetType | null>(null);

  useEffect(() => {
    fetchPlans();
  }, [targetFilter]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      params.append('include_inactive', 'true');
      if (targetFilter) {
        params.append('target_user_type', targetFilter);
      }
      
      const response = await fetch(`http://localhost:8000/v1/plans/?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar los planes');
      }
      
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Error al cargar los planes del sistema.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = () => {
    const newPlan: Plan = {
      id: 'new',
      code: '',
      name: '',
      description: '',
      tier: 'basic',
      period: 'monthly',
      target_user_type: 'individual',
      period_months: 1,
      price_amount: 0,
      price_currency: 'PEN',
      max_active_listings: 5,
      listing_active_days: 30,
      max_images_per_listing: 5,
      max_videos_per_listing: 0,
      max_video_seconds: 60,
      max_image_width: 1920,
      max_image_height: 1080,
      featured_listings: false,
      priority_support: false,
      analytics_access: false,
      api_access: false,
      is_active: true,
      is_default: false,
    };
    setEditingPlan(newPlan);
    setShowEditModal(true);
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan({ ...plan });
    setShowEditModal(true);
  };

  const handleSavePlan = async () => {
    if (!editingPlan) return;

    if (!editingPlan.name.trim() || !editingPlan.code.trim()) {
      setError('El nombre y código del plan son obligatorios');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const isNew = editingPlan.id === 'new';
      const url = isNew 
        ? 'http://localhost:8000/v1/plans/'
        : `http://localhost:8000/v1/plans/${editingPlan.id}`;
      
      const method = isNew ? 'POST' : 'PATCH';
      
      const { id, ...payload } = editingPlan;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al guardar el plan');
      }

      await fetchPlans();
      setSuccess(`✓ Plan "${editingPlan.name}" ${isNew ? 'creado' : 'actualizado'} correctamente`);
      setShowEditModal(false);
      setEditingPlan(null);
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Error saving plan:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar el plan');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:8000/v1/plans/${planId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al eliminar el plan');
      }

      await fetchPlans();
      setSuccess('✓ Plan eliminado correctamente');
      setShowDeleteConfirm(null);
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Error deleting plan:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar el plan');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (planId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:8000/v1/plans/${planId}/set-default`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al establecer plan por defecto');
      }

      await fetchPlans();
      setSuccess('✓ Plan establecido como predeterminado');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Error setting default:', err);
      setError(err instanceof Error ? err.message : 'Error al establecer plan por defecto');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Planes del Sistema</h2>
          <p className="text-sm text-gray-600 mt-1">Gestiona los planes de suscripción disponibles</p>
        </div>
        <button
          onClick={handleCreatePlan}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Nuevo Plan</span>
        </button>
      </div>

      {/* Filtros por tipo de usuario */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Filtrar por tipo:</span>
        <button
          onClick={() => setTargetFilter(null)}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            targetFilter === null
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setTargetFilter('individual')}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            targetFilter === 'individual'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Individuales
        </button>
        <button
          onClick={() => setTargetFilter('agency')}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            targetFilter === 'agency'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Agencias
        </button>
        <button
          onClick={() => setTargetFilter('both')}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            targetFilter === 'both'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Ambos
        </button>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <XMarkIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded">
            <XMarkIcon className="w-4 h-4 text-red-600" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
          <CheckIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-green-700 font-medium">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="p-1 hover:bg-green-100 rounded">
            <XMarkIcon className="w-4 h-4 text-green-600" />
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && !editingPlan && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Plans Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white border-2 rounded-xl p-6 hover:shadow-lg transition-all ${
                plan.is_default ? 'border-yellow-400' : 'border-gray-200'
              } ${!plan.is_active ? 'opacity-60' : ''}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                    {plan.is_default && (
                      <StarIcon className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {TIER_LABELS[plan.tier]}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      {PERIOD_LABELS[plan.period]}
                    </span>
                    <span className={`px-2 py-1 rounded ${
                      plan.target_user_type === 'agency' 
                        ? 'bg-purple-100 text-purple-700' 
                        : plan.target_user_type === 'both'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {TARGET_TYPE_LABELS[plan.target_user_type]}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditPlan(plan)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(plan.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Description */}
              {plan.description && (
                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
              )}

              {/* Price */}
              <div className="mb-4 pb-4 border-b">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">
                    {plan.price_currency} {plan.price_amount}
                  </span>
                  <span className="text-sm text-gray-600">
                    {plan.period === 'permanent' ? '' : `/ ${PERIOD_LABELS[plan.period].toLowerCase()}`}
                  </span>
                </div>
              </div>

              {/* Limits */}
              <div className="space-y-2 mb-4">
                <p className="text-xs font-semibold text-gray-700 uppercase">Límites:</p>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>• Propiedades activas: {plan.max_active_listings}</div>
                  <div>• Días activos: {plan.listing_active_days}</div>
                  <div>• Imágenes: {plan.max_images_per_listing}</div>
                  <div>• Videos: {plan.max_videos_per_listing}</div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-700 uppercase">Características:</p>
                <div className="text-sm space-y-1">
                  {plan.featured_listings && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <CheckIcon className="w-4 h-4 text-green-600" />
                      <span>Propiedades destacadas</span>
                    </div>
                  )}
                  {plan.priority_support && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <CheckIcon className="w-4 h-4 text-green-600" />
                      <span>Soporte prioritario</span>
                    </div>
                  )}
                  {plan.analytics_access && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <CheckIcon className="w-4 h-4 text-green-600" />
                      <span>Acceso a analíticas</span>
                    </div>
                  )}
                  {plan.api_access && (
                    <div className="flex items-center gap-2 text-gray-700">
                      <CheckIcon className="w-4 h-4 text-green-600" />
                      <span>Acceso a API</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {!plan.is_default && (
                <button
                  onClick={() => handleSetDefault(plan.id)}
                  className="mt-4 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Establecer como predeterminado
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingPlan.id === 'new' ? 'Crear Nuevo Plan' : 'Editar Plan'}
            </h3>

            <div className="space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código *
                </label>
                <input
                  type="text"
                  value={editingPlan.code}
                  onChange={(e) => setEditingPlan({ ...editingPlan, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ej: basic-monthly"
                  disabled={editingPlan.id !== 'new'}
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Plan Básico Mensual"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={editingPlan.description || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Descripción del plan"
                />
              </div>

              {/* Tier and Period */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nivel (Tier) *
                  </label>
                  <select
                    value={editingPlan.tier}
                    onChange={(e) => setEditingPlan({ ...editingPlan, tier: e.target.value as PlanTier })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="free">Gratuito</option>
                    <option value="basic">Básico</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Empresarial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Período *
                  </label>
                  <select
                    value={editingPlan.period}
                    onChange={(e) => {
                      const period = e.target.value as PlanPeriod;
                      const months = period === 'monthly' ? 1 : period === 'quarterly' ? 3 : period === 'yearly' ? 12 : 0;
                      setEditingPlan({ ...editingPlan, period, period_months: months });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="permanent">Permanente</option>
                    <option value="monthly">Mensual</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
              </div>

              {/* Tipo de Usuario Objetivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Usuario *
                </label>
                <select
                  value={editingPlan.target_user_type}
                  onChange={(e) => setEditingPlan({ ...editingPlan, target_user_type: e.target.value as PlanTargetType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="individual">Usuarios Individuales</option>
                  <option value="agency">Agencias</option>
                  <option value="both">Ambos</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Define si este plan está dirigido a usuarios individuales, agencias o ambos
                </p>
              </div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPlan.price_amount}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Moneda *
                  </label>
                  <input
                    type="text"
                    value={editingPlan.price_currency}
                    onChange={(e) => setEditingPlan({ ...editingPlan, price_currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={3}
                  />
                </div>
              </div>

              {/* Limits */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Límites del Plan</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Propiedades activas</label>
                    <input
                      type="number"
                      value={editingPlan.max_active_listings}
                      onChange={(e) => setEditingPlan({ ...editingPlan, max_active_listings: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Días activos</label>
                    <input
                      type="number"
                      value={editingPlan.listing_active_days}
                      onChange={(e) => setEditingPlan({ ...editingPlan, listing_active_days: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Imágenes por propiedad</label>
                    <input
                      type="number"
                      value={editingPlan.max_images_per_listing}
                      onChange={(e) => setEditingPlan({ ...editingPlan, max_images_per_listing: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Videos por propiedad</label>
                    <input
                      type="number"
                      value={editingPlan.max_videos_per_listing}
                      onChange={(e) => setEditingPlan({ ...editingPlan, max_videos_per_listing: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Características</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingPlan.featured_listings}
                      onChange={(e) => setEditingPlan({ ...editingPlan, featured_listings: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Propiedades destacadas</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingPlan.priority_support}
                      onChange={(e) => setEditingPlan({ ...editingPlan, priority_support: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Soporte prioritario</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingPlan.analytics_access}
                      onChange={(e) => setEditingPlan({ ...editingPlan, analytics_access: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Acceso a analíticas</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingPlan.api_access}
                      onChange={(e) => setEditingPlan({ ...editingPlan, api_access: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Acceso a API</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editingPlan.is_active}
                      onChange={(e) => setEditingPlan({ ...editingPlan, is_active: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Plan activo</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSavePlan}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPlan(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirmar Eliminación</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar este plan? Esta acción lo marcará como inactivo.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeletePlan(showDeleteConfirm)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
