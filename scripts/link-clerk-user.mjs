import { randomUUID } from "crypto";
import { execSync } from "child_process";
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadProductionEnv() {
  const files = [
    join(root, ".env"),
    join(root, "packages/database/.env"),
    join(root, ".env.platform.live"),
  ];

  for (const file of files) {
    try {
      const content = readFileSync(file, "utf8");
      const force = file.endsWith(".env.platform.live");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const idx = trimmed.indexOf("=");
        if (idx === -1) continue;
        const key = trimmed.slice(0, idx).trim();
        let value = trimmed.slice(idx + 1).trim();
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }
        if (force || !process.env[key]) process.env[key] = value;
      }
    } catch {
      // optional
    }
  }
}

function sqlEscape(value) {
  return String(value).replace(/'/g, "''");
}

async function fetchClerkUser(email) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error("CLERK_SECRET_KEY missing in .env.platform.live");

  const url = new URL("https://api.clerk.com/v1/users");
  url.searchParams.set("email_address", email);
  url.searchParams.set("limit", "1");

  const res = await fetch(url, { headers: { Authorization: `Bearer ${secretKey}` } });
  if (!res.ok) throw new Error(`Clerk API ${res.status}: ${await res.text()}`);
  const body = await res.json();
  return body[0] ?? null;
}

function runSql(databaseUrl, sql) {
  const sqlFile = join(root, "scripts", ".tmp-link-user.sql");
  writeFileSync(sqlFile, sql, "utf8");
  try {
    execSync(
      `docker run --rm -v "${sqlFile.replace(/\\/g, "/")}:/script.sql:ro" postgres:16-alpine psql "${databaseUrl}" -v ON_ERROR_STOP=1 -f /script.sql`,
      { stdio: "inherit", shell: true }
    );
  } finally {
    try {
      unlinkSync(sqlFile);
    } catch {
      // ignore
    }
  }
}

async function main() {
  loadProductionEnv();

  const emailArg = process.argv.find((a, i) => process.argv[i - 1] === "--email");
  const email = emailArg ?? "mountainoflifeprayer@gmail.com";
  const roleArg = process.argv.find((a, i) => process.argv[i - 1] === "--role");
  const role = (roleArg ?? "RN").toUpperCase();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL missing in .env.platform.live");
  const dbUrl = databaseUrl.includes("sslmode=")
    ? databaseUrl
    : `${databaseUrl}${databaseUrl.includes("?") ? "&" : "?"}sslmode=require`;

  const clerkUser = await fetchClerkUser(email);
  if (!clerkUser) throw new Error(`No Clerk Production user for ${email}`);

  const primaryEmail =
    clerkUser.email_addresses?.find((e) => e.id === clerkUser.primary_email_address_id)
      ?.email_address ??
    clerkUser.email_addresses?.[0]?.email_address ??
    email;

  const firstName = sqlEscape(clerkUser.first_name ?? "Google");
  const lastName = sqlEscape(clerkUser.last_name ?? "Play Review");
  const clerkId = sqlEscape(clerkUser.id);
  const safeEmail = sqlEscape(primaryEmail);
  const safeRole = sqlEscape(role);
  const userId = randomUUID();
  const licenseExpiry = new Date(Date.now() + 86400000 * 365).toISOString();

  const sql = `
DO $$
DECLARE
  v_user_id text;
  v_role_id text;
  v_license_id text;
  v_cert_id text;
  v_bg_id text;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE email = '${safeEmail}';

  IF v_user_id IS NULL THEN
    v_user_id := '${userId}';
    INSERT INTO users (id, email, clerk_id, first_name, last_name, status, email_verified, created_at, updated_at)
    VALUES (v_user_id, '${safeEmail}', '${clerkId}', '${firstName}', '${lastName}', 'ACTIVE', true, NOW(), NOW());
  ELSE
    UPDATE users SET clerk_id = '${clerkId}', status = 'ACTIVE', updated_at = NOW() WHERE id = v_user_id;
  END IF;

  SELECT id INTO v_role_id FROM roles WHERE name = '${safeRole}'::"PlatformRole";
  IF v_role_id IS NULL THEN
    RAISE EXCEPTION 'Role ${safeRole} missing in production DB';
  END IF;

  INSERT INTO user_roles (id, user_id, role_id, granted_at)
  VALUES ('${randomUUID()}', v_user_id, v_role_id, NOW())
  ON CONFLICT (user_id, role_id) DO NOTHING;

  INSERT INTO worker_profiles (
    id, user_id, clinical_role, specialties, preferred_shift_types,
    min_hourly_rate, compliance_score, reliability_score, attendance_rate,
    created_at, updated_at
  )
  VALUES (
    '${randomUUID()}', v_user_id, '${safeRole}'::"ClinicalRole", ARRAY['Med-Surg']::text[], ARRAY['PER_DIEM']::"ShiftType"[],
    40, 100, 100, 100, NOW(), NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET clinical_role = EXCLUDED.clinical_role, compliance_score = 100, updated_at = NOW();

  v_license_id := 'seed-license-' || v_user_id;
  v_cert_id := 'seed-cert-' || v_user_id;
  v_bg_id := 'seed-bg-' || v_user_id;

  INSERT INTO licenses (id, user_id, type, number, state, status, expires_at, verified_at, created_at, updated_at)
  VALUES (v_license_id, v_user_id, '${safeRole}', '${safeRole}-MD-PLAY-001', 'MD', 'ACTIVE', '${licenseExpiry}', NOW(), NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET status = 'ACTIVE', expires_at = EXCLUDED.expires_at, updated_at = NOW();

  INSERT INTO certifications (id, user_id, name, issuer, status, expires_at, issued_at, created_at)
  VALUES (v_cert_id, v_user_id, 'BLS/CPR', 'American Heart Association', 'VERIFIED', '${licenseExpiry}', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET status = 'VERIFIED', expires_at = EXCLUDED.expires_at;

  INSERT INTO background_checks (id, user_id, provider, status, completed_at, created_at)
  VALUES (v_bg_id, v_user_id, 'checkr', 'VERIFIED', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET status = 'VERIFIED';

  INSERT INTO wallets (id, user_id, balance, updated_at)
  VALUES ('${randomUUID()}', v_user_id, 0, NOW())
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'Linked user % as ${safeRole}', '${safeEmail}';
END $$;
`;

  console.log(`Linking ${primaryEmail} to production DB...`);
  runSql(dbUrl, sql);
  console.log(`Linked ${primaryEmail} (${clerkUser.id}) as ${role}.`);
  console.log("READY: yes");
  console.log("Test: https://sompacare-nurse.onrender.com/sign-in");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("password authentication failed")) {
    console.error(
      "Database password rejected. Copy the fresh External Database URL from Render → sompacare-db → Connect, update .env.platform.live, then rerun: npm run link:user"
    );
  }
  console.error(message);
  process.exit(1);
});
