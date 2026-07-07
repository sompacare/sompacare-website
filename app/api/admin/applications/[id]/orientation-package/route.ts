import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isOrientationPackageReady, normalizeHireDetails } from "@/lib/hire-orientation";
import { sendOrientationPackage } from "@/lib/orientation-package-service";
import { getApplication } from "@/lib/supabase/admin";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const application = await getApplication(id);
  if (!application) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  if (application.status !== "hired") {
    return NextResponse.json({ error: "Applicant must be marked as hired first." }, { status: 400 });
  }

  const hireDetails = normalizeHireDetails(application.hire_details);
  if (!isOrientationPackageReady(hireDetails)) {
    return NextResponse.json(
      { error: "Complete facility, start date, orientation date, and reporting manager before sending." },
      { status: 400 },
    );
  }

  try {
    const result = await sendOrientationPackage(application);
    if (!result.sent) {
      return NextResponse.json(
        { error: result.error ?? "Unable to send orientation package." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      onboarding: result,
      orientation_package_sent_at: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Unable to send orientation package." }, { status: 500 });
  }
}
