/**
 * Start Stripe webhook forwarding using the bundled local Stripe CLI.
 * Auto-updates STRIPE_WEBHOOK_SECRET in .env.platform when listen starts.
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";
const stripeBin = isWin
  ? path.join(repoRoot, "tools", "stripe", "stripe.exe")
  : path.join(repoRoot, "tools", "stripe", "stripe");

const forwardTo =
  process.env.STRIPE_WEBHOOK_FORWARD_TO ??
  "localhost:4000/api/v1/payments/stripe/webhook";

if (!existsSync(stripeBin)) {
  console.error(
    `Stripe CLI not found at ${stripeBin}\n` +
      "Run: npm run stripe:install"
  );
  process.exit(1);
}

function updateWebhookSecret(secret) {
  const envPath = path.join(repoRoot, ".env.platform");
  if (!existsSync(envPath)) {
    console.warn(".env.platform not found — copy webhook secret manually:", secret);
    return;
  }

  let content = readFileSync(envPath, "utf8");
  if (/^STRIPE_WEBHOOK_SECRET=.*$/m.test(content)) {
    content = content.replace(
      /^STRIPE_WEBHOOK_SECRET=.*$/m,
      `STRIPE_WEBHOOK_SECRET=${secret}`
    );
  } else {
    content += `\nSTRIPE_WEBHOOK_SECRET=${secret}\n`;
  }
  writeFileSync(envPath, content, "utf8");
  console.log(`\nUpdated .env.platform STRIPE_WEBHOOK_SECRET`);
  console.log("Restart the API if it is already running: npm run dev:api\n");
}

let secretWritten = false;

const child = spawn(
  stripeBin,
  ["listen", "--forward-to", forwardTo],
  { stdio: ["inherit", "pipe", "pipe"], shell: false }
);

function handleOutput(chunk) {
  const text = chunk.toString();
  process.stdout.write(text);
  if (!secretWritten) {
    const match = text.match(/whsec_[A-Za-z0-9]+/);
    if (match) {
      secretWritten = true;
      updateWebhookSecret(match[0]);
    }
  }
}

child.stdout.on("data", handleOutput);
child.stderr.on("data", (chunk) => {
  process.stderr.write(chunk);
  handleOutput(chunk);
});

child.on("exit", (code) => process.exit(code ?? 0));

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));

console.log(`Forwarding Stripe webhooks → http://${forwardTo}`);
console.log(`Using Stripe CLI: ${stripeBin}\n`);
