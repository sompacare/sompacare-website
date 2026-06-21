import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { sendApplicantOnboarding } from "@/lib/onboarding-service";
import { getApplication } from "@/lib/supabase/admin";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const application = await getApplication(id);
    if (!application) {
      return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    if (application.status !== "hired") {
      return NextResponse.json(
        { error: "Mark the applicant as hired before sending onboarding." },
        { status: 400 },
      );
    }

    if (application.onboarding_sent_at) {
      return NextResponse.json(
        { error: "Onboarding was already sent for this applicant." },
        { status: 409 },
      );
    }

    const onboarding = await sendApplicantOnboarding(application);

    if (!onboarding.sent) {
      return NextResponse.json(
        {
          error: onboarding.error ?? "Unable to send onboarding email.",
          onboarding,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      onboarding,
      onboarding_sent_at: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Unable to send onboarding email." }, { status: 500 });
  }
}
