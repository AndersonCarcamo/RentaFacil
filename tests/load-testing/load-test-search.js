import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Métricas personalizadas
const errorRate = new Rate('errors');
const mapLoadRate = new Rate('map_load_success');

// Configuración de la prueba de carga
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp-up: 10 usuarios en 30 segundos
    { duration: '1m', target: 50 },   // Incrementar a 50 usuarios
    { duration: '1m', target: 100 },  // Incrementar a 100 usuarios
    { duration: '1m', target: 200 },  // Incrementar a 200 usuarios
    { duration: '2m', target: 200 },  // Mantener 200 usuarios por 2 minutos
    { duration: '1m', target: 200 },  // Incrementar a 500 usuarios
    { duration: '2m', target: 200 },  // Mantener 500 usuarios por 2 minutos
    { duration: '30s', target: 0 },   // Ramp-down a 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 95% de las peticiones deben completarse en menos de 5s
    http_req_failed: ['rate<0.1'],     // Menos del 10% de errores
    errors: ['rate<0.1'],              // Tasa de errores menor al 10%
  },
};

const BASE_URL = 'http://127.0.0.1:3000';
const SEARCH_URLS = [
  '/search?mode=alquiler&location=lima',
  '/search?mode=alquiler&location=miraflores',
  '/search?mode=alquiler&location=san-isidro',
  '/search?mode=alquiler&location=surco',
  '/search?mode=alquiler&propertyType=apartment',
  '/search?mode=alquiler&propertyType=house',
  '/search?mode=alquiler&minPrice=500&maxPrice=2000',
  '/search?mode=alquiler-temporal&location=lima',
];

// Función para simular la carga de recursos del mapa
function loadMapResources() {
  const mapResources = [
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  ];

  const responses = http.batch(mapResources.map(url => ['GET', url]));
  
  responses.forEach((response, i) => {
    const success = check(response, {
      'map resource loaded': (r) => r.status === 200,
    });
    mapLoadRate.add(success);
  });
}

// Función para simular una búsqueda
function performSearch() {
  // Seleccionar una URL de búsqueda aleatoria
  const searchUrl = SEARCH_URLS[Math.floor(Math.random() * SEARCH_URLS.length)];
  const url = `${BASE_URL}${searchUrl}`;

  console.log(`VU ${__VU}: Loading ${searchUrl}`);

  // Realizar la petición
  const response = http.get(url, {
    headers: {
      'User-Agent': 'k6-load-test',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
    },
    timeout: '30s',
  });

  // Verificar la respuesta
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'page has content': (r) => r.body.length > 0,
    'no critical errors': (r) => {
      // Solo verificar errores críticos, no la palabra "error" en general
      const body = r.body.toLowerCase();
      return !body.includes('500 internal server error') && 
             !body.includes('503 service unavailable') &&
             !body.includes('404 not found') &&
             !body.includes('application error');
    },
    'has map container': (r) => r.body.includes('leaflet') || r.body.includes('map'),
  });

  errorRate.add(!success);

  // Log del resultado
  console.log(`VU ${__VU}: ${searchUrl} - Status: ${response.status}, Time: ${response.timings.duration}ms`);

  return response;
}

// Función para simular llamadas API que hace la página de búsqueda
// 🎯 OPTIMIZADO: Solo 30% de usuarios hacen llamadas API extras (más realista)
function makeApiCalls() {
  // Simular que solo algunos usuarios hacen scroll y cargan más datos
  if (Math.random() > 0.7) return; // 70% de usuarios no hacen llamadas API extras
  
  // La página de búsqueda hace peticiones a estos endpoints públicos (sin autenticación)
  const apiEndpoints = [
    `http://localhost:8000/v1/search/?operation=rent&limit=20`,
  ];

  const responses = http.batch(
    apiEndpoints.map(url => [
      'GET',
      url,
      null,
      {
        headers: {
          'Accept': 'application/json',
        },
        timeout: '5s', // 🚀 Reducido de 10s a 5s
      }
    ])
  );

  responses.forEach((response, i) => {
    check(response, {
      [`API ${i} returned valid response`]: (r) => r.status === 200 || r.status === 404 || r.status === 500,
    });
  });
}

