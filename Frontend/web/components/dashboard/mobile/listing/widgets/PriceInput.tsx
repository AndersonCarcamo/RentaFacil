/**
 * PriceInput Component
 * Input for property price with currency formatting
 */

'use client';

import React, { useState } from 'react';

interface PriceInputProps {
  value: number;
  onChange: (value: number) => void;
  currency?: string;
  placeholder?: string;
  label?: string;
}

export default function PriceInput({
  value,
  onChange,
  currency = 'S/',
  placeholder = '0.00',
  label = 'Precio mensual',
}: PriceInputProps) {
  const [displayValue, setDisplayValue] = useState(value > 0 ? value.toString() : '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/[^\d]/g, '');
    setDisplayValue(input);
    onChange(Number(input));
  };

  const formatDisplay = () => {
    if (!displayValue) return '';
    return Number(displayValue).toLocaleString('es-PE');
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
          {currency}
        </div>
        
        <input
          type="text"
          inputMode="decimal"
          value={formatDisplay()}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full h-14 pl-14 pr-4 text-2xl font-semibold bg-white border-2 border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      <p className="mt-2 text-sm text-gray-500">
        El precio se mostrará en la publicación
      </p>
    </div>
  );
}
