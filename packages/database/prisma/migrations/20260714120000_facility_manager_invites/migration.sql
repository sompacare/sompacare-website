-- CreateEnum
CREATE TYPE "FacilityInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "facility_manager_invites" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "FacilityInviteStatus" NOT NULL DEFAULT 'PENDING',
    "organization_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "invited_by_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "accepted_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facility_manager_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "facility_manager_invites_token_key" ON "facility_manager_invites"("token");

-- CreateIndex
CREATE INDEX "facility_manager_invites_email_status_idx" ON "facility_manager_invites"("email", "status");

-- CreateIndex
CREATE INDEX "facility_manager_invites_token_idx" ON "facility_manager_invites"("token");

-- AddForeignKey
ALTER TABLE "facility_manager_invites" ADD CONSTRAINT "facility_manager_invites_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_manager_invites" ADD CONSTRAINT "facility_manager_invites_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_manager_invites" ADD CONSTRAINT "facility_manager_invites_invited_by_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facility_manager_invites" ADD CONSTRAINT "facility_manager_invites_accepted_by_id_fkey" FOREIGN KEY ("accepted_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
