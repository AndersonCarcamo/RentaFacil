/**
 * Step4Price Component
 * Pricing information
 */

'use client';

import React from 'react';
import PriceInput from '../widgets/PriceInput';

interface Step4Data {
  price: number;
  currency: string;
  includesUtilities: boolean;
}

interface Step4PriceProps {
  data: Step4Data;
  onChange: (data: Partial<Step4Data>) => void;
}

export default function Step4Price({ data, onChange }: Step4PriceProps) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          ¿Cuál es el precio?
        </h2>
        <p className="text-sm text-gray-600">
          Establece el precio de alquiler o venta
        </p>
      </div>

      {/* Price Input */}
      <PriceInput
        value={data.price}
        onChange={(value) => onChange({ price: value })}
        currency={data.currency}
        label="Precio"
      />

      {/* Currency Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Moneda
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onChange({ currency: 'S/' })}
            className={`p-3 rounded-lg border-2 transition-all active:scale-95 ${
              data.currency === 'S/'
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-gray-200 bg-white text-gray-700'
            }`}
          >
            <div className="font-medium">S/ Soles</div>
          </button>

          <button
            onClick={() => onChange({ currency: '$' })}
            className={`p-3 rounded-lg border-2 transition-all active:scale-95 ${
              data.currency === '$'
                ? 'border-blue-500 bg-blue-50 text-blue-900'
                : 'border-gray-200 bg-white text-gray-700'
            }`}
          >
            <div className="font-medium">$ Dólares</div>
          </button>
        </div>
      </div>

      {/* Utilities Option */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="utilities"
            checked={data.includesUtilities}
            onChange={(e) => onChange({ includesUtilities: e.target.checked })}
            className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div className="flex-1">
            <label htmlFor="utilities" className="text-sm font-medium text-gray-900 cursor-pointer">
              Incluye servicios (luz, agua, gas)
            </label>
            <p className="mt-1 text-xs text-gray-600">
              Marca esta opción si el precio incluye los servicios básicos
            </p>
          </div>
        </div>
      </div>

      {/* Price Tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Investiga precios de propiedades similares en la zona para establecer un precio competitivo.
        </p>
      </div>
    </div>
  );
}
