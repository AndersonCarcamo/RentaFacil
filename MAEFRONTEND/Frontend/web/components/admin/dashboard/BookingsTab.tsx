/**
 * BookingsTab Component
 * Tab de reservas con calendario, comisiones y análisis
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarDaysIcon,
  CreditCardIcon,
  ChartPieIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import {
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
  LineChart,
  Line,
} from 'recharts';
import { getBookingsSummary, BookingsSummary } from '@/lib/api/admin-dashboard';
import KPICard, { KPIData } from './KPICard';

export default function BookingsTab() {
  const [data, setData] = useState<BookingsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const bookings = await getBookingsSummary();
      setData(bookings);
    } catch (err: any) {
      console.error('Error loading bookings:', err);
      setError(err.message || 'Error al cargar datos de reservas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <ArrowPathIcon className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando datos de reservas...</p>
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
      id: 'total_bookings',
      label: 'Reservas Totales del Mes',
      value: Object.values(data.bookings_by_status).reduce(
        (sum, item) => sum + item.count,
        0
      ),
      subtitle: 'Todas las reservas',
      color: 'blue',
      icon: CalendarDaysIcon,
      format: 'number',
    },
    {
      id: 'platform_fees',
      label: 'Comisiones de Plataforma',
      value: data.platform_fees.total,
      subtitle: `${data.platform_fees.booking_count} reservas completadas`,
      color: 'green',
      icon: CreditCardIcon,
      format: 'currency',
    },
    {
      id: 'completed_bookings',
      label: 'Reservas Completadas',
      value: data.bookings_by_status.completed?.count || 0,
      subtitle: `S/ ${(
        data.bookings_by_status.completed?.total_value || 0
      ).toLocaleString('es-PE')} en ventas`,
      color: 'purple',
      icon: CheckCircleIcon,
      format: 'number',
    },
    {
      id: 'cancellation_rate',
      label: 'Tasa de Cancelación',
      value: data.cancellation_rate.toFixed(1),
      subtitle: `${data.bookings_by_status.cancelled_by_guest?.count || 0} cancelaciones`,
      color: data.cancellation_rate > 15 ? 'red' : 'yellow',
      icon: XCircleIcon,
      format: 'percentage',
    },
  ];

  // Datos para gráfico de estado de reservas
  const statusData = Object.entries(data.bookings_by_status).map(([status, info]) => ({
    name: formatStatus(status),
    count: info.count,
    value: info.total_value,
  }));

  // Datos para top propiedades
  const topPropertiesData = data.top_properties.slice(0, 10);

  // Colores para gráficos
  const STATUS_COLORS: Record<string, string> = {
    pending_confirmation: '#F59E0B',
    confirmed: '#3B82F6',
    reservation_paid: '#8B5CF6',
    checked_in: '#10B981',
    completed: '#059669',
    cancelled_by_guest: '#EF4444',
    cancelled_by_host: '#DC2626',
    cancelled_no_payment: '#B91C1C',
    refunded: '#9CA3AF',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reservas & Bookings</h2>
          <p className="text-sm text-gray-600">
            Análisis de reservas estilo Airbnb y comisiones de plataforma
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

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de Reservas por Estado */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ChartPieIcon className="w-5 h-5 text-purple-600" />
            Reservas por Estado
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : null
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {statusData.map((entry, index) => {
                  const originalStatus = Object.keys(data.bookings_by_status)[index];
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[originalStatus] || '#6B7280'}
                    />
                  );
                })}
              </Pie>
              <Tooltip
                formatter={(value: any, name: string) => [
                  `${value} reservas`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Valor Total por Estado */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <CreditCardIcon className="w-5 h-5 text-green-600" />
            Valor Total por Estado
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                type="number"
                stroke="#6B7280"
                tickFormatter={(value) => `S/ ${(value / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#6B7280"
                width={120}
                style={{ fontSize: '12px' }}
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
              <Bar
                dataKey="value"
                fill="#10B981"
                radius={[0, 8, 8, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top 10 Propiedades por Ingresos */}
      {topPropertiesData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Top 10 Propiedades por Ingresos
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topPropertiesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="title"
                stroke="#6B7280"
                angle={-45}
                textAnchor="end"
                height={150}
                style={{ fontSize: '11px' }}
              />
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
                formatter={(value: any, name: string) => {
                  if (name === 'total_revenue') {
                    return [
                      `S/ ${value.toLocaleString('es-PE', {
                        minimumFractionDigits: 2,
                      })}`,
                      'Ingresos',
                    ];
                  }
                  if (name === 'platform_fees') {
                    return [
                      `S/ ${value.toLocaleString('es-PE', {
                        minimumFractionDigits: 2,
                      })}`,
                      'Comisiones',
                    ];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Bar
                dataKey="total_revenue"
                name="Ingresos Totales"
                fill="#8B5CF6"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="platform_fees"
                name="Comisiones Plataforma"
                fill="#10B981"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tarjetas de métricas adicionales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <CalendarDaysIcon className="w-6 h-6 text-blue-600" />
            <p className="text-sm font-medium text-gray-600">Reservas Confirmadas</p>
          </div>
          <p className="text-3xl font-bold text-blue-700">
            {data.bookings_by_status.confirmed?.count || 0}
          </p>
          <p className="text-xs text-gray-500 mt-2">Esperando pago de reserva</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <ClockIcon className="w-6 h-6 text-purple-600" />
            <p className="text-sm font-medium text-gray-600">Pendientes</p>
          </div>
          <p className="text-3xl font-bold text-purple-700">
            {data.bookings_by_status.pending_confirmation?.count || 0}
          </p>
          <p className="text-xs text-gray-500 mt-2">Esperando confirmación</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircleIcon className="w-6 h-6 text-green-600" />
            <p className="text-sm font-medium text-gray-600">Check-in Realizado</p>
          </div>
          <p className="text-3xl font-bold text-green-700">
            {data.bookings_by_status.checked_in?.count || 0}
          </p>
          <p className="text-xs text-gray-500 mt-2">En progreso actualmente</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <CreditCardIcon className="w-6 h-6 text-yellow-600" />
            <p className="text-sm font-medium text-gray-600">Comisión Promedio</p>
          </div>
          <p className="text-3xl font-bold text-yellow-700">
            S/{' '}
            {data.platform_fees.booking_count > 0
              ? (
                  data.platform_fees.total / data.platform_fees.booking_count
                ).toFixed(2)
              : '0.00'}
          </p>
          <p className="text-xs text-gray-500 mt-2">Por reserva completada</p>
        </div>
      </div>
    </div>
  );
}

// Helper function para formatear estados
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    pending_confirmation: 'Pendiente',
    confirmed: 'Confirmada',
    reservation_paid: 'Reserva Pagada',
    checked_in: 'Check-in',
    completed: 'Completada',
    cancelled_by_guest: 'Cancelada (Huésped)',
    cancelled_by_host: 'Cancelada (Host)',
    cancelled_no_payment: 'Cancelada (Sin Pago)',
    refunded: 'Reembolsada',
  };
  return statusMap[status] || status;
}
