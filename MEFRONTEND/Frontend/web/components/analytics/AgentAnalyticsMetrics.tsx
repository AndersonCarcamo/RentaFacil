import React from 'react';
import { 
  EyeIcon, 
  ChatBubbleLeftEllipsisIcon, 
  HomeIcon,
  UsersIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';
import { AgentStats } from '@/lib/api/agent-analytics';

interface AgentAnalyticsMetricsProps {
  stats: AgentStats;
}

export const AgentAnalyticsMetrics: React.FC<AgentAnalyticsMetricsProps> = ({ stats }) => {
  const metrics = [
    {
      label: 'Propiedades Activas',
      value: stats.active_listings,
      subtitle: `${stats.total_listings} total`,
      icon: <HomeIcon className="w-6 h-6" />,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    {
      label: 'Vistas Totales',
      value: stats.last_30_days.views.toLocaleString(),
      subtitle: 'Últimos 30 días',
      icon: <EyeIcon className="w-6 h-6" />,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200'
    },
    {
      label: 'Contactos',
      value: stats.last_30_days.contacts.toLocaleString(),
      subtitle: 'Últimos 30 días',
      icon: <ChatBubbleLeftEllipsisIcon className="w-6 h-6" />,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200'
    },
    {
      label: 'Visitantes Únicos',
      value: stats.last_30_days.unique_visitors.toLocaleString(),
      subtitle: `${((stats.last_30_days.unique_visitors / stats.last_30_days.views) * 100).toFixed(1)}% de vistas`,
      icon: <UsersIcon className="w-6 h-6" />,
      color: 'orange',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-200'
    },
    {
      label: 'Tasa de Conversión',
      value: `${stats.last_30_days.conversion_rate}%`,
      subtitle: 'Contactos / Vistas',
      icon: <ChartBarIcon className="w-6 h-6" />,
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      borderColor: 'border-indigo-200'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className={`${metric.bgColor} rounded-xl border ${metric.borderColor} p-5 transition-all hover:shadow-md`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg ${metric.bgColor} ${metric.iconColor}`}>
              {metric.icon}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">{metric.label}</p>
            <p className={`text-3xl font-bold ${metric.iconColor}`}>
              {metric.value}
            </p>
            <p className="text-xs text-gray-500">{metric.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
