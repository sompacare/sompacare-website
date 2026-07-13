export enum PlatformRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  RECRUITER = "RECRUITER",
  FACILITY_MANAGER = "FACILITY_MANAGER",
  FACILITY_STAFF = "FACILITY_STAFF",
  NURSE = "NURSE",
  CNA = "CNA",
  LPN = "LPN",
  RN = "RN",
  GNA = "GNA",
  CMA = "CMA",
  MED_TECH = "MED_TECH",
  PAYROLL = "PAYROLL",
  COMPLIANCE_OFFICER = "COMPLIANCE_OFFICER",
  CUSTOMER_SUPPORT = "CUSTOMER_SUPPORT",
  FINANCE = "FINANCE",
}

export const WORKER_ROLES: PlatformRole[] = [
  PlatformRole.NURSE,
  PlatformRole.CNA,
  PlatformRole.LPN,
  PlatformRole.RN,
  PlatformRole.GNA,
  PlatformRole.CMA,
  PlatformRole.MED_TECH,
];

const WORKER_CLINICAL_PERMISSIONS: PermissionKey[] = [
  "shifts:read",
  "applications:read", "applications:write",
  "assignments:read", "assignments:confirm",
  "timecards:read",
  "wallet:read", "wallet:instant_pay",
  "notifications:read",
  "messages:read", "messages:write",
  "ratings:read", "ratings:write",
  "compliance:read", "compliance:write",
];

export const FACILITY_ROLES: PlatformRole[] = [
  PlatformRole.FACILITY_MANAGER,
  PlatformRole.FACILITY_STAFF,
];

export const ADMIN_ROLES: PlatformRole[] = [
  PlatformRole.SUPER_ADMIN,
  PlatformRole.ADMIN,
  PlatformRole.PAYROLL,
  PlatformRole.COMPLIANCE_OFFICER,
  PlatformRole.CUSTOMER_SUPPORT,
  PlatformRole.FINANCE,
];

export type PermissionKey =
  | "users:read"
  | "users:write"
  | "users:delete"
  | "organizations:read"
  | "organizations:write"
  | "facilities:read"
  | "facilities:write"
  | "shifts:read"
  | "shifts:write"
  | "shifts:delete"
  | "shifts:publish"
  | "applications:read"
  | "applications:write"
  | "assignments:read"
  | "assignments:write"
  | "assignments:confirm"
  | "timecards:read"
  | "timecards:approve"
  | "payroll:read"
  | "payroll:write"
  | "payroll:approve"
  | "payroll:process"
  | "compliance:read"
  | "compliance:write"
  | "compliance:verify"
  | "invoices:read"
  | "invoices:write"
  | "payments:read"
  | "payments:write"
  | "wallet:read"
  | "wallet:instant_pay"
  | "notifications:read"
  | "notifications:write"
  | "messages:read"
  | "messages:write"
  | "ratings:read"
  | "ratings:write"
  | "admin:dashboard"
  | "admin:audit_logs"
  | "admin:feature_flags"
  | "admin:analytics"
  | "support:read"
  | "support:write"
  | "recruiter:pipeline"
  | "recruiter:placements";

export const ALL_PERMISSIONS: PermissionKey[] = [
  "users:read", "users:write", "users:delete",
  "organizations:read", "organizations:write",
  "facilities:read", "facilities:write",
  "shifts:read", "shifts:write", "shifts:delete", "shifts:publish",
  "applications:read", "applications:write",
  "assignments:read", "assignments:write", "assignments:confirm",
  "timecards:read", "timecards:approve",
  "payroll:read", "payroll:write", "payroll:approve", "payroll:process",
  "compliance:read", "compliance:write", "compliance:verify",
  "invoices:read", "invoices:write",
  "payments:read", "payments:write",
  "wallet:read", "wallet:instant_pay",
  "notifications:read", "notifications:write",
  "messages:read", "messages:write",
  "ratings:read", "ratings:write",
  "admin:dashboard", "admin:audit_logs", "admin:feature_flags", "admin:analytics",
  "support:read", "support:write",
  "recruiter:pipeline", "recruiter:placements",
];

