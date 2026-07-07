import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminSetupNotice } from "@/components/admin/AdminSetupNotice";
import { PaymentSubNav } from "@/components/admin/PaymentSubNav";
import { PaymentsTable } from "@/components/admin/PaymentsTable";
import { StripeAchPanel } from "@/components/admin/StripeAchPanel";
import { formatCurrency } from "@/lib/format";
import { isStripeConfigured } from "@/lib/stripe";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getOutstandingInvoices, isOpsConfigured, listClients, listPayments } from "@/lib/supabase/ops";

export default async function PaymentAchPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; invoice?: string }>;
}) {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");

  const params = await searchParams;
  let setupError = false;
  let achPayments: Awaited<ReturnType<typeof listPayments>> = [];
  let clients: Awaited<ReturnType<typeof listClients>> = [];
  let outstanding: Awaited<ReturnType<typeof getOutstandingInvoices>> = [];

  if (isOpsConfigured()) {
    try {
      [achPayments, clients, outstanding] = await Promise.all([
        listPayments({ method: "ach" }),
        listClients(),
        getOutstandingInvoices(),
      ]);
    } catch {
      setupError = true;
    }
  }

  const selectedClient = params.client ?? clients[0]?.id ?? "";
  const selectedInvoice = params.invoice ?? outstanding[0]?.id ?? "";
  const invoice = outstanding.find((inv) => inv.id === selectedInvoice);
  const amountDue = invoice ? Number(invoice.total) - Number(invoice.amount_paid) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <AdminPageHeader badge="Payments" title="ACH Payments" description="Stripe ACH bank transfers and setup" />
      <div className="mt-6"><PaymentSubNav /></div>

      {setupError ? (
        <div className="mt-8"><AdminSetupNotice /></div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-brand-navy">Set Up Client Bank Account</h2>
              <p className="mt-2 text-sm text-brand-slate">Select a client, then save their verified US bank account for ACH debits.</p>
              <form className="mt-4 space-y-3" action="/admin/payments/ach" method="get">
                <select name="client" defaultValue={selectedClient} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button type="submit" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium">Select Client</button>
              </form>
              {selectedClient && (
                <div className="mt-6">
                  <StripeAchPanel mode="setup" clientId={selectedClient} stripeConfigured={isStripeConfigured()} />
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-brand-navy">Collect ACH Payment</h2>
              <form className="mt-4 space-y-3" action="/admin/payments/ach" method="get">
                <input type="hidden" name="client" value={selectedClient} />
                <select name="invoice" defaultValue={selectedInvoice} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm">
                  {outstanding.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoice_number} — {inv.clients?.name} ({formatCurrency(Number(inv.total) - Number(inv.amount_paid))})
                    </option>
                  ))}
                </select>
                <button type="submit" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium">Select Invoice</button>
              </form>
              {selectedClient && selectedInvoice && amountDue > 0 && (
                <div className="mt-6">
                  <StripeAchPanel
                    mode="charge"
                    clientId={selectedClient}
                    invoiceId={selectedInvoice}
                    amount={amountDue}
                    stripeConfigured={isStripeConfigured()}
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-bold text-brand-navy">ACH Payment History</h2>
            <PaymentsTable payments={achPayments} emptyMessage="No ACH payments yet." />
          </div>
        </div>
      )}
    </div>
  );
}
