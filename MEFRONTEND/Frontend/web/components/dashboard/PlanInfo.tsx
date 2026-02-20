import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';

interface PlanInfoProps {
  planName: string;
  maxActiveListings: number;
  activeProperties: number;
  totalProperties: number;
  airbnbProperties: number;
  features: string[];
  onUpgrade?: () => void;
}

export const PlanInfo: React.FC<PlanInfoProps> = ({
  planName,
  maxActiveListings,
  activeProperties,
  totalProperties,
  airbnbProperties,
  features,
  onUpgrade
}) => {
  const isPremium = planName.toLowerCase() === 'premium' || maxActiveListings === -1;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md border border-blue-100 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Plan {planName}
          </h2>
          <p className="text-sm text-gray-600">
            Tu plan actual y sus beneficios
          </p>
        </div>
        <div className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">
          {planName}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Límites del Plan</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Propiedades activas:</span>
              <span className="font-semibold text-gray-900">
                {maxActiveListings === -1 
                  ? 'Ilimitadas' 
                  : `${activeProperties} / ${maxActiveListings}`
                }
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Propiedades totales:</span>
              <span className="font-semibold text-gray-900">{totalProperties}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Tipo Airbnb:</span>
              <span className="font-semibold text-gray-900">{airbnbProperties}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-gray-900 mb-3">Características Incluidas</h3>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckIcon className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {!isPremium && onUpgrade && (
        <div className="mt-6 pt-6 border-t border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">¿Necesitas más propiedades?</p>
              <p className="text-sm text-gray-600 mt-1">Mejora tu plan y obtén más beneficios</p>
            </div>
            <button 
              onClick={onUpgrade}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Ver Planes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
