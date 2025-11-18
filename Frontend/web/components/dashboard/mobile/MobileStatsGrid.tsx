import React from 'react';
import { MobileStatsCard } from './MobileStatsCard';
import {
  HomeIcon,
  ChartBarIcon,
  EyeIcon,
  ChatBubbleLeftEllipsisIcon
} from '@heroicons/react/24/outline';

interface MobileStatsGridProps {
  activeProperties: number;
  totalProperties: number;
  activeAirbnbProperties: number;
  airbnbProperties: number;
  totalViews: number;
  totalContacts: number;
  planName: string;
  maxActiveListings: number;
}

export const MobileStatsGrid: React.FC<MobileStatsGridProps> = ({
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
    <div className="space-y-3">
      {/* Stats principal - Propiedades Activas */}
      <MobileStatsCard
        label="Propiedades Activas"
        value={activeProperties}
        sublabel={`Plan ${planName}`}
        icon={<HomeIcon className="w-5 h-5" />}
        color="blue"
        progress={{
          current: activeProperties,
          max: maxActiveListings
        }}
      />

      {/* Grid 2x2 para stats secundarias */}
      <div className="grid grid-cols-2 gap-3">
        <MobileStatsCard
          label="Airbnb"
          value={activeAirbnbProperties}
          sublabel={`${airbnbProperties} total`}
          icon={<ChartBarIcon className="w-5 h-5" />}
          color="orange"
        />

        <MobileStatsCard
          label="Vistas"
          value={totalViews.toLocaleString()}
          sublabel={totalProperties > 0 ? `${totalProperties} props` : 'Sin props'}
          icon={<EyeIcon className="w-5 h-5" />}
          color="yellow"
        />
      </div>

      {/* Contactos en card completo */}
      <MobileStatsCard
        label="Contactos Totales"
        value={totalContacts.toLocaleString()}
        sublabel="Total de consultas recibidas"
        icon={<ChatBubbleLeftEllipsisIcon className="w-5 h-5" />}
        color="purple"
      />
    </div>
  );
};
