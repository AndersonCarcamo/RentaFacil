/**
 * AlertsSection Component
 * Sección de alertas críticas para el dashboard de administración
 */

'use client';

import React from 'react';
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CreditCardIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  count?: number;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}

interface AlertsSectionProps {
  alerts: Alert[];
  loading?: boolean;
}

export default function AlertsSection({ alerts, loading }: AlertsSectionProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-100 rounded"></div>
          <div className="h-16 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg shadow-sm border border-green-300 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <CheckBadgeIcon className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-green-900">Todo en orden</h3>
            <p className="text-sm text-green-700">No hay alertas críticas en este momento</p>
          </div>
        </div>
      </div>
    );
  }

  const criticalAlerts = alerts.filter(a => a.type === 'critical');
  const warningAlerts = alerts.filter(a => a.type === 'warning');
  const infoAlerts = alerts.filter(a => a.type === 'info');

  return (
    <div className="space-y-3">
      {/* Alertas Críticas */}
      {criticalAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg shadow-sm border border-red-300 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            <h3 className="text-base font-bold text-red-900">
              Alertas Críticas ({criticalAlerts.length})
            </h3>
          </div>
          <div className="space-y-2.5">
            {criticalAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}

      {/* Alertas de Advertencia */}
      {warningAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl shadow-sm border-2 border-yellow-300 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <ClockIcon className="w-6 h-6 text-yellow-600" />
            <h3 className="text-base font-bold text-yellow-900">
              Advertencias ({warningAlerts.length})
            </h3>
          </div>
          <div className="space-y-2">
            {warningAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} compact />
            ))}
          </div>
        </div>
      )}

      {/* Alertas Informativas */}
      {infoAlerts.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-blue-900">
              Información ({infoAlerts.length})
            </h3>
          </div>
          <div className="space-y-2">
            {infoAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} compact />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface AlertCardProps {
  alert: Alert;
  compact?: boolean;
}

function AlertCard({ alert, compact }: AlertCardProps) {
  const Icon = alert.icon || ExclamationTriangleIcon;

  const colorClasses = {
    critical: {
      bg: 'bg-white',
      border: 'border-red-200',
      icon: 'text-red-600',
      badge: 'bg-red-100 text-red-700',
      button: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      bg: 'bg-white',
      border: 'border-secondary-200',
      icon: 'text-secondary-600',
      badge: 'bg-secondary-100 text-secondary-700',
      button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    },
    info: {
      bg: 'bg-white',
      border: 'border-primary-200',
      icon: 'text-primary-600',
      badge: 'bg-primary-100 text-primary-700',
      button: 'bg-primary-600 hover:bg-primary-700 text-white',
    },
  };

  const colors = colorClasses[alert.type];

  if (compact) {
    return (
      <div
        className={`${colors.bg} ${colors.border} border rounded-lg p-3 flex items-center justify-between gap-3`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Icon className={`w-5 h-5 ${colors.icon} flex-shrink-0`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
            {alert.count !== undefined && (
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${colors.badge} mt-1`}>
                {alert.count} items
              </span>
            )}
          </div>
        </div>
        {alert.onAction && alert.actionLabel && (
          <button
            onClick={alert.onAction}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors flex-shrink-0 ${colors.button}`}
          >
            {alert.actionLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`${colors.bg} ${colors.border} border rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg ${colors.badge} flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h4 className="text-base font-bold text-gray-900">{alert.title}</h4>
            {alert.count !== undefined && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${colors.badge}`}>
                {alert.count} items
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{alert.description}</p>
        </div>
        {alert.onAction && alert.actionLabel && (
          <button
            onClick={alert.onAction}
            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex-shrink-0 shadow-md hover:shadow-lg transform hover:scale-105 ${colors.button}`}
          >
            {alert.actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
