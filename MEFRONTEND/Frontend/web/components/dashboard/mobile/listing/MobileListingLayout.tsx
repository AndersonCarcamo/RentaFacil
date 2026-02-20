/**
 * MobileListingLayout Component
 * Main layout for mobile create/edit listing wizard
 */

'use client';

import React from 'react';
import { ChevronLeftIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';

interface MobileListingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  onClose?: () => void;
  showProgress?: boolean;
}

export default function MobileListingLayout({
  children,
  currentStep,
  totalSteps,
  onBack,
  onClose,
  showProgress = true,
}: MobileListingLayoutProps) {
  const router = useRouter();

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      // Show confirmation modal
      if (confirm('¿Seguro que quieres salir? Los cambios no guardados se perderán.')) {
        router.push('/dashboard');
      }
    }
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="fixed inset-0 bg-gray-50 pt-16 flex flex-col">
      {/* Mobile Sub-Header - Compacto */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 z-40">
        {/* Header Row */}
        <div className="flex items-center justify-between h-12 px-4">
          {onBack && currentStep > 1 ? (
            <button
              onClick={onBack}
              className="flex items-center justify-center w-9 h-9 -ml-2 rounded-lg active:bg-gray-100 transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-700" />
            </button>
          ) : (
            <div className="w-9" />
          )}

          <div className="flex-1 text-center">
            <p className="text-sm font-medium text-gray-900">
              Paso {currentStep} de {totalSteps}
            </p>
          </div>

          <button
            onClick={handleClose}
            className="flex items-center justify-center w-9 h-9 -mr-2 rounded-lg active:bg-gray-100 transition-colors"
            aria-label="Cerrar"
          >
            <XMarkIcon className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="h-0.5 bg-gray-200">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}
      </div>

      {/* Content Area - Scrollable */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
