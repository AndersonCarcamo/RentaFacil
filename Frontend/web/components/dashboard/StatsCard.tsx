import React from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: React.ReactNode;
  iconBgColor: string;
  progress?: {
    current: number;
    max: number;
    showBar?: boolean;
  };
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  sublabel,
  icon,
  iconBgColor,
  progress
}) => {
  const progressPercentage = progress 
    ? Math.min((progress.current / progress.max) * 100, 100) 
    : 0;

  const getProgressColor = () => {
    if (!progress) return 'bg-green-500';
    const ratio = progress.current / progress.max;
    if (ratio >= 1) return 'bg-red-500';
    if (ratio >= 0.8) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {progress && progress.max !== -1 && (
              <p className="text-lg text-gray-500">/ {progress.max}</p>
            )}
          </div>
          
          {sublabel && (
            <p className="text-xs text-gray-500 mt-2">{sublabel}</p>
          )}

          {progress && progress.showBar && progress.max !== -1 && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          {progress && progress.max === -1 && (
            <p className="text-xs text-green-600 font-medium mt-2">Ilimitadas ✨</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBgColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
