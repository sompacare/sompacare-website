# Sompacare Staffing Platform — Build Status

Production healthcare staffing marketplace ("Uber for Healthcare Staffing").

## Architecture

| Layer | Technology |
|-------|-----------|
| Marketing site | Next.js 15 (root `app/`) |
| Platform API | NestJS + Prisma + PostgreSQL |
| Auth | Clerk JWT + dev tokens (local) |
| Mobile | React Native + Expo (M12) | ✅ Nurse + facility apps |
| Realtime (planned) | Socket.IO + FCM (M10) |

## Repository Layout

```
apps/
  api/                 NestJS REST API — production modules
  nurse-portal/        (M3) Worker marketplace web app
  facility-portal/     (M3) Facility shift management
  recruiter-portal/    (M8) Recruiter pipeline & placements
  admin-portal/        (M11) Platform admin dashboard
  mobile-nurse/        (M12) React Native nurse app (Expo)
  mobile-facility/     (M12) React Native facility app (Expo)
packages/
  mobile-shared/       (M12) Shared mobile API client + offline queue
  database/            Prisma schema (50 models)
  shared/              RBAC + compliance engine
infra/
  terraform/           (M13) AWS VPC, RDS, ElastiCache, ECS, S3
  observability/       (M13) Prometheus + Grafana config
loadtests/             (M13) k6 shift search load tests
docs/
  launch/              (M14) Cutover runbook, incident response, launch checklist
  guides/              (M14) Nurse, facility, admin, recruiter user guides
docs/architecture/     System design, API spec, roadmap
```

## Milestone Progress

| Status | Milestone | Notes |
|--------|-----------|-------|
| ✅ | M1 Foundation | Monorepo, schema, Docker, RBAC, API skeleton |
| ✅ | M2 Auth & Users | Clerk JWT + webhook, worker profile endpoints |
| 🚧 | M3 Shift Marketplace | Portals + notifications + shift detail + deploy configs |
| 🚧 | M4 Timekeeping | GPS clock in/out, timecards, facility approval |
| 🚧 | M5 Payments | Wallet, Stripe Connect, invoicing, instant pay |
| 🚧 | M6 Payroll | Pay runs, overtime, batch payouts, CSV export |
| 🚧 | M7 Compliance | License/cert CRUD, verification queue, expiry alerts, Checkr dev |
| ✅ | M8 Recruiter Portal | Pipeline kanban, interviews, offers, resume parse, leaderboard |
| ✅ | M9 AI Engine | Shift matching, recommendations, payroll anomalies, compliance risks |
| ✅ | M10 Real-time | WebSocket, notification center, SMS/push dev, reminder jobs |
| ✅ | M11 Admin Platform | Dashboard KPIs, audit logs, support tickets, feature flags, admin portal |
| ✅ | M12 Mobile Apps | Expo nurse + facility apps, offline clock queue, biometrics, push tokens |
| ✅ | M13 DevOps | Terraform AWS, GitHub Actions CI, Prometheus/Grafana, k6 load tests |
| ✅ | M14 Launch | Runbooks, user guides, pentest tracker, incident response, launch checklist |

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
| Compliance | licenses, certs, verify queue, alerts, score sync, Checkr dev | ✅ (M7) |
| Workers | profile + compliance status | ✅ |
| Timekeeping | clock-in/out with GPS geofence | ✅ (M4) |
| Timecards | list, approve submitted timecards | ✅ (M4) |
| Notifications | email + in-app on apply/approve | ✅ (M3 polish) |
| Wallet | balance, transactions, instant pay | ✅ (M5) |
| Payments | Stripe Connect onboard, webhooks | ✅ (M5) |
| Invoices | auto on timecard approve, facility pay | ✅ (M5) |
| Payroll | pay runs, OT rules, approve, process, export | ✅ (M6) |
| Recruiters | pipeline, candidates, interviews, offers, metrics, leaderboard | ✅ (M8) |
| AI Engine | shift matches, recommendations, payroll anomalies, compliance risks | ✅ (M9) |
| Real-time | WebSocket gateway, notification center, BullMQ reminders, SMS/push dev | ✅ (M10) |
| Admin | Dashboard KPIs, audit logs, support tickets, feature flags, insights | ✅ (M11) |
| Nurse Portal | Home, shifts, schedule, wallet, credentials, profile | ✅ |
| Facility Portal | Shifts, applicants, schedule, payroll, compliance queue | ✅ |
| Recruiter Portal | Home metrics, pipeline kanban, candidate detail, leaderboard | ✅ (M8) |
| Admin Portal | Dashboard, users, facilities, support, audit, flags, insights | ✅ (M11) |
| Mobile | Config, push tokens, nurse/facility Expo apps | ✅ (M12) |
| Observability | Prometheus metrics, Sentry hook, health+redis | ✅ (M13) |

