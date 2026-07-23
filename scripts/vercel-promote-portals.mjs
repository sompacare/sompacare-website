#!/usr/bin/env node
/**
 * Wait for latest Git deployment per portal project, promote to Production if Preview succeeds.
 * Usage: node scripts/vercel-promote-portals.mjs
 */
import { execSync } from "node:child_process";

const scope = process.env.VERCEL_SCOPE ?? "sompacare-staffing";
const projects = ["sompacare-admin", "sompacare-nurse", "sompacare-facility", "sompacare-recruiter"];

function ls(project) {
  return execSync(`npx vercel ls ${project} --scope ${scope}`, { encoding: "utf8" });
}

function inspect(url) {
  return execSync(`npx vercel inspect ${url} --scope ${scope} --json`, { encoding: "utf8" });
}

function parseLatestPreviewUrl(text) {
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (!line.includes("Preview")) continue;
    const m = line.match(/https:\/\/[^\s]+/);
    if (m) return m[0];
  }
  return null;
}

function parseStatus(text, url) {
  for (const line of text.split(/\r?\n/)) {
    if (!line.includes(url)) continue;
    if (line.includes("Ready")) return "Ready";
    if (line.includes("Error")) return "Error";
    if (line.includes("Building") || line.includes("Queued")) return "Building";
  }
  return "Unknown";
}

async function waitReady(project, maxMs = 600_000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const list = ls(project);
    const url = parseLatestPreviewUrl(list);
    if (!url) {
      await sleep(15_000);
      continue;
    }
    const status = parseStatus(list, url);
    console.log(`${project}: ${status} ${url}`);
    if (status === "Ready") return url;
    if (status === "Error") throw new Error(`${project} deploy failed: ${url}`);
    await sleep(20_000);
  }
  throw new Error(`${project} timed out waiting for deploy`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  for (const project of projects) {
    console.log(`\n--- ${project} ---`);
    const url = await waitReady(project);
    console.log(`Promoting ${url} to production…`);
    execSync(`npx vercel promote ${url} --scope ${scope} --yes`, { stdio: "inherit" });
  }
  console.log("\nAll portals promoted to production.");
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
