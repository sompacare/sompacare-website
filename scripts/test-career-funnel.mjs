/**
 * Career funnel: careers ingest → recruiter pipeline → worker onboarding
 */
const API_BASE = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const API = API_BASE.endsWith("/api/v1") ? API_BASE : `${API_BASE}/api/v1`;
const RECRUITER = process.env.RECRUITER_TOKEN ?? "Bearer dev_dev_recruiter";
const INGEST_SECRET = process.env.CAREERS_INGEST_SECRET ?? "dev-careers-ingest-secret";

async function api(path, { method = "GET", token, secret, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = token;
  if (secret) headers["x-careers-ingest-secret"] = secret;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  console.log("=== Career Funnel Test ===\n");

  const applicationId = crypto.randomUUID();
  const email = `funnel.test.${Date.now()}@example.com`;

  console.log("1. Ingest careers application into recruiter pipeline…");
  const ingest = await api("/careers/ingest", {
    method: "POST",
    secret: INGEST_SECRET,
    body: {
      applicationId,
      firstName: "Funnel",
      lastName: "Test",
      email,
      phone: "4105550100",
      position: "rn",
      positionLabel: "Registered Nurse (RN)",
      experience: "3 years acute care",
      availability: "Per diem · nights",
    },
  });
  console.log(`   candidate ${ingest.candidate.id} (created=${ingest.created})`);
  if (ingest.candidate.source !== "careers") throw new Error("Expected careers source");
  if (ingest.candidate.clinicalRole !== "RN") throw new Error("Expected RN clinical role");

  console.log("2. Idempotent re-ingest…");
  const again = await api("/careers/ingest", {
    method: "POST",
    secret: INGEST_SECRET,
    body: {
      applicationId,
      firstName: "Funnel",
      lastName: "Test",
      email,
      position: "rn",
    },
  });
  if (!again.created) console.log("   duplicate correctly skipped");

  console.log("3. Recruiter sees candidate on pipeline…");
  const pipeline = await api("/recruiters/pipeline", { token: RECRUITER });
  const applied = pipeline.columns?.find((c) => c.stage === "APPLIED");
  const found = applied?.candidates?.some((c) => c.id === ingest.candidate.id);
  if (!found) throw new Error("Candidate not visible in APPLIED column");

  const candidateId = ingest.candidate.id;

  console.log("4. Send worker onboarding invite…");
  const onboarding = await api(`/recruiters/candidates/${candidateId}/onboarding`, {
    method: "POST",
    token: RECRUITER,
  });
  if (!onboarding.signupUrl?.includes("/sign-up")) {
    throw new Error("Expected nurse portal signup URL");
  }
  console.log(`   signup URL: ${onboarding.signupUrl}`);

  console.log("5. Move to PLACED…");
  await api(`/recruiters/candidates/${candidateId}/stage`, {
    method: "PATCH",
    token: RECRUITER,
    body: { stage: "PLACED" },
  });

  console.log("\nCareer funnel test passed.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
