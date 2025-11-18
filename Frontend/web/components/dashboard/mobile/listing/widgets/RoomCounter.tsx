/**
 * RoomCounter Component
 * Counter widget for bedrooms, bathrooms, etc.
 */

'use client';

import React from 'react';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';

interface RoomCounterProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  icon?: React.ReactNode;
}

export default function RoomCounter({
  label,
  value,
  onChange,
  min = 0,
  max = 20,
  icon,
}: RoomCounterProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center space-x-3">
        {icon && <div className="text-gray-600">{icon}</div>}
        <span className="text-base font-medium text-gray-900">{label}</span>
      </div>

      <div className="flex items-center space-x-3">
        <button
          onClick={handleDecrement}
          disabled={value <= min}
          className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <MinusIcon className="w-5 h-5" />
        </button>

        <span className="w-8 text-center text-lg font-semibold text-gray-900">
          {value}
        </span>

        <button
          onClick={handleIncrement}
          disabled={value >= max}
          className="w-10 h-10 rounded-full border-2 border-blue-500 bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 active:bg-blue-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
