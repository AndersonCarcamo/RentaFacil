/**
 * SuccessFeedback Component
 * Success modal/toast after saving configuration
 * Auto-dismisses after 3 seconds
 */

'use client';

import React, { useEffect } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface SuccessFeedbackProps {
  show: boolean;
  onClose: () => void;
  message?: string;
}

export default function SuccessFeedback({
  show,
  onClose,
  message = 'Configuración guardada correctamente',
}: SuccessFeedbackProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-40 z-[60] animate-fadeIn" />

      {/* Modal */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-scaleIn">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </div>
          </div>

          {/* Message */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              ¡Listo!
            </h3>
            <p className="text-sm text-gray-600">
              {message}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-green-600 animate-progressBar" />
          </div>
        </div>
      </div>
    </>
  );
}
