import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminSignOutButton } from "@/components/admin/AdminSignOutButton";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listApplications } from "@/lib/supabase/admin";
import type { ApplicationRecord, ApplicationStatus } from "@/lib/supabase/types";

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  reviewing: "bg-amber-100 text-amber-800",
  interviewed: "bg-purple-100 text-purple-800",
  hired: "bg-green-100 text-green-800",
  rejected: "bg-slate-200 text-slate-700",
};

export default async function AdminApplicationsPage() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  let applications: ApplicationRecord[] = [];
  try {
    applications = await listApplications();
  } catch {
    applications = [];
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest text-brand-blue uppercase">Sompacare ATS</p>
          <h1 className="mt-1 text-3xl font-bold text-brand-navy">Applications</h1>
          <p className="mt-1 text-sm text-brand-slate">{applications.length} total submissions</p>
        </div>
        <AdminSignOutButton />
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-brand-navy">Applicant</th>
              <th className="px-4 py-3 text-left font-semibold text-brand-navy">Position</th>
              <th className="px-4 py-3 text-left font-semibold text-brand-navy">Applied</th>
              <th className="px-4 py-3 text-left font-semibold text-brand-navy">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-brand-navy">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applications.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-brand-slate">
                  No applications yet. Submissions from the Careers page will appear here.
                </td>
              </tr>
            ) : (
              applications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-brand-navy">{app.first_name} {app.last_name}</p>
                    <p className="text-xs text-brand-slate">{app.email}</p>
                  </td>
                  <td className="px-4 py-3 text-brand-slate">{app.position_label}</td>
                  <td className="px-4 py-3 text-brand-slate">
                    {new Date(app.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_COLORS[app.status]}`}>
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/applications/${app.id}`} className="font-semibold text-brand-blue hover:underline">
                      Review
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
