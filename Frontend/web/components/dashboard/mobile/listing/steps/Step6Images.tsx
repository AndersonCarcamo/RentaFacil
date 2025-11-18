/**
 * Step6Images Component
 * Upload property images
 */

'use client';

import React from 'react';
import ImageUploader from '../widgets/ImageUploader';
import { PhotoIcon } from '@heroicons/react/24/outline';

interface Step6Data {
  images: File[];
}

interface Step6ImagesProps {
  data: Step6Data;
  onChange: (data: Partial<Step6Data>) => void;
}

export default function Step6Images({ data, onChange }: Step6ImagesProps) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Agrega fotos
        </h2>
        <p className="text-sm text-gray-600">
          Las fotos ayudan a atraer más interesados
        </p>
      </div>

      {/* Image Uploader */}
      <ImageUploader
        images={data.images}
        onChange={(images) => onChange({ images })}
        maxImages={10}
      />

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <p className="text-sm font-semibold text-blue-900">
          📸 Consejos para mejores fotos:
        </p>
        <ul className="text-sm text-blue-800 space-y-1 ml-4">
          <li>• Toma fotos con buena iluminación natural</li>
          <li>• Muestra todas las habitaciones</li>
          <li>• Incluye fotos del exterior y áreas comunes</li>
          <li>• Asegúrate que las fotos estén enfocadas</li>
        </ul>
      </div>

      {/* Requirements */}
      {data.images.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <PhotoIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900">
                Se requiere al menos 1 foto
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Las propiedades con fotos reciben 5x más consultas
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
