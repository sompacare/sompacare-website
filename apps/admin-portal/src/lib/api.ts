export type DashboardKpis = {
  totalUsers: number;
  activeWorkers: number;
  totalFacilities: number;
  publishedShifts: number;
  fillRate: number;
  revenue30d: number;
  paidInvoices30d: number;
  payrollProcessed30d: number;
  payRuns30d: number;
  openTickets: number;
  pendingCompliance: number;
  placementsTotal: number;
};

export type DashboardResponse = {
  kpis: DashboardKpis;
  period: { days: number; from: string };
};

export type InsightsResponse = {
  topFacilities: Array<{
    id: string;
    name: string;
    rating: number | null;
    ratingCount: number;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    user: string;
    createdAt: string;
  }>;
  enabledFlags: number;
  urgentTickets: number;
  aiSummary: string;
  aiDevBypass?: boolean;
  pendingCompliance?: number;
  fillRate?: number;
};

export type UserRecord = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  createdAt: string;
  roles?: Array<{ role: { name: string; displayName: string } }>;
  profile?: { clinicalRole?: string } | null;
};

export type FacilityRecord = {
  id: string;
  name: string;
  slug: string;
  type: string;
  rating: number | null;
  ratingCount: number;
  isActive: boolean;
  isInternal?: boolean;
  locations?: Array<{
    id: string;
    name: string;
    city: string;
    state: string;
    addressLine1?: string;
    zipCode?: string;
    isPrimary?: boolean;
  }>;
};

export type ShiftRecord = {
  id: string;
  title: string;
  description?: string | null;
  role: string;
  shiftType: string;
  status: string;
  payRate?: string | number;
  billRate?: string | number;
  hourlyRate?: string | number;
  startTime: string;
  endTime: string;
  slotsTotal: number;
  slotsFilled: number;
  isEmergency?: boolean;
  facility: { id: string; name: string };
  location: {
    id: string;
    name: string;
    city: string;
    state: string;
    addressLine1?: string;
  };
  _count?: { applications: number };
};

export type SupportTicket = {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; firstName: string; lastName: string; email: string };
};

export type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  user?: { id: string; firstName: string; lastName: string; email: string } | null;
};

export type FeatureFlag = {
  id: string;
  key: string;
  description: string | null;
  isEnabled: boolean;
  updatedAt: string;
};

