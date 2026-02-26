import React from 'react';

interface AnalyticsMetricCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
}

export const AnalyticsMetricCard: React.FC<AnalyticsMetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor,
  iconColor
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>
        <div className={`p-3 ${iconBgColor} rounded-full`}>
          <div className={iconColor}>
            {icon}
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-2">
        {subtitle}
      </p>
    </div>
  );
};
