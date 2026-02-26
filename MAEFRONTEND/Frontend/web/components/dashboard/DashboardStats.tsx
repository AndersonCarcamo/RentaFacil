import React from 'react';
import { StatsCard } from './StatsCard';
import {
  HomeIcon,
  ChartBarIcon,
  EyeIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';

interface DashboardStatsProps {
  activeProperties: number;
  totalProperties: number;
  activeAirbnbProperties: number;
  airbnbProperties: number;
  totalViews: number;
  totalContacts: number;
  planName: string;
  maxActiveListings: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  activeProperties,
  totalProperties,
  activeAirbnbProperties,
  airbnbProperties,
  totalViews,
  totalContacts,
  planName,
  maxActiveListings
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Propiedades Activas con límite de plan */}
      <StatsCard
        label="Propiedades Activas"
        value={activeProperties}
        sublabel={`Plan ${planName}`}
        icon={<HomeIcon className="w-6 h-6 text-blue-600" />}
        iconBgColor="bg-blue-100"
        progress={{
          current: activeProperties,
          max: maxActiveListings,
          showBar: true
        }}
      />

      {/* Propiedades Airbnb */}
      <StatsCard
        label="Propiedades Airbnb"
        value={activeAirbnbProperties}
        sublabel={`${airbnbProperties} total (${activeAirbnbProperties} activas)`}
        icon={<ChartBarIcon className="w-6 h-6 text-orange-600" />}
        iconBgColor="bg-orange-100"
      />

      {/* Vistas Totales */}
      <StatsCard
        label="Vistas Totales"
        value={totalViews.toLocaleString()}
        sublabel={
          totalProperties > 0 
            ? `En ${totalProperties} propiedad${totalProperties !== 1 ? 'es' : ''}`
            : 'Sin propiedades'
        }
        icon={<EyeIcon className="w-6 h-6 text-yellow-600" />}
        iconBgColor="bg-yellow-100"
      />

      {/* Contactos */}
      <StatsCard
        label="Contactos"
        value={totalContacts.toLocaleString()}
        sublabel={totalProperties > 0 ? 'Total de consultas' : 'Sin propiedades'}
        icon={<ChatBubbleLeftEllipsisIcon className="w-6 h-6 text-purple-600" />}
        iconBgColor="bg-purple-100"
      />
    </div>
  );
};
