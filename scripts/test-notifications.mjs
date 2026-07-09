/**
 * Smoke test platform notifications (apply → facility email, approve → nurse email).
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const API = process.env.API_URL ?? "http://localhost:4000/api/v1";

function loadEnv() {
  for (const file of [".env", ".env.local"]) {
    const path = join(root, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadEnv();

const NURSE_TOKEN = "Bearer dev_user_3GExGUcVAk8Z0FtKSQeVly1hX4K";
const FACILITY_TOKEN = "Bearer dev_dev_facility_mgr";

async function api(path, { method = "GET", token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

const FACILITY_ID = "cmrct0uiq00iu1yz4bwr3q687";
const LOCATION_ID = "seed-location-fox-chase";

async function main() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY missing from .env");
  }

  console.log("1. Ensure a published RN shift exists…");
  let shifts = await api("/shifts?limit=20&role=RN&facilityId=" + FACILITY_ID, {
    token: FACILITY_TOKEN,
  });
  let shift = shifts.data?.find((s) => s.status === "PUBLISHED");

  if (!shift) {
    const start = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 12 * 60 * 60 * 1000);
    const created = await api("/shifts", {
      method: "POST",
      token: FACILITY_TOKEN,
      body: {
        facilityId: FACILITY_ID,
        locationId: LOCATION_ID,
        title: "RN — Notification Test Shift",
        description: "Auto-created for notification smoke test",
        role: "RN",
        shiftType: "PER_DIEM",
        hourlyRate: 55,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        slotsTotal: 1,
      },
    });
    shift = await api(`/shifts/${created.id}/publish`, {
      method: "POST",
      token: FACILITY_TOKEN,
    });
    console.log("   created + published:", shift.title);
  } else {
    console.log("   using shift:", shift.title);
  }

  console.log("2. Apply (triggers facility notification)…");
  let application;
  try {
    application = await api(`/shifts/${shift.id}/applications`, {
      method: "POST",
      token: NURSE_TOKEN,
      body: { message: "Notification smoke test apply" },
    });
    console.log("   application created:", application.id);
  } catch (err) {
    if (String(err.message).includes("already applied")) {
      const apps = await api(`/applications?shiftId=${shift.id}&limit=5`, {
        token: FACILITY_TOKEN,
      });
      application = apps.data?.[0];
      if (!application) throw err;
      console.log("   using existing application:", application.id);
    } else {
      throw err;
    }
  }

  if (application.status === "PENDING") {
    console.log("3. Approve (triggers nurse notification)…");
    const result = await api(`/applications/${application.id}/approve`, {
      method: "POST",
      token: FACILITY_TOKEN,
    });
    console.log("   assignment:", result.assignment?.id);
  } else {
    console.log("3. Skip approve — application status:", application.status);
  }

  console.log("4. Check in-app notifications…");
  const [nurseNotes, facilityNotes] = await Promise.all([
    api("/notifications?limit=3", { token: NURSE_TOKEN }),
    api("/notifications?limit=3", { token: FACILITY_TOKEN }),
  ]);
  console.log("   nurse notifications:", nurseNotes.length ?? nurseNotes.data?.length ?? 0);
  console.log("   facility notifications:", facilityNotes.length ?? facilityNotes.data?.length ?? 0);

  console.log("Notification smoke test passed. Check inboxes for Resend emails.");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
