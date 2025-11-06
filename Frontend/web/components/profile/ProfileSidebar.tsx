import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  UserCircleIcon,
  HeartIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const menuItems: MenuItem[] = [
  {
    id: 'profile',
    label: 'Mi Perfil',
    href: '/profile',
    icon: UserCircleIcon,
  },
  {
    id: 'favorites',
    label: 'Favoritos',
    href: '/profile/favorites',
    icon: HeartIcon,
  },
  {
    id: 'settings',
    label: 'Configuración',
    href: '/profile/settings',
    icon: Cog6ToothIcon,
  },
];

export const ProfileSidebar: React.FC = () => {
  const router = useRouter();

  const isActive = (href: string) => {
    if (href === '/profile') {
      return router.pathname === '/profile';
    }
    return router.pathname.startsWith(href);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <nav className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                active
                  ? 'bg-[#5AB0DB] bg-opacity-20 text-[#2D7DA8] font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-[#5AB0DB]' : 'text-gray-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
