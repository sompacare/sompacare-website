/**
 * Assign RN role + worker profile to a Clerk user in the platform database.
 *
 * Usage:
 *   node scripts/link-clerk-user.mjs --email you@example.com
 *   node scripts/link-clerk-user.mjs --clerk-id user_2abc...
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
      // ignore missing env files
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
    include: { roles: true, profile: true },
  });
  if (user) return user;

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY missing from .env");
  }

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
      firstName: clerkUser.firstName ?? "New",
      lastName: clerkUser.lastName ?? "User",
      avatarUrl: clerkUser.imageUrl ?? undefined,
      status: "ACTIVE",
      emailVerified: true,
    },
    include: { roles: true, profile: true },
  });
}

async function main() {
  loadEnv();
  const { email, clerkId } = parseArgs(process.argv);
  if (!email && !clerkId) {
    console.error("Usage: node scripts/link-clerk-user.mjs --email you@example.com");
    console.error("   or: node scripts/link-clerk-user.mjs --clerk-id user_...");
    process.exit(1);
  }

  const user = await ensurePlatformUser({ email, clerkId });

  const rnRole = await prisma.role.findUnique({ where: { name: "RN" } });
  if (!rnRole) {
    console.error("RN role missing — run: npm run db:seed");
    process.exit(1);
  }

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: rnRole.id } },
    update: {},
    create: { userId: user.id, roleId: rnRole.id },
  });

  await prisma.workerProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      clinicalRole: "RN",
      specialties: ["Med-Surg"],
      preferredShiftTypes: ["PER_DIEM"],
      minHourlyRate: 40,
      complianceScore: 100,
      reliabilityScore: 100,
    },
  });

  const licenseExpiry = new Date(Date.now() + 86400000 * 365);
  await prisma.license.upsert({
    where: { id: `seed-license-${user.id}` },
    update: { status: "ACTIVE", expiresAt: licenseExpiry },
    create: {
      id: `seed-license-${user.id}`,
      userId: user.id,
      type: "RN",
      number: "RN-MD-DEV-001",
      state: "MD",
      status: "ACTIVE",
      expiresAt: licenseExpiry,
      verifiedAt: new Date(),
    },
  });

  await prisma.certification.upsert({
    where: { id: `seed-cert-${user.id}` },
    update: { status: "VERIFIED", expiresAt: licenseExpiry },
    create: {
      id: `seed-cert-${user.id}`,
      userId: user.id,
      name: "BLS/CPR",
      issuer: "American Heart Association",
      status: "VERIFIED",
      expiresAt: licenseExpiry,
      issuedAt: new Date(),
    },
  });

  await prisma.backgroundCheck.upsert({
    where: { id: `seed-bg-${user.id}` },
    update: { status: "VERIFIED" },
    create: {
      id: `seed-bg-${user.id}`,
      userId: user.id,
      provider: "checkr",
      status: "VERIFIED",
      completedAt: new Date(),
    },
  });

  await prisma.wallet.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, balance: 0 },
  });

  console.log(`Linked ${user.email} (${user.clerkId}) as RN with worker profile and credentials.`);
  console.log("Refresh http://localhost:3001/home to see open shifts.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
