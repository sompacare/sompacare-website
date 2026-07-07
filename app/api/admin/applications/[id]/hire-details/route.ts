import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { normalizeHireDetails } from "@/lib/hire-orientation";
import { getApplication, updateApplicationHireDetails } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  let body: { hire_details?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const existing = await getApplication(id);
  if (!existing) {
    return NextResponse.json({ error: "Application not found." }, { status: 404 });
  }

  try {
    const hireDetails = normalizeHireDetails(body.hire_details);
    const application = await updateApplicationHireDetails(id, hireDetails);
    return NextResponse.json({ application });
  } catch {
    return NextResponse.json({ error: "Unable to save hire details." }, { status: 500 });
  }
}
