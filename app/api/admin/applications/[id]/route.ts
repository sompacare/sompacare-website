import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { sendApplicantOnboarding } from "@/lib/onboarding-service";
import { getApplication, updateApplicationStatus } from "@/lib/supabase/admin";
import type { ApplicationStatus } from "@/lib/supabase/types";

const VALID_STATUSES = new Set<ApplicationStatus>([
  "new",
  "reviewing",
  "interviewed",
  "hired",
  "rejected",
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  let body: { status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body.status || !VALID_STATUSES.has(body.status as ApplicationStatus)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const nextStatus = body.status as ApplicationStatus;

  try {
    const existing = await getApplication(id);
    if (!existing) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    const updated = await updateApplicationStatus(id, nextStatus);

    let application = updated;
    let onboarding: Awaited<ReturnType<typeof sendApplicantOnboarding>> | null = null;

    if (nextStatus === "hired" && existing.status !== "hired" && !existing.onboarding_sent_at) {
      onboarding = await sendApplicantOnboarding(updated);
      if (onboarding.sent) {
        const refreshed = await getApplication(id);
        if (refreshed) application = refreshed;
      }
    }

    return NextResponse.json({ application, onboarding });
  } catch {
    return NextResponse.json({ error: "Unable to update application." }, { status: 500 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const application = await getApplication(id);
  if (!application) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({ application });
}
