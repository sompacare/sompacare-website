#!/bin/sh
set -e
echo "Running database migrations..."
cd /app/packages/database
npx prisma migrate deploy
echo "Seeding platform roles and permissions..."
cd /app
npm run db:seed:roles --workspace=@sompacare/database
echo "Starting API..."
cd /app/apps/api
exec node dist/main.js
