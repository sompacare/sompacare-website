-- Referral codes on workers + referral tracking fields
ALTER TABLE "users" ADD COLUMN "referral_code" TEXT;
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");

ALTER TABLE "candidates" ADD COLUMN "referral_code" TEXT;

ALTER TABLE "referrals" ADD COLUMN "referral_code" TEXT;
ALTER TABLE "referrals" ADD COLUMN "candidate_id" TEXT;
ALTER TABLE "referrals" ADD COLUMN "qualified_at" TIMESTAMP(3);

CREATE INDEX "referrals_referral_code_idx" ON "referrals"("referral_code");
CREATE INDEX "referrals_referee_email_idx" ON "referrals"("referee_email");

ALTER TABLE "referrals" ADD CONSTRAINT "referrals_candidate_id_fkey"
  FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Job postings for dynamic careers page
CREATE TYPE "JobPostingStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

CREATE TABLE "job_postings" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "employment" TEXT NOT NULL,
  "locations" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "requirements" TEXT[],
  "clinical_role" "ClinicalRole" NOT NULL,
  "status" "JobPostingStatus" NOT NULL DEFAULT 'DRAFT',
  "published_at" TIMESTAMP(3),
  "created_by_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "job_postings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "job_postings_slug_key" ON "job_postings"("slug");
CREATE INDEX "job_postings_status_published_at_idx" ON "job_postings"("status", "published_at");

ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
