import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const ADMIN_TABLES = [
  "clients",
  "contracts",
  "employees",
  "job_orders",
  "invoices",
  "payments",
  "documents",
  "admin_settings",
];

const ADMIN_TABLE_PROBE_COLUMN = {
  clients: "id",
  contracts: "id",
  employees: "id",
  job_orders: "id",
  invoices: "id",
  payments: "id",
  documents: "id",
  admin_settings: "key",
};

function isMissingTableError(message, code) {
  if (code === "PGRST204" || code === "42703") return false;
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    /relation .* does not exist/i.test(message) ||
    /could not find the table/i.test(message) ||
    /schema cache/i.test(message)
  );
}

function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const BUCKET = "business-documents";

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function tableExists(table) {
  const column = ADMIN_TABLE_PROBE_COLUMN[table] ?? "id";
  const { error } = await supabase.from(table).select(column).limit(1);
  if (!error) return true;
  if (isMissingTableError(error.message, error.code)) return false;
  throw new Error(`${table}: ${error.message}`);
}

async function ensureBucket() {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw new Error(`Storage list failed: ${listError.message}`);

  if (buckets?.some((b) => b.name === BUCKET || b.id === BUCKET)) {
    console.log(`Bucket "${BUCKET}" already exists.`);
    return;
  }

  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: false,
    fileSizeLimit: 52_428_800,
  });

  if (error) throw new Error(`Bucket create failed: ${error.message}`);
  console.log(`Created storage bucket "${BUCKET}".`);
}

async function runSqlFile() {
  if (!dbUrl) {
    console.log("No DATABASE_URL in .env.local — skipping automatic SQL migration.");
    console.log("Add your Supabase database connection string as DATABASE_URL, then re-run:");
    console.log("  npm run setup:admin");
    return false;
  }

  let pg;
  try {
    pg = await import("pg");
  } catch {
    console.error("Install pg to run SQL automatically: npm install --save-dev pg");
    return false;
  }

  const sql = readFileSync(resolve(process.cwd(), "supabase/admin-dashboard.sql"), "utf8");
  const client = new pg.default.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  await client.connect();
  try {
    await client.query(sql);
    console.log("Ran supabase/admin-dashboard.sql successfully.");
    return true;
  } finally {
    await client.end();
  }
}

console.log("Sompacare admin dashboard setup\n");

const missingBefore = [];
for (const table of ADMIN_TABLES) {
  const exists = await tableExists(table);
  console.log(`${exists ? "OK" : "MISSING"}  table: ${table}`);
  if (!exists) missingBefore.push(table);
}

await ensureBucket();

if (missingBefore.length > 0) {
  const migrated = await runSqlFile();
  if (migrated) {
    console.log("\nRe-checking tables...");
    for (const table of ADMIN_TABLES) {
      const exists = await tableExists(table);
      console.log(`${exists ? "OK" : "MISSING"}  table: ${table}`);
    }
  } else if (missingBefore.length > 0) {
    console.log("\nManual step required:");
    console.log("1. Open Supabase → SQL Editor → New query");
    console.log("2. Paste contents of supabase/admin-dashboard.sql");
    console.log("3. Click Run");
    process.exit(1);
  }
}

console.log("\nAdmin dashboard setup complete.");
