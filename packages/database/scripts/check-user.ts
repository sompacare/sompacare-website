import { PrismaClient } from "@prisma/client";
import { loadProductionEnv } from "./load-env";

loadProductionEnv();

async function main() {
const email = process.argv[2] ?? "mountainoflifeprayer@gmail.com";
const prisma = new PrismaClient();

const user = await prisma.user.findFirst({
  where: { email },
  include: {
    roles: { include: { role: true } },
    profile: true,
    licenses: true,
    certifications: true,
  },
});

if (!user) {
  console.log(`NOT_LINKED: no row for ${email}`);
  process.exit(1);
}

const roles = user.roles.map((r) => r.role.name);
console.log("LINKED: yes");
console.log("Email:", user.email);
console.log("Clerk ID:", user.clerkId);
console.log("Status:", user.status);
console.log("Roles:", roles.length ? roles.join(", ") : "(none)");
console.log("Worker profile:", user.profile?.clinicalRole ?? "missing");
console.log("Licenses:", user.licenses.length);
console.log("Certs:", user.certifications.length);

const ready =
  user.status === "ACTIVE" &&
  roles.includes("RN") &&
  Boolean(user.profile) &&
  user.licenses.length > 0;

console.log(ready ? "READY: yes" : "READY: no — run link-clerk-user.mjs");

await prisma.$disconnect();
}

main().catch((error) => {
  console.error("ERROR:", error.message);
  process.exit(1);
});
