type IngestPayload = {
  applicationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  positionLabel?: string;
  resumeUrl?: string | null;
  resumeFileName?: string | null;
  licenseNumber?: string;
  licenseState?: string;
  experience?: string;
  availability?: string;
  referralCode?: string;
};

/**
 * Forward careers applications into the platform recruiter pipeline.
 * Failures are logged but do not block the public careers form.
 */
export async function ingestCareerApplicationToPlatform(payload: IngestPayload) {
  const apiUrl = process.env.PLATFORM_API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  const secret = process.env.CAREERS_INGEST_SECRET;

  if (!apiUrl || !secret) {
    console.warn("Careers funnel ingest skipped: PLATFORM_API_URL or CAREERS_INGEST_SECRET not set");
    return { ingested: false, reason: "not_configured" as const };
  }

  const base = apiUrl.replace(/\/$/, "");
  const endpoint = base.endsWith("/api/v1") ? `${base}/careers/ingest` : `${base}/api/v1/careers/ingest`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-careers-ingest-secret": secret,
      },
      body: JSON.stringify({
        ...payload,
        resumeUrl: payload.resumeUrl ?? undefined,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Careers funnel ingest failed:", res.status, text);
      return { ingested: false, reason: "api_error" as const };
    }

    const data = (await res.json()) as { created?: boolean; candidate?: { id: string } };
    return {
      ingested: true,
      created: data.created ?? true,
      candidateId: data.candidate?.id,
    };
  } catch (error) {
    console.error("Careers funnel ingest error:", error);
    return { ingested: false, reason: "network_error" as const };
  }
}
