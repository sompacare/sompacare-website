import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  approvePayrollRun,
  buildPayrollRunFromTimesheets,
  markPayrollRunPaid,
} from "@/lib/supabase/payroll";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { action?: string };

  try {
    if (body.action === "build") {
      const result = await buildPayrollRunFromTimesheets(id);
      return NextResponse.json({ ok: true, ...result });
    }
    if (body.action === "approve") {
      const run = await approvePayrollRun(id);
      return NextResponse.json({ ok: true, run });
    }
    if (body.action === "pay") {
      const run = await markPayrollRunPaid(id);
      return NextResponse.json({ ok: true, run });
    }
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payroll action failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
