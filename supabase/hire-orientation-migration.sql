-- Hire orientation & assignment details for applications
-- Run in Supabase SQL Editor

alter table applications add column if not exists hire_details jsonb not null default '{}'::jsonb;
alter table applications add column if not exists orientation_package_sent_at timestamptz;

create index if not exists applications_hire_details_idx on applications using gin (hire_details);
