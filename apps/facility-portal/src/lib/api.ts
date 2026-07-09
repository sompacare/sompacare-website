export type Facility = {
  id: string;
  name: string;
  slug: string;
  type: string;
  rating?: number | null;
  locations: FacilityLocation[];
  organization?: { id: string; name: string };
};

export type FacilityLocation = {
  id: string;
  name: string;
  city: string;
  state: string;
  addressLine1: string;
  isPrimary?: boolean;
};

export type Shift = {
  id: string;
  title: string;
  description?: string | null;
  role: string;
  shiftType: string;
  status: string;
  hourlyRate: string | number;
  startTime: string;
  endTime: string;
  slotsTotal: number;
  slotsFilled: number;
  facility: { id: string; name: string };
  location: { id: string; city: string; state: string };
  _count?: { applications: number };
};

export type Application = {
  id: string;
  status: string;
  message?: string | null;
  matchScore?: number | null;
  createdAt: string;
  shift: Shift;
  applicant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
    profile?: {
      clinicalRole: string;
      complianceScore: number;
      reliabilityScore: number;
    } | null;
  };
};

export type Assignment = {
  id: string;
  status: string;
  shift: Shift;
  worker?: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

export type CreateShiftInput = {
  facilityId: string;
  locationId: string;
  title: string;
  description?: string;
  role: string;
  shiftType: string;
  hourlyRate: number;
  startTime: string;
  endTime: string;
  slotsTotal?: number;
  requirements?: string[];
};

type ListResponse<T> = {
  data: T[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {}
): Promise<T> {
  const { token, headers, ...rest } = options;
  const devFallback = process.env.NEXT_PUBLIC_FACILITY_PORTAL_DEV_TOKEN
    ? `dev_${process.env.NEXT_PUBLIC_FACILITY_PORTAL_DEV_TOKEN}`
    : null;
  const authToken = token ?? devFallback;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
  });

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = undefined;
    }
    throw new ApiError(`API ${res.status}: ${path}`, res.status, body);
  }

  return res.json() as Promise<T>;
}

