/**
 * KPICard Component
 * Tarjeta de KPI mejorada con gráfico de tendencia
 */

'use client';

import React from 'react';
import {
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

export interface KPIData {
  id: string;
  label: string;
  value: string | number;
  previousValue?: number;
  change?: number;
  changePercentage?: number;
  subtitle?: string;
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'indigo' | 'pink';
  icon?: React.ComponentType<{ className?: string }>;
  trend?: Array<{ value: number }>;
  format?: 'number' | 'currency' | 'percentage';
}

interface KPICardProps {
  kpi: KPIData;
  loading?: boolean;
  onClick?: () => void;
}

export default function KPICard({ kpi, loading, onClick }: KPICardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-100 rounded w-1/3"></div>
      </div>
    );
  }

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-primary-200',
      text: 'text-primary-700',
      icon: 'text-primary-600',
      gradient: 'from-primary-500 to-primary-600',
      chart: '#22ACF5',
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      icon: 'text-green-600',
      gradient: 'from-green-500 to-green-600',
      chart: '#10B981',
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-secondary-200',
      text: 'text-secondary-700',
      icon: 'text-secondary-600',
      gradient: 'from-secondary-500 to-secondary-600',
      chart: '#F5C842',
    },
    yellow: {
      bg: 'bg-yellow-50',
      border: 'border-secondary-200',
      text: 'text-secondary-700',
      icon: 'text-secondary-600',
      gradient: 'from-secondary-500 to-secondary-600',
      chart: '#F5C842',
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: 'text-red-600',
      gradient: 'from-red-500 to-red-600',
      chart: '#EF4444',
    },
    indigo: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      text: 'text-indigo-700',
      icon: 'text-indigo-600',
      gradient: 'from-indigo-500 to-indigo-600',
      chart: '#6366F1',
    },
    pink: {
      bg: 'bg-pink-50',
      border: 'border-pink-200',
      text: 'text-pink-700',
      icon: 'text-pink-600',
      gradient: 'from-pink-500 to-pink-600',
      chart: '#EC4899',
    },
  };

  const colors = colorClasses[kpi.color || 'blue'];
  const Icon = kpi.icon;

  const isPositiveChange = (kpi.changePercentage || kpi.change || 0) >= 0;
  const hasChange = kpi.changePercentage !== undefined || kpi.change !== undefined;

  const TrendIcon = isPositiveChange ? TrendingUpIcon : TrendingDownIcon;
  const ChangeIcon = isPositiveChange ? ArrowUpIcon : ArrowDownIcon;

  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val;
    
    switch (kpi.format) {
      case 'currency':
        return `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'number':
      default:
        return val.toLocaleString('es-PE');
    }
  };

  return (
    <div
      className={`
        ${colors.bg} ${colors.border} 
        border rounded-lg p-4 shadow-sm hover:shadow-md
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}
        relative overflow-hidden
      `}
      onClick={onClick}
    >
      {/* Background gradient decoration - subtle */}
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${colors.gradient} opacity-5 rounded-full -mr-12 -mt-12`}></div>
      
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5 relative z-10">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">{kpi.label}</p>
          {kpi.subtitle && (
            <p className="text-xs text-gray-500">{kpi.subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colors.gradient} flex items-center justify-center shadow-sm`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
      </div>

      {/* Value with badge */}
      <div className="mb-2 relative z-10">
        <div className="flex items-baseline gap-2">
          <p className={`text-3xl font-bold ${colors.text} tracking-tight`}>
            {formatValue(kpi.value)}
          </p>
          {hasChange && (
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                isPositiveChange
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {isPositiveChange ? '↑' : '↓'}
              {Math.abs(kpi.changePercentage || kpi.change || 0).toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {/* Change & Trend */}
      <div className="flex items-center justify-between gap-2.5 relative z-10">
        <div className="flex-1 min-w-0">
          {hasChange && (
            <div className="flex items-center gap-1.5 mb-0.5">
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${
                isPositiveChange ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <ChangeIcon
                  className={`w-3 h-3 ${
                    isPositiveChange ? 'text-green-600' : 'text-red-600'
                  }`}
                />
                <span
                  className={`text-xs font-bold ${
                    isPositiveChange ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {isPositiveChange ? '+' : ''}
                  {kpi.changePercentage !== undefined
                    ? `${kpi.changePercentage.toFixed(1)}%`
                    : kpi.change?.toLocaleString('es-PE')}
                </span>
              </div>
              <span className="text-xs text-gray-500 font-medium">vs anterior</span>
            </div>
          )}
          {kpi.previousValue !== undefined && (
            <p className="text-xs text-gray-500">
              Anterior: <span className="font-semibold text-gray-700">{formatValue(kpi.previousValue)}</span>
            </p>
          )}
        </div>

        {/* Mini Trend Chart - más pequeño */}
        {kpi.trend && kpi.trend.length > 0 && (
          <div className="w-20 h-12 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={kpi.trend}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={colors.chart}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

// Grid Component for multiple KPIs
interface KPIGridProps {
  kpis: KPIData[];
  loading?: boolean;
  columns?: 2 | 3 | 4;
}

export function KPIGrid({ kpis, loading, columns = 4 }: KPIGridProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4`}>
      {loading
        ? Array.from({ length: columns }).map((_, i) => (
            <KPICard key={i} kpi={{ id: '', label: '', value: 0 }} loading />
          ))
        : kpis.map((kpi) => <KPICard key={kpi.id} kpi={kpi} />)}
    </div>
  );
}
