#!/usr/bin/env node
/**
 * Mark every Clerk user's email addresses as verified (one-time / maintenance).
 * Requires CLERK_SECRET_KEY in the environment.
 *
 * Usage: node scripts/verify-clerk-emails.mjs
 */
import { createClerkClient } from "@clerk/backend";

const secretKey = process.env.CLERK_SECRET_KEY?.trim();
if (!secretKey) {
  console.error("Set CLERK_SECRET_KEY before running this script.");
  process.exit(1);
}

const clerk = createClerkClient({ secretKey });

async function main() {
  let offset = 0;
  const limit = 100;
  let verified = 0;
  let scanned = 0;

  for (;;) {
    const page = await clerk.users.getUserList({ limit, offset });
    if (page.data.length === 0) break;

    for (const user of page.data) {
      scanned += 1;
      for (const email of user.emailAddresses) {
        if (email.verification?.status === "verified") continue;
        await clerk.emailAddresses.updateEmailAddress(email.id, { verified: true });
        verified += 1;
        console.log(`Verified ${email.emailAddress} (${user.id})`);
      }
    }

    offset += page.data.length;
    if (page.data.length < limit) break;
  }

  console.log(`Done. Scanned ${scanned} user(s); verified ${verified} email(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
