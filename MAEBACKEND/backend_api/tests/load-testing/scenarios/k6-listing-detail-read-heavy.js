import http from 'k6/http';
import { sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { API_PREFIX, BASE_URL, checkApiOk, safeJson, summaryOutput } from './_common.js';

const errors = new Rate('errors');
const discoveredIds = [];
const discoveredSlugs = [];

export const options = {
  scenarios: {
    listing_detail_read_heavy: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '45s', target: 25 },
        { duration: '90s', target: 75 },
        { duration: '90s', target: 150 },
        { duration: '45s', target: 0 },
      ],
      gracefulRampDown: '20s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1200', 'p(99)<2500'],
    errors: ['rate<0.02'],
  },
};

function warmupListings() {
  if (discoveredIds.length > 0) {
    return;
  }

  const response = http.get(`${BASE_URL}${API_PREFIX}/search/?limit=30&page=1`, {
    headers: { Accept: 'application/json' },
    timeout: '10s',
  });

  if (response.status !== 200) {
    return;
  }

  const payload = safeJson(response);
  if (!payload?.data?.length) {
    return;
  }

  for (const listing of payload.data) {
    if (listing?.id) {
      discoveredIds.push(listing.id);
    }
    if (listing?.slug) {
      discoveredSlugs.push(listing.slug);
    }
  }
}

export default function () {
  warmupListings();

  if (discoveredIds.length === 0) {
    sleep(0.5);
    return;
  }

  const useSlug = Math.random() < 0.4 && discoveredSlugs.length > 0;
  const endpoint = useSlug
    ? `${API_PREFIX}/listings/by-slug/${discoveredSlugs[Math.floor(Math.random() * discoveredSlugs.length)]}`
    : `${API_PREFIX}/listings/${discoveredIds[Math.floor(Math.random() * discoveredIds.length)]}`;

  const response = http.get(`${BASE_URL}${endpoint}`, {
    headers: { Accept: 'application/json' },
    timeout: '10s',
  });

  const ok = checkApiOk(response, 'listing_detail');
  errors.add(!ok);
  sleep(Math.random() * 0.6 + 0.1);
}

export function handleSummary(data) {
  return summaryOutput(data, 'listing-detail-read-heavy');
}
