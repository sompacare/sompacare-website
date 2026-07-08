import { PrismaClient, PlatformRole, ClinicalRole, ShiftType } from "@prisma/client";
import { ROLE_PERMISSIONS } from "@sompacare/shared";

const prisma = new PrismaClient();

async function seedRolesAndPermissions() {
  for (const [roleName, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    const role = await prisma.role.upsert({
      where: { name: roleName as PlatformRole },
      update: { displayName: roleName.replace(/_/g, " ") },
      create: {
        name: roleName as PlatformRole,
        displayName: roleName.replace(/_/g, " "),
        description: `${roleName} platform role`,
      },
    });

    for (const permKey of permissions) {
      const [module] = permKey.split(":");
      const permission = await prisma.permission.upsert({
        where: { key: permKey },
        update: {},
        create: { key: permKey, module, description: permKey },
      });

      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }
}

async function seedDemoData() {
  const admin = await prisma.user.upsert({
    where: { clerkId: "dev_admin" },
    update: {},
    create: {
      clerkId: "dev_admin",
      email: "admin@sompacare.com",
      firstName: "Platform",
      lastName: "Admin",
      status: "ACTIVE",
      emailVerified: true,
    },
  });

  const nurse = await prisma.user.upsert({
    where: { clerkId: "dev_nurse_rn" },
    update: {},
    create: {
      clerkId: "dev_nurse_rn",
      email: "nurse@sompacare.com",
      firstName: "Sarah",
      lastName: "Johnson",
      status: "ACTIVE",
      emailVerified: true,
    },
  });

  const facilityManager = await prisma.user.upsert({
    where: { clerkId: "dev_facility_mgr" },
    update: {},
    create: {
      clerkId: "dev_facility_mgr",
      email: "facility@sompacare.com",
      firstName: "Michael",
      lastName: "Chen",
      status: "ACTIVE",
      emailVerified: true,
    },
  });

  const adminRole = await prisma.role.findUnique({ where: { name: PlatformRole.SUPER_ADMIN } });
  const rnRole = await prisma.role.findUnique({ where: { name: PlatformRole.RN } });
  const fmRole = await prisma.role.findUnique({ where: { name: PlatformRole.FACILITY_MANAGER } });

  if (adminRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
      update: {},
      create: { userId: admin.id, roleId: adminRole.id },
    });
  }

  if (rnRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: nurse.id, roleId: rnRole.id } },
      update: {},
      create: { userId: nurse.id, roleId: rnRole.id },
    });

    await prisma.workerProfile.upsert({
      where: { userId: nurse.id },
      update: {},
      create: {
        userId: nurse.id,
        clinicalRole: ClinicalRole.RN,
        specialties: ["ICU", "Medical-Surgical"],
        preferredShiftTypes: [ShiftType.PER_DIEM, ShiftType.CONTRACT],
        minHourlyRate: 45,
        complianceScore: 98,
        reliabilityScore: 96,
      },
    });

    await prisma.wallet.upsert({
      where: { userId: nurse.id },
      update: {},
      create: { userId: nurse.id, balance: 0 },
    });

    const licenseExpiry = new Date(Date.now() + 86400000 * 365);
    await prisma.license.upsert({
      where: { id: "seed-license-nurse-rn" },
      update: {},
      create: {
        id: "seed-license-nurse-rn",
        userId: nurse.id,
        type: "RN",
        number: "RN-MD-123456",
        state: "MD",
        status: "ACTIVE",
        expiresAt: licenseExpiry,
        verifiedAt: new Date(),
      },
    });

    await prisma.certification.upsert({
      where: { id: "seed-cert-nurse-bls" },
      update: {},
      create: {
        id: "seed-cert-nurse-bls",
        userId: nurse.id,
        name: "BLS/CPR",
        issuer: "American Heart Association",
        status: "VERIFIED",
        expiresAt: licenseExpiry,
        issuedAt: new Date(),
      },
    });

    await prisma.backgroundCheck.upsert({
      where: { id: "seed-bg-nurse" },
      update: {},
      create: {
        id: "seed-bg-nurse",
        userId: nurse.id,
        provider: "checkr",
        status: "VERIFIED",
        completedAt: new Date(),
      },
    });
  }

  if (fmRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: facilityManager.id, roleId: fmRole.id } },
      update: {},
      create: { userId: facilityManager.id, roleId: fmRole.id },
    });
  }

  const org = await prisma.organization.upsert({
    where: { slug: "fox-chase-healthcare" },
    update: {},
    create: {
      name: "Fox Chase Health Care",
      slug: "fox-chase-healthcare",
      type: "healthcare_system",
      email: "contact@foxchasehealth.example",
      phone: "(240) 676-1208",
    },
  });

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: facilityManager.id } },
    update: {},
    create: {
      organizationId: org.id,
      userId: facilityManager.id,
      title: "Director of Nursing",
      isPrimary: true,
    },
  });

  const facility = await prisma.facility.upsert({
    where: { slug: "fox-chase-skilled-nursing" },
    update: {},
    create: {
      organizationId: org.id,
      name: "Fox Chase Skilled Nursing",
      slug: "fox-chase-skilled-nursing",
      type: "skilled_nursing",
      rating: 4.7,
      ratingCount: 128,
    },
  });

  const location = await prisma.facilityLocation.upsert({
    where: { id: "seed-location-fox-chase" },
    update: {},
    create: {
      id: "seed-location-fox-chase",
      facilityId: facility.id,
      name: "Main Campus",
      addressLine1: "123 Healthcare Blvd",
      city: "Baltimore",
      state: "MD",
      zipCode: "21201",
      latitude: 39.2904,
      longitude: -76.6122,
      isPrimary: true,
    },
  });

  const existingShift = await prisma.shift.findFirst({
    where: { facilityId: facility.id, title: "RN — Med-Surg Per Diem" },
  });

  if (!existingShift) {
    await prisma.shift.create({
      data: {
        facilityId: facility.id,
        locationId: location.id,
        createdById: facilityManager.id,
        title: "RN — Med-Surg Per Diem",
        description: "Experienced RN needed for medical-surgical unit. BLS required.",
        role: ClinicalRole.RN,
        shiftType: ShiftType.PER_DIEM,
        status: "PUBLISHED",
        hourlyRate: 52,
        startTime: new Date(Date.now() + 86400000 * 2),
        endTime: new Date(Date.now() + 86400000 * 2 + 43200000),
        requirements: ["Active RN License", "BLS Certification", "2+ years Med-Surg"],
        publishedAt: new Date(),
      },
    });
  }

  console.log("Seed complete:");
  console.log("  Admin token:     Bearer dev_dev_admin");
  console.log("  Nurse token:     Bearer dev_dev_nurse_rn");
  console.log("  Facility token:  Bearer dev_dev_facility_mgr");
}

async function main() {
  console.log("Seeding Sompacare platform database...");
  await seedRolesAndPermissions();
  await seedDemoData();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
