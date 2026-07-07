-- Creates admin_settings if missing (safe to re-run)
create table if not exists public.admin_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.admin_settings enable row level security;

insert into public.admin_settings (key, value) values
  ('company', '{"invoice_prefix":"INV","payment_terms_days":30,"default_tax_rate":0}'::jsonb),
  ('notifications', '{"payment_receipts":true}'::jsonb)
on conflict (key) do nothing;
