-- Run in Supabase SQL Editor AFTER schema.sql
-- Creates the private bucket for resume and certification uploads

insert into storage.buckets (id, name, public, file_size_limit)
values ('application-files', 'application-files', false, 10485760)
on conflict (id) do nothing;
