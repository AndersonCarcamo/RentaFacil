import http from 'k6/http';
import { sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { API_PREFIX, BASE_URL, checkApiOk, summaryOutput } from './_common.js';

const errors = new Rate('errors');

export const options = {
  scenarios: {
    search_read_heavy: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '45s', target: 20 },
        { duration: '90s', target: 60 },
        { duration: '90s', target: 120 },
        { duration: '45s', target: 0 },
      ],
      gracefulRampDown: '20s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
    errors: ['rate<0.02'],
  },
};

const QUERIES = [
  `${API_PREFIX}/search/?operation=rent&limit=20&page=1`,
  `${API_PREFIX}/search/?operation=sale&limit=20&page=1`,
  `${API_PREFIX}/search/?location=lima&property_type=apartment&limit=20&page=1`,
  `${API_PREFIX}/search/?district=miraflores&min_price=1500&max_price=3500&limit=20&page=1`,
  `${API_PREFIX}/search/?department=lima&sort_by=published_at&sort_order=desc&limit=20&page=2`,
];

export default function () {
  const path = QUERIES[Math.floor(Math.random() * QUERIES.length)];
  const response = http.get(`${BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
    timeout: '10s',
  });

  const ok = checkApiOk(response, 'search');
  errors.add(!ok);
  sleep(Math.random() * 0.5 + 0.1);
}

export function handleSummary(data) {
  return summaryOutput(data, 'search-read-heavy');
}
