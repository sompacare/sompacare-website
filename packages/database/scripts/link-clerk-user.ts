import { PrismaClient } from "@prisma/client";
import { loadProductionEnv } from "./load-env";

loadProductionEnv();

const prisma = new PrismaClient();

type ClerkUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  image_url: string;
  email_addresses: Array<{ id: string; email_address: string }>;
  primary_email_address_id: string | null;
};

async function fetchClerkUser({
  email,
  clerkId,
}: {
  email?: string | null;
  clerkId?: string | null;
}): Promise<ClerkUser | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY missing — set in .env.platform.live");
  }

  const headers = { Authorization: `Bearer ${secretKey}` };

  if (clerkId) {
    const res = await fetch(`https://api.clerk.com/v1/users/${clerkId}`, { headers });
    if (!res.ok) return null;
    return (await res.json()) as ClerkUser;
  }

  if (!email) return null;

  const url = new URL("https://api.clerk.com/v1/users");
  url.searchParams.set("email_address", email);
  url.searchParams.set("limit", "1");

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Clerk API error ${res.status}: ${await res.text()}`);
  }

  const body = (await res.json()) as ClerkUser[];
  return body[0] ?? null;
}

async function ensurePlatformUser({
  email,
  clerkId,
}: {
  email?: string | null;
  clerkId?: string | null;
}) {
  const existing = await prisma.user.findFirst({
    where: email ? { email } : { clerkId: clerkId! },
    include: { roles: true, profile: true },
  });
  if (existing) return existing;

  const clerkUser = await fetchClerkUser({ email, clerkId });
  if (!clerkUser) {
    throw new Error(`No Clerk Production user found for ${email ?? clerkId}`);
  }

  const primaryEmail =
    clerkUser.email_addresses.find((e) => e.id === clerkUser.primary_email_address_id)
      ?.email_address ??
    clerkUser.email_addresses[0]?.email_address ??
    email;

  return prisma.user.create({
    data: {
      clerkId: clerkUser.id,
      email: primaryEmail!,
      firstName: clerkUser.first_name ?? "New",
      lastName: clerkUser.last_name ?? "User",
      avatarUrl: clerkUser.image_url ?? undefined,
      status: "ACTIVE",
      emailVerified: true,
    },
    include: { roles: true, profile: true },
  });
}

async function main() {
  const args = process.argv.slice(2);
  let email: string | null = null;
  let clerkId: string | null = null;
  let role = "RN";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--email" && args[i + 1]) email = args[++i];
    if (args[i] === "--clerk-id" && args[i + 1]) clerkId = args[++i];
    if (args[i] === "--role" && args[i + 1]) role = args[++i].toUpperCase();
  }

  if (!email && !clerkId) {
    console.error("Usage: npm run link:user -- --email user@example.com [--role RN]");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL?.includes("render.com")) {
    console.warn("Warning: DATABASE_URL does not look like Render production.");
  }

  const user = await ensurePlatformUser({ email, clerkId });

  const platformRole = await prisma.role.findUnique({ where: { name: role as never } });
  if (!platformRole) {
    throw new Error(`${role} role missing — run npm run db:seed:roles against production`);
  }

  const clinicalRoleMap: Record<string, string> = {
    RN: "RN",
    LPN: "LPN",
    CNA: "CNA",
    GNA: "GNA",
    CMA: "CMA",
    MED_TECH: "MED_TECH",
    NURSE: "RN",
  };
  const clinicalRole = clinicalRoleMap[role] ?? "RN";

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: platformRole.id } },
    update: {},
    create: { userId: user.id, roleId: platformRole.id },
  });

  await prisma.workerProfile.upsert({
    where: { userId: user.id },
    update: { clinicalRole: clinicalRole as never },
    create: {
      userId: user.id,
      clinicalRole: clinicalRole as never,
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
      type: role,
      number: `${role}-MD-PLAY-001`,
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

  console.log(`Linked ${user.email} (${user.clerkId}) as ${role}.`);
  console.log(`Test: https://nurse.sompacare.com/sign-in`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
