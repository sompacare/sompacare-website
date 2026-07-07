import "server-only";

import { getSupabaseAdmin } from "./admin";
import type {
  ClientRecord,
  ContractRecord,
  DashboardMetrics,
  DocumentRecord,
  EmployeeRecord,
  InvoiceRecord,
  JobOrderRecord,
  PaymentMethod,
  PaymentRecord,
  PaymentStatus,
} from "./ops-types";

function db() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export function isOpsConfigured(): boolean {
  return Boolean(getSupabaseAdmin());
}

// ─── Clients ───────────────────────────────────────────────────────────────

export async function listClients(): Promise<ClientRecord[]> {
  const { data, error } = await db().from("clients").select("*").order("name");
  if (error) throw error;
  return (data ?? []) as ClientRecord[];
}

export async function getClient(id: string): Promise<ClientRecord | null> {
  const { data, error } = await db().from("clients").select("*").eq("id", id).single();
  if (error) return null;
  return data as ClientRecord;
}

export async function createClient(input: Partial<ClientRecord> & { name: string }) {
  const { data, error } = await db().from("clients").insert(input).select().single();
  if (error) throw error;
  return data as ClientRecord;
}

export async function updateClient(id: string, input: Partial<ClientRecord>) {
  const { data, error } = await db().from("clients").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data as ClientRecord;
}

// ─── Contracts ─────────────────────────────────────────────────────────────

