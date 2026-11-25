import http from 'k6/http';
import { check, sleep } from 'k6';

const base = __ENV.BASE_URL || 'http://127.0.0.1:3000/report';
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/[^?#]*$/.test(base) && base !== 'https://test.k6.io') {
  throw new Error('Use https://test.k6.io or a local endpoint for this lab.');
}

const fixedLoad = {
  vus: __ENV.P95_LIMIT_MS ? 30 : 5,
  duration: __ENV.P95_LIMIT_MS ? '1m' : '30s',
};

export const options = {
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
  ...(__ENV.MODE === 'stages'
    ? {
        stages: [
          { duration: '30s', target: 5 },
          { duration: '1m', target: 30 },
          { duration: '30s', target: 100 },
          { duration: '30s', target: 0 },
        ],
      }
    : fixedLoad),
};

if (__ENV.P95_LIMIT_MS) {
  const limit = Number(__ENV.P95_LIMIT_MS);
  if (!Number.isFinite(limit) || limit <= 0) {
    throw new Error('P95_LIMIT_MS must be a positive number.');
  }
  options.thresholds = {
    http_req_duration: [`p(95)<${limit}`],
    http_req_failed: ['rate<0.01'],
  };
}

export default function () {
  const response = http.get(base);
  check(response, { 'status is 200': (result) => result.status === 200 });
  sleep(1);
}
