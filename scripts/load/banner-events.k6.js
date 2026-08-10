import http from 'k6/http';
import { check } from 'k6';

const baseUrl = (__ENV.BANNER_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const bannerId = __ENV.BANNER_ID || '1';

export const options = {
  scenarios: {
    banner_events_smoke: {
      executor: 'constant-arrival-rate',
      rate: Number(__ENV.BANNER_RATE || 10),
      timeUnit: '1s',
      duration: __ENV.BANNER_DURATION || '30s',
      preAllocatedVUs: Number(__ENV.BANNER_VUS || 10),
      maxVUs: Number(__ENV.BANNER_MAX_VUS || 50),
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
    checks: ['rate>0.99'],
  },
};

export default function () {
  const instanceId = `${__VU}-${__ITER}-${Date.now()}`;
  const payload = JSON.stringify({
    banner_event: {
      banner_id: bannerId,
      event_type: 'impression',
      impression_instance_id: instanceId,
      delivery_id: `load-${bannerId}`,
      metadata: {
        position: 'load_test',
        slot_key: 'load_test',
        audience_key: `load-${__VU}`,
      },
    },
  });

  const response = http.post(`${baseUrl}/api/v1/banner_events`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { endpoint: 'banner_events' },
  });

  check(response, {
    'banner event accepted': (res) => res.status === 201 || res.status === 200,
  });
}
