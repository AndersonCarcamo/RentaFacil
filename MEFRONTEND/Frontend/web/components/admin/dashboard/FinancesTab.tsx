/**
 * FinancesTab Component
 * Tab de finanzas con MRR, ARR, churn rate y gráficos detallados
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { getFinancesSummary, FinancesSummary } from '@/lib/api/admin-dashboard';
import KPICard, { KPIData } from './KPICard';

export default function FinancesTab() {
  const [data, setData] = useState<FinancesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const finances = await getFinancesSummary();
      setData(finances);
    } catch (err: any) {
      console.error('Error loading finances:', err);
      setError(err.message || 'Error al cargar datos financieros');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <ArrowPathIcon className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando datos financieros...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 font-semibold mb-2">Error al cargar datos</p>
        <p className="text-red-500 text-sm mb-4">{error}</p>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // KPIs principales
  const mainKPIs: KPIData[] = [
    {
      id: 'mrr',
      label: 'MRR (Monthly Recurring Revenue)',
      value: data.mrr.total,
      previousValue: data.mrr.total - data.mrr.change,
      changePercentage: data.mrr.growth_percentage,
      subtitle: `${data.mrr.active_subscriptions} suscripciones activas`,
      color: 'purple',
      icon: CurrencyDollarIcon,
      format: 'currency',
      trend: data.mrr.trend,
    },
    {
      id: 'arr',
      label: 'ARR (Annual Recurring Revenue)',
      value: data.mrr.total * 12,
      subtitle: 'Proyección anual',
      color: 'blue',
      icon: ArrowTrendingUpIcon,
      format: 'currency',
    },
    {
      id: 'churn',
      label: 'Churn Rate',
      value: data.churn.rate.toFixed(1),
      subtitle: `${data.churn.cancelled} cancelaciones este mes`,
      color: data.churn.rate > 5 ? 'red' : 'green',
      icon: UserGroupIcon,
      format: 'percentage',
    },
    {
      id: 'total_revenue',
      label: 'Ingresos Totales del Mes',
      value: data.total_revenue.amount,
      previousValue: data.total_revenue.amount - data.total_revenue.change,
      changePercentage: data.total_revenue.growth_percentage,
      subtitle: `${data.total_revenue.transaction_count} transacciones`,
      color: 'green',
      icon: ChartBarIcon,
      format: 'currency',
    },
  ];

  // Datos para gráfico de MRR por plan
  const mrrByPlanData = Object.entries(data.mrr_by_plan).map(([plan, amount]) => ({
    name: plan.charAt(0).toUpperCase() + plan.slice(1),
    mrr: amount,
    arr: amount * 12,
  }));

  // Colores para el gráfico de pie
  const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Finanzas</h2>
          <p className="text-sm text-gray-600">
            Métricas de ingresos recurrentes y crecimiento financiero
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <ArrowPathIcon className="w-5 h-5" />
          Actualizar
        </button>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainKPIs.map((kpi) => (
          <KPICard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR Trend */}
        {data.mrr.trend && data.mrr.trend.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Tendencia de MRR
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.mrr.trend}>
                <defs>
                  <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#6B7280"
                  style={{ fontSize: '12px' }}
                  tickFormatter={(value) => `S/ ${(value / 1000).toFixed(1)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                  formatter={(value: any) =>
                    `S/ ${value.toLocaleString('es-PE', {
                      minimumFractionDigits: 2,
                    })}`
                  }
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorMRR)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* MRR by Plan - Pie Chart */}
        {mrrByPlanData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              MRR por Tipo de Plan
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mrrByPlanData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="mrr"
                >
                  {mrrByPlanData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) =>
                    `S/ ${value.toLocaleString('es-PE', {
                      minimumFractionDigits: 2,
                    })}`
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* MRR by Plan - Bar Chart */}
      {mrrByPlanData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Comparación MRR vs ARR por Plan
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={mrrByPlanData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" />
              <YAxis
                stroke="#6B7280"
                tickFormatter={(value) => `S/ ${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                }}
                formatter={(value: any) =>
                  `S/ ${value.toLocaleString('es-PE', {
                    minimumFractionDigits: 2,
                  })}`
                }
              />
              <Legend />
              <Bar dataKey="mrr" name="MRR Mensual" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
              <Bar dataKey="arr" name="ARR Anual" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Métricas adicionales */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200 p-5">
          <p className="text-sm text-gray-600 mb-2">Suscripciones Activas</p>
          <p className="text-3xl font-bold text-purple-700">
            {data.mrr.active_subscriptions}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {data.mrr.growth_percentage > 0 ? '+' : ''}
            {data.mrr.growth_percentage.toFixed(1)}% vs mes anterior
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-5">
          <p className="text-sm text-gray-600 mb-2">MRR Promedio por Suscripción</p>
          <p className="text-3xl font-bold text-green-700">
            S/ {(data.mrr.total / data.mrr.active_subscriptions).toLocaleString('es-PE', {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="text-xs text-gray-500 mt-2">Por usuario activo</p>
        </div>

        <div className={`bg-gradient-to-br rounded-xl border-2 p-5 ${
          data.churn.rate > 5
            ? 'from-red-50 to-orange-50 border-red-200'
            : 'from-green-50 to-emerald-50 border-green-200'
        }`}>
          <p className="text-sm text-gray-600 mb-2">Estado de Churn</p>
          <p className={`text-3xl font-bold ${
            data.churn.rate > 5 ? 'text-red-700' : 'text-green-700'
          }`}>
            {data.churn.rate > 5 ? '⚠️ Alto' : '✅ Saludable'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {data.churn.rate.toFixed(1)}% este mes
          </p>
        </div>
      </div>
    </div>
  );
}
