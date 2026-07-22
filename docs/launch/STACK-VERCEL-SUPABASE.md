# Run Sompacare without Render

Use only what you already pay for: **GitHub**, **Vercel**, **Supabase**, **Clerk** (via portals), **Resend**, **Stripe**, and **Cursor** for development.

Render is optional. Its **build pipeline minutes** only affect Render-hosted builds—not Vercel.

---

## Target architecture

```
                    ┌─────────────────────────────────────────┐
                    │              Vercel                      │
                    │  • www.sompacare.com (marketing, root)   │
                    │  • nurse / facility / recruiter / admin   │
                    │  • api.sompacare.com (NestJS serverless) │
                    └───────────────┬─────────────────────────┘
                                    │ HTTPS / REST
                    ┌───────────────▼─────────────────────────┐
                    │           Supabase                       │
                    │  • PostgreSQL (Prisma DATABASE_URL)      │
                    │  • Storage (resumes — already used)      │
                    └─────────────────────────────────────────┘

GitHub ──push──► Vercel (auto deploy, no “build minutes” quota like Render)
GitHub Actions ──► prisma migrate deploy (optional, on release)

Clerk ──webhook──► api.sompacare.com/api/v1/auth/webhook/clerk
Stripe ──webhook──► api.sompacare.com/api/v1/payments/stripe/webhook
Resend ──► API env on Vercel (transactional email)
```

| Concern | Tool | Notes |
|--------|------|--------|
| Next.js (5 apps) | **Vercel** | One project per app; see [VERCEL-PORTALS.md](./VERCEL-PORTALS.md) |
| PostgreSQL | **Supabase** | Replace Render `sompacare-db`; Prisma stays the same |
| NestJS API | **Vercel** (6th project) | Serverless HTTP; see **API on Vercel** below |
| File storage | **Supabase Storage** | Already wired for careers resumes |
| Email | **Resend** | API + marketing env vars |
| Payments | **Stripe** | Webhooks point at Vercel API URL |
| Auth | **Clerk** | Same keys on Vercel portal + API projects |
| CI / migrations | **GitHub Actions** | [`.github/workflows/supabase-migrate.yml`](../../.github/workflows/supabase-migrate.yml) |

---

## Phase 1 — Portals off Render (fast win)

1. Create **four Vercel projects** (root dirs under `apps/*-portal`), branch **`platform`**.
2. Copy env from Render env group → Vercel (**Clerk** + `NEXT_PUBLIC_API_URL=https://api.sompacare.com/api/v1`).
3. Attach custom domains (`nurse.sompacare.com`, etc.) in Vercel.
4. **Suspend** Render portal services (keep API on Render until Phase 3 if needed).

No more Render minutes burned on four Next builds.

Details: [VERCEL-PORTALS.md](./VERCEL-PORTALS.md).

---

## Phase 2 — Database on Supabase

