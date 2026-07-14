/**
 * Record applicant consent on the platform API (best-effort).
 */
export async function recordPlatformConsent(input: {
  email: string;
  context: string;
  documentTypes: string[];
  ipAddress?: string;
  userAgent?: string;
}) {
  const apiUrl = process.env.PLATFORM_API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return { recorded: false, reason: "not_configured" as const };

  const base = apiUrl.replace(/\/$/, "");
  const endpoint = base.endsWith("/api/v1")
    ? `${base}/legal/consent/public`
    : `${base}/api/v1/legal/consent/public`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) return { recorded: false, reason: "api_error" as const };
    return { recorded: true as const };
  } catch {
    return { recorded: false, reason: "network_error" as const };
  }
}
