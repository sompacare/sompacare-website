#!/usr/bin/env node
/**
 * Print Clerk Dashboard redirect URLs for production custom domains.
 * Clerk Dashboard → Configure → Paths → Allowed redirect URLs
 */
import { CLERK_REDIRECT_URLS, PRODUCTION } from "./production-urls.mjs";

console.log("Clerk production redirect URLs (add each line in Dashboard → Paths):\n");
for (const url of CLERK_REDIRECT_URLS) {
  console.log(url);
}

console.log("\nClerk webhook endpoint:");
console.log(`${PRODUCTION.apiV1}/auth/webhook/clerk`);

console.log("\nClerk satellite mode: OFF (NEXT_PUBLIC_CLERK_IS_SATELLITE=false)");
console.log("Portals are subdomains of sompacare.com — no satellite domains needed.");
console.log("\nIf DNS cutover is incomplete, also add Render fallbacks under Domains → Satellites");
console.log("and set NEXT_PUBLIC_CLERK_IS_SATELLITE=true until custom domains resolve.");
