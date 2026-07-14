-- Legal documents and user consent audit trail (idempotent for Render redeploys)
DO $$ BEGIN
  CREATE TYPE "LegalDocumentType" AS ENUM ('PRIVACY_POLICY', 'TERMS_OF_SERVICE', 'BACKGROUND_CHECK_DISCLOSURE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "legal_documents" (
    "id" TEXT NOT NULL,
    "type" "LegalDocumentType" NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "content" JSONB NOT NULL,
    "effective_at" TIMESTAMP(3) NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legal_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_consents" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "email" TEXT,
    "document_type" "LegalDocumentType" NOT NULL,
    "document_version" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "legal_documents_type_version_key" ON "legal_documents"("type", "version");
CREATE INDEX IF NOT EXISTS "legal_documents_type_is_current_idx" ON "legal_documents"("type", "is_current");
CREATE INDEX IF NOT EXISTS "user_consents_email_document_type_idx" ON "user_consents"("email", "document_type");
CREATE INDEX IF NOT EXISTS "user_consents_user_id_document_type_idx" ON "user_consents"("user_id", "document_type");

DO $$ BEGIN
  ALTER TABLE "user_consents" ADD CONSTRAINT "user_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