1. **Supabase** → Project → **Settings** → **Database** → connection string (URI).
2. Use the **Transaction pooler** (port **6543**) for serverless/API:

   ```
   postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

3. For **migrations**, use **Session mode** or direct connection (port **5432**) once:

   ```bash
   cd packages/database
   set DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[ref].supabase.co:5432/postgres
   npx prisma migrate deploy
   npm run db:seed:roles
   ```

4. **Migrate data** from Render Postgres (one time):

   ```bash
   pg_dump "$RENDER_DATABASE_URL" --no-owner --no-acl -F c -f sompacare.dump
   pg_restore -d "$SUPABASE_DIRECT_URL" --no-owner --no-acl sompacare.dump
   ```

   Run from a trusted machine; rotate passwords after.

5. Point **API** `DATABASE_URL` at Supabase pooler URL (Vercel env or temporary Render API).

---

## Phase 3 — API on Vercel (drop Render completely)

Today the API is a **long-running** NestJS process (`apps/api/src/main.ts`) with **Socket.IO**. Vercel runs **serverless HTTP**:

| Feature on Render | On Vercel-only stack |
|-------------------|----------------------|
| REST `/api/v1/*` | Supported (after serverless entry + build config) |
| Clerk / Stripe webhooks | Supported (same URLs on `api.sompacare.com`) |
| Prisma + Supabase | Supported (pooler URL, `connection_limit=1` in serverless) |
| BullMQ / Redis | **Skip** — omit `REDIS_URL`; jobs use in-memory fallback (already in code) |
| Socket.IO `/realtime` | **Not on Vercel** — nurse/facility live notifications fall back until you add **Supabase Realtime** or polling |

**Implementation status:** REST API on Vercel requires a small **serverless bootstrap** (`ExpressAdapter` + single cached Nest app) and a Vercel project with root `apps/api`. Track as engineering task before deleting Render API.

**Until that ships**, you can:

- **Option A:** Portals on Vercel + **API stays on Render** (one Docker deploy, rare) + DB on Supabase.  
- **Option B:** Full cutover once API Vercel project is merged.

---

## Vercel projects checklist (6 total)

| # | Vercel project | Root directory | Domain |
|---|----------------|----------------|--------|
| 1 | sompacare-website | `.` (repo root) | `www.sompacare.com` |
| 2 | sompacare-nurse | `apps/nurse-portal` | `nurse.sompacare.com` |
| 3 | sompacare-facility | `apps/facility-portal` | `facility.sompacare.com` |
| 4 | sompacare-recruiter | `apps/recruiter-portal` | `recruiter.sompacare.com` |
| 5 | sompacare-admin | `apps/admin-portal` | `admin.sompacare.com` |
| 6 | sompacare-api | `apps/api` | `api.sompacare.com` (after serverless ready) |

---

## Environment variables (API on Vercel — Production)

Set on **sompacare-api** Vercel project when ready:

| Variable | Source |
|----------|--------|
| `DATABASE_URL` | Supabase pooler URI |
| `CLERK_SECRET_KEY` | Clerk |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook |
| `CORS_ORIGINS` | `https://www.sompacare.com,https://nurse.sompacare.com,...` |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Resend |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase |
| `AUTH_ALLOW_DEV_TOKENS` | `false` |
| `GEOFENCE_DEV_BYPASS` / `PAYMENTS_DEV_BYPASS` | `false` |
| `JOBS_DEV_BYPASS` | `false` |
| `NODE_ENV` | `production` |

Do **not** set `REDIS_URL` unless you add Redis later (not in your current stack).

Portal projects: same as [VERCEL-PORTALS.md](./VERCEL-PORTALS.md).

---

## DNS (after Vercel is live)

Point subdomains to **Vercel** (CNAME / A records Vercel shows). Remove Render targets for those hostnames.

Keep Clerk DNS records (`clerk`, `accounts`, etc.) unchanged.

---

## Verify

```bash
npm run smoke:production
```

Update `scripts/production-urls.mjs` if you use temporary `*.vercel.app` URLs during cutover.

---

## What you can cancel on Render

After Vercel portals + Supabase DB + Vercel API are live and smoke tests pass:

- Delete or suspend all **Render web services** and **Render Postgres**  
- Stop syncing `render.yaml` if you no longer use Blueprint  

You keep: **GitHub** (source), **Vercel** (hosting), **Supabase** (data + files), **Clerk**, **Resend**, **Stripe**.

---

## Recommended order (minimal pain)

1. **Vercel portals** (Phase 1) — stops Render minute frustration for frontends.  
2. **Supabase database** (Phase 2) — move `DATABASE_URL`; API can still run on Render briefly.  
3. **Vercel API** (Phase 3) — ship serverless Nest entry, move `api.sompacare.com`, turn off Render.

Ask in Cursor to implement **Phase 3 API serverless bootstrap** when you are ready to delete Render entirely.
