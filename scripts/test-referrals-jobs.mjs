/**
 * Referrals + job postings smoke test
 */
const API_BASE = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const API = API_BASE.endsWith("/api/v1") ? API_BASE : `${API_BASE}/api/v1`;
const NURSE = process.env.NURSE_TOKEN ?? "Bearer dev_dev_nurse_rn";
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
  console.log("=== Referrals + Job Postings Test ===\n");

  console.log("1. Public job postings…");
  const publicJobs = await api("/job-postings/public");
  if (!publicJobs.data?.length) throw new Error("Expected published job postings");
  console.log(`   ${publicJobs.data.length} published roles`);

  console.log("2. Nurse referral code…");
  const refs = await api("/referrals/me", { token: NURSE });
  if (!refs.code) throw new Error("Expected referral code");
  console.log(`   code: ${refs.code}`);

  console.log("3. Validate referral code…");
  const valid = await api(`/referrals/validate/${refs.code}`);
  if (!valid.valid) throw new Error("Referral code should validate");

  console.log("4. Careers ingest with referral…");
  const applicationId = crypto.randomUUID();
  const email = `referral.test.${Date.now()}@example.com`;
  const ingest = await api("/careers/ingest", {
    method: "POST",
    secret: INGEST_SECRET,
    body: {
      applicationId,
      firstName: "Refer",
      lastName: "Test",
      email,
      position: "cna",
      referralCode: refs.code,
    },
  });
  if (!ingest.candidate.referralCode) throw new Error("Candidate missing referral code");
  console.log(`   candidate ${ingest.candidate.id} referred`);

  console.log("5. Recruiter job postings list…");
  const jobs = await api("/job-postings", { token: RECRUITER });
  if (!jobs.data?.length) throw new Error("Recruiter should see job postings");
  console.log(`   ${jobs.data.length} postings managed`);

  console.log("\nReferrals + job postings test passed.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
