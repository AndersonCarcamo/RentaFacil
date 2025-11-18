import React from 'react';
import {
  HomeIcon,
  BuildingOfficeIcon,
  PresentationChartBarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export type DashboardTab = 'overview' | 'properties' | 'analytics' | 'verification';

interface DashboardTabsProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

export const DashboardTabs: React.FC<DashboardTabsProps> = ({
  activeTab,
  onTabChange
}) => {
  const tabs: Array<{ id: DashboardTab; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Resumen', icon: <HomeIcon className="w-4 h-4" /> },
    { id: 'properties', label: 'Mis Propiedades', icon: <BuildingOfficeIcon className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analíticas', icon: <PresentationChartBarIcon className="w-4 h-4" /> },
    { id: 'verification', label: 'Verificación', icon: <ShieldCheckIcon className="w-4 h-4" /> }
  ];

  return (
    <div className="mb-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};
