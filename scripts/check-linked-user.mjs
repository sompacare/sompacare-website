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

function runSql(databaseUrl, sql) {
  const sqlFile = join(root, "scripts", ".tmp-check-user.sql");
  writeFileSync(sqlFile, sql, "utf8");
  try {
    execSync(
      `docker run --rm -v "${sqlFile.replace(/\\/g, "/")}:/script.sql:ro" postgres:16-alpine psql "${databaseUrl}" -t -A -F '|' -f /script.sql`,
      { stdio: "pipe", shell: true, encoding: "utf8" }
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
  const email = process.argv[2] ?? "mountainoflifeprayer@gmail.com";
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL missing in .env.platform.live");
  const dbUrl = databaseUrl.includes("sslmode=")
    ? databaseUrl
    : `${databaseUrl}${databaseUrl.includes("?") ? "&" : "?"}sslmode=require`;

  const safeEmail = sqlEscape(email);
  const sql = `
SELECT
  u.email,
  u.clerk_id,
  u.status,
  COALESCE(string_agg(DISTINCT r.name::text, ','), ''),
  COALESCE(wp.clinical_role::text, ''),
  (SELECT COUNT(*)::text FROM licenses l WHERE l.user_id = u.id),
  (SELECT COUNT(*)::text FROM certifications c WHERE c.user_id = u.id)
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
LEFT JOIN worker_profiles wp ON wp.user_id = u.id
WHERE u.email = '${safeEmail}'
GROUP BY u.id, u.email, u.clerk_id, u.status, wp.clinical_role;
`;

  const sqlFile = join(root, "scripts", ".tmp-check-user.sql");
  writeFileSync(sqlFile, sql, "utf8");
  let output;
  try {
    output = execSync(
      `docker run --rm -v "${sqlFile.replace(/\\/g, "/")}:/script.sql:ro" postgres:16-alpine psql "${dbUrl}" -t -A -F "|" -f /script.sql`,
      { shell: true, encoding: "utf8" }
    ).trim();
  } finally {
    try {
      unlinkSync(sqlFile);
    } catch {
      // ignore
    }
  }

  if (!output) {
    console.log(`NOT_LINKED: no row for ${email}`);
    process.exit(1);
  }

  const [rowEmail, clerkId, status, rolesCsv, clinicalRole, licenses, certs] = output.split("|");
  const roles = rolesCsv ? rolesCsv.split(",").filter(Boolean) : [];

  console.log("LINKED: yes");
  console.log("Email:", rowEmail);
  console.log("Clerk ID:", clerkId);
  console.log("Status:", status);
  console.log("Roles:", roles.length ? roles.join(", ") : "(none)");
  console.log("Worker profile:", clinicalRole || "missing");
  console.log("Licenses:", licenses);
  console.log("Certs:", certs);

  const ready =
    status === "ACTIVE" &&
    roles.includes("RN") &&
    clinicalRole &&
    Number(licenses) > 0;

  console.log(ready ? "READY: yes" : "READY: no");
  if (!ready) process.exit(1);
}

main().catch((error) => {
  console.error("ERROR:", error.message);
  process.exit(1);
});
