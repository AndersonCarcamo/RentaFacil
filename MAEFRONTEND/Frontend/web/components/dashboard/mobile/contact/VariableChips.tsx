/**
 * VariableChips Component
 * Displays clickable chips for inserting variables into messages
 * Variables: {TITULO}, {PRECIO}, {DIRECCION}, {LINK}
 */

'use client';

import React from 'react';

interface VariableChipsProps {
  onInsert: (variable: string) => void;
  compact?: boolean;
}

const VARIABLES = [
  { key: '{TITULO}', label: 'Título', description: 'Título de la propiedad' },
  { key: '{PRECIO}', label: 'Precio', description: 'Precio de la propiedad' },
  { key: '{DIRECCION}', label: 'Dirección', description: 'Dirección completa' },
  { key: '{LINK}', label: 'Link', description: 'Enlace a la propiedad' },
  { key: '{TIPO}', label: 'Tipo', description: 'Tipo de propiedad' },
  { key: '{OPERACION}', label: 'Operación', description: 'Venta o Alquiler' },
];

export default function VariableChips({ onInsert, compact = false }: VariableChipsProps) {
  return (
    <div className={compact ? 'mb-2' : 'mb-3'}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium text-gray-700">
          Variables disponibles
        </label>
        <button
          type="button"
          className="text-xs text-blue-600 hover:text-blue-700 active:text-blue-800"
          onClick={() => {
            // Show tooltip or help modal
          }}
        >
          ¿Cómo usar?
        </button>
      </div>

      <div className={`flex flex-wrap gap-2 ${compact ? '' : 'pb-2'}`}>
        {VARIABLES.map((variable) => (
          <button
            key={variable.key}
            type="button"
            onClick={() => onInsert(variable.key)}
            className="inline-flex items-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 rounded-full text-xs font-medium text-blue-700 transition-colors touch-manipulation"
            title={variable.description}
          >
            <svg
              className="w-3 h-3 mr-1.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            {variable.label}
          </button>
        ))}
      </div>

      {!compact && (
        <p className="mt-2 text-xs text-gray-500">
          Toca una variable para insertarla en el mensaje
        </p>
      )}
    </div>
  );
}
