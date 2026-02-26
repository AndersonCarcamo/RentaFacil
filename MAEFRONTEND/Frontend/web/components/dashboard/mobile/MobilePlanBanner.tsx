import React from 'react';
import {
  SparklesIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface MobilePlanBannerProps {
  planName: string;
  currentListings: number;
  maxListings: number;
  onUpgrade: () => void;
  variant?: 'info' | 'warning' | 'success';
}

export const MobilePlanBanner: React.FC<MobilePlanBannerProps> = ({
  planName,
  currentListings,
  maxListings,
  onUpgrade,
  variant = 'info'
}) => {
  const usagePercentage = (currentListings / maxListings) * 100;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = currentListings >= maxListings;

  const getVariantStyles = () => {
    if (isAtLimit) {
      return {
        container: 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200',
        icon: 'text-red-600',
        title: 'text-red-900',
        badge: 'bg-red-100 text-red-700 border-red-200',
        button: 'bg-red-600 active:bg-red-700 text-white',
        progress: 'bg-red-500'
      };
    }
    
    if (isNearLimit) {
      return {
        container: 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200',
        icon: 'text-yellow-600',
        title: 'text-yellow-900',
        badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        button: 'bg-yellow-600 active:bg-yellow-700 text-white',
        progress: 'bg-yellow-500'
      };
    }

    return {
      container: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-900',
      badge: 'bg-blue-100 text-blue-700 border-blue-200',
      button: 'bg-blue-600 active:bg-blue-700 text-white',
      progress: 'bg-blue-500'
    };
  };

  const styles = getVariantStyles();

  const Icon = isAtLimit ? ExclamationTriangleIcon : 
               isNearLimit ? ExclamationTriangleIcon : 
               planName.toLowerCase() === 'premium' ? CheckCircleIcon : 
               SparklesIcon;

  return (
    <div className={`rounded-xl border ${styles.container} p-4 shadow-sm`}>
      <div className="flex items-start gap-3">
        {/* Icono */}
        <div className="flex-shrink-0">
          <Icon className={`w-6 h-6 ${styles.icon}`} />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-semibold text-sm ${styles.title}`}>
              Plan {planName}
            </h4>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${styles.badge}`}>
              {currentListings}/{maxListings}
            </span>
          </div>

          {/* Descripción */}
          <p className="text-xs text-gray-600 mb-2">
            {isAtLimit ? (
              '¡Has alcanzado el límite de publicaciones!'
            ) : isNearLimit ? (
              'Estás cerca del límite de publicaciones'
            ) : (
              `Tienes ${maxListings - currentListings} publicaciones disponibles`
            )}
          </p>

          {/* Barra de progreso */}
          <div className="mb-3">
            <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
              <div
                className={`h-full ${styles.progress} transition-all duration-300 rounded-full`}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Botón de upgrade */}
          {planName.toLowerCase() !== 'premium' && (
            <button
              onClick={onUpgrade}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${styles.button}`}
            >
              <SparklesIcon className="w-4 h-4" />
              <span>Mejorar plan</span>
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          )}

          {/* Mensaje para plan premium */}
          {planName.toLowerCase() === 'premium' && (
            <div className="flex items-center gap-1 text-xs text-green-700">
              <CheckCircleIcon className="w-4 h-4" />
              <span className="font-medium">Tienes el mejor plan disponible</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