export async function listContracts(): Promise<ContractRecord[]> {
  const { data, error } = await db()
    .from("contracts")
    .select("*, clients(name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ContractRecord[];
}

export async function createContract(input: {
  client_id: string;
  title: string;
  contract_number?: string;
  start_date?: string;
  end_date?: string;
  status?: ContractRecord["status"];
  terms?: string;
}) {
  const { data, error } = await db().from("contracts").insert(input).select().single();
  if (error) throw error;
  return data as ContractRecord;
}

// ─── Employees ─────────────────────────────────────────────────────────────

export async function listEmployees(): Promise<EmployeeRecord[]> {
  const { data, error } = await db().from("employees").select("*").order("last_name");
  if (error) throw error;
  return (data ?? []) as EmployeeRecord[];
}

export async function createEmployee(input: {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  position?: string;
  license_number?: string;
  pay_rate?: number;
  application_id?: string;
}) {
  const { data, error } = await db().from("employees").insert(input).select().single();
  if (error) throw error;
  return data as EmployeeRecord;
}

// ─── Job Orders ────────────────────────────────────────────────────────────

export async function listJobOrders(): Promise<JobOrderRecord[]> {
  const { data, error } = await db()
    .from("job_orders")
    .select("*, clients(name), employees(first_name, last_name)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as JobOrderRecord[];
}

export async function createJobOrder(input: {
  client_id: string;
  title: string;
  role: string;
  contract_id?: string;
  location?: string;
  shift_details?: string;
  start_date?: string;
  end_date?: string;
  bill_rate?: number;
  pay_rate?: number;
  notes?: string;
}) {
  const { data, error } = await db().from("job_orders").insert(input).select().single();
  if (error) throw error;
  return data as JobOrderRecord;
}

// ─── Invoices ──────────────────────────────────────────────────────────────

export async function listInvoices(): Promise<InvoiceRecord[]> {
  const { data, error } = await db()
    .from("invoices")
    .select("*, clients(name, email, stripe_customer_id)")
    .order("issue_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as InvoiceRecord[];
}

export async function getInvoice(id: string): Promise<InvoiceRecord | null> {
  const { data, error } = await db()
    .from("invoices")
    .select("*, clients(name, email, stripe_customer_id)")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as InvoiceRecord;
}

export async function createInvoice(input: {
  client_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax?: number;
  total: number;
  status?: InvoiceRecord["status"];
  notes?: string;
}) {
  const { data, error } = await db().from("invoices").insert(input).select().single();
  if (error) throw error;
  return data as InvoiceRecord;
}

export async function updateInvoicePaidAmount(id: string, amountPaid: number, status: InvoiceRecord["status"]) {
  const { data, error } = await db()
    .from("invoices")
    .update({ amount_paid: amountPaid, status })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as InvoiceRecord;
}

export async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const { count } = await db()
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .gte("created_at", `${year}-01-01`);
  const seq = (count ?? 0) + 1;
  return `INV-${year}-${String(seq).padStart(4, "0")}`;
}

// ─── Payments ──────────────────────────────────────────────────────────────

export async function listPayments(filters?: {
  method?: PaymentMethod;
  status?: PaymentStatus;
}): Promise<PaymentRecord[]> {
  let query = db()
    .from("payments")
    .select("*, clients(name), invoices(invoice_number, total)")
    .order("created_at", { ascending: false });

  if (filters?.method) query = query.eq("method", filters.method);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PaymentRecord[];
}

export async function createPayment(input: {
  client_id?: string;
  invoice_id?: string;
  amount: number;
  method: PaymentMethod;
  status?: PaymentStatus;
  reference?: string;
  stripe_payment_intent_id?: string;
  stripe_charge_id?: string;
  paid_at?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}) {
  const { data, error } = await db().from("payments").insert(input).select().single();
  if (error) throw error;
  return data as PaymentRecord;
}

export async function updatePayment(id: string, input: Partial<PaymentRecord>) {
  const { data, error } = await db().from("payments").update(input).eq("id", id).select().single();
  if (error) throw error;
  return data as PaymentRecord;
}

export async function getOutstandingInvoices(): Promise<InvoiceRecord[]> {
  const { data, error } = await db()
    .from("invoices")
    .select("*, clients(name, email, stripe_customer_id)")
    .in("status", ["sent", "partial", "overdue"])
    .order("due_date");
  if (error) throw error;
  return (data ?? []) as InvoiceRecord[];
}

export async function getPaidInvoices(): Promise<InvoiceRecord[]> {
  const { data, error } = await db()
    .from("invoices")
    .select("*, clients(name)")
    .eq("status", "paid")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as InvoiceRecord[];
}

// ─── Documents ─────────────────────────────────────────────────────────────

export async function listDocuments(): Promise<DocumentRecord[]> {
  const { data, error } = await db().from("documents").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as DocumentRecord[];
}

export async function createDocument(input: Omit<DocumentRecord, "id" | "created_at">) {
  const { data, error } = await db().from("documents").insert(input).select().single();
  if (error) throw error;
  return data as DocumentRecord;
}

// ─── Settings ──────────────────────────────────────────────────────────────

export async function getSettings(key: string): Promise<Record<string, unknown>> {
  const { data, error } = await db().from("admin_settings").select("value").eq("key", key).single();
  if (error) return {};
  return (data?.value as Record<string, unknown>) ?? {};
}

export async function upsertSettings(key: string, value: Record<string, unknown>) {
  const { error } = await db().from("admin_settings").upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
}

// ─── Reports / Metrics ─────────────────────────────────────────────────────

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = db();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [clients, employees, jobOrders, invoices, payments, applications] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase.from("employees").select("*", { count: "exact", head: true }),
    supabase.from("job_orders").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("invoices").select("total, amount_paid, status").in("status", ["sent", "partial", "overdue"]),
    supabase
      .from("payments")
      .select("amount")
      .eq("status", "completed")
      .gte("paid_at", monthStart),
    supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "new"),
  ]);

  const outstandingBalance = (invoices.data ?? []).reduce(
    (sum, inv) => sum + (Number(inv.total) - Number(inv.amount_paid)),
    0,
  );
  const paidThisMonth = (payments.data ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

  return {
    clients: clients.count ?? 0,
    employees: employees.count ?? 0,
    openJobOrders: jobOrders.count ?? 0,
    outstandingBalance,
    paidThisMonth,
    pendingApplications: applications.count ?? 0,
  };
}

export async function getPaymentSummary() {
  const payments = await listPayments();
  const completed = payments.filter((p) => p.status === "completed");
  return {
    totalCollected: completed.reduce((s, p) => s + Number(p.amount), 0),
    achTotal: completed.filter((p) => p.method === "ach").reduce((s, p) => s + Number(p.amount), 0),
    cardTotal: completed.filter((p) => p.method === "credit_card").reduce((s, p) => s + Number(p.amount), 0),
    wireTotal: completed.filter((p) => p.method === "wire").reduce((s, p) => s + Number(p.amount), 0),
    pendingCount: payments.filter((p) => p.status === "pending" || p.status === "processing").length,
  };
}
