-- Platform storage keys for careers resumes copied from Supabase
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "resume_storage_key" TEXT;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "resume_file_name" TEXT;
ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "resume_source_path" TEXT;
