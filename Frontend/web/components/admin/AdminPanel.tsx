/**
 * AdminPanel Component
 * Panel de administración para usuarios administradores
 * Con diseño responsive mobile-first
 */

'use client';

import React, { useState } from 'react';
import {
  ShieldCheckIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CreditCardIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import AdminPlansManager from './SystemPlansManager';
import AdminManagement from './AdminManagement';
import AdminAnalytics from './AdminAnalytics';
import UsersManager from './UsersManager';
import ListingsManager from './ListingsManager';

interface AdminPanelProps {
  userEmail: string;
}

type AdminTab = 'overview' | 'users' | 'listings' | 'subscriptions' | 'analytics' | 'settings';

export default function AdminPanel({ userEmail }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const tabs = [
    { id: 'overview' as AdminTab, name: 'Vista General', icon: ChartBarIcon },
    { id: 'users' as AdminTab, name: 'Usuarios', icon: UsersIcon },
    { id: 'listings' as AdminTab, name: 'Propiedades', icon: BuildingOfficeIcon },
    { id: 'subscriptions' as AdminTab, name: 'Suscripciones', icon: CreditCardIcon },
    { id: 'analytics' as AdminTab, name: 'Analíticas', icon: ChartBarIcon },
    { id: 'settings' as AdminTab, name: 'Configuración', icon: Cog6ToothIcon },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  const handleTabChange = (tabId: AdminTab) => {
    setActiveTab(tabId);
    setShowMobileMenu(false);
  };

  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-xl p-4 sm:p-6 mb-8">
      {/* Header - Mobile Optimized */}
      <div className="flex items-center justify-between mb-6 gap-3">
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
      <div className="hidden lg:block bg-white/10 backdrop-blur-sm rounded-lg p-2 mb-6">
        <div className="grid grid-cols-6 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-purple-600 shadow-lg'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg p-6">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'listings' && <ListingsTab />}
        {activeTab === 'subscriptions' && <SubscriptionsTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}

function OverviewTab() {
  const stats = [
    { label: 'Total Usuarios', value: '1,234', change: '+12%', color: 'blue' },
    { label: 'Propiedades Activas', value: '567', change: '+8%', color: 'green' },
    { label: 'Suscripciones Premium', value: '89', change: '+15%', color: 'purple' },
    { label: 'Ingresos Mensuales', value: 'S/ 8,450', change: '+23%', color: 'yellow' },
  ];

  return (
    <div>
      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Resumen General</h3>
      
      {/* Stats Grid - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-2 border-${stat.color}-200 bg-${stat.color}-50`}
          >
            <p className="text-xs sm:text-sm text-gray-600 mb-1">{stat.label}</p>
            <p className={`text-xl sm:text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
            <p className="text-xs sm:text-sm text-green-600 mt-1">{stat.change} vs mes anterior</p>
          </div>
        ))}
      </div>

      {/* Quick Actions - Mobile Optimized */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
          <DocumentTextIcon className="w-5 h-5" />
          Acciones Rápidas
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          <button className="px-3 py-2 sm:px-4 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium">
            Ver Reportes
          </button>
          <button className="px-3 py-2 sm:px-4 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium">
            Gestionar Usuarios
          </button>
          <button className="px-3 py-2 sm:px-4 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium sm:col-span-2 lg:col-span-1">
            Revisar Propiedades
          </button>
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  return <UsersManager />;
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