## Nurse Portal

```bash
cp apps/nurse-portal/.env.local.example apps/nurse-portal/.env.local
# Add Clerk keys — see docs/clerk-setup.md
npm run dev --workspace=@sompacare/nurse-portal
```

Open http://localhost:3001

## Facility Portal

```bash
cp apps/facility-portal/env.local.example apps/facility-portal/.env.local
# Same Clerk keys as nurse portal — see docs/clerk-setup.md
npm run dev --workspace=@sompacare/facility-portal
```

Open http://localhost:3002

## Recruiter Portal

```bash
cp apps/recruiter-portal/env.local.example apps/recruiter-portal/.env.local
# Add Clerk keys — or use dev token mode (see env.local.example)
npm run dev --workspace=@sompacare/recruiter-portal
```

Open http://localhost:3003

**Pages:** Home dashboard · Pipeline kanban · Candidate detail (interviews, offers, resume parse) · Leaderboard

**Dev token:** `Bearer dev_dev_recruiter`

```bash
node scripts/test-m8-recruiter.mjs
```

## AI Engine (M9)

Rules-based matching with OpenAI dev bypass. Powers shift match scores across nurse and facility portals.

```bash
node scripts/test-m9-ai.mjs
```

**Endpoints:**
- `GET /shifts/:id/matches` — AI-ranked workers for a shift (facility)
- `GET /ai/recommendations/shifts` — personalized shift feed (nurse)
- `GET /ai/payroll/anomalies` — timecard fraud/missing clock-out alerts
- `GET /ai/compliance/risks/:userId` — compliance risk flags

Set `AI_MATCHING_DEV_BYPASS=true` in `.env` for local dev without OpenAI.

## Real-time (M10)

Socket.IO live updates + in-app notification center in nurse and facility portals.

```bash
node scripts/test-m10-realtime.mjs
```

**WebSocket:** `ws://localhost:4000/realtime` (auth via `auth.token` in handshake)

**New API:**
- `GET /notifications/unread-count`
- `POST /notifications/read-all`

**Portal:** Bell icon in header → `/notifications` page (live updates via WebSocket + 30s polling fallback)

Dev bypass flags: `JOBS_DEV_BYPASS`, `SMS_DEV_BYPASS`, `PUSH_DEV_BYPASS` (all default `true`)

## Admin Portal (M11)

Platform administration dashboard backed by NestJS admin module.

```bash
cp apps/admin-portal/env.local.example apps/admin-portal/.env.local
npm run dev --workspace=@sompacare/admin-portal
```

Open http://localhost:3004

**Pages:** Dashboard · Users · Facilities · Support tickets · Audit logs · Feature flags · AI insights

**Dev token:** `Bearer dev_dev_admin`

```bash
node scripts/test-m11-admin.mjs
```

**Endpoints:**
- `GET /admin/dashboard` — platform KPIs
- `GET /admin/insights` — activity summary
- `GET /admin/audit-logs` — audit trail
- `GET/POST/PATCH /admin/support-tickets` — support queue
- `GET/PATCH /admin/feature-flags/:key` — feature toggles

## Mobile Apps (M12)

React Native (Expo) apps for nurses and facility managers, sharing `@sompacare/mobile-shared`.

```bash
# Nurse app (Metro port 8081)
cp apps/mobile-nurse/env.example apps/mobile-nurse/.env
npm run dev --workspace=@sompacare/mobile-nurse

# Facility app (Metro port 8082)
cp apps/mobile-facility/env.example apps/mobile-facility/.env
npm run dev --workspace=@sompacare/mobile-facility

# Both apps
npm run dev:mobile
```

