/**
 * PhoneConfig Component
 * Configuration form for Phone contact method
 * Includes country code and phone number
 */

'use client';

import React, { useState } from 'react';
import CountryCodePicker from './CountryCodePicker';

interface PhoneConfigProps {
  value: {
    countryCode: string;
    phoneNumber: string;
    allowWhatsApp: boolean;
  };
  onChange: (value: PhoneConfigProps['value']) => void;
}

export default function PhoneConfig({ value, onChange }: PhoneConfigProps) {
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const handleCountryCodeChange = (code: string) => {
    onChange({ ...value, countryCode: code });
    setShowCountryPicker(false);
  };

  const handlePhoneChange = (phone: string) => {
    // Only allow numbers
    const cleaned = phone.replace(/\D/g, '');
    onChange({ ...value, phoneNumber: cleaned });
  };

  const isPhoneValid = value.phoneNumber.length >= 7;

  return (
    <div className="space-y-4">
      {/* Phone Number Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Número de teléfono
        </label>
        
        <div className="flex space-x-2">
          {/* Country Code */}
          <button
            onClick={() => setShowCountryPicker(true)}
            className="flex-shrink-0 w-20 h-11 px-3 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center justify-center"
          >
            {value.countryCode || '+51'}
          </button>

          {/* Phone Number */}
          <div className="flex-1 relative">
            <input
              type="tel"
              value={value.phoneNumber}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="987654321"
              className="w-full h-11 px-4 pr-10 bg-white border border-gray-300 rounded-lg text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={15}
            />
            {isPhoneValid && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Este número aparecerá en tus propiedades
        </p>
      </div>

      {/* WhatsApp Option */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            id="allow-whatsapp"
            checked={value.allowWhatsApp}
            onChange={(e) => onChange({ ...value, allowWhatsApp: e.target.checked })}
            className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div className="flex-1">
            <label htmlFor="allow-whatsapp" className="text-sm font-medium text-gray-900 cursor-pointer">
              Este número también es WhatsApp
            </label>
            <p className="mt-1 text-xs text-gray-600">
              Se mostrará un botón de WhatsApp junto al número de teléfono
            </p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Consejos para recibir más llamadas
        </h4>
        <ul className="space-y-1 text-xs text-gray-600">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Responde rápido a las llamadas perdidas</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Mantén tu número siempre disponible</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Considera activar WhatsApp para mayor alcance</span>
          </li>
        </ul>
      </div>

      {/* Country Code Picker Modal */}
      {showCountryPicker && (
        <CountryCodePicker
          currentCode={value.countryCode}
          onSelect={handleCountryCodeChange}
          onClose={() => setShowCountryPicker(false)}
        />
      )}
    </div>
  );
}
