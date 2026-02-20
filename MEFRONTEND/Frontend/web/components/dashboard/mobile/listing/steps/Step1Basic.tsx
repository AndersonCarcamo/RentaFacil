/**
 * Step1Basic Component
 * Basic information: property type and operation type
 */

'use client';

import React from 'react';
import PropertyTypeSelector from '../widgets/PropertyTypeSelector';

interface Step1Data {
  propertyType: string;
  operationType: 'alquiler' | 'venta';
}

interface Step1BasicProps {
  data: Step1Data;
  onChange: (data: Partial<Step1Data>) => void;
}

export default function Step1Basic({ data, onChange }: Step1BasicProps) {
  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          ¿Qué tipo de propiedad es?
        </h2>
        <p className="text-sm text-gray-600">
          Selecciona el tipo que mejor describa tu propiedad
        </p>
      </div>

      {/* Property Type */}
      <PropertyTypeSelector
        value={data.propertyType}
        onChange={(value) => onChange({ propertyType: value })}
      />

      {/* Operation Type */}
      <div className="pt-2">
        <h3 className="text-base font-semibold text-gray-900 mb-3">
          ¿Qué tipo de operación?
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onChange({ operationType: 'alquiler' })}
            className={`p-3 rounded-xl border-2 transition-all active:scale-95 ${
              data.operationType === 'alquiler'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div
                className={`text-xl mb-1.5 ${
                  data.operationType === 'alquiler' ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                🏠
              </div>
              <span
                className={`text-sm font-medium ${
                  data.operationType === 'alquiler' ? 'text-blue-900' : 'text-gray-700'
                }`}
              >
                Alquiler
              </span>
            </div>
          </button>

          <button
            onClick={() => onChange({ operationType: 'venta' })}
            className={`p-3 rounded-xl border-2 transition-all active:scale-95 ${
              data.operationType === 'venta'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <div
                className={`text-xl mb-1.5 ${
                  data.operationType === 'venta' ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                💰
              </div>
              <span
                className={`text-sm font-medium ${
                  data.operationType === 'venta' ? 'text-blue-900' : 'text-gray-700'
                }`}
              >
                Venta
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
