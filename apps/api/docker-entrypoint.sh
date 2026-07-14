#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/packages/database

# Recover from failed deploys when candidates table was missing (b762fea)
if ! npx prisma migrate deploy 2>/tmp/migrate.log; then
  if grep -q "P3009\|failed migrations\|relation \"candidates\" does not exist" /tmp/migrate.log; then
    echo "Recovering failed migration state..."
    for mig in \
      20260713180000_career_funnel \
      20260713200000_referrals_job_postings \
      20260713210000_candidate_resume_storage \
      20260713230000_legal_consent_trust \
      20260713240000_enable_background_check_auto
    do
      npx prisma migrate resolve --rolled-back "$mig" 2>/dev/null || true
    done
    npx prisma migrate deploy
  else
    cat /tmp/migrate.log
    exit 1
  fi
fi

echo "Seeding platform roles and permissions..."
cd /app
if ! npm run db:seed:roles --workspace=@sompacare/database; then
  echo "WARN: role seed failed — starting API anyway (permissions may be stale)"
fi

echo "Starting API..."
cd /app/apps/api
exec node dist/main.js
