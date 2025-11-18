/**
 * Step5Features Component
 * Property features and amenities
 */

'use client';

import React from 'react';
import AmenityGrid from '../widgets/AmenityGrid';

interface Step5Data {
  amenities: string[];
  furnished: boolean;
  parking: boolean;
  pets: boolean;
}

interface Step5FeaturesProps {
  data: Step5Data;
  onChange: (data: Partial<Step5Data>) => void;
}

export default function Step5Features({ data, onChange }: Step5FeaturesProps) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Características
        </h2>
        <p className="text-sm text-gray-600">
          Selecciona las comodidades disponibles
        </p>
      </div>

      {/* Amenities Grid */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-3">
          Comodidades
        </h3>
        <AmenityGrid
          selectedAmenities={data.amenities}
          onChange={(amenities) => onChange({ amenities })}
        />
      </div>

      {/* Additional Features */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-gray-900">
          Características adicionales
        </h3>

        {/* Furnished */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Amoblado</p>
              <p className="text-xs text-gray-500">Incluye muebles básicos</p>
            </div>
            <button
              onClick={() => onChange({ furnished: !data.furnished })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                data.furnished ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  data.furnished ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Parking */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Estacionamiento</p>
              <p className="text-xs text-gray-500">Cochera disponible</p>
            </div>
            <button
              onClick={() => onChange({ parking: !data.parking })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                data.parking ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  data.parking ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Pets */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Se aceptan mascotas</p>
              <p className="text-xs text-gray-500">Perros y gatos permitidos</p>
            </div>
            <button
              onClick={() => onChange({ pets: !data.pets })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                data.pets ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  data.pets ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
