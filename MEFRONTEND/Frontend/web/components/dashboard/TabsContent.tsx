import React from 'react';
import { useRouter } from 'next/router';
import Button from '../ui/Button';
import {
  PresentationChartBarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface AnalyticsTabProps {}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = () => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Analíticas</h2>
      </div>
      <div className="p-12 text-center">
        <PresentationChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Próximamente</h3>
        <p className="mt-1 text-sm text-gray-500">
          Aquí podrás ver gráficos y métricas detalladas de tus propiedades.
        </p>
      </div>
    </div>
  );
};

interface VerificationTabProps {}

export const VerificationTab: React.FC<VerificationTabProps> = () => {
  const router = useRouter();

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Verificación de Propiedades</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Verifica la legitimidad de tus propiedades con documentos legales
        </p>
      </div>
      <div className="p-12 text-center">
        <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">Sistema de Verificación</h3>
        <p className="mt-1 text-sm text-gray-500">
          Para acceder al sistema completo de verificación, visita la página dedicada
        </p>
        <div className="mt-6">
          <Button
            onClick={() => router.push('/dashboard/verificacion')}
            variant="primary"
            className="flex items-center gap-2 mx-auto"
          >
            <ShieldCheckIcon className="w-4 h-4" />
            Ir a Verificación
          </Button>
        </div>
      </div>
    </div>
  );
};
