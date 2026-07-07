-- Sompacare Payroll module
-- Run in Supabase SQL Editor after admin-dashboard.sql

create table if not exists public.employee_pay_profiles (
  employee_id uuid primary key references public.employees(id) on delete cascade,
  pay_type text not null default 'hourly' check (pay_type in ('hourly', 'salary')),
  pay_frequency text not null default 'biweekly' check (pay_frequency in ('weekly', 'biweekly', 'semimonthly', 'monthly')),
  base_pay_rate numeric(10, 2) not null default 0,
  overtime_multiplier numeric(4, 2) not null default 1.5,
  direct_deposit_enabled boolean not null default true,
  bank_name text,
  bank_account_last4 text,
  bank_routing_last4 text,
  payment_method text not null default 'direct_deposit' check (payment_method in ('direct_deposit', 'check')),
  tax_profile jsonb not null default '{"federal_filing_status":"single","federal_allowances":0,"state_code":"","state_allowances":0}'::jsonb,
  benefit_deductions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.timesheets (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  job_order_id uuid references public.job_orders(id) on delete set null,
  work_date date not null,
  regular_hours numeric(6, 2) not null default 0,
  overtime_hours numeric(6, 2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'processed')),
  notes text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payroll_runs (
  id uuid primary key default gen_random_uuid(),
  run_number text not null unique,
  pay_period_start date not null,
  pay_period_end date not null,
  pay_date date not null,
  status text not null default 'draft' check (status in ('draft', 'processing', 'approved', 'paid', 'cancelled')),
  total_gross numeric(14, 2) not null default 0,
  total_deductions numeric(14, 2) not null default 0,
  total_net numeric(14, 2) not null default 0,
  employee_count integer not null default 0,
  approved_at timestamptz,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payroll_entries (
  id uuid primary key default gen_random_uuid(),
  payroll_run_id uuid not null references public.payroll_runs(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  job_order_id uuid references public.job_orders(id) on delete set null,
  regular_hours numeric(6, 2) not null default 0,
  overtime_hours numeric(6, 2) not null default 0,
  regular_rate numeric(10, 2) not null default 0,
  overtime_rate numeric(10, 2) not null default 0,
  gross_pay numeric(12, 2) not null default 0,
  federal_withholding numeric(12, 2) not null default 0,
  state_withholding numeric(12, 2) not null default 0,
  benefit_deductions numeric(12, 2) not null default 0,
  other_deductions numeric(12, 2) not null default 0,
  net_pay numeric(12, 2) not null default 0,
  payment_method text not null default 'direct_deposit' check (payment_method in ('direct_deposit', 'check')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid', 'void')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (payroll_run_id, employee_id)
);

create index if not exists idx_timesheets_employee on public.timesheets(employee_id);
create index if not exists idx_timesheets_status on public.timesheets(status);
create index if not exists idx_timesheets_work_date on public.timesheets(work_date);
create index if not exists idx_payroll_runs_status on public.payroll_runs(status);
create index if not exists idx_payroll_runs_pay_date on public.payroll_runs(pay_date);
create index if not exists idx_payroll_entries_run on public.payroll_entries(payroll_run_id);
create index if not exists idx_payroll_entries_employee on public.payroll_entries(employee_id);

drop trigger if exists employee_pay_profiles_updated_at on public.employee_pay_profiles;
create trigger employee_pay_profiles_updated_at before update on public.employee_pay_profiles for each row execute function public.set_updated_at();
drop trigger if exists timesheets_updated_at on public.timesheets;
create trigger timesheets_updated_at before update on public.timesheets for each row execute function public.set_updated_at();
drop trigger if exists payroll_runs_updated_at on public.payroll_runs;
create trigger payroll_runs_updated_at before update on public.payroll_runs for each row execute function public.set_updated_at();
drop trigger if exists payroll_entries_updated_at on public.payroll_entries;
create trigger payroll_entries_updated_at before update on public.payroll_entries for each row execute function public.set_updated_at();

alter table public.employee_pay_profiles enable row level security;
alter table public.timesheets enable row level security;
alter table public.payroll_runs enable row level security;
alter table public.payroll_entries enable row level security;
