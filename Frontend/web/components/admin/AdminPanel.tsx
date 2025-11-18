/**
 * AdminPanel Component
 * Panel de administración para usuarios administradores
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
} from '@heroicons/react/24/outline';
import AdminPlansManager from './AdminPlansManager';
import AdminManagement from './AdminManagement';

interface AdminPanelProps {
  userEmail: string;
}

type AdminTab = 'overview' | 'users' | 'listings' | 'subscriptions' | 'analytics' | 'settings';

export default function AdminPanel({ userEmail }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const tabs = [
    { id: 'overview' as AdminTab, name: 'Vista General', icon: ChartBarIcon },
    { id: 'users' as AdminTab, name: 'Usuarios', icon: UsersIcon },
    { id: 'listings' as AdminTab, name: 'Propiedades', icon: BuildingOfficeIcon },
    { id: 'subscriptions' as AdminTab, name: 'Suscripciones', icon: CreditCardIcon },
    { id: 'analytics' as AdminTab, name: 'Analíticas', icon: ChartBarIcon },
    { id: 'settings' as AdminTab, name: 'Configuración', icon: Cog6ToothIcon },
  ];

  return (
    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-xl p-6 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
            <ShieldCheckIcon className="w-7 h-7 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Panel de Administrador</h2>
            <p className="text-purple-100 text-sm">{userEmail}</p>
          </div>
        </div>
        <div className="px-4 py-2 bg-yellow-400 text-purple-900 rounded-lg font-semibold text-sm flex items-center gap-2">
          <ExclamationTriangleIcon className="w-5 h-5" />
          Modo Admin Activo
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
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
                <span className="hidden md:inline">{tab.name}</span>
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
      <h3 className="text-xl font-bold text-gray-900 mb-4">Resumen General</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg border-2 border-${stat.color}-200 bg-${stat.color}-50`}
          >
            <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
            <p className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</p>
            <p className="text-sm text-green-600 mt-1">{stat.change} vs mes anterior</p>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <DocumentTextIcon className="w-5 h-5" />
          Acciones Rápidas de Administrador
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
          <button className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors">
            Ver Reportes
          </button>
          <button className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors">
            Gestionar Usuarios
          </button>
          <button className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors">
            Revisar Propiedades
          </button>
        </div>
      </div>
    </div>
  );
}

function UsersTab() {
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-4">Gestión de Usuarios</h3>
      <p className="text-gray-600">Funcionalidad de gestión de usuarios en desarrollo...</p>
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Ver lista de todos los usuarios</li>
          <li>• Suspender/Activar cuentas</li>
          <li>• Cambiar roles de usuario</li>
          <li>• Ver historial de actividad</li>
          <li>• Exportar datos de usuarios</li>
        </ul>
      </div>
    </div>
  );
}

function ListingsTab() {
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-4">Gestión de Propiedades</h3>
      <p className="text-gray-600">Funcionalidad de gestión de propiedades en desarrollo...</p>
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Ver todas las propiedades publicadas</li>
          <li>• Aprobar/Rechazar propiedades</li>
          <li>• Marcar propiedades destacadas</li>
          <li>• Eliminar propiedades inapropiadas</li>
          <li>• Ver estadísticas de publicaciones</li>
        </ul>
      </div>
    </div>
  );
}

function SubscriptionsTab() {
  return <AdminPlansManager />;
}

function AnalyticsTab() {
  return (
    <div>
      <h3 className="text-xl font-bold text-gray-900 mb-4">Analíticas del Sistema</h3>
      <p className="text-gray-600">Funcionalidad de analíticas en desarrollo...</p>
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Gráficos de crecimiento de usuarios</li>
          <li>• Análisis de búsquedas populares</li>
          <li>• Tasa de conversión de suscripciones</li>
          <li>• Propiedades más vistas</li>
          <li>• Reportes personalizados</li>
        </ul>
      </div>
    </div>
  );
}

function SettingsTab() {
  return <AdminManagement />;
}
