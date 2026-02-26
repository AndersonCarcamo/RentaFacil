/**
 * Voice Search Parser
 * Procesa el texto transcrito y extrae parámetros de búsqueda
 */

import { VoiceSearchParams } from '@/types/voiceSearch';

// Distritos más comunes de Lima
const DISTRICTS = [
  'Miraflores', 'San Isidro', 'Barranco', 'Surco', 'Santiago de Surco',
  'La Molina', 'San Borja', 'Magdalena', 'Jesús María', 'Lince',
  'Pueblo Libre', 'San Miguel', 'Cercado de Lima', 'Breña',
  'Chorrillos', 'Surquillo', 'San Luis', 'Santa Anita',
  'Ate', 'La Victoria', 'El Agustino', 'San Juan de Lurigancho',
  'Los Olivos', 'Independencia', 'Comas', 'Callao', 'Bellavista'
];

/**
 * Extrae parámetros de búsqueda del texto transcrito
 */
export function parseVoiceQuery(transcript: string): VoiceSearchParams {
  const params: VoiceSearchParams = {};
  const lowerTranscript = transcript.toLowerCase();

  // 1. Detectar tipo de propiedad
  if (/departamento|depa|dpto/i.test(transcript)) {
    params.property_type = 'departamento';
  } else if (/\bcasa\b/i.test(transcript)) {
    params.property_type = 'casa';
  } else if (/cuarto|habitación individual|room/i.test(transcript)) {
    params.property_type = 'cuarto';
  } else if (/airbnb|temporal|vacacional/i.test(transcript)) {
    params.property_type = 'airbnb';
  }

  // 2. Extraer número de habitaciones/dormitorios
  const bedroomsPatterns = [
    /(\d+)\s*(habitacion|cuarto|dormitorio|recámara|bedroom)(?!.*baño)/i,
    /(\d+)\s*hab\b/i,
    /(\d+)\s*dorm\b/i
  ];
  
  for (const pattern of bedroomsPatterns) {
    const match = transcript.match(pattern);
    if (match) {
      params.bedrooms = parseInt(match[1]);
      break;
    }
  }

  // 3. Extraer número de baños
  const bathroomsPatterns = [
    /(\d+)\s*(baño|bathroom)/i,
    /(\d+)\s*bath\b/i
  ];
  
  for (const pattern of bathroomsPatterns) {
    const match = transcript.match(pattern);
    if (match) {
      params.bathrooms = parseInt(match[1]);
      break;
    }
  }

  // 4. Detectar ubicación (distrito)
  for (const district of DISTRICTS) {
    const regex = new RegExp(`\\b${district}\\b`, 'i');
    if (regex.test(transcript)) {
      params.district = district;
      break;
    }
  }

  // 5. Extraer precio
  // Patrones: "menos de 2000", "hasta 2000", "máximo 2000", "2000 soles"
  const maxPricePatterns = [
    /(menos|hasta|máximo|max|como máximo)\s*de?\s*(\d+)/i,
    /(\d+)\s*(?:soles?|dólares?|dollars?)\s*(?:como\s*)?(?:máximo|max)?/i
  ];

  const minPricePatterns = [
    /(más|mínimo|desde|a partir)\s*de?\s*(\d+)/i,
    /(\d+)\s*(?:soles?|dólares?)\s*(?:o\s*)?(?:más|mínimo)/i
  ];

  const rangePricePattern = /entre\s*(\d+)\s*y\s*(\d+)/i;

  // Detectar rango de precios
  const rangeMatch = transcript.match(rangePricePattern);
  if (rangeMatch) {
    params.min_price = parseInt(rangeMatch[1]);
    params.max_price = parseInt(rangeMatch[2]);
  } else {
    // Detectar precio máximo
    for (const pattern of maxPricePatterns) {
      const match = transcript.match(pattern);
      if (match) {
        const priceIndex = match[2] ? 2 : 1;
        params.max_price = parseInt(match[priceIndex]);
        break;
      }
    }

    // Detectar precio mínimo
    for (const pattern of minPricePatterns) {
      const match = transcript.match(pattern);
      if (match) {
        params.min_price = parseInt(match[2]);
        break;
      }
    }
  }

  // 6. Detectar moneda
  if (/dólar|dollar|usd/i.test(transcript)) {
    params.currency = 'USD';
  } else if (/sol|soles|pen/i.test(transcript) || params.max_price || params.min_price) {
    params.currency = 'PEN'; // Default a soles si se menciona precio
  }

  // 7. Extraer área/tamaño
  const areaPatterns = [
    /(\d+)\s*(?:metros?|m2|m²)\s*(?:cuadrados?)?/i,
    /(\d+)\s*(?:mts?|mt2)/i
  ];

  for (const pattern of areaPatterns) {
    const match = transcript.match(pattern);
    if (match) {
      const area = parseInt(match[1]);
      
      // Determinar si es mínimo o máximo según contexto
      if (/(más|mínimo|desde)\s*de/i.test(transcript)) {
        params.min_area = area;
      } else if (/(menos|hasta|máximo)\s*de/i.test(transcript)) {
        params.max_area = area;
      } else {
        params.min_area = area; // Default a mínimo
      }
      break;
    }
  }

  return params;
}

