import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { HiringWorkflowPanel } from "@/components/admin/HiringWorkflowPanel";
import { HireOrientationPanel } from "@/components/admin/HireOrientationPanel";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { normalizeHireDetails } from "@/lib/hire-orientation";
import { createSignedFileUrl, getApplication } from "@/lib/supabase/admin";

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const { id } = await params;
  const application = await getApplication(id);
  if (!application) notFound();

  const hireDetails = normalizeHireDetails(application.hire_details);
  const resumeUrl = application.resume_url
    ? await createSignedFileUrl(application.resume_url)
    : null;

  const certLinks = await Promise.all(
    (application.certification_urls ?? []).map(async (cert) => ({
      ...cert,
      signedUrl: cert.url ? await createSignedFileUrl(cert.url) : null,
    })),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/admin/applications" className="text-sm font-semibold text-brand-blue hover:underline">
        ← Back to applications
      </Link>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-bold tracking-widest text-brand-blue uppercase">Talent Acquisition Review</p>
            <h1 className="mt-1 text-3xl font-bold text-brand-navy">
              {application.first_name} {application.last_name}
            </h1>
            <p className="mt-1 text-sm text-brand-slate">{application.position_label}</p>
            <p className="mt-1 text-xs text-brand-slate">
              Applied {new Date(application.created_at).toLocaleString("en-US")}
            </p>
          </div>
          <HiringWorkflowPanel
            applicationId={application.id}
            currentStatus={application.status}
            onboardingSentAt={application.onboarding_sent_at ?? null}
          />
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Email", application.email],
            ["Phone", application.phone],
            ["Address", `${application.address_line1}, ${application.city}, ${application.state} ${application.zip}`],
            ["License", `${application.license_number ?? "—"} (${application.license_state ?? "—"})`],
            ["Experience", application.experience],
            ["Availability", application.availability],
            ["Certifications", application.certifications.join(", ") || "—"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase text-brand-slate">{label}</dt>
              <dd className="mt-1 text-sm text-brand-navy">{value}</dd>
            </div>
          ))}
        </dl>

        {application.additional_notes && (
          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-brand-slate">Additional Notes</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-brand-navy">{application.additional_notes}</p>
          </div>
        )}

        <div className="mt-8 space-y-3">
          <p className="text-xs font-semibold uppercase text-brand-slate">Credential Documents</p>
          {resumeUrl ? (
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-full bg-brand-blue px-5 py-2 text-sm font-semibold text-white hover:bg-brand-blue-dark"
            >
              Download Resume ({application.resume_file_name})
            </a>
          ) : (
            <p className="text-sm text-brand-slate">No resume on file.</p>
          )}
          {certLinks.length > 0 && (
            <ul className="space-y-2">
              {certLinks.map((cert) => (
                <li key={cert.fileName}>
                  {cert.signedUrl ? (
                    <a href={cert.signedUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-blue hover:underline">
                      {cert.fileName}
                    </a>
                  ) : (
                    <span className="text-sm text-brand-slate">{cert.fileName}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <HireOrientationPanel
        applicationId={application.id}
        initialDetails={hireDetails}
        onboardingSentAt={application.onboarding_sent_at}
        orientationPackageSentAt={application.orientation_package_sent_at}
        isHired={application.status === "placed" || application.status === "hired"}
      />
    </div>
  );
}
