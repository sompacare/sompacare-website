export type CandidateStage =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "PLACED"
  | "HIRED"
  | "REJECTED";

export type Candidate = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  clinicalRole: string;
  stage: CandidateStage;
  resumeUrl?: string | null;
  resumeFileName?: string | null;
  resumeStorageKey?: string | null;
  resumeParsedAt?: string | null;
  resumeParsedData?: Record<string, unknown> | null;
  source?: string | null;
  sourceApplicationId?: string | null;
  workerId?: string | null;
  worker?: { id: string; email: string; firstName: string; lastName: string } | null;
  notes?: string | null;
  matchScore?: number | null;
  backgroundCheckStatus?: string | null;
  referenceStatus?: string | null;
  offerSentAt?: string | null;
  offerAcceptedAt?: string | null;
  onboardingSentAt?: string | null;
  placedAt?: string | null;
  hiredAt?: string | null;
  employeeNumber?: string | null;
  hireDetails?: { payRate?: string; startDate?: string; sentAt?: string } | null;
  createdAt: string;
  updatedAt: string;
  recruiter?: { id: string; firstName: string; lastName: string; email: string };
  facility?: { id: string; name: string } | null;
  interviews?: CandidateInterview[];
};

export type CandidateInterview = {
  id: string;
  scheduledAt: string;
  mode: string;
  notes?: string | null;
  status: string;
  createdAt: string;
};

export type PipelineColumn = {
  stage: CandidateStage;
  count: number;
  candidates: Candidate[];
};

export type PipelineResponse = {
  columns: PipelineColumn[];
  total: number;
};

export type RecruiterMetrics = {
  activePipeline: number;
  placedTotal: number;
  byStage: Record<string, number>;
  recentPlacements: Array<{
    id: string;
    firstName: string;
    lastName: string;
    clinicalRole: string;
    placedAt?: string | null;
    facility?: { name: string } | null;
  }>;
};

export type LeaderboardEntry = {
  rank: number;
  recruiter?: { id: string; firstName: string; lastName: string; email: string };
  placements: number;
};

export type JobPosting = {
  id: string;
  slug: string;
  title: string;
  category: string;
  employment: string;
  locations: string;
  description: string;
  requirements: string[];
  clinicalRole: string;
  status: string;
  publishedAt?: string | null;
  updatedAt: string;
};

export type ShiftRecord = {
  id: string;
  title: string;
  description?: string | null;
  role: string;
  shiftType: string;
  status: string;
  payRate?: string | number;
  hourlyRate?: string | number;
  startTime: string;
  endTime: string;
  slotsTotal: number;
  slotsFilled: number;
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

export type HomecareFacility = {
  id: string;
  name: string;
  isInternal?: boolean;
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
  const devFallback = process.env.NEXT_PUBLIC_RECRUITER_PORTAL_DEV_TOKEN
    ? `dev_${process.env.NEXT_PUBLIC_RECRUITER_PORTAL_DEV_TOKEN}`
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
      !token && process.env.NEXT_PUBLIC_RECRUITER_PORTAL_DEV_TOKEN
        ? `dev_${process.env.NEXT_PUBLIC_RECRUITER_PORTAL_DEV_TOKEN}`
        : null;

    return apiFetch<T>(path, {
      ...init,
      token: token ?? devFallback,
    });
  }

  return {
    getPipeline: () => withAuth<PipelineResponse>("/recruiters/pipeline"),
    getCandidates: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return withAuth<ListResponse<Candidate>>(`/recruiters/candidates${qs}`);
    },
    getCandidate: (id: string) => withAuth<Candidate>(`/recruiters/candidates/${id}`),
    getCandidateResume: (id: string) =>
      withAuth<{ url: string; fileName: string; storageKey: string }>(
        `/recruiters/candidates/${id}/resume`
      ),
    createCandidate: (body: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      clinicalRole: string;
      source?: string;
      resumeUrl?: string;
      notes?: string;
      facilityId?: string;
    }) =>
      withAuth<Candidate>("/recruiters/candidates", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    updateStage: (id: string, stage: CandidateStage, notes?: string) =>
      withAuth<Candidate>(`/recruiters/candidates/${id}/stage`, {
        method: "PATCH",
        body: JSON.stringify({ stage, notes }),
      }),
    scheduleInterview: (
      id: string,
      body: { scheduledAt: string; mode?: string; notes?: string }
    ) =>
      withAuth<{ candidate: Candidate; interview: CandidateInterview }>(
        `/recruiters/candidates/${id}/interviews`,
        { method: "POST", body: JSON.stringify(body) }
      ),
    sendOffer: (
      id: string,
      body?: { facilityId?: string; payRate?: string; startDate?: string }
    ) =>
      withAuth<Candidate>(`/recruiters/candidates/${id}/offer`, {
        method: "POST",
        body: JSON.stringify(body ?? {}),
      }),
    acceptOffer: (id: string) =>
      withAuth<Candidate>(`/recruiters/candidates/${id}/offer/accept`, {
        method: "POST",
      }),
    sendOnboarding: (id: string) =>
      withAuth<Candidate>(`/recruiters/candidates/${id}/onboarding`, {
        method: "POST",
      }),
    parseResume: (id: string, resumeText?: string) =>
      withAuth<{
        candidate: Candidate;
        parsed: Record<string, unknown>;
        devBypass?: boolean;
      }>(`/recruiters/candidates/${id}/parse-resume`, {
        method: "POST",
        body: JSON.stringify({ resumeText }),
      }),
    updateChecklist: (
      id: string,
      body: { backgroundCheckStatus: string; referenceStatus: string }
    ) =>
      withAuth<Candidate>(`/recruiters/candidates/${id}/checklist`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    getMetrics: () => withAuth<RecruiterMetrics>("/recruiters/metrics"),
    getLegalConsentStatus: () =>
      withAuth<{ complete: boolean; missing: string[]; marketingUrl: string }>(
        "/legal/consent/status"
      ),
    recordLegalConsent: (body: { documentTypes: string[]; context: string }) =>
      withAuth(`/legal/consent`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    getLeaderboard: () => withAuth<LeaderboardEntry[]>("/recruiters/leaderboard"),
    getJobPostings: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return withAuth<ListResponse<JobPosting>>(`/job-postings${qs}`);
    },
    updateJobPosting: (
      id: string,
      body: Partial<{
        title: string;
        category: string;
        employment: string;
        locations: string;
        description: string;
        requirements: string[];
        clinicalRole: string;
        status: string;
      }>
    ) =>
      withAuth<JobPosting>(`/job-postings/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    getInternalHomecareFacility: () =>
      withAuth<{ data: HomecareFacility }>("/facilities/internal/homecare"),
    getShifts: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return withAuth<ListResponse<ShiftRecord>>(`/shifts${qs}`);
    },
    createShift: (body: {
      facilityId: string;
      location?: {
        name: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        zipCode: string;
      };
      title: string;
      description?: string;
      role: string;
      shiftType: string;
      billRate: number;
      startTime: string;
      endTime: string;
      slotsTotal?: number;
      requirements?: string[];
      isEmergency?: boolean;
    }) => withAuth<ShiftRecord>("/shifts", { method: "POST", body: JSON.stringify(body) }),
    publishShift: (id: string) =>
      withAuth<ShiftRecord>(`/shifts/${id}/publish`, { method: "POST" }),
  };
}
