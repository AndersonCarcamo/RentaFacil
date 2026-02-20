import { VALIDATION } from '@/constants';

export const validators = {
  // Validar email
  email(email: string): boolean {
    return VALIDATION.EMAIL_REGEX.test(email);
  },

  // Validar contraseña
  password(password: string): boolean {
    return password.length >= VALIDATION.PASSWORD_MIN_LENGTH;
  },

  // Validar teléfono (Perú)
  phone(phone: string): boolean {
    return VALIDATION.PHONE_REGEX.test(phone);
  },

  // Validar DNI
  dni(dni: string): boolean {
    return VALIDATION.DNI_REGEX.test(dni);
  },

  // Validar RUC
  ruc(ruc: string): boolean {
    return VALIDATION.RUC_REGEX.test(ruc);
  },

  // Validar documento según tipo
  document(value: string, type: string): boolean {
    switch (type) {
      case 'DNI':
        return this.dni(value);
      case 'RUC':
        return this.ruc(value);
      case 'CE':
        return value.length >= 9 && value.length <= 12;
      case 'PASSPORT':
        return value.length >= 6 && value.length <= 12;
      default:
        return false;
    }
  },

  // Validar que las contraseñas coincidan
  passwordMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword && password.length > 0;
  },

  // Validar nombre (no vacío, sin números)
  name(name: string): boolean {
    return name.trim().length > 0 && !/\d/.test(name);
  },

  // Validar campo requerido
  required(value: string): boolean {
    return value.trim().length > 0;
  },
};

// Mensajes de error
export const validationMessages = {
  email: 'Por favor ingresa un email válido',
  password: `La contraseña debe tener al menos ${VALIDATION.PASSWORD_MIN_LENGTH} caracteres`,
  passwordMatch: 'Las contraseñas no coinciden',
  phone: 'Por favor ingresa un número de celular válido (9 dígitos)',
  dni: 'El DNI debe tener 8 dígitos',
  ruc: 'El RUC debe tener 11 dígitos',
  document: 'Por favor ingresa un documento válido',
  name: 'Por favor ingresa un nombre válido',
  required: 'Este campo es requerido',
  terms: 'Debes aceptar los términos y condiciones',
  privacy: 'Debes aceptar las políticas de privacidad',
};

// Formatear documento
export const formatDocument = (value: string, type: string): string => {
  // Remover caracteres no numéricos
  const cleaned = value.replace(/\D/g, '');
  
  switch (type) {
    case 'DNI':
      return cleaned.slice(0, VALIDATION.DNI_LENGTH);
    case 'RUC':
      return cleaned.slice(0, VALIDATION.RUC_LENGTH);
    case 'CE':
      return cleaned.slice(0, 12);
    default:
      return value.slice(0, 12);
  }
};

// Formatear teléfono
export const formatPhone = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  return cleaned.slice(0, VALIDATION.PHONE_LENGTH);
};

// Obtener longitud máxima según tipo de documento
export const getDocumentMaxLength = (type: string): number => {
  switch (type) {
    case 'DNI':
      return VALIDATION.DNI_LENGTH;
    case 'RUC':
      return VALIDATION.RUC_LENGTH;
    case 'CE':
    case 'PASSPORT':
      return 12;
    default:
      return 20;
  }
};
