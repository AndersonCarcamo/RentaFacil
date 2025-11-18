import { useState, useEffect } from 'react';

/**
 * Hook para detectar si el dispositivo es móvil basado en el ancho de la ventana
 * @param breakpoint - Ancho en píxeles para considerar móvil (por defecto 768px = md en Tailwind)
 * @returns boolean - true si el ancho es menor al breakpoint
 */
export const useIsMobile = (breakpoint: number = 768): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    // Función para verificar si es móvil
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Verificar en el montaje inicial
    checkMobile();

    // Agregar listener para cambios de tamaño
    window.addEventListener('resize', checkMobile);

    // Cleanup: remover listener al desmontar
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
};

/**
 * Hook para detectar rangos de pantalla múltiples
 * @returns objeto con booleans para diferentes tamaños
 */
export const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState({
    isMobile: false,    // < 640px (sm)
    isTablet: false,    // >= 640px && < 1024px (sm-lg)
    isDesktop: false,   // >= 1024px (lg+)
    isSmall: false,     // < 768px (md)
    isMedium: false,    // >= 768px && < 1024px (md-lg)
    isLarge: false,     // >= 1024px (lg+)
    width: 0,
    height: 0
  });

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setScreenSize({
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
        isDesktop: width >= 1024,
        isSmall: width < 768,
        isMedium: width >= 768 && width < 1024,
        isLarge: width >= 1024,
        width,
        height
      });
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return screenSize;
};
