/**
 * CountryCodePicker Component
 * Bottom sheet modal for selecting country code
 * Includes search and popular countries
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { code: 'PE', name: 'Perú', dialCode: '+51', flag: '🇵🇪' },
  { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
  { code: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
  { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
  { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪' },
  { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨' },
  { code: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴' },
  { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾' },
  { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾' },
  { code: 'ES', name: 'España', dialCode: '+34', flag: '🇪🇸' },
];

const POPULAR_COUNTRIES = ['PE', 'US', 'MX', 'AR'];

interface CountryCodePickerProps {
  currentCode: string;
  onSelect: (dialCode: string) => void;
  onClose: () => void;
}

export default function CountryCodePicker({
  currentCode,
  onSelect,
  onClose,
}: CountryCodePickerProps) {
  const [search, setSearch] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 200);
  };

  const handleSelect = (dialCode: string) => {
    onSelect(dialCode);
    handleClose();
  };

  const filteredCountries = COUNTRIES.filter((country) => {
    const searchLower = search.toLowerCase();
    return (
      country.name.toLowerCase().includes(searchLower) ||
      country.dialCode.includes(searchLower) ||
      country.code.toLowerCase().includes(searchLower)
    );
  });

  const popularCountries = COUNTRIES.filter((c) =>
    POPULAR_COUNTRIES.includes(c.code)
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black z-[60] transition-opacity duration-200 ${
          isVisible ? 'bg-opacity-50' : 'bg-opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Bottom Sheet */}
      <div
        ref={modalRef}
        className={`fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-2xl shadow-2xl transition-transform duration-200 ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '85vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 pb-4 z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Seleccionar país
            </h3>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar país o código..."
              className="w-full h-11 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-4 pb-safe" style={{ maxHeight: 'calc(85vh - 140px)' }}>
          {/* Popular Countries */}
          {!search && (
            <div className="py-3">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Países populares
              </h4>
              <div className="space-y-1">
                {popularCountries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => handleSelect(country.dialCode)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      currentCode === country.dialCode
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 active:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{country.flag}</span>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">
                          {country.name}
                        </p>
                        <p className="text-xs text-gray-500">{country.dialCode}</p>
                      </div>
                    </div>
                    {currentCode === country.dialCode && (
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All Countries */}
          <div className="py-3">
            {!search && (
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Todos los países
              </h4>
            )}
            <div className="space-y-1">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => handleSelect(country.dialCode)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                      currentCode === country.dialCode
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 active:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{country.flag}</span>
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">
                          {country.name}
                        </p>
                        <p className="text-xs text-gray-500">{country.dialCode}</p>
                      </div>
                    </div>
                    {currentCode === country.dialCode && (
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-500">
                    No se encontraron resultados
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
