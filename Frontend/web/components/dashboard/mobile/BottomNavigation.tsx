import React from 'react';
import type { DashboardTab } from '../DashboardTabs';
import {
  HomeIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeSolidIcon,
  BuildingOfficeIcon as BuildingSolidIcon,
  ChartBarIcon as ChartSolidIcon,
  ShieldCheckIcon as ShieldSolidIcon
} from '@heroicons/react/24/solid';

interface BottomNavigationProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange
}) => {
  const tabs: Array<{
    id: DashboardTab;
    label: string;
    icon: React.ReactNode;
    iconActive: React.ReactNode;
  }> = [
    {
      id: 'overview',
      label: 'Inicio',
      icon: <HomeIcon className="w-6 h-6" />,
      iconActive: <HomeSolidIcon className="w-6 h-6" />
    },
    {
      id: 'properties',
      label: 'Propiedades',
      icon: <BuildingOfficeIcon className="w-6 h-6" />,
      iconActive: <BuildingSolidIcon className="w-6 h-6" />
    },
    {
      id: 'analytics',
      label: 'Analítica',
      icon: <ChartBarIcon className="w-6 h-6" />,
      iconActive: <ChartSolidIcon className="w-6 h-6" />
    },
    {
      id: 'verification',
      label: 'Verificar',
      icon: <ShieldCheckIcon className="w-6 h-6" />,
      iconActive: <ShieldSolidIcon className="w-6 h-6" />
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom">
      <div className="grid grid-cols-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-2 px-1 transition-all ${
                isActive
                  ? 'text-blue-600'
                  : 'text-gray-500 active:bg-gray-100'
              }`}
            >
              <div className="relative">
                {isActive ? tab.iconActive : tab.icon}
                {/* Indicador de tab activo */}
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full" />
                )}
              </div>
              <span className={`text-xs mt-1 font-medium ${
                isActive ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
