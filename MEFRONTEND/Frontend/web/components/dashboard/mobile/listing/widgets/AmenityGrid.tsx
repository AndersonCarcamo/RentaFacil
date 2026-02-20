/**
 * AmenityGrid Component
 * Grid for selecting property amenities
 */

'use client';

import React from 'react';
import {
  WifiIcon,
  TvIcon,
  FireIcon,
  HomeModernIcon,
} from '@heroicons/react/24/outline';

interface Amenity {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const AMENITIES: Amenity[] = [
  { id: 'wifi', label: 'WiFi', icon: WifiIcon },
  { id: 'tv', label: 'TV', icon: TvIcon },
  { id: 'calefaccion', label: 'Calefacción', icon: FireIcon },
  { id: 'amoblado', label: 'Amoblado', icon: HomeModernIcon },
  // Add more amenities as needed
];

interface AmenityGridProps {
  selectedAmenities: string[];
  onChange: (amenities: string[]) => void;
}

export default function AmenityGrid({ selectedAmenities, onChange }: AmenityGridProps) {
  const toggleAmenity = (amenityId: string) => {
    if (selectedAmenities.includes(amenityId)) {
      onChange(selectedAmenities.filter((id) => id !== amenityId));
    } else {
      onChange([...selectedAmenities, amenityId]);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {AMENITIES.map((amenity) => {
        const Icon = amenity.icon;
        const isSelected = selectedAmenities.includes(amenity.id);

        return (
          <button
            key={amenity.id}
            onClick={() => toggleAmenity(amenity.id)}
            className={`p-4 rounded-xl border-2 transition-all active:scale-95 ${
              isSelected
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
              <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                {amenity.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
