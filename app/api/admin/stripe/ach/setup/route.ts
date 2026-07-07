import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createAchSetupIntent } from "@/lib/payment-service";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { clientId } = (await request.json()) as { clientId?: string };
    if (!clientId) {
      return NextResponse.json({ error: "clientId is required." }, { status: 400 });
    }
    const result = await createAchSetupIntent(clientId);
    return NextResponse.json({ clientSecret: result.clientSecret });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Setup failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
