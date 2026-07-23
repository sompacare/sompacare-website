#!/usr/bin/env node
/**
 * Start API + all four portal dev servers (Windows-friendly).
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const jobs = [
  { name: "api", cmd: "npm", args: ["run", "dev", "--workspace=@sompacare/api"] },
  { name: "nurse", cmd: "npm", args: ["run", "dev", "--workspace=@sompacare/nurse-portal"] },
  { name: "facility", cmd: "npm", args: ["run", "dev", "--workspace=@sompacare/facility-portal"] },
  { name: "recruiter", cmd: "npm", args: ["run", "dev", "--workspace=@sompacare/recruiter-portal"] },
  { name: "admin", cmd: "npm", args: ["run", "dev", "--workspace=@sompacare/admin-portal"] },
];

console.log("Starting API (4000) + portals 3001–3004. Ctrl+C stops all.\n");

const children = jobs.map(({ name, cmd, args }) => {
  const child = spawn(cmd, args, { cwd: root, stdio: "inherit", shell: true, env: process.env });
  child.on("exit", (code) => {
    if (code && code !== 0) console.error(`[${name}] exited ${code}`);
  });
  return child;
});

function shutdown() {
  for (const child of children) {
    try {
      child.kill();
    } catch {
      // ignore
    }
  }
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
