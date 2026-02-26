import React from 'react';
import Button from '../ui/Button';
import {
  XMarkIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface LimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  planName: string;
  maxActiveListings: number;
  currentActiveCount: number;
}

export const LimitModal: React.FC<LimitModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  planName,
  maxActiveListings,
  currentActiveCount
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Límite de Propiedades Alcanzado
              </h3>
              <p className="text-sm text-gray-600">
                Has alcanzado el límite de propiedades activas de tu plan actual.
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Contenido */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Plan Actual:</span>
              <span className="text-sm font-semibold text-blue-600">{planName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Propiedades Activas:</span>
              <span className="text-sm font-semibold text-gray-900">
                {currentActiveCount} / {maxActiveListings}
              </span>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-sm text-gray-600">
              Para publicar más propiedades, puedes:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Despublicar alguna de tus propiedades actuales</span>
              </li>
              <li className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Actualizar a un plan superior para más propiedades activas</span>
              </li>
            </ul>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Entendido
            </Button>
            <Button
              onClick={() => {
                onClose();
                onUpgrade();
              }}
              variant="primary"
              className="flex-1"
            >
              Ver Planes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
