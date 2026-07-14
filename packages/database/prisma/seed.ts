import { PrismaClient, PlatformRole, ClinicalRole, ShiftType, CandidatePipelineStage, JobPostingStatus } from "@prisma/client";
import { ROLE_PERMISSIONS, buildReferralCode } from "@sompacare/shared";

const prisma = new PrismaClient();

export async function seedRolesAndPermissions() {
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

  await prisma.user.update({
    where: { id: nurse.id },
    data: { referralCode: buildReferralCode("Sarah", "Johnson", nurse.id) },
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

  const recruiter = await prisma.user.upsert({
    where: { clerkId: "dev_recruiter" },
    update: {},
    create: {
      clerkId: "dev_recruiter",
      email: "recruiter@sompacare.com",
      firstName: "Jordan",
      lastName: "Williams",
      status: "ACTIVE",
      emailVerified: true,
    },
  });

  const adminRole = await prisma.role.findUnique({ where: { name: PlatformRole.SUPER_ADMIN } });
  const rnRole = await prisma.role.findUnique({ where: { name: PlatformRole.RN } });
  const fmRole = await prisma.role.findUnique({ where: { name: PlatformRole.FACILITY_MANAGER } });
  const recruiterRole = await prisma.role.findUnique({ where: { name: PlatformRole.RECRUITER } });

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

  if (recruiterRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: recruiter.id, roleId: recruiterRole.id } },
      update: {},
      create: { userId: recruiter.id, roleId: recruiterRole.id },
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
        payRate: 45,
        billRate: 56.25,
        hourlyRate: 45,
        startTime: new Date(Date.now() + 86400000 * 2),
        endTime: new Date(Date.now() + 86400000 * 2 + 43200000),
        requirements: ["Active RN License", "BLS Certification", "2+ years Med-Surg"],
        publishedAt: new Date(),
      },
    });
  }

  if (recruiterRole && facility) {
    const seedCandidates = [
      { firstName: "Maria", lastName: "Garcia", email: "maria.garcia@example.com", clinicalRole: ClinicalRole.CNA, stage: CandidatePipelineStage.APPLIED, matchScore: 72 },
      { firstName: "James", lastName: "Wilson", email: "james.wilson@example.com", clinicalRole: ClinicalRole.LPN, stage: CandidatePipelineStage.SCREENING, matchScore: 81 },
      { firstName: "Emily", lastName: "Davis", email: "emily.davis@example.com", clinicalRole: ClinicalRole.RN, stage: CandidatePipelineStage.INTERVIEW, matchScore: 88 },
      { firstName: "David", lastName: "Brown", email: "david.brown@example.com", clinicalRole: ClinicalRole.RN, stage: CandidatePipelineStage.OFFER, matchScore: 92 },
      { firstName: "Lisa", lastName: "Taylor", email: "lisa.taylor@example.com", clinicalRole: ClinicalRole.CNA, stage: CandidatePipelineStage.PLACED, matchScore: 95, placedAt: new Date() },
      { firstName: "Patricia", lastName: "Moore", email: "patricia.moore@example.com", clinicalRole: ClinicalRole.GNA, stage: CandidatePipelineStage.SCREENING, matchScore: 78 },
      { firstName: "Robert", lastName: "Lee", email: "robert.lee@example.com", clinicalRole: ClinicalRole.CMA, stage: CandidatePipelineStage.APPLIED, matchScore: 74 },
      { firstName: "Angela", lastName: "White", email: "angela.white@example.com", clinicalRole: ClinicalRole.MED_TECH, stage: CandidatePipelineStage.INTERVIEW, matchScore: 86 },
    ];

    for (const c of seedCandidates) {
      await prisma.candidate.upsert({
        where: { id: `seed-candidate-${c.email}` },
        update: { stage: c.stage, matchScore: c.matchScore },
        create: {
          id: `seed-candidate-${c.email}`,
          recruiterId: recruiter.id,
          facilityId: c.stage === CandidatePipelineStage.PLACED ? facility.id : undefined,
          firstName: c.firstName,
          lastName: c.lastName,
          email: c.email,
          clinicalRole: c.clinicalRole,
          stage: c.stage,
          matchScore: c.matchScore,
          source: "Careers page",
          placedAt: c.placedAt,
        },
      });
    }
  }

  const publishedShift = await prisma.shift.findFirst({
    where: { facilityId: facility.id, title: "RN — Med-Surg Per Diem" },
  });

  const featureFlags = [
    { key: "ai_matching", description: "AI-powered shift matching", isEnabled: true },
    { key: "instant_pay", description: "Instant pay for workers", isEnabled: true },
    { key: "recruiter_portal", description: "Recruiter pipeline portal", isEnabled: true },
    { key: "background_check_auto", description: "Auto-trigger Checkr on offer", isEnabled: true },
  ];

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: { description: flag.description, isEnabled: flag.isEnabled },
      create: flag,
    });
  }

  await prisma.supportTicket.upsert({
    where: { id: "seed-ticket-urgent" },
    update: {},
    create: {
      id: "seed-ticket-urgent",
      userId: nurse.id,
      subject: "Payroll discrepancy on last shift",
      description: "My wallet shows $0 for the shift on Tuesday but timecard was approved.",
      status: "OPEN",
      priority: "URGENT",
    },
  });

  await prisma.supportTicket.upsert({
    where: { id: "seed-ticket-normal" },
    update: {},
    create: {
      id: "seed-ticket-normal",
      userId: facilityManager.id,
      subject: "Need help publishing bulk shifts",
      description: "Is there a bulk import for shift schedules?",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
    },
  });

  const auditEntries = [
    { id: "seed-audit-login", userId: admin.id, action: "USER_LOGIN", entityType: "User", entityId: admin.id },
    {
      id: "seed-audit-shift",
      userId: facilityManager.id,
      action: "SHIFT_PUBLISHED",
      entityType: "Shift",
      entityId: publishedShift?.id,
    },
    {
      id: "seed-audit-flag",
      userId: admin.id,
      action: "FEATURE_FLAG_UPDATED",
      entityType: "FeatureFlag",
      entityId: "ai_matching",
    },
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.upsert({
      where: { id: entry.id },
      update: {},
      create: entry,
    });
  }

  const defaultPostings = [
    { slug: "cna", title: "Certified Nursing Assistant (CNA)", category: "Clinical", employment: "Per Diem · Part-Time · Full-Time", locations: "Nursing homes, assisted living, hospitals — Nationwide", description: "Provide hands-on bedside care, vital signs, and daily living support under the supervision of licensed nurses in long-term care and acute settings.", requirements: ["Active CNA certification in your state", "CPR/BLS certification", "Reliable attendance and compassionate bedside manner"], clinicalRole: ClinicalRole.CNA },
    { slug: "gna", title: "Geriatric Nursing Assistant (GNA)", category: "Clinical", employment: "Per Diem · Part-Time · Full-Time", locations: "Skilled nursing and geriatric care facilities — Nationwide", description: "Support elderly residents with activities of daily living, mobility, and comfort in skilled nursing and geriatric care environments.", requirements: ["Active GNA certification (Maryland) or equivalent state credential", "CPR/BLS certification", "Experience in geriatric or long-term care preferred"], clinicalRole: ClinicalRole.GNA },
    { slug: "cma", title: "Certified Medical Assistant (CMA)", category: "Allied Health", employment: "Part-Time · Full-Time · Contract", locations: "Clinics, physician offices, outpatient centers — Nationwide", description: "Assist providers with patient intake, vitals, rooming, and clinical support in outpatient and ambulatory care settings.", requirements: ["CMA certification or equivalent medical assistant credential", "BLS certification", "EHR and patient intake experience"], clinicalRole: ClinicalRole.CMA },
    { slug: "med-tech", title: "Medication Technician (Med Tech)", category: "Clinical", employment: "Per Diem · Part-Time · Full-Time", locations: "Assisted living, skilled nursing — Nationwide", description: "Administer medications and document treatments according to facility protocols under appropriate nursing oversight.", requirements: ["Active Med Tech certification for your state", "CPR/BLS certification", "Medication administration competency and attention to detail"], clinicalRole: ClinicalRole.MED_TECH },
    { slug: "lpn", title: "Licensed Practical Nurse (LPN)", category: "Clinical", employment: "Per Diem · Contract · Full-Time", locations: "Skilled nursing, rehab, clinics — Nationwide", description: "Deliver skilled nursing care including medication administration, wound care, and patient assessments in facility and clinic settings.", requirements: ["Active, unencumbered LPN/LVN license", "BLS certification", "Minimum 6 months of clinical experience"], clinicalRole: ClinicalRole.LPN },
    { slug: "rn", title: "Registered Nurse (RN)", category: "Clinical", employment: "Per Diem · Contract · Travel · Full-Time", locations: "Hospitals, acute care, specialty units — Nationwide", description: "Provide comprehensive nursing care across hospital units, specialty departments, and critical care environments with full clinical autonomy.", requirements: ["Active, unencumbered RN license", "BLS certification (ACLS preferred for specialty units)", "Minimum 1 year of acute or specialty nursing experience"], clinicalRole: ClinicalRole.RN },
  ];

  for (const posting of defaultPostings) {
    await prisma.jobPosting.upsert({
      where: { slug: posting.slug },
      update: {
        title: posting.title,
        category: posting.category,
        employment: posting.employment,
        locations: posting.locations,
        description: posting.description,
        requirements: posting.requirements,
        clinicalRole: posting.clinicalRole,
        status: JobPostingStatus.PUBLISHED,
        publishedAt: new Date(),
        createdById: recruiter.id,
      },
      create: {
        ...posting,
        status: JobPostingStatus.PUBLISHED,
        publishedAt: new Date(),
        createdById: recruiter.id,
      },
    });
  }

  console.log("Seed complete:");
  console.log("  Admin token:     Bearer dev_dev_admin");
  console.log("  Nurse token:     Bearer dev_dev_nurse_rn");
  console.log("  Facility token:  Bearer dev_dev_facility_mgr");
  console.log("  Recruiter token: Bearer dev_dev_recruiter");
}

async function main() {
  console.log("Seeding Sompacare platform database...");
  await seedRolesAndPermissions();
  if (process.env.SEED_DEMO_DATA !== "false") {
    await seedDemoData();
  } else {
    console.log("Skipped demo data (SEED_DEMO_DATA=false).");
  }
}

const isSeedEntrypoint = process.argv[1]?.replace(/\\/g, "/").endsWith("/prisma/seed.ts");

if (isSeedEntrypoint) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
