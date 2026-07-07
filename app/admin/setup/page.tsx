import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSetupPanel } from "@/components/admin/AdminSetupPanel";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getAdminSetupStatus } from "@/lib/admin-setup";

export default async function AdminSetupPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const status = await getAdminSetupStatus();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <AdminPageHeader
        badge="Admin"
        title="Dashboard Setup"
        description="Fix database and storage setup for clients, billing, payments, and documents."
      />
      <AdminSetupPanel initialStatus={status} />
    </div>
  );
}
