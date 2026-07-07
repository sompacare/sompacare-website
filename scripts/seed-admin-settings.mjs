import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

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

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) process.exit(1);

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const defaults = [
  { key: "company", value: { invoice_prefix: "INV", payment_terms_days: 30, default_tax_rate: 0 } },
  { key: "notifications", value: { payment_receipts: true } },
];

for (const row of defaults) {
  const { data } = await supabase.from("admin_settings").select("key").eq("key", row.key).maybeSingle();
  if (!data) {
    await supabase.from("admin_settings").insert(row);
    console.log(`Seeded admin_settings.${row.key}`);
  } else {
    console.log(`admin_settings.${row.key} already exists`);
  }
}

console.log("Default admin settings ready.");
