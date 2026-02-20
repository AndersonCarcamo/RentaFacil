/**
 * Step3Details Component
 * Property details: title, description, rooms, bathrooms
 */

'use client';

import React from 'react';
import RoomCounter from '../widgets/RoomCounter';
import { HomeIcon, KeyIcon } from '@heroicons/react/24/outline';

interface Step3Data {
  title: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
}

interface Step3DetailsProps {
  data: Step3Data;
  onChange: (data: Partial<Step3Data>) => void;
}

export default function Step3Details({ data, onChange }: Step3DetailsProps) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Detalles de la propiedad
        </h2>
        <p className="text-sm text-gray-600">
          Completa la información básica
        </p>
      </div>

      {/* Property Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Título del anuncio *
        </label>
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Ej: Hermoso departamento en San Isidro"
          maxLength={100}
          className="w-full h-12 px-4 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
        />
        <p className="mt-1 text-xs text-gray-500">
          {data.title.length}/100 caracteres
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Describe las características principales de tu propiedad..."
          rows={5}
          maxLength={500}
          className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors resize-none"
        />
        <p className="mt-1 text-xs text-gray-500">
          {data.description.length}/500 caracteres
        </p>
      </div>

      {/* Room Counters */}
      <div className="space-y-3">
        <RoomCounter
          label="Dormitorios"
          value={data.bedrooms}
          onChange={(value) => onChange({ bedrooms: value })}
          icon={<HomeIcon className="w-5 h-5" />}
          min={0}
          max={10}
        />

        <RoomCounter
          label="Baños"
          value={data.bathrooms}
          onChange={(value) => onChange({ bathrooms: value })}
          icon={<KeyIcon className="w-5 h-5" />}
          min={1}
          max={10}
        />
      </div>

      {/* Area */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Área (m²)
        </label>
        <input
          type="number"
          value={data.area || ''}
          onChange={(e) => onChange({ area: Number(e.target.value) })}
          placeholder="Ej: 85"
          min={0}
          className="w-full h-12 px-4 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>
    </div>
  );
}
