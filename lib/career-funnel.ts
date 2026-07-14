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

function careersApiConfig() {
  const apiUrl = process.env.PLATFORM_API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  const secret = process.env.CAREERS_INGEST_SECRET;
  if (!apiUrl || !secret) {
    return null;
  }
  const base = apiUrl.replace(/\/$/, "");
  const root = base.endsWith("/api/v1") ? base : `${base}/api/v1`;
  return { root, secret };
}

/**
 * Forward careers applications into the platform recruiter pipeline.
 * Failures are logged but do not block the public careers form.
 */
export async function ingestCareerApplicationToPlatform(payload: IngestPayload) {
  const config = careersApiConfig();
  if (!config) {
    console.warn("Careers funnel ingest skipped: PLATFORM_API_URL or CAREERS_INGEST_SECRET not set");
    return { ingested: false, reason: "not_configured" as const };
  }

  const endpoint = `${config.root}/careers/ingest`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-careers-ingest-secret": config.secret,
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

/** Mark applicant placed in platform pipeline — offer letter + onboarding package. */
export async function placeCareerApplicationOnPlatform(applicationId: string) {
  const config = careersApiConfig();
  if (!config) {
    return { placed: false, reason: "not_configured" as const };
  }

  const endpoint = `${config.root}/careers/place`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-careers-ingest-secret": config.secret,
      },
      body: JSON.stringify({ applicationId }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Careers place failed:", res.status, text);
      return { placed: false, reason: "api_error" as const, detail: text };
    }

    const data = (await res.json()) as { offerSent?: boolean; onboardingSent?: boolean };
    return {
      placed: true,
      offerSent: data.offerSent ?? true,
      onboardingSent: data.onboardingSent ?? true,
    };
  } catch (error) {
    console.error("Careers place error:", error);
    return { placed: false, reason: "network_error" as const };
  }
}

/** Mark applicant hired in platform pipeline and email employee number for portal sign-up. */
export async function hireCareerApplicationOnPlatform(applicationId: string) {
  const config = careersApiConfig();
  if (!config) {
    return { hired: false, reason: "not_configured" as const };
  }

  const endpoint = `${config.root}/careers/hire`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-careers-ingest-secret": config.secret,
      },
      body: JSON.stringify({ applicationId }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Careers hire failed:", res.status, text);
      return { hired: false, reason: "api_error" as const, detail: text };
    }

    const data = (await res.json()) as {
      employeeNumber?: string;
      signupUrl?: string;
      signInUrl?: string;
    };
    return {
      hired: true,
      employeeNumber: data.employeeNumber,
      signupUrl: data.signupUrl,
      signInUrl: data.signInUrl,
    };
  } catch (error) {
    console.error("Careers hire error:", error);
    return { hired: false, reason: "network_error" as const };
  }
}
