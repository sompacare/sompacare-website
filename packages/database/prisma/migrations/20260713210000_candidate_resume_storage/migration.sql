-- Platform storage keys for careers resumes copied from Supabase
ALTER TABLE "candidates" ADD COLUMN "resume_storage_key" TEXT;
ALTER TABLE "candidates" ADD COLUMN "resume_file_name" TEXT;
ALTER TABLE "candidates" ADD COLUMN "resume_source_path" TEXT;
