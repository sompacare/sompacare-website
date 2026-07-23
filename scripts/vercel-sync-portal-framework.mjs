#!/usr/bin/env node
/**
 * Reset Vercel portal projects to Next.js + vercel.json build settings (monorepo).
 * Run after Git deploys fail with Framework "Other" / wrong output directory.
 */
import { execSync } from "node:child_process";

const scope = "sompacare-staffing";
const projects = [
  "sompacare-admin",
  "sompacare-nurse",
  "sompacare-facility",
  "sompacare-recruiter",
];

for (const project of projects) {
  console.log(`\nUpdating ${project}…`);
  execSync(
    `npx vercel project update ${project} --scope ${scope} --framework nextjs --auto-detect build-command --auto-detect install-command --auto-detect output-directory`,
    { stdio: "inherit" }
  );
}

console.log("\nDone. Push to platform (production branch) to redeploy.");
