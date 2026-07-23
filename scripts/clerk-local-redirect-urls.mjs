#!/usr/bin/env node
/** Clerk Dashboard → Configure → Paths → Allowed redirect URLs (Development instance). */
const origins = [
  ["nurse", 3001],
  ["facility", 3002],
  ["recruiter", 3003],
  ["admin", 3004],
];

console.log("Add these Allowed redirect URLs in Clerk (Development / pk_test instance):\n");
for (const [, port] of origins) {
  const base = `http://localhost:${port}`;
  for (const path of ["", "/sign-in", "/sign-up", "/home", "/forgot-password"]) {
    console.log(`${base}${path}`);
  }
}
console.log("\nUse http://localhost in the browser — not http://127.0.0.1");
