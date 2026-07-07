import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSetupNotice } from "@/components/admin/AdminSetupNotice";
import { formatDate } from "@/lib/format";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isOpsConfigured, listDocuments } from "@/lib/supabase/ops";

export default async function AdminDocumentsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  let documents: Awaited<ReturnType<typeof listDocuments>> = [];
  let setupError = false;
  if (isOpsConfigured()) {
    try { documents = await listDocuments(); } catch { setupError = true; }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminPageHeader badge="Records" title="Documents" description="Contracts, credentials, and business files" />
      {setupError ? (
        <div className="mt-8"><AdminSetupNotice /></div>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Title</th>
                <th className="px-4 py-3 text-left font-semibold">Entity</th>
                <th className="px-4 py-3 text-left font-semibold">File</th>
                <th className="px-4 py-3 text-left font-semibold">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-brand-slate">
                    No documents uploaded yet. Use the business-documents storage bucket for file uploads.
                  </td>
                </tr>
              ) : documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="px-4 py-3 font-medium">{doc.title}</td>
                  <td className="px-4 py-3 capitalize">{doc.entity_type}</td>
                  <td className="px-4 py-3">{doc.file_name}</td>
                  <td className="px-4 py-3">{formatDate(doc.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
