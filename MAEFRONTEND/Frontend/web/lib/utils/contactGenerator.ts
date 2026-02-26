// Utilidades para generar links de contacto con datos dinámicos

export interface PropertyContactData {
  title: string;
  address: string;
  propertyUrl: string; // URL completa de la propiedad
}

export interface ContactSettings {
  whatsapp: {
    enabled: boolean;
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
    number: string;
    schedule: string;
  };
}

/**
 * Genera URLs de contacto personalizadas para una propiedad específica
 */
export class ContactGenerator {
  
  /**
   * Obtiene la configuración de contacto desde localStorage
   */
  static getContactSettings(): ContactSettings | null {
    const savedSettings = localStorage.getItem('contactSettings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
    return null;
  }

  /**
   * Reemplaza las variables en un texto con los datos de la propiedad
   */
  private static replaceVariables(text: string, propertyData: PropertyContactData): string {
    return text
      .replace(/\{TITULO\}/g, propertyData.title)
      .replace(/\{DIRECCION\}/g, propertyData.address)
      .replace(/\{LINK\}/g, propertyData.propertyUrl);
  }

  /**
   * Genera URL de WhatsApp con mensaje personalizado
   */
  static generateWhatsAppUrl(propertyData: PropertyContactData): string | null {
    const settings = this.getContactSettings();
    if (!settings || !settings.whatsapp.enabled || !settings.whatsapp.number) {
      return null;
    }

    const personalizedMessage = this.replaceVariables(settings.whatsapp.message, propertyData);
    const phoneNumber = settings.whatsapp.number.replace(/\D/g, '');
    
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(personalizedMessage)}`;
  }

  /**
   * Genera URL de email con asunto y mensaje personalizados
   */
  static generateEmailUrl(propertyData: PropertyContactData): string | null {
    const settings = this.getContactSettings();
    if (!settings || !settings.email.enabled || !settings.email.address) {
      return null;
    }

    const personalizedSubject = this.replaceVariables(settings.email.subject, propertyData);
    const personalizedMessage = this.replaceVariables(settings.email.message, propertyData);
    
    return `mailto:${settings.email.address}?subject=${encodeURIComponent(personalizedSubject)}&body=${encodeURIComponent(personalizedMessage)}`;
  }

  /**
   * Genera URL de teléfono
   */
  static generatePhoneUrl(): string | null {
    const settings = this.getContactSettings();
    if (!settings || !settings.phone.enabled || !settings.phone.number) {
      return null;
    }
    
    return `tel:${settings.phone.number}`;
  }

  /**
   * Obtiene todos los métodos de contacto disponibles para una propiedad
   */
  static getAvailableContactMethods(propertyData: PropertyContactData) {
    const settings = this.getContactSettings();
    if (!settings) {
      return {
        whatsapp: null,
        email: null,
        phone: null
      };
    }

    return {
      whatsapp: settings.whatsapp.enabled ? {
        url: this.generateWhatsAppUrl(propertyData),
        number: settings.whatsapp.number,
        businessName: settings.whatsapp.businessName
      } : null,
      
      email: settings.email.enabled ? {
        url: this.generateEmailUrl(propertyData),
        address: settings.email.address
      } : null,
      
      phone: settings.phone.enabled ? {
        url: this.generatePhoneUrl(),
        number: settings.phone.number,
        schedule: settings.phone.schedule
      } : null
    };
  }
}

/**
 * Hook de React para usar el generador de contacto
 */
export function useContactGenerator(propertyData: PropertyContactData) {
  const contactMethods = ContactGenerator.getAvailableContactMethods(propertyData);
  
  const contactViaWhatsApp = () => {
    const url = ContactGenerator.generateWhatsAppUrl(propertyData);
    if (url) {
      window.open(url, '_blank');
    } else {
      alert('WhatsApp no está configurado');
    }
  };

  const contactViaEmail = () => {
    const url = ContactGenerator.generateEmailUrl(propertyData);
    if (url) {
      window.location.href = url;
    } else {
      alert('Email no está configurado');
    }
  };

  const contactViaPhone = () => {
    const url = ContactGenerator.generatePhoneUrl();
    if (url) {
      window.location.href = url;
    } else {
      alert('Teléfono no está configurado');
    }
  };

  return {
    contactMethods,
    contactViaWhatsApp,
    contactViaEmail,
    contactViaPhone
  };
}