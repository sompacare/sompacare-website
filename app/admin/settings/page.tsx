import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSetupNotice } from "@/components/admin/AdminSetupNotice";
import { saveSettingsAction } from "@/lib/admin-actions";
import { isStripeConfigured, getStripePublishableKey } from "@/lib/stripe";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSettings, isOpsConfigured } from "@/lib/supabase/ops";
import { siteConfig } from "@/lib/data";

export default async function AdminSettingsPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  let company: Record<string, unknown> = {};
  let setupError = false;

  if (isOpsConfigured()) {
    try {
      company = await getSettings("company");
    } catch {
      setupError = true;
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <AdminPageHeader badge="Configuration" title="Settings" description="Company, billing, and payment integration settings" />
      {setupError ? (
        <div className="mt-8"><AdminSetupNotice /></div>
      ) : (
        <div className="mt-8 space-y-8">
          <form action={saveSettingsAction} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-brand-navy">Company & Billing</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input name="company_name" defaultValue={String(company.company_name ?? siteConfig.name)} placeholder="Company name" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm sm:col-span-2" />
              <input name="support_email" defaultValue={String(company.support_email ?? siteConfig.email)} placeholder="Support email" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="support_phone" defaultValue={String(company.support_phone ?? siteConfig.phone)} placeholder="Support phone" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="invoice_prefix" defaultValue={String(company.invoice_prefix ?? "INV")} placeholder="Invoice prefix" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="payment_terms_days" type="number" defaultValue={String(company.payment_terms_days ?? 30)} placeholder="Payment terms (days)" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
              <input name="default_tax_rate" type="number" step="0.01" defaultValue={String(company.default_tax_rate ?? 0)} placeholder="Default tax rate %" className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm" />
            </div>
            <button type="submit" className="mt-4 rounded-full bg-brand-blue px-6 py-2.5 text-sm font-semibold text-white">Save Settings</button>
          </form>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-brand-navy">Stripe ACH Integration</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-brand-slate">Stripe configured</dt>
                <dd className="font-semibold">{isStripeConfigured() ? "Yes" : "No"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-brand-slate">Publishable key</dt>
                <dd className="font-semibold">{getStripePublishableKey() ? "Set" : "Missing"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-brand-slate">Webhook endpoint</dt>
                <dd className="font-mono text-xs">{siteConfig.url}/api/stripe/webhook</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-brand-slate">
              Add STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, and STRIPE_WEBHOOK_SECRET to Vercel.
              Enable ACH in your Stripe Dashboard under Payment Methods.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
