import { useState } from 'react';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface GeocodingResult {
  coordinates: Coordinates | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook para obtener coordenadas geográficas a partir de una dirección
 * Usa la API de OpenStreetMap Nominatim (gratuita, sin API key)
 */
export const useGeocoding = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Geocodifica una dirección completa
   * @param address Dirección completa con distrito, provincia, departamento
   * @returns Coordenadas (lat, lng) o null si no se encuentra
   */
  const geocodeAddress = async (
    address: string,
    district: string,
    province: string,
    department: string
  ): Promise<Coordinates | null> => {
    setLoading(true);
    setError(null);

    try {
      // Construir query completo para mejor precisión
      const fullAddress = `${address}, ${district}, ${province}, ${department}, Perú`;
      
      // Llamar a API de Nominatim (OpenStreetMap)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(fullAddress)}&` +
        `format=json&` +
        `limit=1&` +
        `countrycodes=pe`, // Limitar a Perú
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'EasyRent/1.0', // Requerido por Nominatim
          }
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener coordenadas');
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const coordinates: Coordinates = {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
        };
        
        console.log('✅ Coordenadas obtenidas:', coordinates);
        setLoading(false);
        return coordinates;
      }

      // Si no encuentra resultados exactos, intentar solo con distrito + provincia
      console.warn('⚠️ No se encontró dirección exacta, buscando por distrito...');
      return await geocodeByDistrict(district, province, department);

    } catch (err: any) {
      console.error('❌ Error en geocodificación:', err);
      setError(err.message || 'Error al obtener coordenadas');
      setLoading(false);
      
      // Intentar fallback por distrito
      return await geocodeByDistrict(district, province, department);
    }
  };

  /**
   * Geocodifica solo por distrito (fallback)
   */
  const geocodeByDistrict = async (
    district: string,
    province: string,
    department: string
  ): Promise<Coordinates | null> => {
    try {
      const query = `${district}, ${province}, ${department}, Perú`;
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `limit=1&` +
        `countrycodes=pe`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'EasyRent/1.0',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener coordenadas del distrito');
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const coordinates: Coordinates = {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
        };
        
        console.log('✅ Coordenadas del distrito obtenidas:', coordinates);
        setLoading(false);
        return coordinates;
      }

      setLoading(false);
      return null;

    } catch (err: any) {
      console.error('❌ Error en geocodificación por distrito:', err);
      setError(err.message || 'No se pudieron obtener las coordenadas');
      setLoading(false);
      return null;
    }
  };

  /**
   * Obtener coordenadas del usuario actual (navegador)
   */
  const getCurrentLocation = (): Promise<Coordinates | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setError('Geolocalización no soportada por el navegador');
        resolve(null);
        return;
      }

      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coordinates: Coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          console.log('✅ Ubicación actual obtenida:', coordinates);
          setLoading(false);
          resolve(coordinates);
        },
        (error) => {
          console.error('❌ Error obteniendo ubicación:', error);
          setError('No se pudo obtener la ubicación actual');
          setLoading(false);
          resolve(null);
        }
      );
    });
  };

  /**
   * Geocoding inverso: Obtiene la dirección desde coordenadas
   * Útil cuando el usuario arrastra el marcador en el mapa
   */
  const reverseGeocode = async (
    latitude: number,
    longitude: number
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?` +
        `lat=${latitude}&` +
        `lon=${longitude}&` +
        `format=json&` +
        `addressdetails=1&` +
        `accept-language=es`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'EasyRent/1.0',
          }
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener dirección desde coordenadas');
      }

      const data = await response.json();
      
      if (data && data.address) {
        // Construir dirección legible
        const address = data.address;
        const parts = [];
        
        // Calle y número
        if (address.road) {
          parts.push(address.road);
          if (address.house_number) {
            parts[0] = `${address.road} ${address.house_number}`;
          }
        }
        
        // Distrito (suburb o neighbourhood)
        const district = address.suburb || address.neighbourhood || address.city_district;
        
        // Devolver solo la calle/avenida, el distrito se mantiene en los selectores
        const formattedAddress = parts.join(', ');
        
        console.log('✅ Geocoding inverso exitoso:', {
          original: data.display_name,
          formatted: formattedAddress,
          district: district,
        });
        
        return formattedAddress || null;
      }

      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Error en geocoding inverso:', errorMessage);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    geocodeAddress,
    geocodeByDistrict,
    getCurrentLocation,
    reverseGeocode,
    loading,
    error,
  };
};