export function createApiClient(getToken: () => Promise<string | null>) {
  async function withAuth<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await getToken();
    const devFallback =
      !token && process.env.NEXT_PUBLIC_FACILITY_PORTAL_DEV_TOKEN
        ? `dev_${process.env.NEXT_PUBLIC_FACILITY_PORTAL_DEV_TOKEN}`
        : null;
    const forceDev =
      process.env.NEXT_PUBLIC_FACILITY_PORTAL_FORCE_DEV_TOKEN === "true" &&
      process.env.NEXT_PUBLIC_FACILITY_PORTAL_DEV_TOKEN;
    const authToken = forceDev
      ? `dev_${process.env.NEXT_PUBLIC_FACILITY_PORTAL_DEV_TOKEN}`
      : token ?? devFallback;

    return apiFetch<T>(path, { ...init, token: authToken });
  }

  return {
    getMe: () => withAuth<{ data: unknown }>("/auth/me"),
    getFacilities: () => withAuth<ListResponse<Facility>>("/facilities?limit=20"),
    getFacility: (id: string) => withAuth<{ data: Facility }>(`/facilities/${id}`),
    getShifts: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return withAuth<ListResponse<Shift>>(`/shifts${qs}`);
    },
    getShift: (id: string) => withAuth<Shift>(`/shifts/${id}`),
    getShiftMatches: (id: string) =>
      withAuth<{
        shiftId: string;
        total: number;
        devBypass?: boolean;
        matches: Array<{
          worker: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            profile?: { clinicalRole: string; complianceScore: number; reliabilityScore: number };
          };
          score: number;
          highlights: string[];
          summary: string;
        }>;
      }>(`/shifts/${id}/matches`),
    createShift: (body: CreateShiftInput) =>
      withAuth<Shift>("/shifts", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    publishShift: (id: string) =>
      withAuth(`/shifts/${id}/publish`, { method: "POST" }),
    cancelShift: (id: string, reason?: string) =>
      withAuth(`/shifts/${id}`, {
        method: "DELETE",
        body: JSON.stringify({ reason }),
      }),
    getApplications: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return withAuth<ListResponse<Application>>(`/applications${qs}`);
    },
    approveApplication: (id: string) =>
      withAuth(`/applications/${id}/approve`, { method: "POST" }),
    rejectApplication: (id: string, reason: string) =>
      withAuth(`/applications/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    getAssignments: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return withAuth<ListResponse<Assignment>>(`/assignments${qs}`);
    },
    getTimecards: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return withAuth<ListResponse<Timecard>>(`/timecards${qs}`);
    },
    approveTimecard: (id: string) =>
      withAuth(`/timecards/${id}/approve`, { method: "PATCH" }),
    getInvoices: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return withAuth<ListResponse<Invoice>>(`/invoices${qs}`);
    },
    payInvoice: (id: string) =>
      withAuth<{ devPaid?: boolean }>(`/invoices/${id}/pay`, { method: "POST" }),
    getPayRuns: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return withAuth<ListResponse<PayRun>>(`/payroll/runs${qs}`);
    },
    generatePayRun: (body?: { periodStart?: string; periodEnd?: string }) =>
      withAuth<PayRun>(`/payroll/runs`, {
        method: "POST",
        body: JSON.stringify(body ?? {}),
      }),
    approvePayRun: (id: string) =>
      withAuth<PayRun>(`/payroll/runs/${id}/approve`, { method: "POST" }),
    processPayRun: (id: string) =>
      withAuth(`/payroll/runs/${id}/process`, { method: "POST" }),
    exportPayRun: async (id: string) => {
      const token = await getToken();
      const devFallback =
        !token && process.env.NEXT_PUBLIC_FACILITY_PORTAL_DEV_TOKEN
          ? `dev_${process.env.NEXT_PUBLIC_FACILITY_PORTAL_DEV_TOKEN}`
          : null;
      const res = await fetch(
        `${API_URL}/payroll/runs/${id}/export`,
        { headers: { Authorization: `Bearer ${token ?? devFallback}` } }
      );
      if (!res.ok) throw new ApiError(`Export failed`, res.status);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payrun-${id.slice(-8)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
    getWorkerCompliance: (userId: string) =>
      withAuth<{
        data: { isCompliant: boolean; score: number; blockedReasons: string[]; issues: unknown[] };
      }>(`/compliance/workers/${userId}`),
    getVerificationQueue: () =>
      withAuth<{
        licenses: VerificationLicense[];
        certifications: VerificationCertification[];
        total: number;
      }>(`/compliance/verification-queue`),
    verifyLicense: (id: string, action: "approve" | "reject", reason?: string) =>
      withAuth(`/compliance/licenses/${id}/verify`, {
        method: "PATCH",
        body: JSON.stringify({ action, reason }),
      }),
    verifyCertification: (id: string, action: "approve" | "reject", reason?: string) =>
      withAuth(`/compliance/certifications/${id}/verify`, {
        method: "PATCH",
        body: JSON.stringify({ action, reason }),
      }),
    scanExpirations: () =>
      withAuth<{ alertsCreated: number; expired: number; notified: number }>(
        `/compliance/scan-expirations`,
        { method: "POST" }
      ),
    getPayrollAnomalies: (facilityId?: string) => {
      const qs = facilityId ? `?facilityId=${facilityId}` : "";
      return withAuth<{
        total: number;
        devBypass?: boolean;
        anomalies: Array<{
          type: string;
          severity: string;
          message: string;
          workerName?: string;
        }>;
      }>(`/ai/payroll/anomalies${qs}`);
    },
    getNotifications: () =>
      withAuth<import("@/lib/notifications").AppNotification[]>("/notifications?limit=30"),
    getUnreadCount: () => withAuth<{ count: number }>("/notifications/unread-count"),
    markNotificationRead: (id: string) =>
      withAuth(`/notifications/${id}/read`, { method: "PATCH" }),
    markAllNotificationsRead: () =>
      withAuth("/notifications/read-all", { method: "POST" }),
  };
}

export type VerificationLicense = {
  id: string;
  type: string;
  number: string;
  state: string;
  status: string;
  expiresAt: string;
  user: { id: string; firstName: string; lastName: string; email: string };
};

export type VerificationCertification = {
  id: string;
  name: string;
  status: string;
  expiresAt?: string | null;
  user: { id: string; firstName: string; lastName: string; email: string };
};

export type PayRun = {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalGross: string | number;
  totalNet: string | number;
  totalDeductions: string | number;
  workerCount: number;
  _count?: { timecards: number };
  entries?: {
    id: string;
    workerId: string;
    regularHours: string | number;
    overtimeHours: string | number;
    grossPay: string | number;
    netPay: string | number;
  }[];
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  total: string | number;
  dueDate: string;
  facility?: { name: string };
  lineItems?: { description: string; amount: string | number }[];
};

export type Timecard = {
  id: string;
  status: string;
  regularHours: string | number;
  grossAmount: string | number;
  hourlyRate: string | number;
  worker: { firstName: string; lastName: string; email: string };
  assignment: {
    shift: { title: string; facility: { name: string } };
  };
};
