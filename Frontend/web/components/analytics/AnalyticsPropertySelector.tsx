import React from 'react';
import { Listing } from '../../lib/api/listings';

interface AnalyticsPropertySelectorProps {
  listings: Listing[];
  selectedListingId: string | null;
  onListingChange: (listingId: string) => void;
}

export const AnalyticsPropertySelector: React.FC<AnalyticsPropertySelectorProps> = ({
  listings,
  selectedListingId,
  onListingChange
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Seleccionar Propiedad
      </label>
      <select
        value={selectedListingId || ''}
        onChange={(e) => onListingChange(e.target.value)}
        className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {listings.map((listing) => (
          <option key={listing.id} value={listing.id}>
            {listing.title}
          </option>
        ))}
      </select>
    </div>
  );
};
