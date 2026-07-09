#!/bin/sh
set -e
echo "Running database migrations..."
cd /app/packages/database
npx prisma migrate deploy
echo "Starting API..."
cd /app/apps/api
exec node dist/main.js
