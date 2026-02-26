/**
 * Step8Review Component
 * Review and publish
 */

'use client';

import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ListingData {
  propertyType: string;
  operationType: string;
  title: string;
  address: string;
  price: number;
  currency: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: File[];
}

interface Step8ReviewProps {
  data: ListingData;
}

export default function Step8Review({ data }: Step8ReviewProps) {
  const isComplete = data.title && data.address && data.price > 0 && data.images.length > 0;

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Revisa tu publicación
        </h2>
        <p className="text-sm text-gray-600">
          Verifica que toda la información sea correcta
        </p>
      </div>

      {/* Preview Card */}
      <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden">
        {/* Image Preview */}
        {data.images.length > 0 ? (
          <div className="relative h-48 bg-gray-100">
            <img
              src={URL.createObjectURL(data.images[0])}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
              {data.images.length} fotos
            </div>
          </div>
        ) : (
          <div className="h-48 bg-gray-100 flex items-center justify-center">
            <p className="text-gray-400">Sin fotos</p>
          </div>
        )}

        {/* Info */}
        <div className="p-4 space-y-3">
          <h3 className="text-lg font-bold text-gray-900">
            {data.title || 'Sin título'}
          </h3>

          <p className="text-sm text-gray-600">
            {data.address || 'Sin dirección'}
          </p>

          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-blue-600">
              {data.currency} {data.price.toLocaleString('es-PE')}
            </div>
            <div className="text-sm text-gray-600">
              {data.operationType === 'alquiler' ? '/ mes' : 'total'}
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            {data.bedrooms > 0 && <span>🛏️ {data.bedrooms} dorm.</span>}
            {data.bathrooms > 0 && <span>🚿 {data.bathrooms} baños</span>}
            {data.area > 0 && <span>📐 {data.area} m²</span>}
          </div>
        </div>
      </div>

      {/* Validation */}
      {isComplete ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900">
                ¡Todo listo para publicar!
              </p>
              <p className="text-xs text-green-700 mt-1">
                Tu propiedad cumple con todos los requisitos
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900">
                Completa la información requerida
              </p>
              <ul className="text-xs text-yellow-700 mt-2 space-y-1">
                {!data.title && <li>• Agrega un título</li>}
                {!data.address && <li>• Ingresa la dirección</li>}
                {!data.price && <li>• Establece el precio</li>}
                {data.images.length === 0 && <li>• Sube al menos 1 foto</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Terms */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-xs text-gray-600">
          Al publicar, aceptas nuestros{' '}
          <a href="#" className="text-blue-600 underline">
            Términos y Condiciones
          </a>{' '}
          y confirmas que la información es verídica.
        </p>
      </div>
    </div>
  );
}
