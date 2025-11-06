import { useState, useEffect } from 'react';

/**
 * Hook para detectar si estamos en un dispositivo móvil
 * @returns {boolean} true si el ancho de pantalla es menor a 768px (breakpoint md de Tailwind)
 */
export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check inicial
    checkIsMobile();

    // Listener para cambios de tamaño
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};
