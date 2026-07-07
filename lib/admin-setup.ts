import "server-only";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

const ADMIN_TABLES = [
  "clients",
  "contracts",
  "employees",
  "job_orders",
  "invoices",
  "payments",
  "documents",
  "admin_settings",
] as const;

const BUSINESS_BUCKET = "business-documents";

export type AdminSetupStatus = {
  supabaseConfigured: boolean;
  tables: Record<(typeof ADMIN_TABLES)[number], boolean>;
  bucketExists: boolean;
  databaseUrlConfigured: boolean;
  ready: boolean;
};

function isMissingTableError(message: string, code?: string) {
  return (
    code === "42P01" ||
    code === "PGRST205" ||
    /does not exist/i.test(message) ||
    /schema cache/i.test(message)
  );
}

export async function getAdminSetupStatus(): Promise<AdminSetupStatus> {
  const supabase = getSupabaseAdmin();
  const tables = Object.fromEntries(
    ADMIN_TABLES.map((table) => [table, false]),
  ) as AdminSetupStatus["tables"];

  if (!supabase) {
    return {
      supabaseConfigured: false,
      tables,
      bucketExists: false,
      databaseUrlConfigured: Boolean(process.env.DATABASE_URL || process.env.SUPABASE_DB_URL),
      ready: false,
    };
  }

  await Promise.all(
    ADMIN_TABLES.map(async (table) => {
      const { error } = await supabase.from(table).select("id").limit(1);
      tables[table] = !error || !isMissingTableError(error.message, error.code);
    }),
  );

  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
  const bucketExists =
    !bucketError &&
    Boolean(buckets?.some((bucket) => bucket.name === BUSINESS_BUCKET || bucket.id === BUSINESS_BUCKET));

  const allTablesReady = ADMIN_TABLES.every((table) => tables[table]);

  return {
    supabaseConfigured: true,
    tables,
    bucketExists,
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL || process.env.SUPABASE_DB_URL),
    ready: allTablesReady && bucketExists,
  };
}

export async function ensureBusinessDocumentsBucket() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw new Error(listError.message);

  if (buckets?.some((bucket) => bucket.name === BUSINESS_BUCKET || bucket.id === BUSINESS_BUCKET)) {
    return { created: false };
  }

  const { error } = await supabase.storage.createBucket(BUSINESS_BUCKET, {
    public: false,
    fileSizeLimit: 52_428_800,
  });

  if (error) throw new Error(error.message);
  return { created: true };
}

export async function runAdminDashboardMigration() {
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    throw new Error(
      "DATABASE_URL is not configured. Add your Supabase Postgres connection string to Vercel and .env.local.",
    );
  }

  let pg: typeof import("pg");
  try {
    pg = await import("pg");
  } catch {
    throw new Error("Database driver is not installed.");
  }

  const sql = readFileSync(resolve(process.cwd(), "supabase/admin-dashboard.sql"), "utf8");
  const client = new pg.default.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await client.query(sql);
  } finally {
    await client.end();
  }
}
