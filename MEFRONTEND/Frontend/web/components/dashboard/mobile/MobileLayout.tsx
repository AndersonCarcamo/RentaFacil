import React from 'react';
import { BottomNavigation } from './BottomNavigation';
import { MobileHeader } from './MobileHeader';
import type { DashboardTab } from '../DashboardTabs';

interface MobileLayoutProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  userName?: string;
  children: React.ReactNode;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  activeTab,
  onTabChange,
  userName,
  children
}) => {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header fijo en la parte superior */}
      <MobileHeader userName={userName} />
      
      {/* Contenido con padding para header y bottom nav */}
      <div className="pt-16 pb-4 px-4">
        {children}
      </div>
      
      {/* Navegación inferior fija */}
      <BottomNavigation 
        activeTab={activeTab} 
        onTabChange={onTabChange} 
      />
    </div>
  );
};
