# Developer Onboarding Guide

## Prerequisites

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- Docker Desktop
- PostgreSQL client (optional)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start infrastructure
pnpm docker:up

# 3. Configure environment
cp .env.platform.example .env
# Add DATABASE_URL from example (default works with Docker)

# 4. Generate Prisma client & run migrations
npm run db:generate
npm run db:migrate

# 5. Seed roles, permissions, and demo data
npm run db:seed

# 6. Start the API
npm run dev:api
```

API: http://localhost:4000/api/v1  
Swagger: http://localhost:4000/api/v1/docs  
Health: http://localhost:4000/api/v1/health

## Dev Auth Tokens

Until Clerk is integrated (Milestone 2), use dev tokens:

| Role | Authorization Header |
|------|---------------------|
| Super Admin | `Bearer dev_dev_admin` |
| RN Nurse | `Bearer dev_dev_nurse_rn` |
| Facility Manager | `Bearer dev_dev_facility_mgr` |

## Example API Calls

```bash
# Health check (public)
curl http://localhost:4000/api/v1/health

# List published shifts (as nurse)
curl -H "Authorization: Bearer dev_dev_nurse_rn" \
  http://localhost:4000/api/v1/shifts

# Create shift (as facility manager)
curl -X POST http://localhost:4000/api/v1/shifts \
  -H "Authorization: Bearer dev_dev_facility_mgr" \
  -H "Content-Type: application/json" \
  -d '{
    "facilityId": "<facility-id>",
    "locationId": "seed-location-fox-chase",
    "title": "LPN — Weekend Coverage",
    "role": "LPN",
    "shiftType": "PER_DIEM",
    "hourlyRate": 38,
    "startTime": "2026-06-25T07:00:00Z",
    "endTime": "2026-06-25T19:00:00Z"
  }'

# Apply to shift (as nurse)
curl -X POST http://localhost:4000/api/v1/shifts/<shift-id>/applications \
  -H "Authorization: Bearer dev_dev_nurse_rn" \
  -H "Content-Type: application/json" \
  -d '{"message": "Available and credentialed"}'
```

## Project Structure

See [01-system-overview.md](./architecture/01-system-overview.md) for full architecture.

## Running Tests

```bash
pnpm test:rbac          # RBAC permission unit tests
pnpm --filter @sompacare/api test  # API tests (Milestone 2+)
```

## Legacy Web App

The existing marketing site and Supabase admin continue to run from the repo root:

```bash
pnpm dev:web   # http://localhost:3000
```

Migration to the new platform is documented in the development roadmap.
