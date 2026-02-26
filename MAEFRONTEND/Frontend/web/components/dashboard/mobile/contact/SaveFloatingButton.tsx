/**
 * SaveFloatingButton Component
 * Floating action button for saving contact configuration
 * Shows only when changes are detected
 */

'use client';

import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';

interface SaveFloatingButtonProps {
  hasChanges: boolean;
  onSave: () => void;
  isSaving?: boolean;
}

export default function SaveFloatingButton({
  hasChanges,
  onSave,
  isSaving = false,
}: SaveFloatingButtonProps) {
  if (!hasChanges) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-4 z-40 animate-scaleIn">
      <button
        onClick={onSave}
        disabled={isSaving}
        className="flex items-center space-x-2 h-14 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 text-white rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200 touch-manipulation"
      >
        {isSaving ? (
          <>
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="font-semibold">Guardando...</span>
          </>
        ) : (
          <>
            <CheckIcon className="w-5 h-5" />
            <span className="font-semibold">Guardar cambios</span>
          </>
        )}
      </button>
    </div>
  );
}
