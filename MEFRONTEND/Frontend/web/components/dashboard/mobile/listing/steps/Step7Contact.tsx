/**
 * Step7Contact Component
 * Contact information
 */

'use client';

import React from 'react';
import { PhoneIcon, EnvelopeIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

interface Step7Data {
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  preferredContact: 'whatsapp' | 'phone' | 'email';
}

interface Step7ContactProps {
  data: Step7Data;
  onChange: (data: Partial<Step7Data>) => void;
}

export default function Step7Contact({ data, onChange }: Step7ContactProps) {
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Información de contacto
        </h2>
        <p className="text-sm text-gray-600">
          ¿Cómo pueden contactarte los interesados?
        </p>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre de contacto
        </label>
        <input
          type="text"
          value={data.contactName}
          onChange={(e) => onChange({ contactName: e.target.value })}
          placeholder="Tu nombre"
          className="w-full h-12 px-4 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Teléfono / WhatsApp
        </label>
        <input
          type="tel"
          value={data.contactPhone}
          onChange={(e) => onChange({ contactPhone: e.target.value })}
          placeholder="987 654 321"
          className="w-full h-12 px-4 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Correo electrónico
        </label>
        <input
          type="email"
          value={data.contactEmail}
          onChange={(e) => onChange({ contactEmail: e.target.value })}
          placeholder="tu@email.com"
          className="w-full h-12 px-4 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Preferred Contact Method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Método de contacto preferido
        </label>
        
        <div className="space-y-2">
          <button
            onClick={() => onChange({ preferredContact: 'whatsapp' })}
            className={`w-full p-4 rounded-lg border-2 transition-all active:scale-98 ${
              data.preferredContact === 'whatsapp'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <DevicePhoneMobileIcon
                className={`w-6 h-6 ${
                  data.preferredContact === 'whatsapp' ? 'text-green-600' : 'text-gray-600'
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  data.preferredContact === 'whatsapp' ? 'text-green-900' : 'text-gray-700'
                }`}
              >
                WhatsApp (Recomendado)
              </span>
            </div>
          </button>

          <button
            onClick={() => onChange({ preferredContact: 'phone' })}
            className={`w-full p-4 rounded-lg border-2 transition-all active:scale-98 ${
              data.preferredContact === 'phone'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <PhoneIcon
                className={`w-6 h-6 ${
                  data.preferredContact === 'phone' ? 'text-blue-600' : 'text-gray-600'
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  data.preferredContact === 'phone' ? 'text-blue-900' : 'text-gray-700'
                }`}
              >
                Llamada telefónica
              </span>
            </div>
          </button>

          <button
            onClick={() => onChange({ preferredContact: 'email' })}
            className={`w-full p-4 rounded-lg border-2 transition-all active:scale-98 ${
              data.preferredContact === 'email'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-center space-x-3">
              <EnvelopeIcon
                className={`w-6 h-6 ${
                  data.preferredContact === 'email' ? 'text-purple-600' : 'text-gray-600'
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  data.preferredContact === 'email' ? 'text-purple-900' : 'text-gray-700'
                }`}
              >
                Correo electrónico
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
