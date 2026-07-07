-- Sompacare Admin Dashboard schema
-- Run in Supabase SQL Editor after schema.sql

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Clients
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'facility' check (type in ('facility', 'family', 'agency', 'other')),
  email text,
  phone text,
  billing_email text,
  billing_address text,
  contact_name text,
  status text not null default 'active' check (status in ('active', 'inactive', 'prospect')),
  stripe_customer_id text,
  stripe_payment_method_id text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Contracts
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  title text not null,
  contract_number text,
  start_date date,
  end_date date,
  status text not null default 'draft' check (status in ('draft', 'active', 'expired', 'terminated')),
  rate_schedule jsonb not null default '{}'::jsonb,
  terms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Employees
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  position text,
  license_number text,
  status text not null default 'active' check (status in ('active', 'inactive', 'on_assignment')),
  pay_rate numeric(10, 2),
  hired_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Job orders
create table if not exists public.job_orders (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  contract_id uuid references public.contracts(id) on delete set null,
  employee_id uuid references public.employees(id) on delete set null,
  title text not null,
  role text not null,
  location text,
  shift_details text,
  start_date date,
  end_date date,
  status text not null default 'open' check (status in ('open', 'filled', 'in_progress', 'completed', 'cancelled')),
  bill_rate numeric(10, 2),
  pay_rate numeric(10, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Invoices
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  invoice_number text not null unique,
  issue_date date not null default current_date,
  due_date date not null,
  subtotal numeric(12, 2) not null default 0,
  tax numeric(12, 2) not null default 0,
  total numeric(12, 2) not null default 0,
  amount_paid numeric(12, 2) not null default 0,
  status text not null default 'draft' check (status in ('draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled')),
  line_items jsonb not null default '[]'::jsonb,
  notes text,
  stripe_invoice_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  amount numeric(12, 2) not null,
  method text not null check (method in ('ach', 'credit_card', 'wire', 'check', 'other')),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'refunded')),
  reference text,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  paid_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Documents
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('client', 'contract', 'employee', 'job_order', 'invoice')),
  entity_id uuid not null,
  title text not null,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  uploaded_by text not null default 'admin',
  created_at timestamptz not null default now()
);

-- Settings (key-value)
create table if not exists public.admin_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_contracts_client on public.contracts(client_id);
create index if not exists idx_job_orders_client on public.job_orders(client_id);
create index if not exists idx_job_orders_status on public.job_orders(status);
create index if not exists idx_invoices_client on public.invoices(client_id);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_payments_client on public.payments(client_id);
create index if not exists idx_payments_invoice on public.payments(invoice_id);
create index if not exists idx_payments_method on public.payments(method);
create index if not exists idx_payments_status on public.payments(status);
create index if not exists idx_documents_entity on public.documents(entity_type, entity_id);

-- Updated_at triggers
drop trigger if exists clients_updated_at on public.clients;
create trigger clients_updated_at before update on public.clients for each row execute function public.set_updated_at();
drop trigger if exists contracts_updated_at on public.contracts;
create trigger contracts_updated_at before update on public.contracts for each row execute function public.set_updated_at();
drop trigger if exists employees_updated_at on public.employees;
create trigger employees_updated_at before update on public.employees for each row execute function public.set_updated_at();
drop trigger if exists job_orders_updated_at on public.job_orders;
create trigger job_orders_updated_at before update on public.job_orders for each row execute function public.set_updated_at();
drop trigger if exists invoices_updated_at on public.invoices;
create trigger invoices_updated_at before update on public.invoices for each row execute function public.set_updated_at();
drop trigger if exists payments_updated_at on public.payments;
create trigger payments_updated_at before update on public.payments for each row execute function public.set_updated_at();

-- RLS (service role only — same pattern as applications)
alter table public.clients enable row level security;
alter table public.contracts enable row level security;
alter table public.employees enable row level security;
alter table public.job_orders enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.documents enable row level security;
alter table public.admin_settings enable row level security;

-- Default settings
insert into public.admin_settings (key, value) values
  ('company', '{"invoice_prefix":"INV","payment_terms_days":30,"default_tax_rate":0}'::jsonb),
  ('notifications', '{"payment_receipts":true}'::jsonb)
on conflict (key) do nothing;

-- Storage bucket for business documents
insert into storage.buckets (id, name, public, file_size_limit)
values ('business-documents', 'business-documents', false, 52428800)
on conflict (id) do nothing;
