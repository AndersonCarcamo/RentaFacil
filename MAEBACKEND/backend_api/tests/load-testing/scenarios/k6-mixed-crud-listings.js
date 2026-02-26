import http from 'k6/http';
import { sleep } from 'k6';
import { Rate } from 'k6/metrics';
import {
  API_PREFIX,
  BASE_URL,
  authHeaders,
  checkApiOk,
  requiredEnv,
  safeJson,
  summaryOutput,
} from './_common.js';

const errors = new Rate('errors');

export const options = {
  scenarios: {
    mixed_crud: {
      executor: 'ramping-vus',
      startVUs: 2,
      stages: [
        { duration: '45s', target: 10 },
        { duration: '90s', target: 30 },
        { duration: '90s', target: 60 },
        { duration: '45s', target: 0 },
      ],
      gracefulRampDown: '20s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2500', 'p(99)<4500'],
    errors: ['rate<0.05'],
  },
};

function buildCreatePayload(runId) {
  return {
    title: `Load Test Listing ${runId}`,
    description: 'Synthetic listing for mixed CRUD benchmarking',
    operation: 'rent',
    property_type: 'apartment',
    price: 2200,
    currency: 'PEN',
    bedrooms: 2,
    bathrooms: 1,
    district: 'miraflores',
    province: 'lima',
    department: 'lima',
    address: 'Calle de prueba 123',
  };
}

export default function () {
  requiredEnv('AUTH_TOKEN');

  const headers = authHeaders();
  const runId = `${__VU}-${__ITER}-${Date.now()}`;

  // 1) READ path (search + optional detail)
  const readResponse = http.get(`${BASE_URL}${API_PREFIX}/search/?operation=rent&limit=10&page=1`, {
    headers: { Accept: 'application/json' },
    timeout: '10s',
  });
  const readOk = checkApiOk(readResponse, 'mixed_read_search');
  errors.add(!readOk);

  let discoveredListingId = null;
  if (readResponse.status === 200) {
    const payload = safeJson(readResponse);
    discoveredListingId = payload?.data?.[0]?.id || null;
  }

  if (discoveredListingId && Math.random() < 0.6) {
    const detailResponse = http.get(`${BASE_URL}${API_PREFIX}/listings/${discoveredListingId}`, {
      headers: { Accept: 'application/json' },
      timeout: '10s',
    });
    const detailOk = checkApiOk(detailResponse, 'mixed_read_detail');
    errors.add(!detailOk);
  }

  // 2) WRITE path (create -> update -> publish -> delete)
  const createResponse = http.post(
    `${BASE_URL}${API_PREFIX}/listings/`,
    JSON.stringify(buildCreatePayload(runId)),
    { headers, timeout: '15s' }
  );

  const createOk = checkApiOk(createResponse, 'mixed_create_listing');
  errors.add(!createOk);

  if (createResponse.status < 200 || createResponse.status >= 300) {
    sleep(0.5);
    return;
  }

  const created = safeJson(createResponse);
  const listingId = created?.id;

  if (!listingId) {
    errors.add(true);
    sleep(0.5);
    return;
  }

  const updateResponse = http.put(
    `${BASE_URL}${API_PREFIX}/listings/${listingId}`,
    JSON.stringify({ price: 2350, furnished: true }),
    { headers, timeout: '15s' }
  );
  const updateOk = checkApiOk(updateResponse, 'mixed_update_listing');
  errors.add(!updateOk);

  const publishResponse = http.post(
    `${BASE_URL}${API_PREFIX}/listings/${listingId}/publish`,
    null,
    { headers, timeout: '15s' }
  );
  const publishOk = checkApiOk(publishResponse, 'mixed_publish_listing');
  errors.add(!publishOk);

  const deleteResponse = http.del(`${BASE_URL}${API_PREFIX}/listings/${listingId}`, null, {
    headers,
    timeout: '15s',
  });
  const deleteOk = checkApiOk(deleteResponse, 'mixed_delete_listing');
  errors.add(!deleteOk);

  sleep(Math.random() * 0.6 + 0.2);
}

export function handleSummary(data) {
  return summaryOutput(data, 'mixed-crud-listings');
}
