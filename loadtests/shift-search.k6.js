import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate = new Rate("errors");
const shiftSearchDuration = new Trend("shift_search_duration", true);

const API_BASE = __ENV.API_URL || "http://localhost:4000";
const API = API_BASE.endsWith("/api/v1") ? API_BASE : `${API_BASE}/api/v1`;
const TOKEN = __ENV.NURSE_TOKEN || "Bearer dev_dev_nurse_rn";

// Default: 100 VUs for local smoke. Production target: 10,000 VUs
// k6 run --vus 10000 --duration 2m loadtests/shift-search.k6.js
export const options = {
  scenarios: {
    shift_search: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: Number(__ENV.K6_VUS || 100) },
        { duration: "1m", target: Number(__ENV.K6_VUS || 100) },
        { duration: "15s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    errors: ["rate<0.05"],
    http_req_duration: ["p(95)<2000"],
    shift_search_duration: ["p(95)<1500"],
  },
};

export default function () {
  const res = http.get(`${API}/shifts?limit=20&status=PUBLISHED`, {
    headers: { Authorization: TOKEN },
    tags: { name: "shift_search" },
  });

  shiftSearchDuration.add(res.timings.duration);
  const ok = check(res, {
    "status is 200": (r) => r.status === 200,
    "has shifts array": (r) => {
      try {
        return Array.isArray(r.json("data"));
      } catch {
        return false;
      }
    },
  });

  errorRate.add(!ok);
  sleep(0.1);
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(
      {
        test: "shift-search",
        vus_max: data.metrics.vus_max?.values?.max ?? 0,
        requests: data.metrics.http_reqs?.values?.count ?? 0,
        p95_ms: data.metrics.http_req_duration?.values?.["p(95)"] ?? 0,
        error_rate: data.metrics.errors?.values?.rate ?? 0,
      },
      null,
      2
    ),
  };
}
