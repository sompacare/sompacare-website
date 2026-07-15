import { ADMIN_ROLES, FACILITY_ROLES, PlatformRole, WORKER_ROLES } from "../rbac/permissions";

export type ShiftRateFields = {
  payRate?: unknown;
  billRate?: unknown;
  hourlyRate?: unknown;
};

function isWorkerViewer(roles: PlatformRole[]) {
  return roles.some((r) => WORKER_ROLES.includes(r));
}

function isFacilityViewer(roles: PlatformRole[]) {
  return roles.some((r) => FACILITY_ROLES.includes(r));
}

function isAdminViewer(roles: PlatformRole[]) {
  return roles.some((r) => ADMIN_ROLES.includes(r));
}

/** Hide bill rate from clinicians; hide pay rate from facilities. Admins see both. */
export function sanitizeShiftRatesForRoles<T extends ShiftRateFields>(
  shift: T,
  roles: PlatformRole[]
): T {
  if (isAdminViewer(roles)) {
    return shift;
  }

  if (isWorkerViewer(roles) && !isFacilityViewer(roles)) {
    const pay = Number(shift.payRate ?? shift.hourlyRate ?? 0);
    const { billRate: _bill, payRate: _pay, hourlyRate: _hourly, ...rest } = shift as T &
      Record<string, unknown>;
    return { ...rest, payRate: pay, hourlyRate: pay } as T;
  }

  if (isFacilityViewer(roles)) {
    const { payRate: _pay, hourlyRate: _hourly, ...rest } = shift as T & Record<string, unknown>;
    return rest as T;
  }

  return shift;
}
