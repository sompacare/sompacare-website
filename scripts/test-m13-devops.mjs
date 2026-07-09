/**
 * M13 DevOps — health, metrics, infra files, concurrent load probe
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const API_BASE = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const API = API_BASE.endsWith("/api/v1") ? API_BASE : `${API_BASE}/api/v1`;
const NURSE = process.env.NURSE_TOKEN ?? "Bearer dev_dev_nurse_rn";
const ROOT = process.cwd();

async function api(path, { token, method = "GET" } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: token ? { Authorization: token } : {},
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function assertExists(relPath) {
  const full = join(ROOT, relPath);
  if (!existsSync(full)) throw new Error(`Missing required file: ${relPath}`);
  return full;
}

async function concurrentShiftSearch(concurrency = 20) {
  const started = Date.now();
  const results = await Promise.all(
    Array.from({ length: concurrency }, async () => {
      const t0 = Date.now();
      const res = await fetch(`${API}/shifts?limit=10&status=PUBLISHED`, {
        headers: { Authorization: NURSE },
      });
      return { ok: res.ok, status: res.status, ms: Date.now() - t0 };
    })
  );
  const ok = results.filter((r) => r.ok).length;
  const elapsed = Date.now() - started;
  const sampleError = results.find((r) => !r.ok);
  return {
    concurrency,
    ok,
    failed: concurrency - ok,
    elapsedMs: elapsed,
    sampleStatus: sampleError?.status,
  };
}

async function main() {
  console.log("=== M13 DevOps Test ===\n");

  assertExists(".github/workflows/ci.yml");
  assertExists("infra/terraform/main.tf");
  assertExists("loadtests/shift-search.k6.js");
  assertExists("docker-compose.observability.yml");
  console.log("1. Infra files present ✅");

  const ci = readFileSync(join(ROOT, ".github/workflows/ci.yml"), "utf8");
  if (!ci.includes("terraform validate")) throw new Error("CI missing terraform validate");
  if (!ci.includes("test:rbac")) throw new Error("CI missing RBAC tests");
  console.log("2. CI workflow configured ✅");

  const health = await api("/health");
  console.log("\n3. Health check");
  console.log(`   status: ${health.status}`);
  console.log(`   database: ${health.services?.database}`);
  console.log(`   redis: ${health.services?.redis}`);
  if (!health.services?.database) throw new Error("Health missing database check");

  const metrics = await api("/metrics");
  if (typeof metrics !== "string" || !metrics.includes("http_requests_total")) {
    throw new Error("Metrics endpoint missing prometheus counters");
  }
  console.log("\n4. Prometheus metrics endpoint ✅");

  const load = await concurrentShiftSearch(20);
  console.log("\n5. Concurrent shift search (20 requests)");
  console.log(`   ok: ${load.ok}/${load.concurrency} in ${load.elapsedMs}ms`);
  if (load.failed > 0) {
    console.log(`   sample error status: ${load.sampleStatus ?? "unknown"}`);
  }
  if (load.ok < load.concurrency * 0.85) {
    throw new Error(`Too many failed requests: ${load.failed}`);
  }

  console.log("\n✅ M13 DevOps test passed");
  console.log("\nNext steps:");
  console.log("  docker compose -f docker-compose.observability.yml up -d");
  console.log("  k6 run loadtests/shift-search.k6.js");
  console.log("  cd infra/terraform && terraform plan");
}

main().catch((err) => {
  console.error("\n❌ M13 test failed:", err.message);
  process.exit(1);
});
