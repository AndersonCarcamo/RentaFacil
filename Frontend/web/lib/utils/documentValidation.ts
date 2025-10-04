/**
 * Validaciones de documentos de identidad peruanos
 */

/**
 * Valida un DNI peruano
 * - Debe tener exactamente 8 dígitos
 * - Solo números
 */
export const validateDNI = (dni: string): { valid: boolean; error?: string } => {
  if (!dni) {
    return { valid: false, error: 'El DNI es requerido' };
  }

  const cleaned = dni.trim();

  if (!/^\d+$/.test(cleaned)) {
    return { valid: false, error: 'El DNI solo debe contener números' };
  }

  if (cleaned.length !== 8) {
    return { valid: false, error: 'El DNI debe tener exactamente 8 dígitos' };
  }

  // Validar que no sea todo ceros o dígitos consecutivos obvios
  if (cleaned === '00000000' || cleaned === '11111111' || cleaned === '12345678') {
    return { valid: false, error: 'El DNI ingresado no es válido' };
  }

  return { valid: true };
};

/**
 * Valida un RUC peruano
 * - Debe tener exactamente 11 dígitos
 * - Debe empezar con 10, 15, 17 o 20
 * - Incluye validación de dígito verificador
 */
export const validateRUC = (ruc: string): { valid: boolean; error?: string } => {
  if (!ruc) {
    return { valid: false, error: 'El RUC es requerido' };
  }

  const cleaned = ruc.trim();

  if (!/^\d+$/.test(cleaned)) {
    return { valid: false, error: 'El RUC solo debe contener números' };
  }

  if (cleaned.length !== 11) {
    return { valid: false, error: 'El RUC debe tener exactamente 11 dígitos' };
  }

  // Validar prefijos válidos
  const prefix = cleaned.substring(0, 2);
  const validPrefixes = ['10', '15', '17', '20'];
  
  if (!validPrefixes.includes(prefix)) {
    return { 
      valid: false, 
      error: 'El RUC debe empezar con 10 (persona natural), 15 (persona natural no domiciliada), 17 (gobierno), o 20 (persona jurídica)' 
    };
  }

  // Validar dígito verificador
  const digits = cleaned.split('').map(Number);
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * weights[i];
  }
  
  const remainder = sum % 11;
  const checkDigit = remainder === 0 ? 0 : remainder === 1 ? 1 : 11 - remainder;
  
  if (checkDigit !== digits[10]) {
    return { valid: false, error: 'El dígito verificador del RUC no es válido' };
  }

  return { valid: true };
};

/**
 * Valida un Carnet de Extranjería peruano
 * - Debe tener exactamente 9 dígitos
 * - Solo números
 */
export const validateCE = (ce: string): { valid: boolean; error?: string } => {
  if (!ce) {
    return { valid: false, error: 'El Carnet de Extranjería es requerido' };
  }

  const cleaned = ce.trim();

  if (!/^\d+$/.test(cleaned)) {
    return { valid: false, error: 'El Carnet de Extranjería solo debe contener números' };
  }

  if (cleaned.length !== 9) {
    return { valid: false, error: 'El Carnet de Extranjería debe tener exactamente 9 dígitos' };
  }

  return { valid: true };
};

/**
 * Valida un Pasaporte
 * - Longitud entre 6 y 20 caracteres
 * - Puede contener letras y números
 * - No debe tener caracteres especiales
 */
export const validatePassport = (passport: string): { valid: boolean; error?: string } => {
  if (!passport) {
    return { valid: false, error: 'El número de pasaporte es requerido' };
  }

  const cleaned = passport.trim().toUpperCase();

  if (!/^[A-Z0-9]+$/.test(cleaned)) {
    return { valid: false, error: 'El pasaporte solo debe contener letras y números' };
  }

  if (cleaned.length < 6) {
    return { valid: false, error: 'El pasaporte debe tener al menos 6 caracteres' };
  }

  if (cleaned.length > 20) {
    return { valid: false, error: 'El pasaporte no puede exceder 20 caracteres' };
  }

  return { valid: true };
};

/**
 * Valida un documento según su tipo
 */
export const validateDocument = (
  documentType: string,
  documentNumber: string
): { valid: boolean; error?: string } => {
  switch (documentType) {
    case 'DNI':
      return validateDNI(documentNumber);
    case 'RUC':
      return validateRUC(documentNumber);
    case 'CE':
      return validateCE(documentNumber);
    case 'Pasaporte':
      return validatePassport(documentNumber);
    default:
      return { valid: false, error: 'Tipo de documento no válido' };
  }
};

/**
 * Formatea un documento para visualización
 */
export const formatDocument = (documentType: string, documentNumber: string): string => {
  const cleaned = documentNumber.replace(/\D/g, '');
  
  switch (documentType) {
    case 'DNI':
      // Formato: 12345678
      return cleaned.substring(0, 8);
    case 'RUC':
      // Formato: 20123456789
      return cleaned.substring(0, 11);
    case 'CE':
      // Formato: 123456789
      return cleaned.substring(0, 9);
    case 'Pasaporte':
      // Sin formato especial
      return documentNumber.trim().toUpperCase();
    default:
      return documentNumber;
  }
};

/**
 * Obtiene el tipo de persona según el RUC
 */
export const getRUCType = (ruc: string): string | null => {
  if (ruc.length !== 11) return null;
  
  const prefix = ruc.substring(0, 2);
  
  switch (prefix) {
    case '10':
      return 'Persona Natural';
    case '15':
      return 'Persona Natural No Domiciliada';
    case '17':
      return 'Entidad Gubernamental';
    case '20':
      return 'Persona Jurídica';
    default:
      return null;
  }
};

/**
 * Máscara de entrada para documentos
 */
export const getDocumentMask = (documentType: string): string => {
  switch (documentType) {
    case 'DNI':
      return '99999999';
    case 'RUC':
      return '99999999999';
    case 'CE':
      return '999999999';
    case 'Pasaporte':
      return 'XXXXXXXXXXXXXXXXXXXX'; // Max 20 caracteres
    default:
      return '';
  }
};

/**
 * Obtiene la longitud máxima para un tipo de documento
 */
export const getDocumentMaxLength = (documentType: string): number => {
  switch (documentType) {
    case 'DNI':
      return 8;
    case 'RUC':
      return 11;
    case 'CE':
      return 9;
    case 'Pasaporte':
      return 20;
    default:
      return 20;
  }
};
