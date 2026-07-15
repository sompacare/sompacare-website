-- Sompacare-owned internal facility for homecare shift posting
ALTER TABLE "facilities" ADD COLUMN "is_internal" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "facilities_is_internal_idx" ON "facilities"("is_internal");
