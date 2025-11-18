/**
 * MobileContactLayout Component
 * Main layout wrapper for mobile contact configuration
 * Displays contact methods as expandable accordion cards
 */

'use client';

import React from 'react';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';

interface MobileContactLayoutProps {
  children: React.ReactNode;
  title?: string;
  onBack?: () => void;
}

export default function MobileContactLayout({
  children,
  title = 'Configurar Contacto',
  onBack,
}: MobileContactLayoutProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Mobile Sub-Header - Below main Header */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 -ml-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
            aria-label="Volver"
          >
            <ChevronLeftIcon className="w-6 h-6 text-gray-700" />
          </button>
          
          <h1 className="flex-1 text-lg font-semibold text-gray-900 text-center pr-8">
            {title}
          </h1>
        </div>
      </div>

      {/* Content Area with proper top padding */}
      <main className="pt-14 pb-6">
        <div className="px-4 py-6 space-y-4">
          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Configura cómo quieres que los interesados se comuniquen contigo.
              Puedes activar múltiples métodos.
            </p>
          </div>

          {/* Contact Methods */}
          {children}
        </div>
      </main>
    </div>
  );
}
