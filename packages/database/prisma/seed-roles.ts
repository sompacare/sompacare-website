import { PrismaClient } from "@prisma/client";
import { seedRolesAndPermissions } from "./seed";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding platform roles and permissions...");
  await seedRolesAndPermissions();
  console.log("Role seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
