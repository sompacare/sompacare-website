export type Shift = {
  id: string;
  title: string;
  description?: string | null;
  role: string;
  shiftType: string;
  status: string;
  hourlyRate: string | number;
  bonusRate?: string | number | null;
  startTime: string;
  endTime: string;
  slotsTotal: number;
  slotsFilled: number;
  requirements: string[];
  isEmergency?: boolean;
  facility: { id: string; name: string; rating?: number | null };
  location: {
    id: string;
    city: string;
    state: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  _count?: { applications: number };
  matchScore?: number;
};

export type Assignment = {
  id: string;
  status: string;
  confirmedAt?: string | null;
  shift: Shift;
};

export type WorkerProfileResponse = {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string | null;
  };
  profile: {
    clinicalRole: string;
    complianceScore: number;
    reliabilityScore: number;
    specialties: string[];
  };
  compliance: {
    isCompliant: boolean;
    score: number;
    blockedReasons: string[];
    issues?: Array<{ type: string; name: string; status: string; expiresAt?: string }>;
  };
  licenses?: License[];
  certifications?: Certification[];
};

export type License = {
  id: string;
  type: string;
  number: string;
  state: string;
  status: string;
  expiresAt: string;
  documentUrl?: string | null;
};

export type Certification = {
  id: string;
  name: string;
  issuer?: string | null;
  status: string;
  expiresAt?: string | null;
  documentUrl?: string | null;
};

export type ComplianceAlert = {
  id: string;
  type: string;
  severity: string;
  message: string;
  entityType: string;
  entityId: string;
  isResolved: boolean;
  createdAt: string;
};

export type BackgroundCheck = {
  id: string;
  provider: string;
  status: string;
  completedAt?: string | null;
  createdAt: string;
  result?: Record<string, unknown> | null;
};

type ListResponse<T> = {
  data: T[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
};

export type WalletInfo = {
  balance: number;
  currency: string;
  updatedAt: string;
};

export type WalletTransaction = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description?: string | null;
  referenceId?: string | null;
  createdAt: string;
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
  const devFallback = process.env.NEXT_PUBLIC_NURSE_PORTAL_DEV_TOKEN
    ? `dev_${process.env.NEXT_PUBLIC_NURSE_PORTAL_DEV_TOKEN}`
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
      !token && process.env.NEXT_PUBLIC_NURSE_PORTAL_DEV_TOKEN
        ? `dev_${process.env.NEXT_PUBLIC_NURSE_PORTAL_DEV_TOKEN}`
        : null;

    return apiFetch<T>(path, {
      ...init,
      token: token ?? devFallback,
    });
  }

  return {
    getShifts: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return withAuth<ListResponse<Shift>>(`/shifts${qs}`);
    },
    getRecommendedShifts: (limit = 20) =>
      withAuth<{
        total: number;
        devBypass?: boolean;
        recommendations: Array<{
          shift: Shift;
          score: number;
          highlights: string[];
        }>;
      }>(`/ai/recommendations/shifts?limit=${limit}`),
    getShift: (id: string) => withAuth<{ data: Shift }>(`/shifts/${id}`),
    applyToShift: (id: string, message?: string) =>
      withAuth(`/shifts/${id}/applications`, {
        method: "POST",
        body: JSON.stringify({ message }),
      }),
    getAssignments: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return withAuth<ListResponse<Assignment>>(`/assignments${qs}`);
    },
    confirmAssignment: (id: string) =>
      withAuth(`/assignments/${id}/confirm`, { method: "POST" }),
    clockIn: (
      id: string,
      coords: { latitude: number; longitude: number; accuracyMeters?: number }
    ) =>
      withAuth(`/assignments/${id}/clock-in`, {
        method: "POST",
        body: JSON.stringify(coords),
      }),
    clockOut: (
      id: string,
      coords: { latitude: number; longitude: number; accuracyMeters?: number }
    ) =>
      withAuth(`/assignments/${id}/clock-out`, {
        method: "POST",
        body: JSON.stringify(coords),
      }),
    getMyProfile: () => withAuth<WorkerProfileResponse>(`/workers/me/profile`),
    getCompliance: () => withAuth<{ data: WorkerProfileResponse["compliance"] }>(`/compliance/me`),
    getLicenses: () => withAuth<ListResponse<License>>(`/compliance/licenses`),
    submitLicense: (body: {
      type: string;
      number: string;
      state: string;
      expiresAt: string;
      documentUrl?: string;
    }) =>
      withAuth<License>(`/compliance/licenses`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    getCertifications: () =>
      withAuth<ListResponse<Certification>>(`/compliance/certifications`),
    submitCertification: (body: {
      name: string;
      issuer?: string;
      expiresAt?: string;
      documentUrl?: string;
    }) =>
      withAuth<Certification>(`/compliance/certifications`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    getComplianceAlerts: () =>
      withAuth<ListResponse<ComplianceAlert>>(`/compliance/alerts`),
    getBackgroundChecks: () =>
      withAuth<{ data: BackgroundCheck[] }>(`/compliance/background-checks`),
    recordLegalConsent: (body: {
      documentTypes: string[];
      context: string;
    }) =>
      withAuth(`/legal/consent`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    initiateBackgroundCheck: () =>
      withAuth<{ check: { id: string; status: string }; devBypass?: boolean }>(
        `/compliance/background-checks`,
        { method: "POST" }
      ),
    getWallet: () => withAuth<WalletInfo>(`/wallet`),
    getWalletTransactions: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return withAuth<ListResponse<WalletTransaction>>(`/wallet/transactions${qs}`);
    },
    startStripeOnboard: () =>
      withAuth<{ url: string; devBypass?: boolean }>(`/workers/me/stripe/onboard`, {
        method: "POST",
      }),
    syncStripeOnboard: () =>
      withAuth<{ stripeOnboarded: boolean; instantPayEnabled: boolean }>(
        `/workers/me/stripe/sync`,
        { method: "POST" }
      ),
    instantPay: (amount?: number) =>
      withAuth(`/wallet/instant-pay`, {
        method: "POST",
        body: JSON.stringify(amount ? { amount } : {}),
      }),
    getNotifications: () =>
      withAuth<import("@/lib/notifications").AppNotification[]>("/notifications?limit=30"),
    getUnreadCount: () => withAuth<{ count: number }>("/notifications/unread-count"),
    markNotificationRead: (id: string) =>
      withAuth(`/notifications/${id}/read`, { method: "PATCH" }),
    markAllNotificationsRead: () =>
      withAuth("/notifications/read-all", { method: "POST" }),
    getReferrals: () =>
      withAuth<{
        code: string;
        referrerName: string;
        careersUrl: string | null;
        bonusAmount: number;
        referrals: Array<{
          id: string;
          refereeEmail: string;
          status: string;
          bonusAmount?: string | number | null;
          createdAt: string;
          referee?: { firstName: string; lastName: string; email: string } | null;
        }>;
      }>("/referrals/me"),
    inviteReferral: (email: string) =>
      withAuth("/referrals/me/invite", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
  };
}