export const ROLE_PERMISSIONS: Record<PlatformRole, PermissionKey[]> = {
  [PlatformRole.SUPER_ADMIN]: ALL_PERMISSIONS,

  [PlatformRole.ADMIN]: ALL_PERMISSIONS.filter(
    (p) => p !== "admin:feature_flags"
  ),

  [PlatformRole.RECRUITER]: [
    "users:read", "users:write",
    "applications:read", "applications:write",
    "compliance:read",
    "notifications:read", "notifications:write",
    "messages:read", "messages:write",
    "recruiter:pipeline", "recruiter:placements",
  ],

  [PlatformRole.FACILITY_MANAGER]: [
    "facilities:read", "facilities:write",
    "shifts:read", "shifts:write", "shifts:delete", "shifts:publish",
    "applications:read", "applications:write",
    "assignments:read", "assignments:write",
    "timecards:read", "timecards:approve",
    "invoices:read", "payments:write",
    "payroll:read", "payroll:write", "payroll:approve", "payroll:process",
    "notifications:read", "notifications:write",
    "messages:read", "messages:write",
    "ratings:read", "ratings:write",
  ],

  [PlatformRole.FACILITY_STAFF]: [
    "facilities:read",
    "shifts:read", "shifts:write",
    "applications:read", "applications:write",
    "assignments:read",
    "timecards:read", "timecards:approve",
    "notifications:read",
    "messages:read", "messages:write",
  ],

  [PlatformRole.NURSE]: WORKER_CLINICAL_PERMISSIONS,
  [PlatformRole.CNA]: WORKER_CLINICAL_PERMISSIONS,
  [PlatformRole.LPN]: WORKER_CLINICAL_PERMISSIONS,
  [PlatformRole.RN]: WORKER_CLINICAL_PERMISSIONS,
  [PlatformRole.GNA]: WORKER_CLINICAL_PERMISSIONS,
  [PlatformRole.CMA]: WORKER_CLINICAL_PERMISSIONS,
  [PlatformRole.MED_TECH]: WORKER_CLINICAL_PERMISSIONS,

  [PlatformRole.PAYROLL]: [
    "payroll:read", "payroll:write", "payroll:approve", "payroll:process",
    "timecards:read",
    "users:read",
    "admin:dashboard",
    "notifications:read",
  ],

  [PlatformRole.COMPLIANCE_OFFICER]: [
    "compliance:read", "compliance:write", "compliance:verify",
    "users:read",
    "admin:dashboard", "admin:audit_logs",
    "notifications:read", "notifications:write",
  ],

  [PlatformRole.CUSTOMER_SUPPORT]: [
    "users:read",
    "support:read", "support:write",
    "notifications:read", "notifications:write",
    "messages:read", "messages:write",
  ],

  [PlatformRole.FINANCE]: [
    "invoices:read", "invoices:write",
    "payments:read", "payments:write",
    "payroll:read",
    "admin:dashboard", "admin:analytics",
  ],
};

export function getPermissionsForRoles(roles: PlatformRole[]): PermissionKey[] {
  const permissions = new Set<PermissionKey>();
  for (const role of roles) {
    for (const permission of ROLE_PERMISSIONS[role] ?? []) {
      permissions.add(permission);
    }
  }
  return Array.from(permissions);
}

export function hasPermission(
  userRoles: PlatformRole[],
  required: PermissionKey | PermissionKey[]
): boolean {
  if (userRoles.includes(PlatformRole.SUPER_ADMIN)) {
    return true;
  }
  const userPermissions = getPermissionsForRoles(userRoles);
  const requiredList = Array.isArray(required) ? required : [required];
  return requiredList.every((p) => userPermissions.includes(p));
}

export function hasAnyPermission(
  userRoles: PlatformRole[],
  required: PermissionKey[]
): boolean {
  if (userRoles.includes(PlatformRole.SUPER_ADMIN)) {
    return true;
  }
  const userPermissions = getPermissionsForRoles(userRoles);
  return required.some((p) => userPermissions.includes(p));
}
