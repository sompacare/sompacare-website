import { NextResponse } from "next/server";
import { clearAdminSession, setAdminSession, verifyAdminPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!body.password || !verifyAdminPassword(body.password)) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
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
