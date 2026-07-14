import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listApplications } from "@/lib/supabase/admin";
import type { ApplicationRecord, ApplicationStatus } from "@/lib/supabase/types";

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  reviewing: "bg-amber-100 text-amber-800",
  interviewed: "bg-purple-100 text-purple-800",
  placed: "bg-emerald-100 text-emerald-800",
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

  const placedCount = applications.filter((app) => app.status === "placed").length;
  const hiredCount = applications.filter((app) => app.status === "hired").length;
  const pipelineCount = applications.filter((app) => ["reviewing", "interviewed"].includes(app.status)).length;
  const orientationPending = applications.filter(
    (app) => app.status === "placed" && !app.onboarding_sent_at
  ).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminPageHeader
        badge="Talent Acquisition"
        title="Applications & Hiring Pipeline"
        description="Review careers applicants, mark placed (offer + onboarding), then hired (portal employee number)."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold tracking-widest text-brand-slate uppercase">In Pipeline</p>
          <p className="mt-1 text-2xl font-bold text-brand-navy">{pipelineCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold tracking-widest text-brand-slate uppercase">Placed</p>
          <p className="mt-1 text-2xl font-bold text-brand-navy">{placedCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold tracking-widest text-brand-slate uppercase">Portal Hired</p>
          <p className="mt-1 text-2xl font-bold text-brand-navy">{hiredCount}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <p className="text-[10px] font-bold tracking-widest text-amber-800 uppercase">Onboarding Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-900">{orientationPending}</p>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-brand-navy">Applicant</th>
              <th className="px-4 py-3 text-left font-semibold text-brand-navy">Position</th>
              <th className="px-4 py-3 text-left font-semibold text-brand-navy">Applied</th>
              <th className="px-4 py-3 text-left font-semibold text-brand-navy">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-brand-navy">Orientation</th>
              <th className="px-4 py-3 text-right font-semibold text-brand-navy">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {applications.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-brand-slate">
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
                  <td className="px-4 py-3">
                    {app.status === "placed" || app.status === "hired" ? (
                      <span
                        className={`text-xs font-semibold ${
                          app.orientation_package_sent_at || app.onboarding_sent_at
                            ? "text-brand-green"
                            : "text-amber-700"
                        }`}
                      >
                        {app.status === "hired"
                          ? app.orientation_package_sent_at
                            ? "Portal + package"
                            : app.onboarding_sent_at
                              ? "Portal invite sent"
                              : "Pending portal"
                          : app.onboarding_sent_at
                            ? "Offer + onboarding sent"
                            : "Pending onboarding"}
                      </span>
                    ) : (
                      <span className="text-xs text-brand-slate">—</span>
                    )}
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
