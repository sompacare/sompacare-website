import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Resend } from "resend";

function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnv();

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM_EMAIL ?? "Sompacare <careers@sompacare.com>";
const inbox = process.env.RESEND_SANDBOX_INBOX ?? process.env.INFO_TO_EMAIL ?? "info@sompacare.com";

console.log("From:", from);
console.log("To:", inbox);

const resend = new Resend(apiKey);

const direct = await resend.emails.send({
  from,
  to: [inbox],
  subject: "Sompacare test — direct delivery",
  html: "<p>If you received this, Resend is working.</p>",
  text: "If you received this, Resend is working.",
});

if (direct.error) {
  console.error("DIRECT FAILED:", direct.error);
} else {
  console.log("DIRECT OK:", direct.data?.id);
}

const relayTarget = "careers@sompacare.com";
const restricted = await resend.emails.send({
  from,
  to: [relayTarget],
  subject: "Sompacare test — careers inbox",
  html: "<p>Should fail or relay.</p>",
  text: "Should fail or relay.",
});

if (restricted.error) {
  console.log("CAREERS BLOCKED (expected):", restricted.error.message);
  const relay = await resend.emails.send({
    from,
    to: [inbox],
    subject: `[Sompacare Relay] Test for ${relayTarget}`,
    html: `<p>Relay test for ${relayTarget}</p>`,
    text: `Relay test for ${relayTarget}`,
  });
  if (relay.error) console.error("RELAY FAILED:", relay.error);
  else console.log("RELAY OK:", relay.data?.id);
} else {
  console.log("CAREERS DIRECT OK:", restricted.data?.id);
}
