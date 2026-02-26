/**
 * MobileContactPage Component
 * Mobile-optimized contact configuration page
 * Uses accordion cards instead of tabs
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  DevicePhoneMobileIcon,
  EnvelopeIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import {
  MobileContactLayout,
  ContactMethodCard,
  WhatsAppConfig,
  EmailConfig,
  PhoneConfig,
  SaveFloatingButton,
  SuccessFeedback,
} from './index';

interface ContactSettings {
  whatsapp: {
    enabled: boolean;
    countryCode: string;
    phoneNumber: string;
    message: string;
  };
  email: {
    enabled: boolean;
    email: string;
    subject: string;
    message: string;
  };
  phone: {
    enabled: boolean;
    countryCode: string;
    phoneNumber: string;
    allowWhatsApp: boolean;
  };
}

const DEFAULT_SETTINGS: ContactSettings = {
  whatsapp: {
    enabled: false,
    countryCode: '+51',
    phoneNumber: '',
    message: 'Hola, estoy interesado en {TITULO} ubicado en {DIRECCION}.\n\nPrecio: {PRECIO}\n\nVer más: {LINK}',
  },
  email: {
    enabled: false,
    email: '',
    subject: 'Consulta sobre {TITULO}',
    message: 'Hola,\n\nEstoy interesado en la propiedad {TITULO} ubicada en {DIRECCION}.\n\nMe gustaría obtener más información.\n\nGracias.',
  },
  phone: {
    enabled: false,
    countryCode: '+51',
    phoneNumber: '',
    allowWhatsApp: false,
  },
};

export default function MobileContactPage() {
  const [settings, setSettings] = useState<ContactSettings>(DEFAULT_SETTINGS);
  const [initialSettings, setInitialSettings] = useState<ContactSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('mobile_contact_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings(parsed);
        setInitialSettings(parsed);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Detect changes
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  // Save settings
  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Save to localStorage
      localStorage.setItem('mobile_contact_settings', JSON.stringify(settings));

      // Update initial settings
      setInitialSettings(settings);

      // Show success feedback
      setShowSuccess(true);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MobileContactLayout>
      {/* WhatsApp */}
      <ContactMethodCard
        icon={<DevicePhoneMobileIcon className="w-6 h-6" />}
        title="WhatsApp"
        description="Recibe mensajes directos por WhatsApp"
        enabled={settings.whatsapp.enabled}
        onToggle={(enabled) =>
          setSettings((prev) => ({
            ...prev,
            whatsapp: { ...prev.whatsapp, enabled },
          }))
        }
        badge="Recomendado"
        badgeColor="green"
      >
        <WhatsAppConfig
          value={settings.whatsapp}
          onChange={(value) =>
            setSettings((prev) => ({ ...prev, whatsapp: value }))
          }
        />
      </ContactMethodCard>

      {/* Email */}
      <ContactMethodCard
        icon={<EnvelopeIcon className="w-6 h-6" />}
        title="Correo Electrónico"
        description="Recibe consultas por email"
        enabled={settings.email.enabled}
        onToggle={(enabled) =>
          setSettings((prev) => ({
            ...prev,
            email: { ...prev.email, enabled },
          }))
        }
        badge="Popular"
        badgeColor="blue"
      >
        <EmailConfig
          value={settings.email}
          onChange={(value) =>
            setSettings((prev) => ({ ...prev, email: value }))
          }
        />
      </ContactMethodCard>

      {/* Phone */}
      <ContactMethodCard
        icon={<PhoneIcon className="w-6 h-6" />}
        title="Teléfono"
        description="Permite llamadas telefónicas"
        enabled={settings.phone.enabled}
        onToggle={(enabled) =>
          setSettings((prev) => ({
            ...prev,
            phone: { ...prev.phone, enabled },
          }))
        }
      >
        <PhoneConfig
          value={settings.phone}
          onChange={(value) =>
            setSettings((prev) => ({ ...prev, phone: value }))
          }
        />
      </ContactMethodCard>

      {/* Save FAB */}
      <SaveFloatingButton
        hasChanges={hasChanges}
        onSave={handleSave}
        isSaving={isSaving}
      />

      {/* Success Feedback */}
      <SuccessFeedback
        show={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </MobileContactLayout>
  );
}
