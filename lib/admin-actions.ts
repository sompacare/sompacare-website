"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  createClient,
  createContract,
  createEmployee,
  createInvoice,
  createJobOrder,
  createPayment,
  generateInvoiceNumber,
  upsertSettings,
  updateClient,
} from "@/lib/supabase/ops";

async function requireAdmin() {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}

export async function createClientAction(formData: FormData) {
  await requireAdmin();
  await createClient({
    name: String(formData.get("name") ?? "").trim(),
    type: (formData.get("type") as "facility" | "family" | "agency" | "other") || "facility",
    email: String(formData.get("email") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    contact_name: String(formData.get("contact_name") ?? "").trim() || null,
    billing_email: String(formData.get("billing_email") ?? "").trim() || null,
    status: "active",
  });
  revalidatePath("/admin/clients");
}

export async function createContractAction(formData: FormData) {
  await requireAdmin();
  await createContract({
    client_id: String(formData.get("client_id")),
    title: String(formData.get("title") ?? "").trim(),
    contract_number: String(formData.get("contract_number") ?? "").trim() || undefined,
    start_date: String(formData.get("start_date") ?? "") || undefined,
    end_date: String(formData.get("end_date") ?? "") || undefined,
    status: (formData.get("status") as "draft" | "active") || "draft",
    terms: String(formData.get("terms") ?? "").trim() || undefined,
  });
  revalidatePath("/admin/contracts");
}

export async function createEmployeeAction(formData: FormData) {
  await requireAdmin();
  await createEmployee({
    first_name: String(formData.get("first_name") ?? "").trim(),
    last_name: String(formData.get("last_name") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim() || undefined,
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    position: String(formData.get("position") ?? "").trim() || undefined,
    license_number: String(formData.get("license_number") ?? "").trim() || undefined,
    pay_rate: formData.get("pay_rate") ? Number(formData.get("pay_rate")) : undefined,
  });
  revalidatePath("/admin/employees");
}

export async function createJobOrderAction(formData: FormData) {
  await requireAdmin();
  await createJobOrder({
    client_id: String(formData.get("client_id")),
    title: String(formData.get("title") ?? "").trim(),
    role: String(formData.get("role") ?? "").trim(),
    location: String(formData.get("location") ?? "").trim() || undefined,
    shift_details: String(formData.get("shift_details") ?? "").trim() || undefined,
    start_date: String(formData.get("start_date") ?? "") || undefined,
    bill_rate: formData.get("bill_rate") ? Number(formData.get("bill_rate")) : undefined,
    pay_rate: formData.get("pay_rate") ? Number(formData.get("pay_rate")) : undefined,
    notes: String(formData.get("notes") ?? "").trim() || undefined,
  });
  revalidatePath("/admin/job-orders");
}

export async function createInvoiceAction(formData: FormData) {
  await requireAdmin();
  const subtotal = Number(formData.get("subtotal") ?? 0);
  const tax = Number(formData.get("tax") ?? 0);
  const total = subtotal + tax;
  const invoiceNumber = await generateInvoiceNumber();
  const dueDays = Number(formData.get("due_days") ?? 30);
  const issueDate = new Date();
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + dueDays);

  await createInvoice({
    client_id: String(formData.get("client_id")),
    invoice_number: invoiceNumber,
    issue_date: issueDate.toISOString().slice(0, 10),
    due_date: dueDate.toISOString().slice(0, 10),
    subtotal,
    tax,
    total,
    status: "sent",
    notes: String(formData.get("notes") ?? "").trim() || undefined,
  });
  revalidatePath("/admin/invoices");
  revalidatePath("/admin/payments");
}

export async function recordManualPaymentAction(formData: FormData) {
  await requireAdmin();
  await createPayment({
    client_id: String(formData.get("client_id") ?? "") || undefined,
    invoice_id: String(formData.get("invoice_id") ?? "") || undefined,
    amount: Number(formData.get("amount")),
    method: formData.get("method") as "wire" | "check" | "other",
    status: "completed",
    reference: String(formData.get("reference") ?? "").trim() || undefined,
    paid_at: new Date().toISOString(),
    notes: String(formData.get("notes") ?? "").trim() || undefined,
  });
  revalidatePath("/admin/payments");
  revalidatePath("/admin/payments/history");
  revalidatePath("/admin/payments/wire");
}

export async function saveSettingsAction(formData: FormData) {
  await requireAdmin();
  await upsertSettings("company", {
    invoice_prefix: String(formData.get("invoice_prefix") ?? "INV"),
    payment_terms_days: Number(formData.get("payment_terms_days") ?? 30),
    default_tax_rate: Number(formData.get("default_tax_rate") ?? 0),
    company_name: String(formData.get("company_name") ?? "Sompacare"),
    support_email: String(formData.get("support_email") ?? ""),
    support_phone: String(formData.get("support_phone") ?? ""),
  });
  revalidatePath("/admin/settings");
}

export async function linkStripeCustomerAction(clientId: string) {
  await requireAdmin();
  const { ensureStripeCustomer } = await import("@/lib/stripe");
  const { getClient } = await import("@/lib/supabase/ops");
  const client = await getClient(clientId);
  if (!client) throw new Error("Client not found.");
  const customerId = await ensureStripeCustomer({
    clientId: client.id,
    name: client.name,
    email: client.billing_email ?? client.email,
    existingCustomerId: client.stripe_customer_id,
  });
  await updateClient(clientId, { stripe_customer_id: customerId });
  revalidatePath("/admin/clients");
  revalidatePath("/admin/payments/ach");
  return customerId;
}
