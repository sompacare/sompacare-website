import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  hireCareerApplicationOnPlatform,
  placeCareerApplicationOnPlatform,
} from "@/lib/career-funnel";
import { sendApplicantOnboarding } from "@/lib/onboarding-service";
import { getApplication, markOnboardingSent } from "@/lib/supabase/admin";

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

    if (application.status === "hired") {
      const platformHire = await hireCareerApplicationOnPlatform(id);
      return NextResponse.json({
        success: platformHire.hired,
        platformHire,
      });
    }

    if (application.status !== "placed") {
      return NextResponse.json(
        { error: "Mark the applicant as placed before resending onboarding." },
        { status: 400 },
      );
    }

    const platformPlace = await placeCareerApplicationOnPlatform(id);
    if (platformPlace.placed) {
      try {
        await markOnboardingSent(id);
      } catch (error) {
        console.error("Unable to record onboarding_sent_at after platform place:", error);
      }

      return NextResponse.json({
        success: true,
        platformPlace,
        onboarding_sent_at: new Date().toISOString(),
      });
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
          platformPlace,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      onboarding,
      platformPlace,
      onboarding_sent_at: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Unable to send onboarding email." }, { status: 500 });
  }
}