/**
 * Genera un resumen legible de los parámetros extraídos
 */
export function summarizeSearchParams(params: VoiceSearchParams): string {
  const parts: string[] = [];

  if (params.property_type) {
    const typeNames = {
      departamento: 'Departamento',
      casa: 'Casa',
      cuarto: 'Cuarto',
      airbnb: 'Alquiler temporal'
    };
    parts.push(typeNames[params.property_type]);
  }

  if (params.bedrooms) {
    parts.push(`${params.bedrooms} ${params.bedrooms === 1 ? 'habitación' : 'habitaciones'}`);
  }

  if (params.bathrooms) {
    parts.push(`${params.bathrooms} ${params.bathrooms === 1 ? 'baño' : 'baños'}`);
  }

  if (params.district) {
    parts.push(`en ${params.district}`);
  }

  if (params.min_area || params.max_area) {
    if (params.min_area && params.max_area) {
      parts.push(`de ${params.min_area}m² a ${params.max_area}m²`);
    } else if (params.min_area) {
      parts.push(`mínimo ${params.min_area}m²`);
    } else {
      parts.push(`máximo ${params.max_area}m²`);
    }
  }

  if (params.min_price || params.max_price) {
    const currency = params.currency === 'USD' ? 'USD' : 'S/';
    if (params.min_price && params.max_price) {
      parts.push(`entre ${currency}${params.min_price} y ${currency}${params.max_price}`);
    } else if (params.max_price) {
      parts.push(`hasta ${currency}${params.max_price}`);
    } else if (params.min_price) {
      parts.push(`desde ${currency}${params.min_price}`);
    }
  }

  return parts.length > 0 ? parts.join(', ') : 'Búsqueda general';
}

/**
 * Convierte parámetros de voz a query string para URL
 */
export function voiceParamsToQueryString(params: VoiceSearchParams): string {
  const queryParams = new URLSearchParams();

  if (params.property_type) queryParams.set('type', params.property_type);
  if (params.bedrooms) queryParams.set('bedrooms', params.bedrooms.toString());
  if (params.bathrooms) queryParams.set('bathrooms', params.bathrooms.toString());
  if (params.district) queryParams.set('district', params.district);
  if (params.city) queryParams.set('city', params.city);
  if (params.min_price) queryParams.set('min_price', params.min_price.toString());
  if (params.max_price) queryParams.set('max_price', params.max_price.toString());
  if (params.currency) queryParams.set('currency', params.currency);
  if (params.min_area) queryParams.set('min_area', params.min_area.toString());
  if (params.max_area) queryParams.set('max_area', params.max_area.toString());

  return queryParams.toString();
}
