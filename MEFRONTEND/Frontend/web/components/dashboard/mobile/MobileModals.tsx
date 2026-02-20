import React from 'react';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TrashIcon,
  EyeSlashIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

// Modal de límite alcanzado
interface LimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  planName: string;
  currentLimit: number;
}

export const MobileLimitModal: React.FC<LimitModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  planName,
  currentLimit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-up">
        {/* Header */}
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Límite alcanzado
          </h3>
          <p className="text-gray-600 text-sm">
            Has alcanzado el límite de <span className="font-semibold">{currentLimit} publicaciones</span> de tu plan {planName}.
          </p>
        </div>

        {/* Acciones */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <button
            onClick={onUpgrade}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium active:scale-98 transition-transform"
          >
            <SparklesIcon className="w-5 h-5" />
            Mejorar plan
          </button>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 text-gray-700 font-medium bg-gray-100 rounded-xl active:bg-gray-200"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal de confirmación de eliminación
interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  propertyTitle: string;
}

export const MobileDeleteModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  propertyTitle
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-up">
        {/* Header */}
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrashIcon className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            ¿Eliminar publicación?
          </h3>
          <p className="text-gray-600 text-sm">
            Estás a punto de eliminar <span className="font-semibold">"{propertyTitle}"</span>. Esta acción no se puede deshacer.
          </p>
        </div>

        {/* Acciones */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <button
            onClick={onConfirm}
            className="w-full bg-red-600 text-white px-6 py-3 rounded-xl font-medium active:bg-red-700"
          >
            Sí, eliminar
          </button>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 text-gray-700 font-medium bg-gray-100 rounded-xl active:bg-gray-200"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal de archivar
interface ArchiveConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  propertyTitle: string;
}

export const MobileArchiveModal: React.FC<ArchiveConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  propertyTitle
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-up">
        {/* Header */}
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <EyeSlashIcon className="w-8 h-8 text-orange-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            ¿Archivar publicación?
          </h3>
          <p className="text-gray-600 text-sm">
            La publicación <span className="font-semibold">"{propertyTitle}"</span> dejará de estar visible pero podrás restaurarla después.
          </p>
        </div>

        {/* Acciones */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <button
            onClick={onConfirm}
            className="w-full bg-orange-600 text-white px-6 py-3 rounded-xl font-medium active:bg-orange-700"
          >
            Sí, archivar
          </button>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 text-gray-700 font-medium bg-gray-100 rounded-xl active:bg-gray-200"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal de éxito
interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export const MobileSuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title,
  message
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-up">
        {/* Header */}
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-gray-600 text-sm">
            {message}
          </p>
        </div>

        {/* Acciones */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-xl font-medium active:bg-green-700"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal de menú de acciones
interface ActionMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyTitle: string;
  actions: {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'danger';
  }[];
}

export const MobileActionMenu: React.FC<ActionMenuModalProps> = ({
  isOpen,
  onClose,
  propertyTitle,
  actions
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl shadow-2xl w-full animate-slide-up">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 truncate">
              {propertyTitle}
            </h3>
            <button onClick={onClose} className="p-1">
              <XMarkIcon className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Acciones */}
        <div className="p-2">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg active:bg-gray-100 ${
                action.variant === 'danger' ? 'text-red-600' : 'text-gray-700'
              }`}
            >
              {action.icon}
              <span className="font-medium">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Botón cancelar */}
        <div className="p-4 pt-0">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 text-gray-700 font-medium bg-gray-100 rounded-xl active:bg-gray-200"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
