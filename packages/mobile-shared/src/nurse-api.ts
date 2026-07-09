import { createApiClient, ApiClientOptions } from "./api-client";
import type { Assignment, ClockCoords, ListResponse, MobileConfig, Shift, WalletInfo } from "./types";

export function createNurseApiClient(options: ApiClientOptions) {
  const { request } = createApiClient(options);

  return {
    getConfig: () => request<MobileConfig>("/mobile/config"),
    registerPushToken: (body: { token: string; platform: string; app: "NURSE" }) =>
      request("/mobile/push-token", { method: "POST", body: JSON.stringify(body) }),
    getShifts: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return request<ListResponse<Shift>>(`/shifts${qs}`);
    },
    getRecommendedShifts: (limit = 10) =>
      request<{ recommendations: Array<{ shift: Shift; score: number }> }>(
        `/ai/recommendations/shifts?limit=${limit}`
      ),
    applyToShift: (id: string, message?: string) =>
      request(`/shifts/${id}/applications`, {
        method: "POST",
        body: JSON.stringify({ message }),
      }),
    getAssignments: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params)}` : "";
      return request<ListResponse<Assignment>>(`/assignments${qs}`);
    },
    confirmAssignment: (id: string) =>
      request(`/assignments/${id}/confirm`, { method: "POST" }),
    clockIn: (id: string, coords: ClockCoords) =>
      request(`/assignments/${id}/clock-in`, {
        method: "POST",
        body: JSON.stringify(coords),
      }),
    clockOut: (id: string, coords: ClockCoords) =>
      request(`/assignments/${id}/clock-out`, {
        method: "POST",
        body: JSON.stringify(coords),
      }),
    getWallet: () => request<WalletInfo>("/wallet"),
    getCompliance: () =>
      request<{ data: { isCompliant: boolean; score: number; blockedReasons: string[] } }>(
        "/compliance/me"
      ),
    submitLicense: (body: {
      type: string;
      number: string;
      state: string;
      expiresAt: string;
      documentUrl?: string;
    }) =>
      request("/compliance/licenses", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    getUnreadCount: () => request<{ count: number }>("/notifications/unread-count"),
  };
}

export type NurseApiClient = ReturnType<typeof createNurseApiClient>;
