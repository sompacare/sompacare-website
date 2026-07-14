-- Add HIRED stage and hired_at timestamp for portal invite tracking
ALTER TYPE "CandidatePipelineStage" ADD VALUE IF NOT EXISTS 'HIRED';

ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "hired_at" TIMESTAMP(3);
