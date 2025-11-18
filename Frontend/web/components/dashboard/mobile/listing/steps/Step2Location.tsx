/**
 * Step2Location Component
 * Address and location with map picker
 */

'use client';

import React, { useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

interface Step2Data {
  address: string;
  district: string;
  city: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface Step2LocationProps {
  data: Step2Data;
  onChange: (data: Partial<Step2Data>) => void;
}

export default function Step2Location({ data, onChange }: Step2LocationProps) {
  const [showMap, setShowMap] = useState(false);

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          ¿Dónde está ubicada?
        </h2>
        <p className="text-sm text-gray-600">
          Ingresa la dirección completa de la propiedad
        </p>
      </div>

      {/* Address Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dirección completa
        </label>
        <input
          type="text"
          value={data.address}
          onChange={(e) => onChange({ address: e.target.value })}
          placeholder="Ej: Av. Arequipa 1234"
          className="w-full h-12 px-4 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* District */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Distrito
        </label>
        <input
          type="text"
          value={data.district}
          onChange={(e) => onChange({ district: e.target.value })}
          placeholder="Ej: San Isidro"
          className="w-full h-12 px-4 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* City */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ciudad
        </label>
        <input
          type="text"
          value={data.city}
          onChange={(e) => onChange({ city: e.target.value })}
          placeholder="Ej: Lima"
          className="w-full h-12 px-4 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Map Button */}
      <button
        onClick={() => setShowMap(!showMap)}
        className="w-full p-4 border-2 border-blue-500 bg-blue-50 rounded-lg flex items-center justify-center space-x-2 text-blue-600 font-medium active:scale-98 transition-all"
      >
        <MapPinIcon className="w-5 h-5" />
        <span>{showMap ? 'Ocultar mapa' : 'Marcar en el mapa'}</span>
      </button>

      {/* Map Placeholder */}
      {showMap && (
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <MapPinIcon className="w-12 h-12 mx-auto text-gray-400 mb-1" />
          <p className="text-gray-600">
            Mapa interactivo (requiere componente MapPicker)
          </p>
        </div>
      )}
    </div>
  );
}
