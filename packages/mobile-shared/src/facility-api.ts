import { createApiClient, ApiClientOptions } from "./api-client";
import type { Application, Assignment, ListResponse, MobileConfig, Shift } from "./types";

export type Timecard = {
  id: string;
  status: string;
  regularHours: string | number;
  grossAmount: string | number;
  worker: { firstName: string; lastName: string };
  assignment: { shift: { title: string; facility: { name: string } } };
};

export function createFacilityApiClient(options: ApiClientOptions) {
  const { request } = createApiClient(options);

  return {
    getConfig: () => request<MobileConfig>("/mobile/config"),
    registerPushToken: (body: { token: string; platform: string; app: "FACILITY" }) =>
      request("/mobile/push-token", { method: "POST", body: JSON.stringify(body) }),
    getFacilities: () => request<ListResponse<{ id: string; name: string; locations: unknown[] }>>("/facilities?limit=20"),
    getShifts: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return request<ListResponse<Shift>>(`/shifts${qs}`);
    },
    publishShift: (id: string) => request(`/shifts/${id}/publish`, { method: "POST" }),
    getApplications: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return request<ListResponse<Application>>(`/applications${qs}`);
    },
    approveApplication: (id: string) =>
      request(`/applications/${id}/approve`, { method: "POST" }),
    rejectApplication: (id: string, reason: string) =>
      request(`/applications/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    getAssignments: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return request<ListResponse<Assignment>>(`/assignments${qs}`);
    },
    getTimecards: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return request<ListResponse<Timecard>>(`/timecards${qs}`);
    },
    approveTimecard: (id: string) =>
      request(`/timecards/${id}/approve`, { method: "PATCH" }),
    getUnreadCount: () => request<{ count: number }>("/notifications/unread-count"),
  };
}

export type FacilityApiClient = ReturnType<typeof createFacilityApiClient>;
