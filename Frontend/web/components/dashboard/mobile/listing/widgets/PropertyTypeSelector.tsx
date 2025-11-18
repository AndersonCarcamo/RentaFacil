/**
 * PropertyTypeSelector Component
 * Grid selector for property types
 */

'use client';

import React from 'react';
import { BuildingOffice2Icon, HomeIcon, KeyIcon, BuildingStorefrontIcon } from '@heroicons/react/24/outline';

interface PropertyType {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PROPERTY_TYPES: PropertyType[] = [
  { value: 'departamento', label: 'Departamento', icon: BuildingOffice2Icon },
  { value: 'casa', label: 'Casa', icon: HomeIcon },
  { value: 'cuarto', label: 'Cuarto', icon: KeyIcon },
  { value: 'local', label: 'Local comercial', icon: BuildingStorefrontIcon },
];

interface PropertyTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PropertyTypeSelector({ value, onChange }: PropertyTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {PROPERTY_TYPES.map((type) => {
        const Icon = type.icon;
        const isSelected = value === type.value;

        return (
          <button
            key={type.value}
            onClick={() => onChange(type.value)}
            className={`relative p-4 rounded-xl border-2 transition-all active:scale-95 ${
              isSelected
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex flex-col items-center space-y-2">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isSelected ? 'bg-blue-100' : 'bg-gray-100'
                }`}
              >
                <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
              </div>
              <span
                className={`text-sm font-medium ${
                  isSelected ? 'text-blue-900' : 'text-gray-700'
                }`}
              >
                {type.label}
              </span>
            </div>

            {/* Selected indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
