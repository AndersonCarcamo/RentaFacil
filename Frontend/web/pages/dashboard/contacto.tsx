import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../lib/hooks/useAuth';
import { Header } from '../../components/Header';
import Button from '../../components/ui/Button';
import {
  ArrowLeftIcon,
  PhoneIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  CheckIcon,
  PlayIcon,
  InformationCircleIcon,
  ClockIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface ContactSettings {
  whatsapp: {
    enabled: boolean;
    countryCode: string;
    number: string;
    message: string;
    businessName: string;
  };
  email: {
    enabled: boolean;
    address: string;
    subject: string;
    message: string;
  };
  phone: {
    enabled: boolean;
    countryCode: string;
    number: string;
    schedule: string;
  };
}

// Lista de códigos de país comunes
const countryCodes = [
  { code: '+51', country: 'Perú', flag: '🇵🇪' },
  { code: '+1', country: 'EE.UU./Canadá', flag: '🇺🇸' },
  { code: '+52', country: 'México', flag: '🇲🇽' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+55', country: 'Brasil', flag: '🇧🇷' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴' },
  { code: '+58', country: 'Venezuela', flag: '🇻🇪' },
  { code: '+34', country: 'España', flag: '🇪🇸' },
  { code: '+44', country: 'Reino Unido', flag: '🇬🇧' },
];

type ContactTab = 'whatsapp' | 'email' | 'telefono';

export default function ContactoConfiguracion() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ContactTab>('whatsapp');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [contactSettings, setContactSettings] = useState<ContactSettings>({
    whatsapp: { 
      enabled: false,
      countryCode: '+51',
      number: '', 
      message: 'Hola! Me interesa la propiedad "{TITULO}" ubicada en {DIRECCION}. ¿Podrías darme más información sobre disponibilidad y características?\n\nLink: {LINK}',
      businessName: 'RENTA fácil'
    },
    email: { 
      enabled: false, 
      address: '',
      subject: 'Consulta sobre {TITULO}',
      message: 'Estimado/a,\n\nMe pongo en contacto para consultar sobre la propiedad "{TITULO}" ubicada en {DIRECCION}.\n\nMe gustaría obtener más información sobre disponibilidad, condiciones de alquiler y características del inmueble.\n\nPuede ver la propiedad en: {LINK}\n\nQuedo atento/a a su respuesta.\n\nSaludos cordiales.'
    },
    phone: { 
      enabled: false,
      countryCode: '+51',
      number: '',
      schedule: 'Lunes a Viernes: 9:00 AM - 6:00 PM'
    }
  });

  useEffect(() => {
    // Cargar configuración guardada del localStorage
    const savedSettings = localStorage.getItem('contactSettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      
      // Migrar mensajes viejos con variables de plantilla a mensajes nuevos
      const migratedSettings = { ...parsed };
      
      // Asegurar que tengan countryCode (migración)
      if (!migratedSettings.whatsapp.countryCode) {
        migratedSettings.whatsapp.countryCode = '+51';
      }
      if (!migratedSettings.phone.countryCode) {
        migratedSettings.phone.countryCode = '+51';
      }
      
      // Migrar WhatsApp si tiene variables de plantilla viejas
      if (parsed.whatsapp?.message?.includes('{{propertyTitle}}') || parsed.whatsapp?.message?.includes('{{propertyAddress}}')) {
        migratedSettings.whatsapp.message = 'Hola! Me interesa la propiedad "{TITULO}" ubicada en {DIRECCION}. ¿Podrías darme más información sobre disponibilidad y características?\n\nLink: {LINK}';
      }
      
      // Migrar Email si tiene variables de plantilla viejas
      if (parsed.email?.subject?.includes('{{propertyTitle}}')) {
        migratedSettings.email.subject = 'Consulta sobre {TITULO}';
      }
      
      if (parsed.email?.message?.includes('{{propertyTitle}}') || parsed.email?.message?.includes('{{propertyAddress}}')) {
        migratedSettings.email.message = 'Estimado/a,\n\nMe pongo en contacto para consultar sobre la propiedad "{TITULO}" ubicada en {DIRECCION}.\n\nMe gustaría obtener más información sobre disponibilidad, condiciones de alquiler y características del inmueble.\n\nPuede ver la propiedad en: {LINK}\n\nQuedo atento/a a su respuesta.\n\nSaludos cordiales.';
      }
      
      setContactSettings(migratedSettings);
      
      // Guardar la configuración migrada
      localStorage.setItem('contactSettings', JSON.stringify(migratedSettings));
    }
  }, []);

  const tabs = [
    {
      id: 'whatsapp' as ContactTab,
      name: 'WhatsApp Business',
      icon: DevicePhoneMobileIcon,
      description: 'Contacto directo y rápido'
    },
    {
      id: 'email' as ContactTab,
      name: 'Correo Electrónico',
      icon: EnvelopeIcon,
      description: 'Contacto formal'
    },
    {
      id: 'telefono' as ContactTab,
      name: 'Teléfono',
      icon: PhoneIcon,
      description: 'Llamada directa'
    },
  ];

  const handleSave = () => {
    setIsLoading(true);
    setMessage(null);

    // Validar que los métodos activos tengan datos completos
    const warnings = [];
    if (contactSettings.whatsapp.enabled && !contactSettings.whatsapp.number) {
      warnings.push('WhatsApp está activo pero falta el número');
    }
    if (contactSettings.email.enabled && !contactSettings.email.address) {
      warnings.push('Email está activo pero falta la dirección');
    }
    if (contactSettings.phone.enabled && !contactSettings.phone.number) {
      warnings.push('Teléfono está activo pero falta el número');
    }

    // Mostrar advertencias pero permitir guardar
    if (warnings.length > 0) {
      const warningMsg = `⚠️ Configuración guardada con advertencias:\n\n${warnings.join('\n')}\n\nEstos métodos no se mostrarán a los visitantes hasta que completes la información.`;
      
      try {
        localStorage.setItem('contactSettings', JSON.stringify(contactSettings));
        setMessage({ type: 'error', text: warningMsg });
        setIsLoading(false);
        return;
      } catch (error) {
        console.error('Error saving contact settings:', error);
        setMessage({ type: 'error', text: 'Error al guardar la configuración' });
        setIsLoading(false);
        return;
      }
    }

    try {
      localStorage.setItem('contactSettings', JSON.stringify(contactSettings));
      setMessage({ type: 'success', text: 'Configuración guardada exitosamente. Todos los métodos activos están completos.' });
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Error saving contact settings:', error);
      setMessage({ type: 'error', text: 'Error al guardar la configuración' });
    } finally {
      setIsLoading(false);
    }
  };

  // Función para renderizar texto con variables como pastillas
  const renderTextWithVariables = (text: string) => {
    const parts = text.split(/(\{[^}]+\})/);
    return parts.map((part, index) => {
      if (part.match(/\{[^}]+\}/)) {
        const varName = part.replace(/[{}]/g, '');
        let bgColor = 'bg-gray-100';
        let textColor = 'text-gray-700';
        
        if (varName === 'TITULO') {
          bgColor = 'bg-blue-100';
          textColor = 'text-blue-700';
        } else if (varName === 'DIRECCION') {
          bgColor = 'bg-green-100';
          textColor = 'text-green-700';
        } else if (varName === 'LINK') {
          bgColor = 'bg-purple-100';
          textColor = 'text-purple-700';
        }
        
        return (
          <span
            key={index}
            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${bgColor} ${textColor} mx-0.5`}
          >
            {varName}
          </span>
        );
      }
      return part;
    });
  };

  // Función para insertar variables con efecto visual
  const insertVariable = (type: 'whatsapp' | 'email-subject' | 'email-message', variable: string) => {
    let currentValue = '';
    let element: HTMLTextAreaElement | HTMLInputElement | null = null;
    
    if (type === 'whatsapp') {
      element = document.querySelector('textarea[data-whatsapp="true"]') as HTMLTextAreaElement;
      currentValue = contactSettings.whatsapp.message;
    } else if (type === 'email-subject') {
      element = document.querySelector('input[data-email-subject="true"]') as HTMLInputElement;
      currentValue = contactSettings.email.subject;
    } else if (type === 'email-message') {
      element = document.querySelector('textarea[data-email="true"]') as HTMLTextAreaElement;
      currentValue = contactSettings.email.message;
    }
    
    if (!element) return;
    
    const cursorPos = element.selectionStart || 0;
    const textBefore = currentValue.substring(0, cursorPos);
    const textAfter = currentValue.substring(cursorPos);
    const newValue = textBefore + variable + textAfter;
    
    // Actualizar el estado
    if (type === 'whatsapp') {
      setContactSettings(prev => ({
        ...prev,
        whatsapp: { ...prev.whatsapp, message: newValue }
      }));
    } else if (type === 'email-subject') {
      setContactSettings(prev => ({
        ...prev,
        email: { ...prev.email, subject: newValue }
      }));
    } else if (type === 'email-message') {
      setContactSettings(prev => ({
        ...prev,
        email: { ...prev.email, message: newValue }
      }));
    }
    
    // Efecto visual de inserción
    setTimeout(() => {
      element!.focus();
      element!.setSelectionRange(cursorPos + variable.length, cursorPos + variable.length);
      
      // Resaltar temporalmente
      element!.style.backgroundColor = '#fef3c7';
      element!.style.transition = 'background-color 0.3s ease';
      setTimeout(() => {
        element!.style.backgroundColor = '';
      }, 600);
    }, 50);
  };

  const handleTestWhatsApp = () => {
    if (!contactSettings.whatsapp.number) {
      alert('Por favor ingresa un número de WhatsApp válido');
      return;
    }
    
    // Datos de ejemplo para la prueba
    const testData = {
      title: 'Departamento moderno en Miraflores',
      address: 'Av. Larco 1234, Miraflores, Lima',
      propertyUrl: `${window.location.origin}/propiedad/ejemplo-123`
    };
    
    const testMessage = contactSettings.whatsapp.message
      .replace(/\{TITULO\}/g, testData.title)
      .replace(/\{DIRECCION\}/g, testData.address)
      .replace(/\{LINK\}/g, testData.propertyUrl);
    
    const fullNumber = `${contactSettings.whatsapp.countryCode}${contactSettings.whatsapp.number}`.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${fullNumber}?text=${encodeURIComponent(testMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleTestEmail = () => {
    if (!contactSettings.email.address) {
      alert('Por favor ingresa una dirección de email válida');
      return;
    }
    
    // Datos de ejemplo para la prueba
    const testData = {
      title: 'Departamento moderno en Miraflores',
      address: 'Av. Larco 1234, Miraflores, Lima',
      propertyUrl: `${window.location.origin}/propiedad/ejemplo-123`
    };
    
    const testSubject = contactSettings.email.subject
      .replace(/\{TITULO\}/g, testData.title)
      .replace(/\{DIRECCION\}/g, testData.address)
      .replace(/\{LINK\}/g, testData.propertyUrl);
    
    const testMessage = contactSettings.email.message
      .replace(/\{TITULO\}/g, testData.title)
      .replace(/\{DIRECCION\}/g, testData.address)
      .replace(/\{LINK\}/g, testData.propertyUrl);
    
    const mailtoUrl = `mailto:${contactSettings.email.address}?subject=${encodeURIComponent(testSubject)}&body=${encodeURIComponent(testMessage)}`;
    window.location.href = mailtoUrl;
  };

  const handleTestPhone = () => {
    if (!contactSettings.phone.number) {
      alert('Por favor ingresa un número de teléfono válido');
      return;
    }
    
    const fullNumber = `${contactSettings.phone.countryCode}${contactSettings.phone.number}`;
    const phoneUrl = `tel:${fullNumber}`;
    window.location.href = phoneUrl;
  };

  const renderWhatsApp = () => (
    <div className="border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <DevicePhoneMobileIcon className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <label className="text-lg font-semibold text-gray-900">WhatsApp Business</label>
            <p className="text-sm text-gray-500">Contacto directo y rápido con mensajes personalizados</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {contactSettings.whatsapp.enabled && contactSettings.whatsapp.number && (
            <button
              onClick={handleTestWhatsApp}
              className="flex items-center gap-2 px-3 py-2 text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
            >
              <PlayIcon className="h-4 w-4" />
              Probar
            </button>
          )}
          <input
            type="checkbox"
            checked={contactSettings.whatsapp.enabled}
            onChange={(e) => setContactSettings(prev => ({
              ...prev,
              whatsapp: { ...prev.whatsapp, enabled: e.target.checked }
            }))}
            className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
        </div>
      </div>
      
      {contactSettings.whatsapp.enabled && (
        <div className="space-y-4">
          {/* Advertencia si falta el número */}
          {!contactSettings.whatsapp.number && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-800">
                <span className="font-medium">WhatsApp activo pero sin número configurado.</span> Los visitantes no podrán contactarte por este medio hasta que ingreses tu número.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de WhatsApp *
              </label>
              <div className="flex gap-2">
                <select
                  value={contactSettings.whatsapp.countryCode}
                  onChange={(e) => setContactSettings(prev => ({
                    ...prev,
                    whatsapp: { ...prev.whatsapp, countryCode: e.target.value }
                  }))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                >
                  {countryCodes.map(({ code, country, flag }) => (
                    <option key={code} value={code}>
                      {flag} {code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  placeholder="987654321"
                  value={contactSettings.whatsapp.number}
                  onChange={(e) => setContactSettings(prev => ({
                    ...prev,
                    whatsapp: { ...prev.whatsapp, number: e.target.value.replace(/\D/g, '') }
                  }))}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    !contactSettings.whatsapp.number ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                  }`}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Solo números, sin espacios ni guiones
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Negocio
              </label>
              <input
                type="text"
                placeholder="Ej: Inmobiliaria XYZ"
                value={contactSettings.whatsapp.businessName}
                onChange={(e) => setContactSettings(prev => ({
                  ...prev,
                  whatsapp: { ...prev.whatsapp, businessName: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje Predeterminado
            </label>
            
            {/* Variables disponibles */}
            <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
              <p className="text-sm font-medium text-gray-700 mb-2">Variables disponibles (opcional):</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => insertVariable('whatsapp', '{TITULO}')}
                  className="px-3 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-sm rounded-lg hover:from-blue-200 hover:to-blue-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-105 border border-blue-200"
                >
                  + Título
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable('whatsapp', '{DIRECCION}')}
                  className="px-3 py-2 bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-sm rounded-lg hover:from-green-200 hover:to-green-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-105 border border-green-200"
                >
                  + Dirección
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable('whatsapp', '{LINK}')}
                  className="px-3 py-2 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 text-sm rounded-lg hover:from-purple-200 hover:to-purple-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-105 border border-purple-200"
                >
                  + Enlace
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Haz clic para insertar variables donde esté el cursor. Puedes escribir tu mensaje libremente y agregar las variables que necesites.
              </p>
            </div>

            <textarea
              data-whatsapp="true"
              value={contactSettings.whatsapp.message}
              onChange={(e) => setContactSettings(prev => ({
                ...prev,
                whatsapp: { ...prev.whatsapp, message: e.target.value }
              }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Escribe tu mensaje personalizado. Puedes usar las variables de arriba para incluir información específica de cada propiedad..."
            />
            
            {/* Preview del mensaje con variables como pastillas */}
            {contactSettings.whatsapp.message && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                <div className="text-xs font-medium text-gray-600 mb-2">Vista previa:</div>
                <div className="text-sm leading-relaxed">
                  {renderTextWithVariables(contactSettings.whatsapp.message)}
                </div>
              </div>
            )}
            
            <div className="mt-2 text-xs text-gray-500">
              💡 <strong>Tip:</strong> Las variables se reemplazarán automáticamente con los datos reales de cada propiedad cuando alguien contacte.
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderEmail = () => (
    <div className="border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <EnvelopeIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <label className="text-lg font-semibold text-gray-900">Correo Electrónico</label>
            <p className="text-sm text-gray-500">Contacto formal con información detallada</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {contactSettings.email.enabled && contactSettings.email.address && (
            <button
              onClick={handleTestEmail}
              className="flex items-center gap-2 px-3 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <PlayIcon className="h-4 w-4" />
              Probar
            </button>
          )}
          <input
            type="checkbox"
            checked={contactSettings.email.enabled}
            onChange={(e) => setContactSettings(prev => ({
              ...prev,
              email: { ...prev.email, enabled: e.target.checked }
            }))}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </div>
      </div>
      
      {contactSettings.email.enabled && (
        <div className="space-y-4">
          {/* Advertencia si falta la dirección de email */}
          {!contactSettings.email.address && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-800">
                <span className="font-medium">Email activo pero sin dirección configurada.</span> Los visitantes no podrán contactarte por este medio hasta que ingreses tu email.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección de Email *
              </label>
              <input
                type="email"
                placeholder="contacto@tuempresa.com"
                value={contactSettings.email.address}
                onChange={(e) => setContactSettings(prev => ({
                  ...prev,
                  email: { ...prev.email, address: e.target.value }
                }))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  !contactSettings.email.address ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asunto Predeterminado
              </label>
              
              {/* Variables para asunto */}
              <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
                <p className="text-sm font-medium text-gray-700 mb-2">Variables disponibles:</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => insertVariable('email-subject', '{TITULO}')}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-sm rounded-lg hover:from-blue-200 hover:to-blue-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-105 border border-blue-200"
                  >
                    + Título
                  </button>
                  <button
                    type="button"
                    onClick={() => insertVariable('email-subject', '{DIRECCION}')}
                    className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-sm rounded-lg hover:from-green-200 hover:to-green-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-105 border border-green-200"
                  >
                    + Dirección
                  </button>
                </div>
              </div>
              
              <input
                data-email-subject="true"
                type="text"
                placeholder="Ej: Consulta sobre {TITULO}"
                value={contactSettings.email.subject}
                onChange={(e) => setContactSettings(prev => ({
                  ...prev,
                  email: { ...prev.email, subject: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              
              {/* Preview del asunto con variables */}
              {contactSettings.email.subject && (
                <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-xs font-medium text-blue-600 mb-1">Vista previa del asunto:</div>
                  <div className="text-sm">
                    {renderTextWithVariables(contactSettings.email.subject)}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mensaje Predeterminado
            </label>
            
            {/* Variables para mensaje de email */}
            <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
              <p className="text-sm font-medium text-gray-700 mb-2">Variables disponibles (opcional):</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => insertVariable('email-message', '{TITULO}')}
                  className="px-3 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 text-sm rounded-lg hover:from-blue-200 hover:to-blue-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-105 border border-blue-200"
                >
                  + Título
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable('email-message', '{DIRECCION}')}
                  className="px-3 py-2 bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-sm rounded-lg hover:from-green-200 hover:to-green-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-105 border border-green-200"
                >
                  + Dirección
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable('email-message', '{LINK}')}
                  className="px-3 py-2 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 text-sm rounded-lg hover:from-purple-200 hover:to-purple-300 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-105 border border-purple-200"
                >
                  + Enlace
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Personaliza tu mensaje como prefieras y agrega las variables que necesites.
              </p>
            </div>

            <textarea
              data-email="true"
              value={contactSettings.email.message}
              onChange={(e) => setContactSettings(prev => ({
                ...prev,
                email: { ...prev.email, message: e.target.value }
              }))}
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Escribe tu mensaje formal para email. Puedes incluir las variables según necesites..."
            />
            
            {/* Preview del mensaje con variables como pastillas */}
            {contactSettings.email.message && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs font-medium text-blue-600 mb-2">Vista previa del mensaje:</div>
                <div className="text-sm leading-relaxed whitespace-pre-line">
                  {renderTextWithVariables(contactSettings.email.message)}
                </div>
              </div>
            )}
            
            <div className="mt-2 text-xs text-gray-500">
              💡 <strong>Ejemplo:</strong> "Estimado/a, me interesa la propiedad {'{TITULO}'} en {'{DIRECCION}'}. Enlace: {'{LINK}'}"
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTelefono = () => (
    <div className="border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <PhoneIcon className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <label className="text-lg font-semibold text-gray-900">Teléfono</label>
            <p className="text-sm text-gray-500">Llamada directa para consultas inmediatas</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {contactSettings.phone.enabled && contactSettings.phone.number && (
            <button
              onClick={handleTestPhone}
              className="flex items-center gap-2 px-3 py-2 text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <PlayIcon className="h-4 w-4" />
              Llamar
            </button>
          )}
          <input
            type="checkbox"
            checked={contactSettings.phone.enabled}
            onChange={(e) => setContactSettings(prev => ({
              ...prev,
              phone: { ...prev.phone, enabled: e.target.checked }
            }))}
            className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
        </div>
      </div>
      
      {contactSettings.phone.enabled && (
        <div className="space-y-4">
          {/* Advertencia si falta el número de teléfono */}
          {!contactSettings.phone.number && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-800">
                <span className="font-medium">Teléfono activo pero sin número configurado.</span> Los visitantes no podrán contactarte por este medio hasta que ingreses tu número.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Teléfono *
              </label>
              <div className="flex gap-2">
                <select
                  value={contactSettings.phone.countryCode}
                  onChange={(e) => setContactSettings(prev => ({
                    ...prev,
                    phone: { ...prev.phone, countryCode: e.target.value }
                  }))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                >
                  {countryCodes.map(({ code, country, flag }) => (
                    <option key={code} value={code}>
                      {flag} {code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  placeholder="987654321"
                  value={contactSettings.phone.number}
                  onChange={(e) => setContactSettings(prev => ({
                    ...prev,
                    phone: { ...prev.phone, number: e.target.value.replace(/\D/g, '') }
                  }))}
                  className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    !contactSettings.phone.number ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
                  }`}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Solo números, sin espacios ni guiones
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ClockIcon className="h-4 w-4 inline mr-1" />
                Horario de Atención
              </label>
              <input
                type="text"
                placeholder="Lunes a Viernes: 9:00 AM - 6:00 PM"
                value={contactSettings.phone.schedule}
                onChange={(e) => setContactSettings(prev => ({
                  ...prev,
                  phone: { ...prev.phone, schedule: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'whatsapp':
        return renderWhatsApp();
      case 'email':
        return renderEmail();
      case 'telefono':
        return renderTelefono();
      default:
        return null;
    }
  };

  return (
    <>
      <Head>
        <title>Configuración de Contacto - RentaFácil</title>
      </Head>
      
      <Header />
      
      <main className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Configuración de Contacto
                </h1>
                <p className="text-gray-600">
                  Configura cómo los inquilinos pueden contactarte
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <div className="text-left">
                        <div>{tab.name}</div>
                        <div className="text-xs text-gray-400">{tab.description}</div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            {renderTabContent()}
            
              {/* Actions */}
            <div className="flex justify-between items-center pt-6 mt-6 border-t">
              {message && (
                <div className={`px-4 py-2 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {message.text}
                </div>
              )}
              
              <div className="flex gap-3 ml-auto">
                <Button
                  variant="secondary"
                  onClick={() => router.push('/dashboard')}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}