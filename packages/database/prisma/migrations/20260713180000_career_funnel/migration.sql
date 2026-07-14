-- Career funnel: link Supabase careers applications to recruiter pipeline
ALTER TABLE "candidates" ADD COLUMN "source_application_id" TEXT;

CREATE UNIQUE INDEX "candidates_source_application_id_key" ON "candidates"("source_application_id");
