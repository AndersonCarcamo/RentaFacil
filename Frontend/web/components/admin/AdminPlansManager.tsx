/**
 * AdminPlansManager Component
 * Gestión de planes del sistema (core.plans)
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
import { useAuth } from '../../lib/hooks/useAuth';

type PlanTier = 'free' | 'basic' | 'premium' | 'enterprise';
type PlanPeriod = 'monthly' | 'quarterly' | 'yearly' | 'permanent';

interface Plan {
  id: string;
  code: string;
  name: string;
  description: string;
  tier: PlanTier;
  period: PlanPeriod;
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

export default function AdminPlansManager() {
  const { firebaseUser } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Cargar planes desde el backend
  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:8000/v1/plans/?include_inactive=true');
      
      if (!response.ok) {
        throw new Error('Error al cargar los planes');
      }
      
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Error al cargar los planes del sistema.');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:8000/v1/plans?include_inactive=true');
      
      if (!response.ok) {
        throw new Error('Error al cargar los planes');
      }
      
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Error al cargar los planes. Usando datos de ejemplo.');
      
      // Datos de fallback
      setPlans([
        {
          id: 'basico',
          name: 'Básico',
          description: 'Perfecto para empezar a publicar tus propiedades',
          price_monthly: 0,
          price_yearly: 0,
          features: ['Hasta 3 propiedades activas', 'Hasta 5 imágenes por propiedad', 'Soporte por email'],
          limits: { max_listings: 3, max_images: 5, max_videos: 0 },
          active: true,
          sort_order: 1,
        },
        {
          id: 'premium',
          name: 'Premium',
          description: 'Para arrendadores que quieren destacar',
          price_monthly: 29.90,
          price_yearly: 287.52,
          features: ['Hasta 20 propiedades activas', 'Hasta 15 imágenes por propiedad', '2 videos por propiedad', 'Soporte prioritario'],
          limits: { max_listings: 20, max_images: 15, max_videos: 2, featured_listings: 2 },
          active: true,
          sort_order: 2,
        },
        {
          id: 'profesional',
          name: 'Profesional',
          description: 'Para inmobiliarias y agentes profesionales',
          price_monthly: 99.90,
          price_yearly: 959.04,
          features: ['Propiedades ilimitadas', 'Imágenes ilimitadas', 'Videos ilimitados', 'Analíticas avanzadas', 'Soporte 24/7'],
          limits: { max_listings: 999999, max_images: 999999, max_videos: 999999, analytics_access: true, priority_support: true },
          active: true,
          sort_order: 3,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = () => {
    // Plan vacío para crear uno nuevo
    const newPlan: Plan = {
      id: 'new',
      name: '',
      description: '',
      price_monthly: 0,
      price_yearly: 0,
      features: [''],
      limits: {
        max_listings: 3,
        max_images: 5,
        max_videos: 0,
        featured_listings: 0,
        analytics_access: false,
        priority_support: false,
      },
      active: true,
      sort_order: plans.length + 1,
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

    // Validaciones básicas
    if (!editingPlan.name.trim()) {
      setError('El nombre del plan es obligatorio');
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
      
      const payload: any = {
        name: editingPlan.name,
        description: editingPlan.description,
        price_monthly: editingPlan.price_monthly,
        price_yearly: editingPlan.price_yearly,
        limits: editingPlan.limits,
        features: editingPlan.features.filter(f => f.trim() !== ''),
        is_active: editingPlan.active,
        sort_order: editingPlan.sort_order,
      };
      
      // Para crear, necesitamos plan_code
      if (isNew) {
        payload.plan_code = editingPlan.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      }
      
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

      const savedPlan = await response.json();
      
      // Actualizar en el estado local
      if (isNew) {
        setPlans([...plans, savedPlan]);
        setSuccess(`✓ Plan "${editingPlan.name}" creado correctamente`);
      } else {
        setPlans(plans.map(p => p.id === savedPlan.id ? savedPlan : p));
        setSuccess(`✓ Plan "${editingPlan.name}" actualizado correctamente`);
      }
      
      setShowEditModal(false);
      setEditingPlan(null);
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Error saving plan:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar el plan');
      
      // Limpiar mensaje después de 5 segundos
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateField = (field: keyof Plan, value: any) => {
    if (!editingPlan) return;
    setEditingPlan({ ...editingPlan, [field]: value });
  };

  const handleUpdateLimit = (limitField: keyof PlanLimits, value: any) => {
    if (!editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      limits: { ...editingPlan.limits, [limitField]: value }
    });
  };

  const handleAddFeature = () => {
    if (!editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: [...editingPlan.features, '']
    });
  };

  const handleUpdateFeature = (index: number, value: string) => {
    if (!editingPlan) return;
    const newFeatures = [...editingPlan.features];
    newFeatures[index] = value;
    setEditingPlan({ ...editingPlan, features: newFeatures });
  };

  const handleRemoveFeature = (index: number) => {
    if (!editingPlan) return;
    setEditingPlan({
      ...editingPlan,
      features: editingPlan.features.filter((_, i) => i !== index)
    });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div className="flex-1">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Gestión de Planes</h3>
          <p className="text-xs sm:text-sm text-gray-600">Modifica precios, límites y características de los planes</p>
        </div>
        <button
          onClick={handleCreatePlan}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Nuevo Plan</span>
        </button>
      </div>

      {/* Mensajes de Error y Éxito */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <XMarkIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-900 text-sm">Error</h4>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="p-1 hover:bg-red-100 rounded"
          >
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
          <button
            onClick={() => setSuccess(null)}
            className="p-1 hover:bg-green-100 rounded"
          >
            <XMarkIcon className="w-4 h-4 text-green-600" />
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && !editingPlan && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Planes Grid - Mobile Optimized */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-6 hover:border-blue-400 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-base sm:text-lg font-bold text-gray-900">{plan.name}</h4>
              <button
                onClick={() => handleEditPlan(plan)}
                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                aria-label={`Editar plan ${plan.name}`}
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 mb-4">{plan.description}</p>

            <div className="mb-4">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">S/ {plan.price_monthly}</span>
                <span className="text-sm text-gray-600">/mes</span>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mt-1">
                S/ {plan.price_yearly}/año (20% desc.)
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-xs font-semibold text-gray-700 uppercase">Límites:</p>
              <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                <div>• Propiedades: {plan.limits.max_listings === 999999 ? 'Ilimitadas' : plan.limits.max_listings}</div>
                <div>• Imágenes: {plan.limits.max_images === 999999 ? 'Ilimitadas' : plan.limits.max_images}</div>
                <div>• Videos: {plan.limits.max_videos === 999999 ? 'Ilimitados' : plan.limits.max_videos}</div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700 uppercase">Características:</p>
              {plan.features.slice(0, 3).map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <CheckIcon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-gray-700">{feature}</span>
                </div>
              ))}
              {plan.features.length > 3 && (
                <p className="text-xs text-gray-500 italic">+{plan.features.length - 3} más</p>
              )}
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Edit Modal - Mobile Optimized */}
      {showEditModal && editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-2xl min-h-screen sm:min-h-0 sm:max-h-[90vh] flex flex-col">
            {/* Header - Sticky */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10 rounded-t-2xl sm:rounded-t-xl">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate pr-2">
                Editar: {editingPlan.name}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                aria-label="Cerrar modal"
              >
                <XMarkIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* Información Básica */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Información Básica</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={editingPlan.name}
                      onChange={(e) => handleUpdateField('name', e.target.value)}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea
                      value={editingPlan.description}
                      onChange={(e) => handleUpdateField('description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Precios */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Precios</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Precio Mensual (S/)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingPlan.price_monthly}
                      onChange={(e) => handleUpdateField('price_monthly', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Precio Anual (S/)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingPlan.price_yearly}
                      onChange={(e) => handleUpdateField('price_yearly', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Descuento: {((1 - (editingPlan.price_yearly / (editingPlan.price_monthly * 12))) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Límites */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">Límites</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Max. Propiedades</label>
                    <input
                      type="number"
                      value={editingPlan.limits.max_listings || 0}
                      onChange={(e) => handleUpdateLimit('max_listings', parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Usa 999999 para ilimitado</p>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Max. Imágenes</label>
                    <input
                      type="number"
                      value={editingPlan.limits.max_images || 0}
                      onChange={(e) => handleUpdateLimit('max_images', parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Max. Videos</label>
                    <input
                      type="number"
                      value={editingPlan.limits.max_videos || 0}
                      onChange={(e) => handleUpdateLimit('max_videos', parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Propiedades Destacadas</label>
                    <input
                      type="number"
                      value={editingPlan.limits.featured_listings || 0}
                      onChange={(e) => handleUpdateLimit('featured_listings', parseInt(e.target.value))}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Características */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Características</h4>
                  <button
                    onClick={handleAddFeature}
                    className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs sm:text-sm"
                  >
                    <PlusIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                    Agregar
                  </button>
                </div>
                <div className="space-y-2">
                  {editingPlan.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => handleUpdateFeature(index, e.target.value)}
                        placeholder="Característica"
                        className="flex-1 px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => handleRemoveFeature(index)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex-shrink-0"
                        aria-label="Eliminar característica"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spacer for mobile sticky buttons */}
              <div className="h-20 sm:h-0"></div>
            </div>

            {/* Footer - Sticky */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex gap-2 sm:gap-3 rounded-b-2xl sm:rounded-b-xl shadow-lg sm:shadow-none">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePlan}
                disabled={loading}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Guardar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
