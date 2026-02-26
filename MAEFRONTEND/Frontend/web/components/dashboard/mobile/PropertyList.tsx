import React from 'react';
import { Listing } from '../../../lib/api/listings';
import { PropertyCard } from './PropertyCard';
import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface PropertyListProps {
  properties: Listing[];
  onToggleStatus: (id: string) => void;
  onEdit: (property: Listing) => void;
  onPreview: (property: Listing) => void;
  onMoreActions: (property: Listing) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export const PropertyList: React.FC<PropertyListProps> = ({
  properties,
  onToggleStatus,
  onEdit,
  onPreview,
  onMoreActions,
  isLoading = false,
  emptyMessage = 'No se encontraron propiedades'
}) => {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
            <div className="h-40 bg-gray-200" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-5 bg-gray-200 rounded w-1/3 mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <div className="py-12 text-center">
        <InformationCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          onToggleStatus={onToggleStatus}
          onEdit={onEdit}
          onPreview={onPreview}
          onMoreActions={onMoreActions}
        />
      ))}
    </div>
  );
};
