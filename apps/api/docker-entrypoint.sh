#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/packages/database
if ! npx prisma migrate deploy; then
  echo "ERROR: prisma migrate deploy failed"
  exit 1
fi

echo "Seeding platform roles and permissions..."
cd /app
if ! npm run db:seed:roles --workspace=@sompacare/database; then
  echo "WARN: role seed failed — starting API anyway (permissions may be stale)"
fi

echo "Starting API..."
cd /app/apps/api
exec node dist/main.js
