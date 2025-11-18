/**
 * MessagePreview Component
 * Shows real-time preview of how the message will look
 * Replaces variables with example data
 */

'use client';

import React from 'react';
import { ChatBubbleLeftIcon, EnvelopeIcon } from '@heroicons/react/24/solid';

interface MessagePreviewProps {
  message: string;
  method: 'whatsapp' | 'email' | 'phone';
  subject?: string;
}

const EXAMPLE_DATA = {
  '{TITULO}': 'Departamento 3 hab en San Isidro',
  '{PRECIO}': 'S/ 1,500/mes',
  '{DIRECCION}': 'Av. Camino Real 456, San Isidro',
  '{LINK}': 'https://easyrent.com/prop/abc123',
  '{TIPO}': 'Departamento',
  '{OPERACION}': 'Alquiler',
};

export default function MessagePreview({ message, method, subject }: MessagePreviewProps) {
  const replaceVariables = (text: string): string => {
    let result = text;
    Object.entries(EXAMPLE_DATA).forEach(([variable, value]) => {
      result = result.replace(new RegExp(variable, 'g'), value);
    });
    return result;
  };

  const previewMessage = replaceVariables(message);
  const previewSubject = subject ? replaceVariables(subject) : '';

  if (!message.trim()) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-3">
        {method === 'whatsapp' && (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <ChatBubbleLeftIcon className="w-4 h-4 text-green-600" />
          </div>
        )}
        {method === 'email' && (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <EnvelopeIcon className="w-4 h-4 text-blue-600" />
          </div>
        )}
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Vista previa</h4>
          <p className="text-xs text-gray-500">Así se verá tu mensaje</p>
        </div>
      </div>

      {/* Preview Content */}
      <div className="space-y-2">
        {/* Email Subject */}
        {method === 'email' && previewSubject && (
          <div className="pb-2 border-b border-gray-200">
            <p className="text-xs text-gray-500 mb-1">Asunto:</p>
            <p className="text-sm font-medium text-gray-900">{previewSubject}</p>
          </div>
        )}

        {/* Message */}
        <div>
          {method === 'email' && <p className="text-xs text-gray-500 mb-1">Mensaje:</p>}
          
          {method === 'whatsapp' ? (
            // WhatsApp style bubble
            <div className="bg-green-50 border border-green-200 rounded-2xl rounded-tl-sm p-3 max-w-[85%]">
              <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                {previewMessage}
              </p>
              <div className="flex items-center justify-end mt-1 space-x-1">
                <span className="text-xs text-gray-500">10:30</span>
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
              </div>
            </div>
          ) : (
            // Email style
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                {previewMessage}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Las variables serán reemplazadas automáticamente con la información de cada propiedad.
        </p>
      </div>
    </div>
  );
}