type ListResponse<T> = {
  data: T[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

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
  const devFallback = process.env.NEXT_PUBLIC_ADMIN_PORTAL_DEV_TOKEN
    ? `dev_${process.env.NEXT_PUBLIC_ADMIN_PORTAL_DEV_TOKEN}`
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
      !token && process.env.NEXT_PUBLIC_ADMIN_PORTAL_DEV_TOKEN
        ? `dev_${process.env.NEXT_PUBLIC_ADMIN_PORTAL_DEV_TOKEN}`
        : null;

    return apiFetch<T>(path, {
      ...init,
      token: token ?? devFallback,
    });
  }

  return {
    getDashboard: () => withAuth<DashboardResponse>("/admin/dashboard"),
    getInsights: () => withAuth<InsightsResponse>("/admin/insights"),
    getAuditLogs: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return withAuth<ListResponse<AuditLog>>(`/admin/audit-logs${qs}`);
    },
    getUsers: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return withAuth<ListResponse<UserRecord>>(`/users${qs}`);
    },
    updateUserStatus: (id: string, status: string) =>
      withAuth<{ data: UserRecord }>(`/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    getFacilities: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return withAuth<ListResponse<FacilityRecord>>(`/facilities${qs}`);
    },
    getSupportTickets: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return withAuth<ListResponse<SupportTicket>>(`/admin/support-tickets${qs}`);
    },
    updateSupportTicket: (id: string, body: { status?: string; priority?: string }) =>
      withAuth<SupportTicket>(`/admin/support-tickets/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    getFeatureFlags: () => withAuth<FeatureFlag[]>("/admin/feature-flags"),
    updateFeatureFlag: (key: string, body: { isEnabled: boolean }) =>
      withAuth<FeatureFlag>(`/admin/feature-flags/${key}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    getComplianceRisks: (userId: string) =>
      withAuth<{
        userId: string;
        score: number;
        isCompliant: boolean;
        total: number;
        devBypass?: boolean;
        risks: Array<{ type: string; severity: string; message: string }>;
      }>(`/ai/compliance/risks/${userId}`),
    getLegalConsentStatus: () =>
      withAuth<{ complete: boolean; missing: string[]; marketingUrl: string }>(
        "/legal/consent/status"
      ),
    recordLegalConsent: (body: { documentTypes: string[]; context: string }) =>
      withAuth(`/legal/consent`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    inviteFacilityManager: (body: {
      email: string;
      organizationName: string;
      facilityName: string;
      facilityType: string;
      location: {
        name: string;
        addressLine1: string;
        city: string;
        state: string;
        zipCode: string;
        latitude?: number;
        longitude?: number;
      };
    }) =>
      withAuth<{
        data: {
          onboardingUrl: string;
          clerkInvited: boolean;
        };
      }>("/facility-onboarding/admin/invite", {
        method: "POST",
        body: JSON.stringify(body),
      }).then((res) => res.data),
    listFacilityInvites: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return withAuth<{
        data: Array<{
          id: string;
          email: string;
          status: string;
          facility: { name: string };
          organization: { name: string };
        }>;
      }>(`/facility-onboarding/admin/invites${qs}`);
    },
    getInternalHomecareFacility: () =>
      withAuth<{ data: FacilityRecord }>("/facilities/internal/homecare"),
    getShifts: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return withAuth<ListResponse<ShiftRecord>>(`/shifts${qs}`);
    },
    createShift: (body: {
      facilityId: string;
      locationId?: string;
      location?: {
        name: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        zipCode: string;
        latitude?: number;
        longitude?: number;
      };
      title: string;
      description?: string;
      role: string;
      shiftType: string;
      payRate?: number;
      billRate?: number;
      startTime: string;
      endTime: string;
      slotsTotal?: number;
      requirements?: string[];
      isEmergency?: boolean;
    }) => withAuth<ShiftRecord>("/shifts", { method: "POST", body: JSON.stringify(body) }),
    publishShift: (id: string) =>
      withAuth<ShiftRecord>(`/shifts/${id}/publish`, { method: "POST" }),
    getRoleRates: () =>
      withAuth<{ data: Record<string, { payRate: number; billRate: number }> }>(
        "/platform/role-rates"
      ),
    updateRoleRates: (rates: Record<string, { payRate: number; billRate: number }>) =>
      withAuth<{ data: Record<string, { payRate: number; billRate: number }> }>(
        "/platform/role-rates",
        { method: "PATCH", body: JSON.stringify({ rates }) }
      ),
    getAssignments: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return withAuth<{
        data: Array<{
          id: string;
          status: string;
          worker: { id: string; firstName: string; lastName: string; email: string };
          shift: {
            id: string;
            title: string;
            role: string;
            startTime: string;
            endTime: string;
            payRate?: string | number;
            billRate?: string | number;
            facility: { id: string; name: string };
            location: { city: string; state: string; addressLine1?: string };
          };
          clockEvents?: Array<{ type: string; timestamp: string; isVerified: boolean }>;
        }>;
      }>(`/assignments${qs}`);
    },
    proxyClockIn: (assignmentId: string, note?: string) =>
      withAuth(`/assignments/${assignmentId}/proxy-clock-in`, {
        method: "POST",
        body: JSON.stringify({ note }),
      }),
    proxyClockOut: (assignmentId: string, note?: string) =>
      withAuth(`/assignments/${assignmentId}/proxy-clock-out`, {
        method: "POST",
        body: JSON.stringify({ note }),
      }),
    geocodeAddress: (body: {
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      zipCode: string;
    }) =>
      withAuth<{ latitude: number; longitude: number; formattedAddress: string }>(
        "/facility-onboarding/geocode-address",
        { method: "POST", body: JSON.stringify(body) }
      ),
    inviteWorkerByEmail: (body: { email: string; clinicalRole?: string }) =>
      withAuth<{
        data: {
          employeeNumber: string;
          signupUrl: string;
          signInUrl: string;
          clerkInvited: boolean;
          email: string;
          firstName: string;
          lastName: string;
          clinicalRole: string;
        };
      }>("/worker-onboarding/admin/invite", {
        method: "POST",
        body: JSON.stringify(body),
      }).then((res) => res.data),
    createWorkerEmployee: (body: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      clinicalRole: string;
      facilityId?: string;
      notes?: string;
      licenseNumber?: string;
      licenseState?: string;
      payRate?: string;
      startDate?: string;
    }) =>
      withAuth<{
        data: {
          employeeNumber: string;
          signupUrl: string;
          signInUrl: string;
          clerkInvited: boolean;
          email: string;
          firstName: string;
          lastName: string;
          clinicalRole: string;
        };
      }>("/worker-onboarding/admin/create", {
        method: "POST",
        body: JSON.stringify(body),
      }).then((res) => res.data),
  };
}
