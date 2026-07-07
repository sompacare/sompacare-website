import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  ensureBusinessDocumentsBucket,
  ensureDefaultAdminSettings,
  getAdminSetupStatus,
  runAdminDashboardMigration,
} from "@/lib/admin-setup";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getAdminSetupStatus();
  return NextResponse.json(status);
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { action?: string };
  const action = body.action ?? "bootstrap";

  try {
    if (action === "bucket") {
      const result = await ensureBusinessDocumentsBucket();
      const status = await getAdminSetupStatus();
      return NextResponse.json({ ok: true, ...result, status });
    }

    if (action === "migrate") {
      await runAdminDashboardMigration();
      const status = await getAdminSetupStatus();
      return NextResponse.json({ ok: true, migrated: true, status });
    }

    const bucket = await ensureBusinessDocumentsBucket();
    await ensureDefaultAdminSettings();
    let migrated = false;

    const before = await getAdminSetupStatus();
    const tablesMissing = Object.values(before.tables).some((ready) => !ready);

    if (tablesMissing && before.databaseUrlConfigured) {
      await runAdminDashboardMigration();
      migrated = true;
    }

    const status = await getAdminSetupStatus();
    return NextResponse.json({
      ok: true,
      bucket,
      migrated,
      status,
      needsManualSql: !status.ready && Object.values(status.tables).some((ready) => !ready) && !before.databaseUrlConfigured,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Setup failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
