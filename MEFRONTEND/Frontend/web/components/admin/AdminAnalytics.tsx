/**
 * AdminAnalytics Component
 * Dashboard de analíticas completo para administradores con datos REALES
 * Mobile-first responsive design con gráficos interactivos
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  CursorArrowRaysIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getAnalyticsSummary, AnalyticsSummary } from '@/lib/api/admin-dashboard';

type TimeRange = '7d' | '30d' | '90d';

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const data = await getAnalyticsSummary(days);
      setAnalytics(data);
    } catch (err: any) {
      console.error('Error loading analytics:', err);
      setError(err.message || 'Error al cargar analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <ArrowPathIcon className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 font-semibold mb-2">Error al cargar analytics</p>
        <p className="text-red-500 text-sm mb-4">{error || 'No se pudieron obtener los datos'}</p>
        <button
          onClick={loadAnalytics}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con selector de rango */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ChartBarIcon className="w-6 h-6" />
          Analytics Detallado
        </h3>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {range === '7d' ? '7 días' : range === '30d' ? '30 días' : '90 días'}
            </button>
          ))}
        </div>
      </div>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 font-medium">Total de Vistas</p>
            <EyeIcon className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {analytics.conversion.views.toLocaleString()}
          </p>
        </div>

        <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 font-medium">Total de Contactos</p>
            <CursorArrowRaysIcon className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">
            {analytics.conversion.contacts.toLocaleString()}
          </p>
        </div>

        <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 font-medium">Tasa de Conversión</p>
            <ArrowTrendingUpIcon className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-purple-600">
            {analytics.conversion.rate_percentage.toFixed(2)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">Vista → Contacto</p>
        </div>
      </div>

      {/* Gráfico de Eventos Diarios */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Actividad Diaria ({analytics.period.days} días)
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.daily_events}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(date) => new Date(date).toLocaleDateString('es-PE', { month: 'short', day: 'numeric' })}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="views" stroke="#3B82F6" name="Vistas" strokeWidth={2} />
            <Line type="monotone" dataKey="contacts" stroke="#10B981" name="Contactos" strokeWidth={2} />
            <Line type="monotone" dataKey="searches" stroke="#8B5CF6" name="Búsquedas" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top Búsquedas */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MagnifyingGlassIcon className="w-5 h-5" />
          Top Búsquedas ({analytics.top_searches.length})
        </h4>
        {analytics.top_searches.length > 0 ? (
          <div className="space-y-2">
            {analytics.top_searches.map((search, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                  <span className="text-sm font-medium text-gray-700">{search.term}</span>
                </div>
                <span className="text-sm font-semibold text-purple-600">
                  {search.count.toLocaleString()} búsquedas
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No hay búsquedas registradas en este período</p>
        )}
      </div>

      {/* Top Propiedades */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Propiedades Más Vistas ({analytics.top_listings.length})
        </h4>
        {analytics.top_listings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">#</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Propiedad</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600">Vistas</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600">Visitantes Únicos</th>
                </tr>
              </thead>
              <tbody>
                {analytics.top_listings.map((listing, index) => (
                  <tr key={listing.listing_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-3 text-sm font-bold text-gray-400">#{index + 1}</td>
                    <td className="py-3 px-3 text-sm text-gray-700">{listing.title}</td>
                    <td className="py-3 px-3 text-sm text-right font-semibold text-blue-600">
                      {listing.views.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-sm text-right text-gray-600">
                      {listing.unique_visitors.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No hay datos de propiedades en este período</p>
        )}
      </div>

      {/* Distribución de Eventos */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Distribución de Eventos
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(analytics.event_distribution).map(([type, count]) => {
            const eventLabels: Record<string, { label: string; bgColor: string; textColor: string; borderColor: string }> = {
              view: { 
                label: 'Vistas', 
                bgColor: 'bg-blue-50', 
                textColor: 'text-blue-600',
                borderColor: 'border-blue-200'
              },
              contact: { 
                label: 'Contactos', 
                bgColor: 'bg-green-50', 
                textColor: 'text-green-600',
                borderColor: 'border-green-200'
              },
              search: { 
                label: 'Búsquedas', 
                bgColor: 'bg-purple-50', 
                textColor: 'text-purple-600',
                borderColor: 'border-purple-200'
              },
              favorite: { 
                label: 'Favoritos', 
                bgColor: 'bg-yellow-50', 
                textColor: 'text-yellow-600',
                borderColor: 'border-yellow-200'
              },
            };
            
            const eventInfo = eventLabels[type] || { 
              label: type, 
              bgColor: 'bg-gray-50',
              textColor: 'text-gray-600',
              borderColor: 'border-gray-200'
            };
            
            return (
              <div key={type} className={`p-4 ${eventInfo.bgColor} border ${eventInfo.borderColor} rounded-lg`}>
                <p className="text-xs text-gray-600 mb-1">{eventInfo.label}</p>
                <p className={`text-2xl font-bold ${eventInfo.textColor}`}>
                  {(count as number).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timestamp */}
      <div className="text-xs text-gray-500 text-right">
        Período: {new Date(analytics.period.start_date).toLocaleDateString('es-PE')} - {new Date(analytics.period.end_date).toLocaleDateString('es-PE')}
      </div>
    </div>
  );
}
