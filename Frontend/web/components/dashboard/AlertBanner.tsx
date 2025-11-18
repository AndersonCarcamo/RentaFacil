import React from 'react';
import {
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export type AlertType = 'success' | 'warning' | 'error' | 'info';

interface AlertBannerProps {
  type: AlertType;
  title: string;
  message: string;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type,
  title,
  message,
  onClose,
  action
}) => {
  const styles = {
    success: {
      container: 'bg-green-50 border-green-200',
      icon: 'text-green-600',
      title: 'text-green-900',
      message: 'text-green-700',
      button: 'bg-green-600 hover:bg-green-700',
      iconComponent: CheckIcon
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200',
      icon: 'text-yellow-600',
      title: 'text-yellow-900',
      message: 'text-yellow-700',
      button: 'bg-yellow-600 hover:bg-yellow-700',
      iconComponent: ExclamationTriangleIcon
    },
    error: {
      container: 'bg-red-50 border-red-200',
      icon: 'text-red-600',
      title: 'text-red-900',
      message: 'text-red-700',
      button: 'bg-red-600 hover:bg-red-700',
      iconComponent: XMarkIcon
    },
    info: {
      container: 'bg-blue-50 border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-900',
      message: 'text-blue-700',
      button: 'bg-blue-600 hover:bg-blue-700',
      iconComponent: InformationCircleIcon
    }
  };

  const style = styles[type];
  const IconComponent = style.iconComponent;

  return (
    <div className={`mb-6 rounded-xl border-2 p-6 ${style.container}`}>
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
          type === 'success' ? 'bg-green-100' :
          type === 'warning' ? 'bg-yellow-100' :
          type === 'error' ? 'bg-red-100' :
          'bg-blue-100'
        }`}>
          <IconComponent className={`w-6 h-6 ${style.icon}`} />
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold mb-1 ${style.title}`}>
            {title}
          </h3>
          <p className={`text-sm mb-3 ${style.message}`}>
            {message}
          </p>
          {action && (
            <button 
              onClick={action.onClick}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-white ${style.button}`}
            >
              {action.label}
            </button>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${style.icon} hover:opacity-70`}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};
