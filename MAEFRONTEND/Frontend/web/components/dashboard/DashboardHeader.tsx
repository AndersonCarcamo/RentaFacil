import React from 'react';
import { useRouter } from 'next/router';
import Button from '../ui/Button';
import {
  PlusIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface DashboardHeaderProps {
  userName?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userName }) => {
  const router = useRouter();

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tus propiedades y configuraciones
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => router.push('/dashboard/contacto')}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Cog6ToothIcon className="w-4 h-4" />
            Configurar Contacto
          </Button>
          <Button
            onClick={() => router.push('/dashboard/create-listing')}
            variant="primary"
            className="flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Nueva Propiedad
          </Button>
        </div>
      </div>
    </div>
  );
};
