import React from 'react';

interface MobileStatsCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: React.ReactNode;
  color: 'blue' | 'orange' | 'yellow' | 'purple' | 'green' | 'red';
  progress?: {
    current: number;
    max: number;
  };
  onClick?: () => void;
}

export const MobileStatsCard: React.FC<MobileStatsCardProps> = ({
  label,
  value,
  sublabel,
  icon,
  color,
  progress,
  onClick
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      progress: 'bg-blue-600'
    },
    orange: {
      bg: 'bg-orange-50',
      icon: 'text-orange-600',
      progress: 'bg-orange-600'
    },
    yellow: {
      bg: 'bg-yellow-50',
      icon: 'text-yellow-600',
      progress: 'bg-yellow-600'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      progress: 'bg-purple-600'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      progress: 'bg-green-600'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      progress: 'bg-red-600'
    }
  };

  const colors = colorClasses[color];
  const progressPercentage = progress 
    ? Math.min((progress.current / progress.max) * 100, 100) 
    : 0;

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 w-full text-left ${
        onClick ? 'active:scale-95 transition-transform' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0 pr-3">
          <p className="text-xs font-medium text-gray-600 mb-1 truncate">{label}</p>
          <div className="flex items-baseline gap-1.5">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {progress && progress.max !== -1 && (
              <p className="text-sm text-gray-500">/ {progress.max}</p>
            )}
          </div>
          {sublabel && (
            <p className="text-xs text-gray-500 mt-1 truncate">{sublabel}</p>
          )}
        </div>
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
          <div className={colors.icon}>
            {icon}
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      {progress && progress.max !== -1 && (
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className={`h-1.5 rounded-full transition-all duration-300 ${colors.progress}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {progress && progress.max === -1 && (
        <p className="text-xs text-green-600 font-medium mt-2">✨ Ilimitado</p>
      )}
    </button>
  );
};
