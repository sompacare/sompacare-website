-- Recruiter pipeline tables (missing from init; required before career_funnel alters)
DO $$ BEGIN
  CREATE TYPE "CandidatePipelineStage" AS ENUM (
    'APPLIED',
    'SCREENING',
    'INTERVIEW',
    'OFFER',
    'PLACED',
    'REJECTED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "candidates" (
    "id" TEXT NOT NULL,
    "recruiter_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "clinical_role" "ClinicalRole" NOT NULL,
    "stage" "CandidatePipelineStage" NOT NULL DEFAULT 'APPLIED',
    "resume_url" TEXT,
    "resume_parsed_at" TIMESTAMP(3),
    "resume_parsed_data" JSONB,
    "source" TEXT,
    "notes" TEXT,
    "worker_id" TEXT,
    "facility_id" TEXT,
    "match_score" INTEGER,
    "background_check_status" TEXT DEFAULT 'pending',
    "reference_status" TEXT DEFAULT 'pending',
    "offer_sent_at" TIMESTAMP(3),
    "offer_accepted_at" TIMESTAMP(3),
    "onboarding_sent_at" TIMESTAMP(3),
    "placed_at" TIMESTAMP(3),
    "hire_details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "candidate_interviews" (
    "id" TEXT NOT NULL,
    "candidate_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'video',
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_interviews_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "candidates_recruiter_id_stage_idx" ON "candidates"("recruiter_id", "stage");
CREATE INDEX IF NOT EXISTS "candidates_stage_idx" ON "candidates"("stage");
CREATE INDEX IF NOT EXISTS "candidates_email_idx" ON "candidates"("email");
CREATE INDEX IF NOT EXISTS "candidate_interviews_candidate_id_idx" ON "candidate_interviews"("candidate_id");

DO $$ BEGIN
  ALTER TABLE "candidates" ADD CONSTRAINT "candidates_recruiter_id_fkey"
    FOREIGN KEY ("recruiter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "candidates" ADD CONSTRAINT "candidates_worker_id_fkey"
    FOREIGN KEY ("worker_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "candidates" ADD CONSTRAINT "candidates_facility_id_fkey"
    FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "candidate_interviews" ADD CONSTRAINT "candidate_interviews_candidate_id_fkey"
    FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
