import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  try {
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
  } catch {
    console.error("Could not read .env.local");
    process.exit(1);
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("URL set:", Boolean(url && !url.includes("your-project")));
console.log("Service role set:", Boolean(key && !key.includes("your_service_role")));
console.log("Key starts with eyJ:", Boolean(key?.startsWith("eyJ")));

if (!url || !key) {
  console.error("Missing Supabase env vars.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const testId = crypto.randomUUID();

const { error: insertError } = await supabase.from("applications").insert({
  id: testId,
  first_name: "Test",
  last_name: "Applicant",
  email: "test@example.com",
  phone: "2405550100",
  address_line1: "123 Test St",
  city: "Test City",
  state: "MD",
  zip: "20706",
  position: "cna",
  position_label: "Certified Nursing Assistant (CNA)",
  license_number: "TEST123",
  license_state: "MD",
  certifications: ["CNA"],
  experience: "1-3",
  availability: "full-time",
  resume_url: null,
  resume_file_name: null,
  certification_urls: [],
});

if (insertError) {
  console.error("INSERT ERROR:", insertError.message);
  console.error("DETAILS:", insertError.details ?? "");
  console.error("HINT:", insertError.hint ?? "");
  console.error("CODE:", insertError.code ?? "");
  process.exit(1);
}

console.log("Insert OK, id:", testId);

const buffer = Buffer.from("test resume");
const { error: uploadError } = await supabase.storage
  .from("application-files")
  .upload(`resumes/${testId}/test.pdf`, buffer, {
    contentType: "application/pdf",
    upsert: true,
  });

if (uploadError) {
  console.error("UPLOAD ERROR:", uploadError.message);
  await supabase.from("applications").delete().eq("id", testId);
  process.exit(1);
}

console.log("Upload OK");

await supabase.from("applications").delete().eq("id", testId);
await supabase.storage.from("application-files").remove([`resumes/${testId}/test.pdf`]);

console.log("Cleanup OK — Supabase connection works.");
