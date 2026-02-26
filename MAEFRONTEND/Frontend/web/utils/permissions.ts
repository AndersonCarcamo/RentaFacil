/**
 * Utilidades para gestionar permisos del navegador
 * Micrófono y Geolocalización
 */

export type PermissionType = 'microphone' | 'geolocation';

export interface PermissionResult {
  granted: boolean;
  error?: string;
  state?: PermissionState;
}

/**
 * Verifica si el navegador soporta un permiso específico
 */
export const isPermissionSupported = (permission: PermissionType): boolean => {
  if (typeof window === 'undefined') return false;

  switch (permission) {
    case 'microphone':
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    case 'geolocation':
      return !!navigator.geolocation;
    default:
      return false;
  }
};

/**
 * Solicita permiso para el micrófono
 */
export const requestMicrophonePermission = async (): Promise<PermissionResult> => {
  if (!isPermissionSupported('microphone')) {
    return {
      granted: false,
      error: 'Tu navegador no soporta acceso al micrófono',
    };
  }

  try {
    // Solicitar acceso al micrófono
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Detener el stream inmediatamente después de obtener el permiso
    stream.getTracks().forEach(track => track.stop());
    
    return {
      granted: true,
      state: 'granted',
    };
  } catch (error: any) {
    let errorMessage = 'Error al solicitar permiso de micrófono';
    
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      errorMessage = 'Permiso de micrófono denegado. Por favor, permite el acceso en la configuración de tu navegador.';
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No se encontró ningún micrófono en tu dispositivo.';
    } else if (error.name === 'NotReadableError') {
      errorMessage = 'El micrófono está siendo usado por otra aplicación.';
    }
    
    return {
      granted: false,
      error: errorMessage,
    };
  }
};

/**
 * Solicita permiso para la geolocalización
 */
export const requestGeolocationPermission = async (): Promise<PermissionResult> => {
  if (!isPermissionSupported('geolocation')) {
    return {
      granted: false,
      error: 'Tu navegador no soporta geolocalización',
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => {
        resolve({
          granted: true,
          state: 'granted',
        });
      },
      (error) => {
        let errorMessage = 'Error al solicitar permiso de ubicación';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso de ubicación denegado. Por favor, permite el acceso en la configuración de tu navegador.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Información de ubicación no disponible.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado al obtener la ubicación.';
            break;
        }
        
        resolve({
          granted: false,
          error: errorMessage,
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Verifica el estado actual de un permiso (sin solicitarlo)
 */
export const checkPermissionState = async (
  permission: PermissionType
): Promise<PermissionState | 'unsupported'> => {
  if (typeof window === 'undefined') return 'unsupported';

  try {
    // API de Permissions (no todos los navegadores la soportan completamente)
    if (navigator.permissions && navigator.permissions.query) {
      const permissionName = permission === 'microphone' ? 'microphone' : 'geolocation';
      const result = await navigator.permissions.query({ name: permissionName as PermissionName });
      return result.state;
    }
  } catch (error) {
    // Si la API de Permissions no está disponible, intentar verificar de otra manera
    console.warn('Permissions API no disponible:', error);
  }

  return 'unsupported';
};

/**
 * Obtiene coordenadas de geolocalización del usuario
 */
export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalización no soportada'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Verifica si la aplicación está corriendo en HTTPS o localhost
 * (requerido para permisos sensibles)
 */
export const isSecureContext = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.isSecureContext || window.location.hostname === 'localhost';
};

/**
 * Guía para el usuario sobre cómo habilitar permisos manualmente
 */
export const getPermissionGuide = (permission: PermissionType, browser: string = 'chrome'): string => {
  const guides: Record<PermissionType, Record<string, string>> = {
    microphone: {
      chrome: '1. Haz clic en el ícono de candado/información en la barra de direcciones\n2. Busca "Micrófono"\n3. Selecciona "Permitir"\n4. Recarga la página',
      firefox: '1. Haz clic en el ícono de información en la barra de direcciones\n2. Haz clic en "Más información"\n3. Ve a la pestaña "Permisos"\n4. Desmarca "Usar valores por defecto" en Micrófono\n5. Selecciona "Permitir"',
      safari: '1. Ve a Safari > Preferencias\n2. Haz clic en "Sitios web"\n3. Selecciona "Micrófono"\n4. Encuentra este sitio y selecciona "Permitir"',
      edge: '1. Haz clic en el ícono de candado en la barra de direcciones\n2. Busca "Micrófono"\n3. Selecciona "Permitir"\n4. Recarga la página',
    },
    geolocation: {
      chrome: '1. Haz clic en el ícono de candado/información en la barra de direcciones\n2. Busca "Ubicación"\n3. Selecciona "Permitir"\n4. Recarga la página',
      firefox: '1. Haz clic en el ícono de información en la barra de direcciones\n2. Haz clic en "Más información"\n3. Ve a la pestaña "Permisos"\n4. Desmarca "Usar valores por defecto" en Ubicación\n5. Selecciona "Permitir"',
      safari: '1. Ve a Safari > Preferencias\n2. Haz clic en "Sitios web"\n3. Selecciona "Ubicación"\n4. Encuentra este sitio y selecciona "Permitir"',
      edge: '1. Haz clic en el ícono de candado en la barra de direcciones\n2. Busca "Ubicación"\n3. Selecciona "Permitir"\n4. Recarga la página',
    },
  };

  return guides[permission][browser.toLowerCase()] || guides[permission].chrome;
};

/**
 * Detecta el navegador del usuario
 */
export const detectBrowser = (): string => {
  if (typeof window === 'undefined') return 'unknown';

  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes('firefox')) return 'firefox';
  if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari';
  if (userAgent.includes('edg')) return 'edge';
  if (userAgent.includes('chrome')) return 'chrome';

  return 'chrome'; // Default
};
