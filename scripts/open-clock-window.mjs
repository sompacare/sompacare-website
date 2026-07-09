/**
 * Open the clock-in window for a nurse's confirmed assignment (local testing).
 * - Moves shift start/end to surround "now"
 * - Resets assignment clock state so clock-in can run again
 * - Clears fake Stripe IDs (acct_dev_*, cus_dev_*) so live Stripe tests work
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const NURSE_CLERK_ID = process.env.NURSE_CLERK_ID ?? "dev_nurse_rn";
const SHIFT_HOURS = Number(process.env.SHIFT_HOURS ?? 8);

async function main() {
  const nurse = await prisma.user.findFirst({
    where: { clerkId: NURSE_CLERK_ID },
    include: { profile: true },
  });
  if (!nurse) throw new Error(`Nurse not found (clerkId=${NURSE_CLERK_ID})`);

  let assignment = await prisma.shiftAssignment.findFirst({
    where: {
      workerId: nurse.id,
      status: { in: ["CONFIRMED", "COMPLETED", "CHECKED_IN", "IN_PROGRESS"] },
    },
    include: { shift: { include: { location: true } }, clockEvents: true, timecard: true },
    orderBy: { updatedAt: "desc" },
  });

  if (!assignment) {
    let shift = await prisma.shift.findFirst({
      where: { status: "PUBLISHED" },
      orderBy: { startTime: "asc" },
    });

    if (!shift) {
      shift = await prisma.shift.findFirst({
        orderBy: { updatedAt: "desc" },
        include: { location: true },
      });
      if (!shift) throw new Error("No shifts in database — run db seed first");

      const startTime = new Date(Date.now() - 5 * 60_000);
      const endTime = new Date(Date.now() + SHIFT_HOURS * 3_600_000);
      shift = await prisma.shift.update({
        where: { id: shift.id },
        data: { status: "PUBLISHED", startTime, endTime, publishedAt: new Date() },
      });
      console.log(`Re-published shift "${shift.title}" for testing`);
    }

    let application = await prisma.shiftApplication.findUnique({
      where: { shiftId_applicantId: { shiftId: shift.id, applicantId: nurse.id } },
      include: { assignment: true },
    });

    if (application?.assignment) {
      assignment = await prisma.shiftAssignment.findUniqueOrThrow({
        where: { id: application.assignment.id },
        include: { shift: { include: { location: true } }, clockEvents: true, timecard: true },
      });
      console.log(`Reusing assignment ${assignment.id} (was ${assignment.status})`);
    } else {
      if (!application) {
        application = await prisma.shiftApplication.create({
          data: {
            shiftId: shift.id,
            applicantId: nurse.id,
            status: "APPROVED",
            message: "open-clock-window prep",
            reviewedAt: new Date(),
          },
        });
      } else if (application.status !== "APPROVED") {
        application = await prisma.shiftApplication.update({
          where: { id: application.id },
          data: { status: "APPROVED", reviewedAt: new Date() },
        });
      }

      assignment = await prisma.shiftAssignment.create({
        data: {
          shiftId: shift.id,
          applicationId: application.id,
          workerId: nurse.id,
          status: "CONFIRMED",
          confirmedAt: new Date(),
        },
        include: { shift: { include: { location: true } }, clockEvents: true, timecard: true },
      });
      console.log(`Created CONFIRMED assignment ${assignment.id} on shift "${shift.title}"`);
    }
  }

  const now = Date.now();
  const startTime = new Date(now - 5 * 60_000);
  const endTime = new Date(now + SHIFT_HOURS * 3_600_000);

  await prisma.shift.update({
    where: { id: assignment.shiftId },
    data: { startTime, endTime, status: "PUBLISHED" },
  });

  if (assignment.clockEvents.length) {
    await prisma.clockEvent.deleteMany({ where: { assignmentId: assignment.id } });
  }
  if (assignment.timecard) {
    await prisma.timecard.delete({ where: { assignmentId: assignment.id } });
  }
  await prisma.shiftAssignment.update({
    where: { id: assignment.id },
    data: { status: "CONFIRMED" },
  });

  if (nurse.profile?.stripeAccountId?.startsWith("acct_dev_")) {
    await prisma.workerProfile.update({
      where: { userId: nurse.id },
      data: {
        stripeAccountId: null,
        stripeOnboarded: false,
        instantPayEnabled: false,
      },
    });
    console.log("Cleared fake nurse Stripe Connect account (acct_dev_*)");
  } else if (nurse.profile?.stripeAccountId && !nurse.profile.stripeOnboarded) {
    await prisma.workerProfile.update({
      where: { userId: nurse.id },
      data: { stripeAccountId: null },
    });
    console.log("Cleared incomplete nurse Stripe account (onboarding not finished)");
  }

  const facilities = await prisma.facility.findMany({
    where: { stripeCustomerId: { startsWith: "cus_dev_" } },
    select: { id: true, name: true, stripeCustomerId: true },
  });
  for (const f of facilities) {
    await prisma.facility.update({
      where: { id: f.id },
      data: { stripeCustomerId: null },
    });
    console.log(`Cleared fake facility customer for ${f.name}`);
  }

  const loc = assignment.shift.location;
  console.log("\nClock window opened:");
  console.log(`  assignment: ${assignment.id}`);
  console.log(`  shift:      ${assignment.shift.title}`);
  console.log(`  window:     ${startTime.toISOString()} → ${endTime.toISOString()}`);
  if (loc?.latitude && loc?.longitude) {
    console.log(`  geofence:   ${loc.latitude}, ${loc.longitude} (${loc.geofenceRadiusMeters ?? 150}m)`);
  } else {
    console.log("  WARNING: shift location missing GPS coordinates");
  }
}

main()
  .catch((e) => {
    console.error(e.message ?? e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
