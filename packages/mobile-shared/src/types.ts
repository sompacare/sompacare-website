export type ListResponse<T> = {
  data: T[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
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
  requirements?: string[];
  isEmergency?: boolean;
  matchScore?: number;
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
  worker?: { id: string; firstName: string; lastName: string };
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
    profile?: {
      clinicalRole: string;
      complianceScore: number;
      reliabilityScore: number;
    } | null;
  };
};

export type WalletInfo = {
  balance: number;
  currency: string;
  updatedAt: string;
};

export type MobileConfig = {
  offlineClockQueue: boolean;
  biometricLogin: boolean;
  pushNotifications: boolean;
  documentUpload: boolean;
  minAppVersion: string;
};

export type ClockCoords = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
};

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
