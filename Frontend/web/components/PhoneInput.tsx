import React, { useState } from 'react';
import { COUNTRY_CODES, DEFAULT_COUNTRY_CODE, CountryCode } from '../utils/country-codes';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  required?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  placeholder = "+51987654321",
  label = "Teléfono",
  helperText,
  required = false,
}) => {
  const [selectedCode, setSelectedCode] = useState<string>(DEFAULT_COUNTRY_CODE);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Parsear el valor inicial
  React.useEffect(() => {
    if (value) {
      // Buscar qué código de país coincide
      const matchingCode = COUNTRY_CODES.find(c => value.startsWith(c.dialCode));
      if (matchingCode) {
        setSelectedCode(matchingCode.dialCode);
        setPhoneNumber(value.substring(matchingCode.dialCode.length));
      } else {
        setPhoneNumber(value);
      }
    }
  }, [value]);

  const handleCodeChange = (code: string) => {
    setSelectedCode(code);
    setIsDropdownOpen(false);
    // Actualizar el valor completo
    onChange(code + phoneNumber);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numbers = e.target.value.replace(/[^0-9]/g, '');
    setPhoneNumber(numbers);
    onChange(selectedCode + numbers);
  };

  const selectedCountry = COUNTRY_CODES.find(c => c.dialCode === selectedCode) || COUNTRY_CODES[0];

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="flex gap-2">
        {/* Selector de código de país */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="h-full px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center gap-2 min-w-[100px]"
          >
            <span className="text-xl">{selectedCountry.flag}</span>
            <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          {isDropdownOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />
              
              {/* Menú */}
              <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto">
                {COUNTRY_CODES.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCodeChange(country.dialCode)}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 ${
                      country.dialCode === selectedCode ? 'bg-blue-50' : ''
                    }`}
                  >
                    <span className="text-xl">{country.flag}</span>
                    <span className="text-sm flex-1">{country.name}</span>
                    <span className="text-sm font-medium text-gray-600">{country.dialCode}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Input de número */}
        <input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder="987654321"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      
      {helperText && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  );
};
