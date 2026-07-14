/**
 * Resume sync: careers ingest copies Supabase resume → platform storage
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const API_BASE = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const API = API_BASE.endsWith("/api/v1") ? API_BASE : `${API_BASE}/api/v1`;
const RECRUITER = process.env.RECRUITER_TOKEN ?? "Bearer dev_dev_recruiter";
const INGEST_SECRET = process.env.CAREERS_INGEST_SECRET ?? "dev-careers-ingest-secret";
const UPLOADS = process.env.STORAGE_LOCAL_PATH ?? path.join(process.cwd(), "apps", "api", "uploads");

async function api(pathname, { method = "GET", token, secret, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = token;
  if (secret) headers["x-careers-ingest-secret"] = secret;

  const res = await fetch(`${API}${pathname}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${pathname} → ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

function seedSupabaseResume(applicationId) {
  const supabasePath = `resumes/${applicationId}/test-resume.pdf`;
  const platformKey = `candidates/${applicationId}/seed-resume.pdf`;

  mkdirSync(path.join(UPLOADS, "resumes", applicationId), { recursive: true });
  const resumeBytes = Buffer.from("%PDF-1.4 resume sync test\n");
  writeFileSync(path.join(UPLOADS, supabasePath), resumeBytes);

  return { supabasePath, platformKey, resumeBytes };
}

async function main() {
  console.log("=== Resume Sync Test ===\n");

  const applicationId = crypto.randomUUID();
  const email = `resume.sync.${Date.now()}@example.com`;
  const { supabasePath } = seedSupabaseResume(applicationId);

  console.log("1. Ingest application with Supabase resume path…");
  const ingest = await api("/careers/ingest", {
    method: "POST",
    secret: INGEST_SECRET,
    body: {
      applicationId,
      firstName: "Resume",
      lastName: "Sync",
      email,
      position: "rn",
      resumeUrl: supabasePath,
      resumeFileName: "test-resume.pdf",
    },
  });

  const candidateId = ingest.candidate.id;
  console.log(`   candidate ${candidateId}`);

  if (!ingest.candidate.resumeStorageKey && !ingest.resumeSynced) {
    console.log("   note: resume sync skipped (Supabase not configured in API — local path seeded for dev)");
  }

  if (ingest.candidate.resumeStorageKey) {
    console.log(`   stored at ${ingest.candidate.resumeStorageKey}`);
    const localFile = path.join(UPLOADS, ingest.candidate.resumeStorageKey);
    if (!existsSync(localFile)) {
      throw new Error(`Expected local file at ${localFile}`);
    }
  }

  console.log("2. Recruiter resume download URL…");
  const download = await api(`/recruiters/candidates/${candidateId}/resume`, {
    token: RECRUITER,
  });
  if (!download.url) throw new Error("Expected download URL");
  console.log(`   url: ${download.url}`);

  if (download.url.includes("/files/download")) {
    const res = await fetch(download.url);
    if (!res.ok) throw new Error(`File download failed: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.toString().includes("%PDF")) throw new Error("Downloaded file is not the seeded PDF");
    console.log("   local file stream OK");
  }

  console.log("\nResume sync test passed.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
