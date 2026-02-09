import React from 'react';
import { AnalyticsMetricCard } from './AnalyticsMetricCard';
import { EyeIcon, EnvelopeIcon, UsersIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface ListingStats {
  total_views: number;
  total_leads: number;
  total_favorites: number;
  last_30_days: {
    views: number;
    contacts: number;
    unique_visitors: number;
  };
  last_7_days: {
    views: number;
  };
  daily_stats: Array<{
    date: string;
    views: number;
  }>;
}

interface AnalyticsMetricsGridProps {
  stats: ListingStats;
}

export const AnalyticsMetricsGrid: React.FC<AnalyticsMetricsGridProps> = ({ stats }) => {
  const conversionRate = stats.total_views > 0
    ? ((stats.total_leads / stats.total_views) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <AnalyticsMetricCard
        title="Vistas Totales"
        value={stats.total_views}
        subtitle={`${stats.last_30_days.views} en los últimos 30 días`}
        icon={<EyeIcon className="w-6 h-6" />}
        iconBgColor="bg-blue-100"
        iconColor="text-blue-600"
      />

      <AnalyticsMetricCard
        title="Contactos"
        value={stats.total_leads}
        subtitle={`${stats.last_30_days.contacts} en los últimos 30 días`}
        icon={<EnvelopeIcon className="w-6 h-6" />}
        iconBgColor="bg-green-100"
        iconColor="text-green-600"
      />

      <AnalyticsMetricCard
        title="Visitantes Únicos"
        value={stats.last_30_days.unique_visitors}
        subtitle="Últimos 30 días"
        icon={<UsersIcon className="w-6 h-6" />}
        iconBgColor="bg-purple-100"
        iconColor="text-purple-600"
      />

      <AnalyticsMetricCard
        title="Tasa de Conversión"
        value={`${conversionRate}%`}
        subtitle="Contactos / Vistas"
        icon={<ChartBarIcon className="w-6 h-6" />}
        iconBgColor="bg-orange-100"
        iconColor="text-orange-600"
      />
    </div>
  );
};
