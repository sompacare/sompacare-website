/**
 * Assign FACILITY_MANAGER role to a Clerk user for the facility portal.
 *
 * Usage:
 *   node scripts/link-facility-user.mjs --email you@example.com
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createClerkClient } from "@clerk/backend";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  for (const file of [".env", join("packages", "database", ".env")]) {
    try {
      const content = readFileSync(join(root, file), "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const idx = trimmed.indexOf("=");
        if (idx === -1) continue;
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, "");
        if (!process.env[key]) process.env[key] = value;
      }
    } catch {
      // ignore
    }
  }
}

function parseArgs(argv) {
  const args = { email: null, clerkId: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--email" && argv[i + 1]) args.email = argv[++i];
    if (argv[i] === "--clerk-id" && argv[i + 1]) args.clerkId = argv[++i];
  }
  return args;
}

async function ensurePlatformUser({ email, clerkId }) {
  let user = await prisma.user.findFirst({
    where: email ? { email } : { clerkId },
  });
  if (user) return user;

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) throw new Error("CLERK_SECRET_KEY missing from .env");

  const clerk = createClerkClient({ secretKey });
  let clerkUser;

  if (clerkId) {
    clerkUser = await clerk.users.getUser(clerkId);
  } else if (email) {
    const list = await clerk.users.getUserList({ emailAddress: [email] });
    clerkUser = list.data[0];
  }

  if (!clerkUser) {
    console.error(`No Clerk account found for ${email ?? clerkId}`);
    process.exit(1);
  }

  const primaryEmail =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? email;

  return prisma.user.create({
    data: {
      clerkId: clerkUser.id,
      email: primaryEmail,
      firstName: clerkUser.firstName ?? "Facility",
      lastName: clerkUser.lastName ?? "Manager",
      avatarUrl: clerkUser.imageUrl ?? undefined,
      status: "ACTIVE",
      emailVerified: true,
    },
  });
}

async function main() {
  loadEnv();
  const { email, clerkId } = parseArgs(process.argv);
  if (!email && !clerkId) {
    console.error("Usage: node scripts/link-facility-user.mjs --email you@example.com");
    process.exit(1);
  }

  const user = await ensurePlatformUser({ email, clerkId });

  const fmRole = await prisma.role.findUnique({ where: { name: "FACILITY_MANAGER" } });
  if (!fmRole) {
    console.error("FACILITY_MANAGER role missing — run: npm run db:seed");
    process.exit(1);
  }

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: fmRole.id } },
    update: {},
    create: { userId: user.id, roleId: fmRole.id },
  });

  const org = await prisma.organization.findFirst({ where: { slug: "fox-chase-healthcare" } });
  if (org) {
    await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
      update: { title: "Facility Manager" },
      create: {
        organizationId: org.id,
        userId: user.id,
        title: "Facility Manager",
        isPrimary: true,
      },
    });
  }

  console.log(`Linked ${user.email} (${user.clerkId}) as FACILITY_MANAGER.`);
  console.log("Open http://localhost:3002 and sign in with this account.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
