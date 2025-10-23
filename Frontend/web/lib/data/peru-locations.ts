/**
 * Datos de ubicaciones de Perú - Lima y Callao
 * Incluye provincias y distritos con coordenadas aproximadas del centro
 */

export interface District {
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface Province {
  name: string;
  districts: District[];
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface Department {
  name: string;
  provinces: Province[];
}

export const PERU_LOCATIONS: Record<string, Department> = {
  Lima: {
    name: 'Lima',
    provinces: [
      {
        name: 'Lima',
        coordinates: { latitude: -12.0464, longitude: -77.0428 },
        districts: [
          // Zona Norte
          { name: 'Ancón', coordinates: { latitude: -11.7575, longitude: -77.1672 } },
          { name: 'Carabayllo', coordinates: { latitude: -11.8682, longitude: -77.0434 } },
          { name: 'Comas', coordinates: { latitude: -11.9394, longitude: -77.0533 } },
          { name: 'Independencia', coordinates: { latitude: -11.9931, longitude: -77.0547 } },
          { name: 'Los Olivos', coordinates: { latitude: -11.9757, longitude: -77.0718 } },
          { name: 'Puente Piedra', coordinates: { latitude: -11.8583, longitude: -77.0711 } },
          { name: 'San Martín de Porres', coordinates: { latitude: -12.0131, longitude: -77.0833 } },
          { name: 'Santa Rosa', coordinates: { latitude: -11.7917, longitude: -77.1683 } },
          
          // Zona Este
          { name: 'Ate', coordinates: { latitude: -12.0275, longitude: -76.9447 } },
          { name: 'Chaclacayo', coordinates: { latitude: -11.9758, longitude: -76.7661 } },
          { name: 'Cieneguilla', coordinates: { latitude: -12.0886, longitude: -76.7844 } },
          { name: 'El Agustino', coordinates: { latitude: -12.0447, longitude: -77.0092 } },
          { name: 'La Molina', coordinates: { latitude: -12.0797, longitude: -76.9392 } },
          { name: 'Lurigancho', coordinates: { latitude: -11.9697, longitude: -76.7339 } },
          { name: 'San Juan de Lurigancho', coordinates: { latitude: -11.9911, longitude: -76.9969 } },
          { name: 'San Luis', coordinates: { latitude: -12.0756, longitude: -76.9967 } },
          { name: 'Santa Anita', coordinates: { latitude: -12.0453, longitude: -76.9719 } },
          
          // Zona Centro
          { name: 'Breña', coordinates: { latitude: -12.0581, longitude: -77.0506 } },
          { name: 'Cercado de Lima', coordinates: { latitude: -12.0464, longitude: -77.0428 } },
          { name: 'Jesús María', coordinates: { latitude: -12.0725, longitude: -77.0411 } },
          { name: 'La Victoria', coordinates: { latitude: -12.0672, longitude: -77.0197 } },
          { name: 'Lince', coordinates: { latitude: -12.0850, longitude: -77.0333 } },
          { name: 'Pueblo Libre', coordinates: { latitude: -12.0772, longitude: -77.0631 } },
          { name: 'Rímac', coordinates: { latitude: -12.0286, longitude: -77.0447 } },
          { name: 'San Miguel', coordinates: { latitude: -12.0772, longitude: -77.0889 } },
          
          // Zona Sur
          { name: 'Barranco', coordinates: { latitude: -12.1464, longitude: -77.0208 } },
          { name: 'Chorrillos', coordinates: { latitude: -12.1683, longitude: -77.0172 } },
          { name: 'Lurín', coordinates: { latitude: -12.2747, longitude: -76.8731 } },
          { name: 'Pachacámac', coordinates: { latitude: -12.2533, longitude: -76.8667 } },
          { name: 'Pucusana', coordinates: { latitude: -12.4767, longitude: -76.7981 } },
          { name: 'Punta Hermosa', coordinates: { latitude: -12.3356, longitude: -76.8219 } },
          { name: 'Punta Negra', coordinates: { latitude: -12.3589, longitude: -76.7983 } },
          { name: 'San Bartolo', coordinates: { latitude: -12.3875, longitude: -76.7778 } },
          { name: 'San Juan de Miraflores', coordinates: { latitude: -12.1594, longitude: -76.9733 } },
          { name: 'Santa María del Mar', coordinates: { latitude: -12.3853, longitude: -76.7631 } },
          { name: 'Santiago de Surco', coordinates: { latitude: -12.1456, longitude: -76.9978 } },
          { name: 'Surquillo', coordinates: { latitude: -12.1092, longitude: -77.0178 } },
          { name: 'Villa El Salvador', coordinates: { latitude: -12.2047, longitude: -76.9386 } },
          { name: 'Villa María del Triunfo', coordinates: { latitude: -12.1639, longitude: -76.9356 } },
          
          // Zona Oeste (zona moderna/residencial)
          { name: 'La Punta', coordinates: { latitude: -12.0706, longitude: -77.1625 } },
          { name: 'Magdalena del Mar', coordinates: { latitude: -12.0906, longitude: -77.0744 } },
          { name: 'Miraflores', coordinates: { latitude: -12.1192, longitude: -77.0286 } },
          { name: 'San Borja', coordinates: { latitude: -12.0947, longitude: -77.0011 } },
          { name: 'San Isidro', coordinates: { latitude: -12.0976, longitude: -77.0363 } },
        ],
      },
      {
        name: 'Barranca',
        coordinates: { latitude: -10.7519, longitude: -77.7608 },
        districts: [
          { name: 'Barranca', coordinates: { latitude: -10.7519, longitude: -77.7608 } },
          { name: 'Paramonga', coordinates: { latitude: -10.6683, longitude: -77.8317 } },
          { name: 'Pativilca', coordinates: { latitude: -10.6953, longitude: -77.7803 } },
          { name: 'Supe', coordinates: { latitude: -10.7958, longitude: -77.7125 } },
          { name: 'Supe Puerto', coordinates: { latitude: -10.8019, longitude: -77.7364 } },
        ],
      },
      {
        name: 'Cajatambo',
        coordinates: { latitude: -10.4714, longitude: -76.9939 },
        districts: [
          { name: 'Cajatambo', coordinates: { latitude: -10.4714, longitude: -76.9939 } },
          { name: 'Copa', coordinates: { latitude: -10.4375, longitude: -76.9833 } },
          { name: 'Gorgor', coordinates: { latitude: -10.4167, longitude: -76.9167 } },
          { name: 'Huancapón', coordinates: { latitude: -10.3833, longitude: -77.0333 } },
          { name: 'Manás', coordinates: { latitude: -10.5167, longitude: -77.0500 } },
        ],
      },
      {
        name: 'Canta',
        coordinates: { latitude: -11.4756, longitude: -76.6247 },
        districts: [
          { name: 'Canta', coordinates: { latitude: -11.4756, longitude: -76.6247 } },
          { name: 'Arahuay', coordinates: { latitude: -11.5333, longitude: -76.6833 } },
          { name: 'Huamantanga', coordinates: { latitude: -11.5000, longitude: -76.7500 } },
          { name: 'Huaros', coordinates: { latitude: -11.4167, longitude: -76.5667 } },
          { name: 'Lachaqui', coordinates: { latitude: -11.4500, longitude: -76.6167 } },
          { name: 'San Buenaventura', coordinates: { latitude: -11.5500, longitude: -76.6500 } },
          { name: 'Santa Rosa de Quives', coordinates: { latitude: -11.7056, longitude: -76.8439 } },
        ],
      },
      {
        name: 'Cañete',
        coordinates: { latitude: -13.0775, longitude: -76.3861 },
        districts: [
          { name: 'San Vicente de Cañete', coordinates: { latitude: -13.0775, longitude: -76.3861 } },
          { name: 'Asia', coordinates: { latitude: -12.7783, longitude: -76.5453 } },
          { name: 'Calango', coordinates: { latitude: -12.5333, longitude: -76.5500 } },
          { name: 'Cerro Azul', coordinates: { latitude: -13.0292, longitude: -76.4794 } },
          { name: 'Imperial', coordinates: { latitude: -13.0597, longitude: -76.3514 } },
          { name: 'Mala', coordinates: { latitude: -12.6583, longitude: -76.6306 } },
          { name: 'Nuevo Imperial', coordinates: { latitude: -13.0750, longitude: -76.3167 } },
          { name: 'Quilmaná', coordinates: { latitude: -12.9500, longitude: -76.3833 } },
          { name: 'San Antonio', coordinates: { latitude: -12.8667, longitude: -76.4167 } },
          { name: 'San Luis', coordinates: { latitude: -13.0333, longitude: -76.3000 } },
          { name: 'Santa Cruz de Flores', coordinates: { latitude: -12.8000, longitude: -76.4667 } },
        ],
      },
      {
        name: 'Huaral',
        coordinates: { latitude: -11.4950, longitude: -77.2078 },
        districts: [
          { name: 'Huaral', coordinates: { latitude: -11.4950, longitude: -77.2078 } },
          { name: 'Atavillos Alto', coordinates: { latitude: -11.3167, longitude: -76.7500 } },
          { name: 'Atavillos Bajo', coordinates: { latitude: -11.3667, longitude: -76.8333 } },
          { name: 'Aucallama', coordinates: { latitude: -11.5750, longitude: -77.0917 } },
          { name: 'Chancay', coordinates: { latitude: -11.5628, longitude: -77.2681 } },
          { name: 'Ihuarí', coordinates: { latitude: -11.2833, longitude: -76.7833 } },
          { name: 'Lampián', coordinates: { latitude: -11.3833, longitude: -76.8000 } },
          { name: 'Pacaraos', coordinates: { latitude: -11.2333, longitude: -76.6500 } },
          { name: 'San Miguel de Acos', coordinates: { latitude: -11.3333, longitude: -76.7167 } },
          { name: 'Santa Cruz de Andamarca', coordinates: { latitude: -11.2500, longitude: -76.6833 } },
          { name: 'Sumbilca', coordinates: { latitude: -11.3500, longitude: -76.7667 } },
          { name: 'Veintisiete de Noviembre', coordinates: { latitude: -11.2667, longitude: -76.7000 } },
        ],
      },
      {
        name: 'Huarochirí',
        coordinates: { latitude: -11.9331, longitude: -76.2333 },
        districts: [
          { name: 'Matucana', coordinates: { latitude: -11.8431, longitude: -76.3956 } },
          { name: 'Antioquía', coordinates: { latitude: -11.9500, longitude: -76.5167 } },
          { name: 'Callahuanca', coordinates: { latitude: -11.7333, longitude: -76.4833 } },
          { name: 'Carampoma', coordinates: { latitude: -11.6667, longitude: -76.5000 } },
          { name: 'Chicla', coordinates: { latitude: -11.7167, longitude: -76.2667 } },
          { name: 'Cuenca', coordinates: { latitude: -11.9833, longitude: -76.5500 } },
          { name: 'Huachupampa', coordinates: { latitude: -11.9167, longitude: -76.4833 } },
          { name: 'Huanza', coordinates: { latitude: -11.5333, longitude: -76.5500 } },
          { name: 'Huarochirí', coordinates: { latitude: -11.9331, longitude: -76.2333 } },
          { name: 'Lahuaytambo', coordinates: { latitude: -12.0667, longitude: -76.4667 } },
          { name: 'Langa', coordinates: { latitude: -12.0333, longitude: -76.4333 } },
          { name: 'Laraos', coordinates: { latitude: -12.2667, longitude: -75.9000 } },
          { name: 'Mariatana', coordinates: { latitude: -11.9667, longitude: -76.4167 } },
          { name: 'Ricardo Palma', coordinates: { latitude: -11.9072, longitude: -76.5756 } },
          { name: 'San Andrés de Tupicocha', coordinates: { latitude: -11.9667, longitude: -76.5000 } },
          { name: 'San Antonio', coordinates: { latitude: -11.9500, longitude: -76.3500 } },
          { name: 'San Bartolomé', coordinates: { latitude: -11.8500, longitude: -76.4667 } },
          { name: 'San Damián', coordinates: { latitude: -11.8833, longitude: -76.5667 } },
          { name: 'San Juan de Iris', coordinates: { latitude: -12.0000, longitude: -76.3667 } },
          { name: 'San Juan de Tantaranche', coordinates: { latitude: -12.0167, longitude: -76.4000 } },
          { name: 'San Lorenzo de Quinti', coordinates: { latitude: -12.0833, longitude: -76.1667 } },
          { name: 'San Mateo', coordinates: { latitude: -11.7667, longitude: -76.3000 } },
          { name: 'San Mateo de Otao', coordinates: { latitude: -11.7833, longitude: -76.3167 } },
          { name: 'San Pedro de Casta', coordinates: { latitude: -11.7833, longitude: -76.5667 } },
          { name: 'San Pedro de Huancayre', coordinates: { latitude: -12.0333, longitude: -76.3833 } },
          { name: 'Sangallaya', coordinates: { latitude: -11.9833, longitude: -76.3333 } },
          { name: 'Santa Cruz de Cocachacra', coordinates: { latitude: -11.9333, longitude: -76.3667 } },
          { name: 'Santa Eulalia', coordinates: { latitude: -11.7333, longitude: -76.6500 } },
          { name: 'Santiago de Anchucaya', coordinates: { latitude: -12.0500, longitude: -76.4333 } },
          { name: 'Santiago de Tuna', coordinates: { latitude: -12.0167, longitude: -76.5167 } },
          { name: 'Santo Domingo de Los Olleros', coordinates: { latitude: -11.8500, longitude: -76.3833 } },
          { name: 'Surco', coordinates: { latitude: -11.8167, longitude: -76.4333 } },
        ],
      },
      {
        name: 'Huaura',
        coordinates: { latitude: -11.0697, longitude: -77.6047 },
        districts: [
          { name: 'Huacho', coordinates: { latitude: -11.1067, longitude: -77.6053 } },
          { name: 'Ámbar', coordinates: { latitude: -10.7500, longitude: -77.2333 } },
          { name: 'Caleta de Carquín', coordinates: { latitude: -11.0944, longitude: -77.6264 } },
          { name: 'Checras', coordinates: { latitude: -10.8833, longitude: -77.3500 } },
          { name: 'Hualmay', coordinates: { latitude: -11.0964, longitude: -77.6142 } },
          { name: 'Huaura', coordinates: { latitude: -11.0697, longitude: -77.6047 } },
          { name: 'Leoncio Prado', coordinates: { latitude: -10.9167, longitude: -77.4167 } },
          { name: 'Paccho', coordinates: { latitude: -10.9500, longitude: -77.1167 } },
          { name: 'Santa Leonor', coordinates: { latitude: -10.8000, longitude: -77.1833 } },
          { name: 'Santa María', coordinates: { latitude: -11.0894, longitude: -77.6094 } },
          { name: 'Sayán', coordinates: { latitude: -11.1347, longitude: -77.1903 } },
          { name: 'Végueta', coordinates: { latitude: -11.0167, longitude: -77.6500 } },
        ],
      },
      {
        name: 'Oyón',
        coordinates: { latitude: -10.6667, longitude: -76.7667 },
        districts: [
          { name: 'Oyón', coordinates: { latitude: -10.6667, longitude: -76.7667 } },
          { name: 'Andajes', coordinates: { latitude: -10.6333, longitude: -76.7333 } },
          { name: 'Caujul', coordinates: { latitude: -10.5833, longitude: -76.7833 } },
          { name: 'Cochamarca', coordinates: { latitude: -10.7167, longitude: -76.7000 } },
          { name: 'Naván', coordinates: { latitude: -10.7333, longitude: -76.7333 } },
          { name: 'Pachangara', coordinates: { latitude: -10.6833, longitude: -76.7167 } },
        ],
      },
      {
        name: 'Yauyos',
        coordinates: { latitude: -12.4500, longitude: -75.9167 },
        districts: [
          { name: 'Yauyos', coordinates: { latitude: -12.4500, longitude: -75.9167 } },
          { name: 'Alis', coordinates: { latitude: -12.4667, longitude: -75.8833 } },
          { name: 'Allauca', coordinates: { latitude: -12.5333, longitude: -75.8333 } },
          { name: 'Ayaviri', coordinates: { latitude: -12.3667, longitude: -75.9167 } },
          { name: 'Azángaro', coordinates: { latitude: -12.4167, longitude: -75.8833 } },
          { name: 'Cacra', coordinates: { latitude: -12.3333, longitude: -75.8000 } },
          { name: 'Carania', coordinates: { latitude: -12.3500, longitude: -75.8833 } },
          { name: 'Catahuasi', coordinates: { latitude: -12.7167, longitude: -75.8333 } },
          { name: 'Chocos', coordinates: { latitude: -12.4333, longitude: -75.7833 } },
          { name: 'Cochas', coordinates: { latitude: -12.3833, longitude: -75.9333 } },
          { name: 'Colonia', coordinates: { latitude: -12.2833, longitude: -75.8667 } },
          { name: 'Hongos', coordinates: { latitude: -12.5167, longitude: -75.7667 } },
          { name: 'Huampara', coordinates: { latitude: -12.5500, longitude: -75.8167 } },
          { name: 'Huancaya', coordinates: { latitude: -12.4167, longitude: -75.9833 } },
          { name: 'Huangáscar', coordinates: { latitude: -12.4000, longitude: -75.8500 } },
          { name: 'Huantán', coordinates: { latitude: -12.5667, longitude: -75.8500 } },
          { name: 'Huañec', coordinates: { latitude: -12.5833, longitude: -75.8833 } },
          { name: 'Laraos', coordinates: { latitude: -12.2667, longitude: -75.9000 } },
          { name: 'Lincha', coordinates: { latitude: -12.5000, longitude: -75.9167 } },
          { name: 'Madean', coordinates: { latitude: -12.3000, longitude: -75.8333 } },
          { name: 'Miraflores', coordinates: { latitude: -12.6500, longitude: -75.8500 } },
          { name: 'Omas', coordinates: { latitude: -12.6167, longitude: -75.8000 } },
          { name: 'Putinza', coordinates: { latitude: -12.5333, longitude: -75.7833 } },
          { name: 'Quinches', coordinates: { latitude: -12.6833, longitude: -75.7833 } },
          { name: 'Quinocay', coordinates: { latitude: -12.5500, longitude: -75.7500 } },
          { name: 'San Joaquín', coordinates: { latitude: -12.6667, longitude: -75.8167 } },
          { name: 'San Pedro de Pilas', coordinates: { latitude: -12.4833, longitude: -75.8667 } },
          { name: 'Tanta', coordinates: { latitude: -12.1167, longitude: -75.8833 } },
          { name: 'Tauripampa', coordinates: { latitude: -12.5667, longitude: -75.8833 } },
          { name: 'Tomas', coordinates: { latitude: -12.3167, longitude: -75.7667 } },
          { name: 'Tupe', coordinates: { latitude: -12.7500, longitude: -75.7000 } },
          { name: 'Viñac', coordinates: { latitude: -12.2833, longitude: -75.9333 } },
          { name: 'Vitis', coordinates: { latitude: -12.4500, longitude: -75.7333 } },
        ],
      },
    ],
  },
  Callao: {
    name: 'Callao',
    provinces: [
      {
        name: 'Callao',
        coordinates: { latitude: -12.0565, longitude: -77.1181 },
        districts: [
          { name: 'Bellavista', coordinates: { latitude: -12.0547, longitude: -77.1111 } },
          { name: 'Callao', coordinates: { latitude: -12.0565, longitude: -77.1181 } },
          { name: 'Carmen de la Legua Reynoso', coordinates: { latitude: -12.0411, longitude: -77.0900 } },
          { name: 'La Perla', coordinates: { latitude: -12.0706, longitude: -77.1233 } },
          { name: 'La Punta', coordinates: { latitude: -12.0706, longitude: -77.1625 } },
          { name: 'Mi Perú', coordinates: { latitude: -12.0083, longitude: -77.1583 } },
          { name: 'Ventanilla', coordinates: { latitude: -11.8636, longitude: -77.1186 } },
        ],
      },
    ],
  },
};

/**
 * Obtiene todos los departamentos disponibles
 */
export const getDepartments = (): string[] => {
  return Object.keys(PERU_LOCATIONS);
};

/**
 * Obtiene todas las provincias de un departamento
 */
export const getProvinces = (department: string): Province[] => {
  return PERU_LOCATIONS[department]?.provinces || [];
};

/**
 * Obtiene todos los distritos de una provincia (ordenados alfabéticamente)
 */
export const getDistricts = (department: string, province: string): District[] => {
  const dept = PERU_LOCATIONS[department];
  if (!dept) return [];
  
  const prov = dept.provinces.find(p => p.name === province);
  const districts = prov?.districts || [];
  
  // Ordenar alfabéticamente por nombre
  return districts.sort((a, b) => a.name.localeCompare(b.name, 'es'));
};

/**
 * Busca distritos por nombre (autocompletado) - ya ordenados alfabéticamente
 */
export const searchDistricts = (department: string, province: string, query: string): District[] => {
  const districts = getDistricts(department, province);
  if (!query) return districts;
  
  const lowerQuery = query.toLowerCase();
  const filtered = districts.filter(d => d.name.toLowerCase().includes(lowerQuery));
  
  // Mantener orden alfabético
  return filtered.sort((a, b) => a.name.localeCompare(b.name, 'es'));
};

/**
 * Obtiene las coordenadas de un distrito específico
 */
export const getDistrictCoordinates = (
  department: string,
  province: string,
  district: string
): { latitude: number; longitude: number } | null => {
  const districts = getDistricts(department, province);
  const found = districts.find(d => d.name === district);
  return found?.coordinates || null;
};

/**
 * Obtiene las coordenadas del centro de una provincia
 */
export const getProvinceCoordinates = (
  department: string,
  province: string
): { latitude: number; longitude: number } | null => {
  const provinces = getProvinces(department);
  const found = provinces.find(p => p.name === province);
  return found?.coordinates || null;
};
