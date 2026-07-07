export type ClientRecord = {
  id: string;
  name: string;
  type: "facility" | "family" | "agency" | "other";
  email: string | null;
  phone: string | null;
  billing_email: string | null;
  billing_address: string | null;
  contact_name: string | null;
  status: "active" | "inactive" | "prospect";
  stripe_customer_id: string | null;
  stripe_payment_method_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ContractRecord = {
  id: string;
  client_id: string;
  title: string;
  contract_number: string | null;
  start_date: string | null;
  end_date: string | null;
  status: "draft" | "active" | "expired" | "terminated";
  rate_schedule: Record<string, unknown>;
  terms: string | null;
  created_at: string;
  updated_at: string;
  clients?: Pick<ClientRecord, "name"> | null;
};

export type EmployeeRecord = {
  id: string;
  application_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  license_number: string | null;
  status: "active" | "inactive" | "on_assignment";
  pay_rate: number | null;
  hired_at: string | null;
  created_at: string;
  updated_at: string;
};

export type JobOrderRecord = {
  id: string;
  client_id: string;
  contract_id: string | null;
  employee_id: string | null;
  title: string;
  role: string;
  location: string | null;
  shift_details: string | null;
  start_date: string | null;
  end_date: string | null;
  status: "open" | "filled" | "in_progress" | "completed" | "cancelled";
  bill_rate: number | null;
  pay_rate: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  clients?: Pick<ClientRecord, "name"> | null;
  employees?: Pick<EmployeeRecord, "first_name" | "last_name"> | null;
};

export type InvoiceLineItem = {
  description: string;
  quantity: number;
  unit_rate: number;
  amount: number;
};

export type InvoiceRecord = {
  id: string;
  client_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax: number;
  total: number;
  amount_paid: number;
  status: "draft" | "sent" | "partial" | "paid" | "overdue" | "cancelled";
  line_items: InvoiceLineItem[];
  notes: string | null;
  stripe_invoice_id: string | null;
  created_at: string;
  updated_at: string;
  clients?: Pick<ClientRecord, "name" | "email" | "stripe_customer_id"> | null;
};

export type PaymentMethod = "ach" | "credit_card" | "wire" | "check" | "other";
export type PaymentStatus = "pending" | "processing" | "completed" | "failed" | "refunded";

export type PaymentRecord = {
  id: string;
  client_id: string | null;
  invoice_id: string | null;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string | null;
  stripe_payment_intent_id: string | null;
  stripe_charge_id: string | null;
  paid_at: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  clients?: Pick<ClientRecord, "name"> | null;
  invoices?: Pick<InvoiceRecord, "invoice_number" | "total"> | null;
};

export type DocumentRecord = {
  id: string;
  entity_type: "client" | "contract" | "employee" | "job_order" | "invoice";
  entity_id: string;
  title: string;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  uploaded_by: string;
  created_at: string;
};

export type DashboardMetrics = {
  clients: number;
  employees: number;
  openJobOrders: number;
  outstandingBalance: number;
  paidThisMonth: number;
  pendingApplications: number;
};
