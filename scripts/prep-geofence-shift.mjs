/**
 * Align a CONFIRMED nurse assignment shift to "now" for geofence clock-in tests.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const NURSE_CLERK_ID = process.env.NURSE_CLERK_ID ?? "dev_nurse_rn";

async function main() {
  const nurse = await prisma.user.findFirst({
    where: { clerkId: NURSE_CLERK_ID },
  });
  if (!nurse) throw new Error("Nurse user not found — run db:seed");

  let assignment = await prisma.shiftAssignment.findFirst({
    where: { workerId: nurse.id, status: "CONFIRMED" },
    include: { shift: true },
    orderBy: { createdAt: "desc" },
  });

  if (!assignment) {
    assignment = await prisma.shiftAssignment.findFirst({
      where: { workerId: nurse.id, status: { in: ["COMPLETED", "CHECKED_IN", "IN_PROGRESS"] } },
      include: { shift: true },
      orderBy: { updatedAt: "desc" },
    });
    if (assignment) {
      await prisma.shiftAssignment.update({
        where: { id: assignment.id },
        data: { status: "CONFIRMED" },
      });
      await prisma.clockEvent.deleteMany({ where: { assignmentId: assignment.id } });
      await prisma.timecard.deleteMany({ where: { assignmentId: assignment.id } });
      console.log(`Reset assignment ${assignment.id} to CONFIRMED`);
    }
  }

  if (!assignment) throw new Error("No assignment for nurse — claim a shift first");

  const start = new Date(Date.now() - 20 * 60 * 1000);
  const end = new Date(Date.now() + 8 * 60 * 60 * 1000);

  await prisma.shift.update({
    where: { id: assignment.shiftId },
    data: { startTime: start, endTime: end, status: "PUBLISHED" },
  });

  console.log(`Shift ${assignment.shiftId} window: ${start.toISOString()} → ${end.toISOString()}`);
  console.log(`Assignment ${assignment.id} ready for geofence clock-in`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
