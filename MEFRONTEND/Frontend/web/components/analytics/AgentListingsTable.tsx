import React, { useState } from 'react';
import { 
  EyeIcon, 
  ChatBubbleLeftEllipsisIcon, 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon 
} from '@heroicons/react/24/outline';
import { ListingComparison } from '@/lib/api/agent-analytics';

interface AgentListingsTableProps {
  listings: ListingComparison[];
}

export const AgentListingsTable: React.FC<AgentListingsTableProps> = ({ listings }) => {
  const [sortBy, setSortBy] = useState<keyof ListingComparison>('total_views');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof ListingComparison) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedListings = [...listings].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    return 0;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      published: 'bg-green-100 text-green-800 border-green-200',
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      archived: 'bg-red-100 text-red-800 border-red-200',
    }[status] || 'bg-gray-100 text-gray-800 border-gray-200';

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles}`}>
        {status === 'published' ? 'Publicado' : status === 'draft' ? 'Borrador' : 'Archivado'}
      </span>
    );
  };

  if (listings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 text-center">
        <p className="text-gray-500">No hay propiedades para mostrar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">
          Rendimiento por Propiedad
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Comparativa de {listings.length} propiedades
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Propiedad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('total_views')}
              >
                <div className="flex items-center gap-1">
                  <EyeIcon className="w-4 h-4" />
                  Vistas
                  {sortBy === 'total_views' && (
                    sortOrder === 'desc' ? <ArrowTrendingDownIcon className="w-3 h-3" /> : <ArrowTrendingUpIcon className="w-3 h-3" />
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('total_contacts')}
              >
                <div className="flex items-center gap-1">
                  <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                  Contactos
                  {sortBy === 'total_contacts' && (
                    sortOrder === 'desc' ? <ArrowTrendingDownIcon className="w-3 h-3" /> : <ArrowTrendingUpIcon className="w-3 h-3" />
                  )}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center gap-1">
                  <UsersIcon className="w-4 h-4" />
                  Únicos
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('conversion_rate')}
              >
                <div className="flex items-center gap-1">
                  Conversión
                  {sortBy === 'conversion_rate' && (
                    sortOrder === 'desc' ? <ArrowTrendingDownIcon className="w-3 h-3" /> : <ArrowTrendingUpIcon className="w-3 h-3" />
                  )}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('avg_views_per_day')}
              >
                Promedio/día
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedListings.map((listing) => (
              <tr key={listing.listing_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{listing.title}</p>
                    <p className="text-xs text-gray-500">
                      {listing.district} • {listing.operation} • {listing.property_type}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {getStatusBadge(listing.status)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-900">
                      {listing.total_views.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500">
                      +{listing.views_7d} últimos 7d
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-green-600">
                      {listing.total_contacts.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500">
                      +{listing.contacts_7d} últimos 7d
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {listing.unique_visitors.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-semibold ${
                    listing.conversion_rate >= 10 ? 'text-green-600' :
                    listing.conversion_rate >= 5 ? 'text-yellow-600' :
                    'text-gray-600'
                  }`}>
                    {listing.conversion_rate.toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col text-xs">
                    <span className="text-gray-700">
                      {listing.avg_views_per_day.toFixed(1)} vistas
                    </span>
                    <span className="text-gray-500">
                      {listing.avg_contacts_per_day.toFixed(1)} contactos
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
