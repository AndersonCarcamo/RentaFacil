/**
 * EmailConfig Component
 * Configuration form for Email contact method
 * Includes email address, subject, and message template
 */

'use client';

import React from 'react';
import MessagePreview from './MessagePreview';
import VariableChips from './VariableChips';

interface EmailConfigProps {
  value: {
    email: string;
    subject: string;
    message: string;
  };
  onChange: (value: EmailConfigProps['value']) => void;
}

export default function EmailConfig({ value, onChange }: EmailConfigProps) {
  const insertVariable = (variable: string, field: 'subject' | 'message') => {
    const textarea = document.querySelector(`textarea[name="email-${field}"]`) as HTMLTextAreaElement;
    const input = document.querySelector(`input[name="email-${field}"]`) as HTMLInputElement;
    const element = textarea || input;
    
    if (element) {
      const start = element.selectionStart || 0;
      const end = element.selectionEnd || 0;
      const text = value[field];
      const before = text.substring(0, start);
      const after = text.substring(end);
      const newText = before + variable + after;
      onChange({ ...value, [field]: newText });
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        element.focus();
        element.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email);

  return (
    <div className="space-y-4">
      {/* Email Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Correo electrónico
        </label>
        
        <div className="relative">
          <input
            type="email"
            value={value.email}
            onChange={(e) => onChange({ ...value, email: e.target.value })}
            placeholder="tu@email.com"
            className="w-full h-11 px-4 pr-10 bg-white border border-gray-300 rounded-lg text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {isEmailValid && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          )}
        </div>

        <p className="mt-2 text-xs text-gray-500">
          Los interesados verán este email para contactarte
        </p>
      </div>

      {/* Subject Template */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Asunto predeterminado
        </label>

        {/* Variable Chips for Subject */}
        <VariableChips
          onInsert={(v) => insertVariable(v, 'subject')}
          compact
        />

        <input
          name="email-subject"
          type="text"
          value={value.subject}
          onChange={(e) => onChange({ ...value, subject: e.target.value })}
          placeholder="Consulta sobre {TITULO}"
          className="w-full h-11 px-4 bg-white border border-gray-300 rounded-lg text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          maxLength={100}
        />

        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Asunto del email que recibirás
          </p>
          <span className="text-xs text-gray-500">
            {value.subject.length}/100
          </span>
        </div>
      </div>

      {/* Message Template */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mensaje predeterminado
        </label>

        {/* Variable Chips for Message */}
        <VariableChips onInsert={(v) => insertVariable(v, 'message')} />

        <textarea
          name="email-message"
          value={value.message}
          onChange={(e) => onChange({ ...value, message: e.target.value })}
          placeholder="Hola, me interesa {TITULO} ubicado en {DIRECCION}..."
          className="w-full h-32 px-4 py-3 bg-white border border-gray-300 rounded-lg text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          maxLength={1000}
        />

        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Mensaje que el interesado verá por defecto
          </p>
          <span className="text-xs text-gray-500">
            {value.message.length}/1000
          </span>
        </div>
      </div>

      {/* Preview */}
      <MessagePreview
        message={value.message}
        method="email"
        subject={value.subject}
      />
    </div>
  );
}
