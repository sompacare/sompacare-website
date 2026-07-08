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
  };
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
    getMyProfile: () => withAuth<WorkerProfileResponse>(`/workers/me/profile`),
    getCompliance: () => withAuth<{ data: WorkerProfileResponse["compliance"] }>(`/compliance/me`),
  };
}
