import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { getAgentStats, getAgentListingsComparison, AgentStats, AgentListingsComparison } from '@/lib/api/agent-analytics';
import { AgentAnalyticsMetrics } from '@/components/analytics/AgentAnalyticsMetrics';
import { AgentListingsTable } from '@/components/analytics/AgentListingsTable';
import { AnalyticsLineChart } from '@/components/analytics/AnalyticsLineChart';
import { AnalyticsProjections } from '@/components/analytics/AnalyticsProjections';
import { AnalyticsDailyChart } from '@/components/analytics/AnalyticsDailyChart';
import { ChartBarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const AgentAnalyticsPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [comparison, setComparison] = useState<AgentListingsComparison | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [projectedData, setProjectedData] = useState<Array<{ date: string; views: number; contacts: number }>>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener user_id del localStorage o de la sesión
      const user = localStorage.getItem('user');
      if (!user) {
        router.push('/login');
        return;
      }

      const userData = JSON.parse(user);
      const agentId = userData.id;

      // Cargar stats y comparación en paralelo
      const [statsData, comparisonData] = await Promise.all([
        getAgentStats(agentId),
        getAgentListingsComparison(agentId)
      ]);

      setStats(statsData);
      setComparison(comparisonData);
    } catch (err: any) {
      console.error('Error loading agent analytics:', err);
      setError(err.message || 'Error al cargar analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <ArrowPathIcon className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !stats) {
    return (
      <DashboardLayout>
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
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <ChartBarIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Mis Analytics
              </h1>
              <p className="text-sm text-gray-500">
                Rendimiento de tus {stats.total_listings} propiedades
              </p>
            </div>
          </div>
          <button
            onClick={loadAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Actualizar
          </button>
        </div>

        {/* Métricas principales */}
        <AgentAnalyticsMetrics stats={stats} />

        {/* Gráficos de tendencias */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnalyticsDailyChart dailyStats={stats.daily_stats} />
          
          <AnalyticsProjections
            historicalData={stats.daily_stats.map((day) => ({
              date: day.date,
              views: day.views,
              contacts: day.contacts
            }))}
            projectionDays={7}
            onProjectionsCalculated={setProjectedData}
          />
        </div>

        {/* Gráfico de líneas completo */}
        <AnalyticsLineChart
          data={stats.daily_stats.map((day) => ({
            date: day.date,
            views: day.views,
            contacts: day.contacts
          }))}
          projectedData={projectedData}
          title="Tendencias de Vistas y Contactos (Todas tus propiedades)"
          showViews={true}
          showContacts={true}
        />

        {/* Top propiedades por rendimiento */}
        {stats.listings_performance.length > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Top Propiedades por Rendimiento
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.listings_performance.slice(0, 6).map((listing, index) => (
                <div
                  key={listing.listing_id}
                  className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-500">#{index + 1}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      listing.status === 'published'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {listing.status === 'published' ? 'Publicado' : 'Inactivo'}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm mb-3 line-clamp-2">
                    {listing.title}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">Vistas</p>
                      <p className="font-semibold text-gray-900">{listing.views.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Contactos</p>
                      <p className="font-semibold text-green-600">{listing.contacts.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Únicos</p>
                      <p className="font-semibold text-purple-600">{listing.unique_visitors.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Conversión</p>
                      <p className="font-semibold text-blue-600">{listing.conversion_rate.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabla comparativa detallada */}
        {comparison && comparison.listings.length > 0 && (
          <AgentListingsTable listings={comparison.listings} />
        )}

        {/* Mensaje si no hay propiedades */}
        {stats.total_listings === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <ChartBarIcon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay propiedades publicadas
            </h3>
            <p className="text-gray-600 mb-4">
              Publica tu primera propiedad para ver estadísticas de rendimiento.
            </p>
            <button
              onClick={() => router.push('/dashboard/listings/new')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Publicar Propiedad
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AgentAnalyticsPage;
