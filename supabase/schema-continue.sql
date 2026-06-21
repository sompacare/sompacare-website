-- Run this if you already got: type "application_status" already exists
-- Skips the enum step and creates everything else

create extension if not exists "pgcrypto";

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  address_line1 text not null,
  city text not null,
  state text not null,
  zip text not null,
  position text not null,
  position_label text not null,
  license_number text,
  license_state text,
  certifications text[] not null default '{}',
  experience text not null,
  availability text not null,
  additional_notes text,
  resume_url text,
  resume_file_name text,
  certification_urls jsonb not null default '[]',
  status application_status not null default 'new',
  onboarding_sent_at timestamptz
);

create index if not exists applications_created_at_idx on applications (created_at desc);
create index if not exists applications_status_idx on applications (status);
create index if not exists applications_position_idx on applications (position);
create index if not exists applications_email_idx on applications (email);

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists applications_updated_at on applications;
create trigger applications_updated_at
  before update on applications
  for each row execute function set_updated_at();

alter table applications enable row level security;
