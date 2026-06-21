import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listApplications } from "@/lib/supabase/admin";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const applications = await listApplications();
    return NextResponse.json({ applications });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to load applications." }, { status: 500 });
  }
}
