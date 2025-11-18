/**
 * AdminPlansManager Component
 * Gestión de planes de suscripción (precios, límites, características)
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  PencilIcon,
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  CurrencyDollarIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface PlanLimits {
  max_listings?: number;
  max_images?: number;
  max_videos?: number;
  featured_listings?: number;
  analytics_access?: boolean;
  priority_support?: boolean;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: PlanLimits;
  active: boolean;
  sort_order: number;
}

export default function AdminPlansManager() {
  const [plans, setPlans] = useState<Plan[]>([
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

  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan({ ...plan });
    setShowEditModal(true);
  };

  const handleSavePlan = () => {
    if (!editingPlan) return;

    setPlans(plans.map(p => p.id === editingPlan.id ? editingPlan : p));
    setShowEditModal(false);
    setEditingPlan(null);

    // TODO: Guardar en backend
    console.log('💾 Plan guardado:', editingPlan);
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
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Gestión de Planes</h3>
        <p className="text-sm text-gray-600">Modifica precios, límites y características de los planes</p>
      </div>

      {/* Planes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-900">{plan.name}</h4>
              <button
                onClick={() => handleEditPlan(plan)}
                className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">{plan.description}</p>

            <div className="mb-4">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">S/ {plan.price_monthly}</span>
                <span className="text-gray-600">/mes</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">
                S/ {plan.price_yearly}/año (20% desc.)
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-xs font-semibold text-gray-700 uppercase">Límites:</p>
              <div className="text-sm text-gray-600 space-y-1">
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
                  <span className="text-sm text-gray-700">{feature}</span>
                </div>
              ))}
              {plan.features.length > 3 && (
                <p className="text-xs text-gray-500 italic">+{plan.features.length - 3} más</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Editar Plan: {editingPlan.name}</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Información Básica */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Información Básica</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input
                      type="text"
                      value={editingPlan.name}
                      onChange={(e) => handleUpdateField('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea
                      value={editingPlan.description}
                      onChange={(e) => handleUpdateField('description', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Precios */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Precios</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio Mensual (S/)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingPlan.price_monthly}
                      onChange={(e) => handleUpdateField('price_monthly', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio Anual (S/)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingPlan.price_yearly}
                      onChange={(e) => handleUpdateField('price_yearly', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Descuento: {((1 - (editingPlan.price_yearly / (editingPlan.price_monthly * 12))) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Límites */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Límites</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max. Propiedades</label>
                    <input
                      type="number"
                      value={editingPlan.limits.max_listings || 0}
                      onChange={(e) => handleUpdateLimit('max_listings', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Usa 999999 para ilimitado</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max. Imágenes</label>
                    <input
                      type="number"
                      value={editingPlan.limits.max_images || 0}
                      onChange={(e) => handleUpdateLimit('max_images', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max. Videos</label>
                    <input
                      type="number"
                      value={editingPlan.limits.max_videos || 0}
                      onChange={(e) => handleUpdateLimit('max_videos', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Propiedades Destacadas</label>
                    <input
                      type="number"
                      value={editingPlan.limits.featured_listings || 0}
                      onChange={(e) => handleUpdateLimit('featured_listings', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Características */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Características</h4>
                  <button
                    onClick={handleAddFeature}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                  >
                    <PlusIcon className="w-4 h-4" />
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
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={() => handleRemoveFeature(index)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePlan}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <CheckIcon className="w-5 h-5" />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
