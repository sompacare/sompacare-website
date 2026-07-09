import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const app = await prisma.shiftApplication.findFirst({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: {
      applicant: { select: { email: true, firstName: true } },
      shift: { select: { title: true } },
    },
  });

  if (!app) {
    console.log("No pending applications found.");
    return;
  }

  console.log(JSON.stringify({ id: app.id, applicant: app.applicant.email, shift: app.shift.title }));
}

main()
  .finally(() => prisma.$disconnect());