**Nurse app tabs:** Home · Shifts · Schedule (GPS clock + offline queue) · Wallet · Profile (biometrics + camera upload)

**Facility app tabs:** Dashboard · Shifts · Applicants · Timecards

**Dev tokens:** same as web portals (`dev_dev_nurse_rn`, `dev_dev_facility_mgr`)

**Android emulator API URL:** use `http://10.0.2.2:4000/api/v1` instead of localhost

```bash
node scripts/test-m12-mobile.mjs
npm run test:mobile-shared
```

**New API:**
- `GET /mobile/config` — feature flags for mobile (public)
- `POST /mobile/push-token` — register Expo push token

## DevOps (M13)

Infrastructure-as-code, CI/CD, observability, and load testing.

```bash
node scripts/test-m13-devops.mjs
```

### Terraform (AWS)

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # edit values
terraform init
terraform plan
```

**Modules:** VPC · RDS PostgreSQL · ElastiCache Redis · ECS Fargate + ALB · S3 documents bucket

### CI/CD

GitHub Actions workflows:
- `.github/workflows/ci.yml` — lint, test, build API, Terraform validate, Docker build
- `.github/workflows/deploy.yml` — manual ECS deploy (requires AWS secrets)

### Observability

```bash
npm run docker:observability   # Prometheus :9090, Grafana :3005
```

**New API:**
- `GET /metrics` — Prometheus scrape endpoint
- `GET /health` — now includes Redis status

Set `SENTRY_DSN` for error tracking (optional). `METRICS_ENABLED=true` by default.

### Load testing (k6)

```bash
# Local smoke (100 VUs)
npm run loadtest:shifts

# Production-scale target (10K VUs) — set LOAD_TEST_MODE=true on API first
LOAD_TEST_MODE=true npm run dev:api
k6 run --vus 10000 --duration 2m loadtests/shift-search.k6.js
```

## Launch (M14)

Production documentation, runbooks, and go-live readiness.

```bash
npm run test:launch
# or: node scripts/test-m14-launch.mjs
```

**Documentation index:** [docs/launch/README.md](./docs/launch/README.md)

| Document | Purpose |
|----------|---------|
| [launch-checklist.md](./docs/launch/launch-checklist.md) | Master go-live checklist |
| [production-cutover-runbook.md](./docs/launch/production-cutover-runbook.md) | Cutover steps & rollback |
| [incident-response.md](./docs/launch/incident-response.md) | On-call & severity playbooks |
| [security-pentest-remediation.md](./docs/launch/security-pentest-remediation.md) | Security controls tracker |

**User guides:** [nurse](./docs/guides/nurse-portal-guide.md) · [facility](./docs/guides/facility-portal-guide.md) · [admin](./docs/guides/admin-portal-guide.md) · [recruiter](./docs/guides/recruiter-portal-guide.md)

**Production env:** copy [`.env.production.example`](./.env.production.example) to your secrets manager (never commit real values).

Link a Clerk user as facility manager:

```bash
node scripts/link-facility-user.mjs --email you@example.com
```

**Pages:** Home dashboard · My Shifts (draft/publish) · Shift detail + applicants · Applicants · Staff schedule + timecard approval

Deploy guide: [docs/deploy-platform.md](./docs/deploy-platform.md)

Run API + all portals:

```bash
npm run dev:platform
```

## Shift Lifecycle

```
Facility creates shift (DRAFT)
  → publish (PUBLISHED)
  → worker applies (compliance gate)
  → facility approves → assignment (PENDING_CONFIRMATION)
  → worker confirms (CONFIRMED, slotsFilled++)
  → [M4] GPS clock-in → clock-out → timecard (SUBMITTED)
  → facility approves timecard (APPROVED) + invoice created
  → [M6] generate pay run → approve → process → wallet credited (PAID)
  → nurse instant pay / facility pays invoice
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
- Recruiter: `Bearer dev_dev_recruiter`

Swagger: http://localhost:4000/api/v1/docs

## Legacy Stack

Root Next.js app (`npm run dev:web`) = marketing site + Supabase admin (payroll, ATS, billing). Runs alongside platform during migration.
