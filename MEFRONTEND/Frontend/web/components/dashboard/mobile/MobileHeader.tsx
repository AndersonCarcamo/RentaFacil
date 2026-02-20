import React from 'react';
import { useRouter } from 'next/router';
import {
  Bars3Icon,
  BellIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

interface MobileHeaderProps {
  userName?: string;
  notificationCount?: number;
  onMenuClick?: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  userName,
  notificationCount = 0,
  onMenuClick
}) => {
  const router = useRouter();

  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Logo y título */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bars3Icon className="w-6 h-6 text-gray-700" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
            {userName && (
              <p className="text-xs text-gray-500">Hola, {userName}</p>
            )}
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="flex items-center gap-2">
          {/* Notificaciones */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <BellIcon className="w-6 h-6 text-gray-700" />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {/* Agregar propiedad */}
          <button
            onClick={() => router.push('/dashboard/create-listing')}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
