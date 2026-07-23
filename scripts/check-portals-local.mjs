#!/usr/bin/env node
/** Quick local sign-in probe (dev servers must be running). */
const portals = [
  ["nurse", 3001],
  ["facility", 3002],
  ["recruiter", 3003],
  ["admin", 3004],
];

let failed = false;

for (const [name, port] of portals) {
  const url = `http://localhost:${port}/sign-in`;
  try {
    const res = await fetch(url);
    const body = await res.text();
    const ok =
      res.status === 200 &&
      !body.includes("Portal not configured") &&
      (body.includes("pk_test") || body.includes("pk_live"));
    console.log(ok ? "OK" : "FAIL", name, url, res.status);
    if (!ok) failed = true;
  } catch (err) {
    console.log("FAIL", name, url, err.message);
    failed = true;
  }
}

if (failed) {
  console.error("\nStart servers: npm run dev:portals");
  process.exit(1);
}

console.log("\nAll four sign-in pages responded. Wait for “Connecting to sign-in…” then try credentials.");
