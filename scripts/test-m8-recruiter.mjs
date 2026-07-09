/**
 * M8 Recruiter Portal — pipeline, interviews, offers, metrics
 */
const API_BASE = (process.env.API_URL ?? "http://localhost:4000").replace(/\/$/, "");
const API = API_BASE.endsWith("/api/v1") ? API_BASE : `${API_BASE}/api/v1`;
const RECRUITER = process.env.RECRUITER_TOKEN ?? "Bearer dev_dev_recruiter";

async function api(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: token },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

async function main() {
  console.log("=== M8 Recruiter Portal Test ===\n");

  // 1. Pipeline board
  const pipeline = await api("/recruiters/pipeline", { token: RECRUITER });
  console.log("1. Pipeline board");
  console.log(`   total active: ${pipeline.total}`);
  for (const col of pipeline.columns ?? []) {
    console.log(`   ${col.stage}: ${col.count}`);
  }

  // 2. Metrics
  const metrics = await api("/recruiters/metrics", { token: RECRUITER });
  console.log("\n2. Recruiter metrics");
  console.log(`   active pipeline: ${metrics.activePipeline}`);
  console.log(`   placed total: ${metrics.placedTotal}`);

  // 3. Create candidate
  const suffix = Date.now().toString().slice(-6);
  const created = await api("/recruiters/candidates", {
    method: "POST",
    token: RECRUITER,
    body: {
      firstName: "Test",
      lastName: `Candidate${suffix}`,
      email: `test.candidate.${suffix}@example.com`,
      clinicalRole: "RN",
      source: "m8-test",
    },
  });
  console.log("\n3. Created candidate");
  console.log(`   ${created.firstName} ${created.lastName} → ${created.stage}`);

  // 4. Parse resume (dev bypass)
  const parsed = await api(`/recruiters/candidates/${created.id}/parse-resume`, {
    method: "POST",
    token: RECRUITER,
    body: {
      resumeText: "RN with 8 years med-surg. BLS, ACLS. Maryland license.",
    },
  });
  console.log("\n4. Resume parsed");
  console.log(`   match score: ${parsed.candidate?.matchScore}`);
  console.log(`   dev bypass: ${parsed.devBypass ?? false}`);

  // 5. Schedule interview
  const interview = await api(`/recruiters/candidates/${created.id}/interviews`, {
    method: "POST",
    token: RECRUITER,
    body: {
      scheduledAt: new Date(Date.now() + 86400000 * 3).toISOString(),
      mode: "video",
    },
  });
  console.log("\n5. Interview scheduled");
  console.log(`   candidate stage: ${interview.candidate?.stage}`);
  console.log(`   interview at: ${interview.interview?.scheduledAt}`);

  // 6. Move to offer + send offer
  await api(`/recruiters/candidates/${created.id}/stage`, {
    method: "PATCH",
    token: RECRUITER,
    body: { stage: "OFFER" },
  });
  const offered = await api(`/recruiters/candidates/${created.id}/offer`, {
    method: "POST",
    token: RECRUITER,
    body: { payRate: "$45/hr", startDate: "2026-08-01" },
  });
  console.log("\n6. Offer sent");
  console.log(`   stage: ${offered.stage}`);
  console.log(`   offer sent at: ${offered.offerSentAt ? "yes" : "no"}`);

  // 7. Accept offer + onboarding
  await api(`/recruiters/candidates/${created.id}/offer/accept`, {
    method: "POST",
    token: RECRUITER,
  });
  const onboarded = await api(`/recruiters/candidates/${created.id}/onboarding`, {
    method: "POST",
    token: RECRUITER,
  });
  console.log("\n7. Onboarding package");
  console.log(`   onboarding sent: ${onboarded.onboardingSentAt ? "yes" : "no"}`);

  // 8. Place candidate
  const placed = await api(`/recruiters/candidates/${created.id}/stage`, {
    method: "PATCH",
    token: RECRUITER,
    body: { stage: "PLACED" },
  });
  console.log("\n8. Candidate placed");
  console.log(`   stage: ${placed.stage}`);
  console.log(`   placed at: ${placed.placedAt ? "yes" : "no"}`);

  // 9. Leaderboard
  const leaderboard = await api("/recruiters/leaderboard", { token: RECRUITER });
  console.log("\n9. Leaderboard");
  console.log(`   entries: ${leaderboard.length}`);
  if (leaderboard[0]) {
    const top = leaderboard[0];
    console.log(
      `   #1: ${top.recruiter?.firstName} ${top.recruiter?.lastName} — ${top.placements} placements`
    );
  }

  console.log("\n✅ M8 Recruiter test passed");
}

main().catch((err) => {
  console.error("\n❌ M8 test failed:", err.message);
  process.exit(1);
});
