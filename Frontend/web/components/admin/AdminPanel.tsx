/**
 * AdminPanel Component
 * Panel de administración para usuarios administradores
 * Con diseño responsive mobile-first
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  Bars3Icon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import AdminPlansManager from './SystemPlansManager';
import AdminManagement from './AdminManagement';
import AdminAnalytics from './AdminAnalytics';
import ListingsManager from './ListingsManager';
import ImprovedOverviewTab from './dashboard/ImprovedOverviewTab';
import FinancesTab from './dashboard/FinancesTab';
import BookingsTab from './dashboard/BookingsTab';
import UsersTab from './dashboard/UsersTab';

interface AdminPanelProps {
  userEmail: string;
}

type AdminTab = 'overview' | 'users' | 'listings' | 'subscriptions' | 'finances' | 'bookings' | 'analytics' | 'settings';

export default function AdminPanel({ userEmail }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const tabs = [
    { id: 'overview' as AdminTab, name: 'Vista General', icon: ChartBarIcon },
    { id: 'users' as AdminTab, name: 'Usuarios', icon: UsersIcon },
    { id: 'listings' as AdminTab, name: 'Propiedades', icon: BuildingOfficeIcon },
    { id: 'subscriptions' as AdminTab, name: 'Suscripciones', icon: CreditCardIcon },
    { id: 'finances' as AdminTab, name: 'Finanzas', icon: CurrencyDollarIcon },
    { id: 'bookings' as AdminTab, name: 'Reservas', icon: CalendarDaysIcon },
    { id: 'analytics' as AdminTab, name: 'Analíticas', icon: ChartBarIcon },
    { id: 'settings' as AdminTab, name: 'Configuración', icon: Cog6ToothIcon },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  const handleTabChange = (tabId: AdminTab) => {
    setActiveTab(tabId);
    setShowMobileMenu(false);
  };

  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-xl p-3 sm:p-4 mb-6">
      {/* Header - Mobile Optimized */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
            <ShieldCheckIcon className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-2xl font-bold text-white truncate">Panel Admin</h2>
            <p className="text-purple-100 text-xs sm:text-sm truncate">{userEmail}</p>
          </div>
        </div>
        <div className="px-2 py-1 sm:px-4 sm:py-2 bg-yellow-400 text-purple-900 rounded-lg font-semibold text-xs sm:text-sm flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Modo Admin</span>
          <span className="sm:hidden">Admin</span>
        </div>
      </div>

      {/* Mobile: Dropdown Menu */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="w-full bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between text-white font-medium"
        >
          <div className="flex items-center gap-2">
            {activeTabData && <activeTabData.icon className="w-5 h-5" />}
            <span>{activeTabData?.name}</span>
          </div>
          <Bars3Icon className="w-5 h-5" />
        </button>

        {showMobileMenu && (
          <div className="mt-2 bg-white/95 backdrop-blur-sm rounded-lg overflow-hidden shadow-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 font-medium transition-all border-b border-gray-100 last:border-b-0 ${
                    activeTab === tab.id
                      ? 'bg-purple-50 text-purple-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop: Tabs Grid */}
      <div className="hidden lg:block bg-white/10 backdrop-blur-sm rounded-lg p-2 mb-4">
        <div className="grid grid-cols-4 xl:grid-cols-8 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center gap-2 px-3 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-purple-600 shadow-lg'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs xl:text-sm">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg p-4 sm:p-5">
        {activeTab === 'overview' && <ImprovedOverviewTab onTabChange={setActiveTab} />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'listings' && <ListingsTab />}
        {activeTab === 'subscriptions' && <SubscriptionsTab />}
        {activeTab === 'finances' && <FinancesTab />}
        {activeTab === 'bookings' && <BookingsTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}

function ListingsTab() {
  return <ListingsManager />;
}

function SubscriptionsTab() {
  return <AdminPlansManager />;
}

function AnalyticsTab() {
  return <AdminAnalytics />;
}

function SettingsTab() {
  return <AdminManagement />;
}
