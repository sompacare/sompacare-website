# Sompacare Staffing Platform — Build Status

Production healthcare staffing marketplace ("Uber for Healthcare Staffing").

## Architecture

| Layer | Technology |
|-------|-----------|
| Marketing site | Next.js 15 (root `app/`) |
| Platform API | NestJS + Prisma + PostgreSQL |
| Auth | Clerk JWT + dev tokens (local) |
| Mobile (planned) | React Native + Expo (M12) |
| Realtime (planned) | Socket.IO + FCM (M10) |

## Repository Layout

```
apps/
  api/                 NestJS REST API — production modules
  nurse-portal/        (M3) Worker marketplace web app
  facility-portal/     (M3) Facility shift management
packages/
  database/            Prisma schema (50 models)
  shared/              RBAC + compliance engine
docs/architecture/     System design, API spec, roadmap
```

## Milestone Progress

| Status | Milestone | Notes |
|--------|-----------|-------|
| ✅ | M1 Foundation | Monorepo, schema, Docker, RBAC, API skeleton |
| ✅ | M2 Auth & Users | Clerk JWT + webhook, worker profile endpoints |
| 🚧 | M3 Shift Marketplace | API lifecycle + Nurse Portal UI |
| 🔜 | M4 Timekeeping | GPS check-in/out |
| 🔜 | M5 Payments | Stripe Connect, wallet |
| 🔜 | M6–M14 | See [roadmap](./docs/architecture/02-development-roadmap.md) |

## API Modules (Live)

| Module | Endpoints | Status |
|--------|-----------|--------|
| Health | `GET /health` | ✅ |
| Auth | `GET /auth/me`, `POST /auth/webhook/clerk` | ✅ |
| Users | `GET /users` | ✅ |
| Organizations | CRUD | ✅ |
| Facilities | CRUD + locations | ✅ |
| Shifts | CRUD, publish, cancel, apply | ✅ |
| Applications | list, approve, reject, withdraw | ✅ |
| Assignments | list, confirm, cancel | ✅ |
| Compliance | worker evaluation, blocks expired credentials | ✅ |
| Workers | profile + compliance status | ✅ |
| Nurse Portal | Home, shifts, assignments, profile | ✅ (M3) |

## Nurse Portal

```bash
cp apps/nurse-portal/.env.local.example apps/nurse-portal/.env.local
# Add Clerk keys — see docs/clerk-setup.md
npm run dev --workspace=@sompacare/nurse-portal
```

Open http://localhost:3001

## Shift Lifecycle

```
Facility creates shift (DRAFT)
  → publish (PUBLISHED)
  → worker applies (compliance gate)
  → facility approves → assignment (PENDING_CONFIRMATION)
  → worker confirms (CONFIRMED, slotsFilled++)
  → [M4] check-in → timecard → payroll
```

## Local Development

```bash
cp .env.platform.example .env.platform
docker compose up -d
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev:api
```

**Dev auth tokens** (when `AUTH_ALLOW_DEV_TOKENS=true`):
- Admin: `Bearer dev_dev_admin`
- RN: `Bearer dev_dev_nurse_rn`
- Facility: `Bearer dev_dev_facility_mgr`

Swagger: http://localhost:4000/api/v1/docs

## Legacy Stack

Root Next.js app (`npm run dev:web`) = marketing site + Supabase admin (payroll, ATS, billing). Runs alongside platform during migration.
