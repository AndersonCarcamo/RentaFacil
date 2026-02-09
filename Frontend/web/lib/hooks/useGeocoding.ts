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

interface ReverseGeocodeResult {
  address: string | null;
  department: string | null;
  province: string | null;
  district: string | null;
  fullData?: any;
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
   * Solicita permisos y usa GPS del dispositivo
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
          console.log('✅ Ubicación actual obtenida:', coordinates, 'Precisión:', position.coords.accuracy, 'metros');
          setLoading(false);
          resolve(coordinates);
        },
        (error) => {
          console.error('❌ Error obteniendo ubicación:', error);
          let errorMsg = 'No se pudo obtener la ubicación actual';
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMsg = 'Permiso denegado. Activa la ubicación en tu navegador.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMsg = 'Ubicación no disponible. Intenta en exteriores.';
              break;
            case error.TIMEOUT:
              errorMsg = 'Tiempo de espera agotado. Intenta nuevamente.';
              break;
          }
          
          setError(errorMsg);
          setLoading(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true, // ✅ Solicitar alta precisión GPS
          timeout: 10000, // 10 segundos de timeout
          maximumAge: 0 // No usar cache, obtener ubicación fresca
        }
      );
    });
  };

  /**
   * Geocoding inverso COMPLETO: Obtiene dirección Y datos administrativos desde coordenadas
   * Útil cuando el usuario arrastra el marcador en el mapa
   */
  const reverseGeocodeComplete = async (
    latitude: number,
    longitude: number
  ): Promise<ReverseGeocodeResult> => {
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
        const addressData = data.address;
        
        // Extraer dirección de calle
        const roadParts = [];
        if (addressData.road) {
          roadParts.push(addressData.road);
          if (addressData.house_number) {
            roadParts[0] = `${addressData.road} ${addressData.house_number}`;
          }
        }
        const formattedAddress = roadParts.join(', ');
        
        // Extraer datos administrativos de Perú
        // Nominatim usa diferentes campos según el país y región
        const department = addressData.state || addressData.region || null;
        const province = addressData.county || addressData.province || null;
        
        // Distrito puede estar en varios campos
        const district = addressData.suburb || 
                        addressData.neighbourhood || 
                        addressData.city_district ||
                        addressData.municipality ||
                        addressData.city ||
                        null;
        
        console.log('✅ Geocoding inverso completo:', {
          address: formattedAddress,
          department,
          province,
          district,
          fullAddress: data.display_name,
          rawData: addressData
        });
        
        setLoading(false);
        
        return {
          address: formattedAddress,
          department,
          province,
          district,
          fullData: data
        };
      }

      setLoading(false);
      return {
        address: null,
        department: null,
        province: null,
        district: null
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('❌ Error en geocoding inverso:', errorMessage);
      setError(errorMessage);
      setLoading(false);
      return {
        address: null,
        department: null,
        province: null,
        district: null
      };
    }
  };

  /**
   * Geocoding inverso SIMPLE: Solo obtiene la dirección (mantener para compatibilidad)
   */
  const reverseGeocode = async (
    latitude: number,
    longitude: number
  ): Promise<string | null> => {
    const result = await reverseGeocodeComplete(latitude, longitude);
    return result.address;
  };

  return {
    geocodeAddress,
    geocodeByDistrict,
    getCurrentLocation,
    reverseGeocode,
    reverseGeocodeComplete,
    loading,
    error,
  };
};

export type { Coordinates, ReverseGeocodeResult };
