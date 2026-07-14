-- Enable automatic Checkr screening when offers are accepted
INSERT INTO "feature_flags" ("id", "key", "description", "is_enabled", "updated_at")
VALUES (
  'ff_background_check_auto',
  'background_check_auto',
  'Auto-trigger Checkr on offer',
  true,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("key") DO UPDATE SET
  "is_enabled" = true,
  "description" = EXCLUDED."description",
  "updated_at" = CURRENT_TIMESTAMP;
