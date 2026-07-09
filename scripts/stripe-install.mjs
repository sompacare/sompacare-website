/**
 * Install Stripe CLI into tools/stripe/ (Windows download copy or macOS/Linux curl).
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const toolsDir = path.join(repoRoot, "tools", "stripe");
const isWin = process.platform === "win32";
const target = path.join(toolsDir, isWin ? "stripe.exe" : "stripe");

mkdirSync(toolsDir, { recursive: true });

if (existsSync(target)) {
  const version = spawnSync(target, ["version"], { encoding: "utf8" });
  console.log(version.stdout?.trim() ?? "Stripe CLI already installed.");
  process.exit(0);
}

if (isWin) {
  const candidates = [
    path.join(process.env.USERPROFILE ?? "", "Downloads", "stripe_1.43.6_windows_x86_64", "stripe.exe"),
    path.join(process.env.USERPROFILE ?? "", "Downloads", "stripe.exe"),
  ];
  const source = candidates.find((p) => existsSync(p));
  if (!source) {
    console.error(
      "Stripe CLI not found in Downloads.\n" +
        "Download from https://github.com/stripe/stripe-cli/releases/latest\n" +
        "Or run: winget install Stripe.StripeCli"
    );
    process.exit(1);
  }
  copyFileSync(source, target);
  console.log(`Installed Stripe CLI → ${target}`);
} else {
  console.log("On macOS/Linux, install Stripe CLI globally:");
  console.log("  brew install stripe/stripe-cli/stripe");
  console.log("Then symlink or copy stripe into tools/stripe/stripe");
  process.exit(1);
}

const version = spawnSync(target, ["version"], { encoding: "utf8" });
console.log(version.stdout?.trim());
