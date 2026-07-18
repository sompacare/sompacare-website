import { NextResponse } from "next/server";
import { clearAdminSession, setAdminSession, verifyAdminCredentials } from "@/lib/admin-auth";

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json({ error: "Enter your company email and password." }, { status: 400 });
  }

  if (!verifyAdminCredentials(email, password)) {
    return NextResponse.json({ error: "Invalid company email or password." }, { status: 401 });
  }

  try {
    await setAdminSession();
  } catch {
    return NextResponse.json({ error: "Admin session is not configured." }, { status: 503 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  await clearAdminSession();
  return NextResponse.json({ success: true });
}
