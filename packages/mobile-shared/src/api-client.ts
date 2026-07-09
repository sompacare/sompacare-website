import { ApiError } from "./types";

export type ApiClientOptions = {
  baseUrl: string;
  getToken: () => Promise<string | null>;
  devToken?: string | null;
};

export function createApiClient({ baseUrl, getToken, devToken }: ApiClientOptions) {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await getToken();
    const authToken = token ?? devToken ?? null;

    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(init?.headers ?? {}),
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

  return { request };
}
