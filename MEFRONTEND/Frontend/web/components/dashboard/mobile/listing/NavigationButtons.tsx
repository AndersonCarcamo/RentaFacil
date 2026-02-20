/**
 * NavigationButtons Component
 * Previous/Next buttons for wizard navigation
 */

'use client';

import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CheckIcon } from '@heroicons/react/24/outline';

interface NavigationButtonsProps {
  onPrevious?: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  isNextDisabled?: boolean;
  isLoading?: boolean;
  nextLabel?: string;
  submitLabel?: string;
}

export default function NavigationButtons({
  onPrevious,
  onNext,
  onSubmit,
  isFirstStep = false,
  isLastStep = false,
  isNextDisabled = false,
  isLoading = false,
  nextLabel = 'Siguiente',
  submitLabel = 'Publicar',
}: NavigationButtonsProps) {
  return (
    <div className="flex-shrink-0 bg-white border-t border-gray-200 p-3 safe-bottom">
      <div className="flex items-center gap-2">
        {/* Previous Button - Más compacto */}
        {!isFirstStep && onPrevious && (
          <button
            onClick={onPrevious}
            disabled={isLoading}
            className="flex items-center justify-center w-11 h-11 border-2 border-gray-300 rounded-lg text-gray-700 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
        )}

        {/* Next/Submit Button - Más compacto */}
        {isLastStep && onSubmit ? (
          <button
            onClick={onSubmit}
            disabled={isNextDisabled || isLoading}
            className="flex-1 h-11 px-4 bg-blue-600 active:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm">Publicando...</span>
              </>
            ) : (
              <>
                <CheckIcon className="w-4 h-4" />
                <span className="text-sm">{submitLabel}</span>
              </>
            )}
          </button>
        ) : (
          onNext && (
            <button
              onClick={onNext}
              disabled={isNextDisabled || isLoading}
              className="flex-1 h-11 px-4 bg-blue-600 active:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <span className="text-sm">{nextLabel}</span>
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          )
        )}
      </div>
    </div>
  );
}
