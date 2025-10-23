import React from 'react';
import { 
  DevicePhoneMobileIcon, 
  EnvelopeIcon, 
  PhoneIcon 
} from '@heroicons/react/24/outline';
import { useContactGenerator, PropertyContactData } from '../lib/utils/contactGenerator';

interface PropertyContactButtonsProps {
  property: {
    id: string;
    title: string;
    address: string;
  };
  className?: string;
}

export function PropertyContactButtons({ property, className = '' }: PropertyContactButtonsProps) {
  const propertyData: PropertyContactData = {
    title: property.title,
    address: property.address,
    propertyUrl: `${window.location.origin}/propiedad/${property.id}`
  };

  const { contactMethods, contactViaWhatsApp, contactViaEmail, contactViaPhone } = useContactGenerator(propertyData);

  // Si no hay métodos de contacto configurados
  if (!contactMethods.whatsapp && !contactMethods.email && !contactMethods.phone) {
    return (
      <div className={`text-center p-4 bg-gray-50 rounded-lg ${className}`}>
        <p className="text-gray-500 text-sm">
          Los métodos de contacto no están configurados
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h4 className="font-medium text-gray-900 mb-3">Contactar al propietario</h4>
      
      <div className="flex flex-col gap-2">
        {/* WhatsApp */}
        {contactMethods.whatsapp && (
          <button
            onClick={contactViaWhatsApp}
            className="flex items-center gap-3 w-full p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
          >
            <DevicePhoneMobileIcon className="w-5 h-5 text-green-600" />
            <div className="text-left flex-1">
              <div className="font-medium text-green-900">WhatsApp</div>
              <div className="text-sm text-green-600">{contactMethods.whatsapp.businessName || 'Contacto directo'}</div>
            </div>
          </button>
        )}

        {/* Email */}
        {contactMethods.email && (
          <button
            onClick={contactViaEmail}
            className="flex items-center gap-3 w-full p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
          >
            <EnvelopeIcon className="w-5 h-5 text-blue-600" />
            <div className="text-left flex-1">
              <div className="font-medium text-blue-900">Email</div>
              <div className="text-sm text-blue-600">Consulta formal</div>
            </div>
          </button>
        )}

        {/* Teléfono */}
        {contactMethods.phone && (
          <button
            onClick={contactViaPhone}
            className="flex items-center gap-3 w-full p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
          >
            <PhoneIcon className="w-5 h-5 text-purple-600" />
            <div className="text-left flex-1">
              <div className="font-medium text-purple-900">Llamar</div>
              <div className="text-sm text-purple-600">{contactMethods.phone.schedule || 'Contacto directo'}</div>
            </div>
          </button>
        )}
      </div>

      <div className="text-xs text-gray-500 mt-2 px-1">
        Los mensajes incluirán automáticamente el título, dirección y enlace de esta propiedad
      </div>
    </div>
  );
}

export default PropertyContactButtons;