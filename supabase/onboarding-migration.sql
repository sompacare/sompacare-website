-- Run in Supabase SQL Editor if applications table already exists
alter table applications add column if not exists onboarding_sent_at timestamptz;
