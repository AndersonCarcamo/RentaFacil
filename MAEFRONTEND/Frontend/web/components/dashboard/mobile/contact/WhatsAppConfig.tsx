/**
 * WhatsAppConfig Component
 * Configuration form for WhatsApp contact method
 * Includes country code, phone number, and message template
 */

'use client';

import React, { useState } from 'react';
import { PhoneIcon } from '@heroicons/react/24/solid';
import CountryCodePicker from './CountryCodePicker';
import MessagePreview from './MessagePreview';
import VariableChips from './VariableChips';

interface WhatsAppConfigProps {
  value: {
    countryCode: string;
    phoneNumber: string;
    message: string;
  };
  onChange: (value: WhatsAppConfigProps['value']) => void;
}

export default function WhatsAppConfig({ value, onChange }: WhatsAppConfigProps) {
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

  const handleMessageChange = (message: string) => {
    onChange({ ...value, message });
  };

  const insertVariable = (variable: string) => {
    const textarea = document.querySelector('textarea[name="whatsapp-message"]') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = value.message;
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newMessage = before + variable + after;
      onChange({ ...value, message: newMessage });
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const isPhoneValid = value.phoneNumber.length >= 7;

  return (
    <div className="space-y-4">
      {/* Phone Number Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Número de WhatsApp
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
          El número debe incluir el código de país sin el símbolo +
        </p>
      </div>

      {/* Message Template */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mensaje predeterminado
        </label>

        {/* Variable Chips */}
        <VariableChips onInsert={insertVariable} />

        {/* Message Textarea */}
        <textarea
          name="whatsapp-message"
          value={value.message}
          onChange={(e) => handleMessageChange(e.target.value)}
          placeholder="Hola, estoy interesado en {TITULO}..."
          className="w-full h-32 px-4 py-3 bg-white border border-gray-300 rounded-lg text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          maxLength={500}
        />

        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Usa variables para personalizar el mensaje
          </p>
          <span className="text-xs text-gray-500">
            {value.message.length}/500
          </span>
        </div>
      </div>

      {/* Preview */}
      <MessagePreview
        message={value.message}
        method="whatsapp"
      />

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