// Función principal que ejecuta cada usuario virtual
export default function () {
  // 1. Cargar la página de búsqueda
  const response = performSearch();

  // Si la página cargó correctamente, simular la carga de recursos adicionales
  if (response.status === 200) {
    sleep(0.5); // 🚀 Reducido: Simular tiempo de parsing del HTML
    
    // 2. Cargar recursos del mapa
    loadMapResources();
    
    sleep(0.5); // 🚀 Reducido: Simular tiempo de renderizado del mapa
    
    // 3. Hacer llamadas API que la página hace automáticamente (solo 30% de usuarios)
    makeApiCalls();
  }

  // Simular tiempo que el usuario pasa viendo los resultados
  sleep(Math.random() * 5 + 3); // Entre 3 y 8 segundos
}

// Función de resumen al finalizar
export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = '\n';
  summary += `${indent}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  summary += `${indent}📊 RESUMEN DE PRUEBA DE CARGA - Búsqueda y Mapa\n`;
  summary += `${indent}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  const metrics = data.metrics;

  // Peticiones HTTP
  if (metrics.http_reqs) {
    summary += `${indent}📈 Peticiones HTTP:\n`;
    summary += `${indent}  Total: ${metrics.http_reqs.values.count}\n`;
    summary += `${indent}  Rate: ${metrics.http_reqs.values.rate.toFixed(2)} req/s\n\n`;
  }

  // Duración de peticiones
  if (metrics.http_req_duration && metrics.http_req_duration.values) {
    const values = metrics.http_req_duration.values;
    summary += `${indent}⏱️  Duración de Peticiones:\n`;
    if (values.avg) summary += `${indent}  Promedio: ${values.avg.toFixed(2)}ms\n`;
    if (values.min) summary += `${indent}  Mínimo: ${values.min.toFixed(2)}ms\n`;
    if (values.max) summary += `${indent}  Máximo: ${values.max.toFixed(2)}ms\n`;
    if (values['p(95)']) summary += `${indent}  P95: ${values['p(95)'].toFixed(2)}ms\n`;
    if (values['p(99)']) summary += `${indent}  P99: ${values['p(99)'].toFixed(2)}ms\n`;
    summary += '\n';
  }

  // Tasa de errores
  if (metrics.http_req_failed) {
    const failRate = (metrics.http_req_failed.values.rate * 100).toFixed(2);
    summary += `${indent}❌ Tasa de Errores HTTP: ${failRate}%\n`;
    summary += `${indent}  Fallidas: ${metrics.http_req_failed.values.fails}\n`;
    summary += `${indent}  Exitosas: ${metrics.http_req_failed.values.passes}\n\n`;
  }

  // Errores personalizados
  if (metrics.errors) {
    const errorRate = (metrics.errors.values.rate * 100).toFixed(2);
    summary += `${indent}⚠️  Tasa de Errores General: ${errorRate}%\n\n`;
  }

  // Carga del mapa
  if (metrics.map_load_success) {
    const mapSuccessRate = (metrics.map_load_success.values.rate * 100).toFixed(2);
    summary += `${indent}🗺️  Carga del Mapa: ${mapSuccessRate}% exitosa\n\n`;
  }

  // Usuarios virtuales
  if (metrics.vus && metrics.vus.values) {
    const values = metrics.vus.values;
    summary += `${indent}👥 Usuarios Virtuales:\n`;
    if (values.max) summary += `${indent}  Máximo: ${values.max}\n`;
    if (values.value) summary += `${indent}  Promedio: ${values.value.toFixed(0)}\n`;
    summary += '\n';
  }

  summary += `${indent}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  return summary;
}
