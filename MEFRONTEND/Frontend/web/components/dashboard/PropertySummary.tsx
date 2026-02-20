import React from 'react';

interface PropertySummaryProps {
  publishedCount: number;
  draftCount: number;
  underReviewCount: number;
  archivedCount: number;
}

export const PropertySummary: React.FC<PropertySummaryProps> = ({
  publishedCount,
  draftCount,
  underReviewCount,
  archivedCount
}) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 mb-8">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Resumen de Propiedades</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{publishedCount}</p>
            <p className="text-sm text-gray-600">Publicadas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{draftCount}</p>
            <p className="text-sm text-gray-600">Borradores</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{underReviewCount}</p>
            <p className="text-sm text-gray-600">En revisión</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{archivedCount}</p>
            <p className="text-sm text-gray-600">Archivadas</p>
          </div>
        </div>
      </div>
    </div>
  );
};
