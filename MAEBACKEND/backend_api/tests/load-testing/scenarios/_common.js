import { check } from 'k6';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8000';
export const API_PREFIX = __ENV.API_PREFIX || '/v1';
export const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

export function authHeaders() {
  if (!AUTH_TOKEN) {
    return { 'Content-Type': 'application/json' };
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${AUTH_TOKEN}`,
  };
}

export function requiredEnv(name) {
  const value = __ENV[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export function safeJson(response) {
  try {
    return response.json();
  } catch (_) {
    return null;
  }
}

export function checkApiOk(response, label) {
  return check(response, {
    [`${label} status acceptable`]: (r) => r.status >= 200 && r.status < 400,
  });
}

export function summaryOutput(data, scenarioName) {
  const resultFile = __ENV.RESULT_FILE || `results/baseline/${scenarioName}.json`;
  return {
    [resultFile]: JSON.stringify(data, null, 2),
    stdout: `${scenarioName} finished | requests=${data.metrics.http_reqs?.values?.count || 0}`,
  };
}
