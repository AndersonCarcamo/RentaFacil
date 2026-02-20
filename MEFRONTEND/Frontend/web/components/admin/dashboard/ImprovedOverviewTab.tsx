/**
 * ImprovedOverviewTab Component
 * Vista general mejorada con alertas, KPIs y gráficos
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  EyeIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { getAdminOverview, AdminOverview } from '@/lib/api/admin-dashboard';
import AlertsSection, { Alert } from './AlertsSection';
import KPICard, { KPIData } from './KPICard';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ImprovedOverviewTabProps {
  onTabChange?: (tab: 'analytics' | 'finances' | 'bookings' | 'users') => void;
}

export default function ImprovedOverviewTab({ onTabChange }: ImprovedOverviewTabProps) {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const overview = await getAdminOverview();
      console.log('Admin Overview Data:', overview);
      console.log('Analytics:', overview.analytics);
      console.log('Total Views Month:', overview.analytics?.total_views_month);
      setData(overview);
    } catch (err: any) {
      console.error('Error loading overview:', err);
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <ArrowPathIcon className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando métricas...</p>
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

  // Construir alertas
  const alerts: Alert[] = [];
  
  if (data.alerts.pending_verifications > 0) {
    alerts.push({
      id: 'pending_verifications',
      type: 'critical',
      title: 'Propiedades pendientes de verificación',
      description: `${data.alerts.pending_verifications} propiedades llevan más de 48 horas sin verificar`,
      count: data.alerts.pending_verifications,
      actionLabel: 'Revisar Ahora',
      onAction: () => {
        // TODO: Navigate to listings tab filtered by pending
        console.log('Navigate to pending verifications');
      },
    });
  }

  if (data.alerts.failed_payments_24h > 0) {
    alerts.push({
      id: 'failed_payments',
      type: 'critical',
      title: 'Pagos fallidos recientes',
      description: `${data.alerts.failed_payments_24h} pagos han fallado en las últimas 24 horas`,
      count: data.alerts.failed_payments_24h,
      actionLabel: 'Ver Pagos',
      onAction: () => {
        // TODO: Navigate to finances tab
        console.log('Navigate to failed payments');
      },
    });
  }

  // Construir KPIs
  const kpis: KPIData[] = [
    {
      id: 'users',
      label: 'Total Usuarios',
      value: data.users.total,
      changePercentage: data.users.growth_percentage,
      subtitle: `${data.users.new_today} nuevos hoy`,
      color: 'blue',
      icon: UsersIcon,
      format: 'number',
    },
    {
      id: 'listings',
      label: 'Propiedades Activas',
      value: data.listings.active,
      changePercentage: data.listings.growth_percentage,
      subtitle: `${data.listings.total} total`,
      color: 'green',
      icon: BuildingOfficeIcon,
      format: 'number',
    },
    {
      id: 'mrr',
      label: 'MRR (Ingresos Mensuales)',
      value: data.finances.mrr,
      changePercentage: data.finances.revenue_growth_percentage,
      subtitle: `${data.finances.active_subscriptions} suscripciones`,
      color: 'purple',
      icon: CurrencyDollarIcon,
      format: 'currency',
    },
    {
      id: 'revenue',
      label: 'Ingresos del Mes',
      value: data.finances.current_month_revenue,
      changePercentage: data.finances.revenue_growth_percentage,
      subtitle: 'Ingresos totales',
      color: 'yellow',
      icon: CreditCardIcon,
      format: 'currency',
    },
  ];

  return (
    <div className="space-y-5 animate-fadeIn px-2">
      {/* Header mejorado con estadísticas rápidas */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg shadow-sm border border-primary-300 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Vista General</h2>
            <p className="text-xs text-gray-600 flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Actualizado: {new Date(data.generated_at).toLocaleString('es-PE', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <button
            onClick={loadData}
            className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 font-semibold"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Actualizar
          </button>
        </div>
        
        {/* Quick stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="bg-white rounded-lg p-2.5 border border-primary-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs text-gray-500 mb-0.5">Sistema</p>
            <p className="text-sm font-bold text-primary-700">✓ Operativo</p>
          </div>
          <div className="bg-white rounded-lg p-2.5 border border-primary-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs text-gray-500 mb-0.5">Alertas</p>
            <p className={`text-sm font-bold ${alerts.length > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {alerts.length > 0 ? `⚠ ${alerts.length}` : '✓ 0'}
            </p>
          </div>
          <div className="bg-white rounded-lg p-2.5 border border-primary-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs text-gray-500 mb-0.5">Usuarios Hoy</p>
            <p className="text-sm font-bold text-primary-700">+{data.users.new_today}</p>
          </div>
          <div className="bg-white rounded-lg p-2.5 border border-primary-200 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-xs text-gray-500 mb-0.5">Nuevas Props</p>
            <p className="text-sm font-bold text-green-600">+{data.listings.new_today}</p>
          </div>
        </div>
      </div>

      {/* Alertas Críticas */}
      <AlertsSection alerts={alerts} loading={loading} />

      {/* KPIs Principales con mejor título */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-primary-600" />
            Métricas Principales
          </h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
            Comparación mensual
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <KPICard key={kpi.id} kpi={kpi} />
          ))}
        </div>
      </div>

      {/* Gráficos de Tendencia con mejor diseño */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tendencia de Usuarios y Propiedades */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-primary-600" />
              Tendencia de Crecimiento
            </h3>
            <span className="text-xs bg-primary-100 text-primary-700 px-2.5 py-1 rounded-full font-semibold">
              30 días
            </span>
          </div>
          {data.users.trend && data.users.trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.users.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  style={{ fontSize: '11px' }}
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis
                  stroke="#6B7280"
                  style={{ fontSize: '11px' }}
                  tick={{ fill: '#6B7280' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#22ACF5"
                  strokeWidth={2}
                  dot={false}
                  name="Usuarios"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">Datos de tendencia no disponibles</p>
                <p className="text-xs text-gray-500 mt-1">Backend no devuelve trend data</p>
              </div>
            </div>
          )}
        </div>

        {/* Ingresos Diarios */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <CurrencyDollarIcon className="w-5 h-5 text-secondary-600" />
              Ingresos Diarios
            </h3>
            <span className="text-xs bg-secondary-100 text-secondary-700 px-2.5 py-1 rounded-full font-semibold">
              30 días
            </span>
          </div>
          {data.finances.revenue_trend && data.finances.revenue_trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.finances.revenue_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  stroke="#6B7280"
                  style={{ fontSize: '11px' }}
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis
                  stroke="#6B7280"
                  style={{ fontSize: '11px' }}
                  tick={{ fill: '#6B7280' }}
                  tickFormatter={(value) => `S/ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  formatter={(value: any) =>
                    `S/ ${value.toLocaleString('es-PE', {
                      minimumFractionDigits: 2,
                    })}`
                  }
                />
                <Bar
                  dataKey="value"
                  fill="#F5C842"
                  radius={[8, 8, 0, 0]}
                  name="Ingresos"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <CurrencyDollarIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-600">Datos de ingresos no disponibles</p>
                <p className="text-xs text-gray-500 mt-1">Backend no devuelve revenue_trend</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Métricas Secundarias */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-lg border border-primary-300 p-4 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-sm">
                <UsersIcon className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-700">Usuarios Activos</p>
            </div>
            <span className="text-xs bg-primary-200 text-primary-800 px-2 py-0.5 rounded-full font-bold">7d</span>
          </div>
          <p className="text-3xl font-bold text-primary-700 mb-1">
            {data.users.active_7d.toLocaleString()}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-primary-200 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-primary-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${((data.users.active_7d / data.users.total) * 100)}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-primary-700">
              {((data.users.active_7d / data.users.total) * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg border border-green-300 p-4 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                <EyeIcon className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-700">Vistas (30 días)</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              data.analytics.views_growth_percentage > 0 
                ? 'bg-green-200 text-green-800' 
                : 'bg-red-200 text-red-800'
            }`}>
              {data.analytics.views_growth_percentage > 0 ? '↑' : '↓'}
              {Math.abs(data.analytics.views_growth_percentage)}%
            </span>
          </div>
          <p className="text-3xl font-bold text-green-700 mb-1">
            {data.analytics.total_views_month.toLocaleString()}
          </p>
          <p className="text-xs text-green-600 font-medium">
            vs. 30 días anteriores
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-lg border border-secondary-300 p-4 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-lg flex items-center justify-center shadow-sm">
                <CalendarDaysIcon className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-semibold text-gray-700">Reservas Activas</p>
            </div>
            <span className="text-xs bg-secondary-200 text-secondary-800 px-2 py-0.5 rounded-full font-bold">HOY</span>
          </div>
          <p className="text-3xl font-bold text-secondary-700 mb-1">
            {data.bookings.active.toLocaleString()}
          </p>
          <p className="text-xs text-secondary-600 font-medium flex items-center gap-1">
            <span className="inline-block w-2 h-2 bg-secondary-600 rounded-full animate-pulse"></span>
            Sistema Airbnb-style
          </p>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-primary-300 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-primary-600" />
            Acciones Rápidas
          </h3>
          <span className="text-xs bg-primary-200 text-primary-800 px-2.5 py-1 rounded-full font-bold">
            ACCESO DIRECTO
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => onTabChange?.('analytics')}
            className="group px-4 py-3 bg-white border border-primary-300 rounded-lg hover:bg-gradient-to-br hover:from-blue-50 hover:to-primary-50 hover:border-primary-400 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <div className="text-2xl mb-1 group-hover:scale-110 transition-transform duration-300">📊</div>
            <p className="text-sm font-bold text-primary-700">Analytics</p>
            <p className="text-xs text-gray-500 mt-0.5">Ver estadísticas</p>
          </button>
          <button
            onClick={() => onTabChange?.('finances')}
            className="group px-4 py-3 bg-white border border-primary-300 rounded-lg hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 hover:border-green-400 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <div className="text-2xl mb-1 group-hover:scale-110 transition-transform duration-300">💰</div>
            <p className="text-sm font-bold text-green-700">Finanzas</p>
            <p className="text-xs text-gray-500 mt-0.5">MRR, ARR, Churn</p>
          </button>
          <button
            onClick={() => onTabChange?.('bookings')}
            className="group px-4 py-3 bg-white border border-primary-300 rounded-lg hover:bg-gradient-to-br hover:from-amber-50 hover:to-yellow-50 hover:border-secondary-400 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <div className="text-2xl mb-1 group-hover:scale-110 transition-transform duration-300">📅</div>
            <p className="text-sm font-bold text-secondary-700">Reservas</p>
            <p className="text-xs text-gray-500 mt-0.5">Sistema bookings</p>
          </button>
          <button
            onClick={() => onTabChange?.('users')}
            className="group px-4 py-3 bg-white border border-primary-300 rounded-lg hover:bg-gradient-to-br hover:from-orange-50 hover:to-amber-50 hover:border-orange-400 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <div className="text-2xl mb-1 group-hover:scale-110 transition-transform duration-300">👥</div>
            <p className="text-sm font-bold text-orange-700">Usuarios</p>
            <p className="text-xs text-gray-500 mt-0.5">Roles y permisos</p>
          </button>
        </div>
      </div>
    </div>
  );
}
