# Production on Vercel — layer by layer

Build production **on Vercel only**, keep **api.sompacare.com** stable for portals, then retire Render. No local Clerk path juggling required for go-live.

Branch: **`platform`**

---

## Layer 0 — Done: Portals on Vercel

| Domain | Vercel project |
|--------|----------------|
| `admin.sompacare.com` | sompacare-admin |
| `nurse.sompacare.com` | sompacare-nurse |
| `facility.sompacare.com` | sompacare-facility |
| `recruiter.sompacare.com` | sompacare-recruiter |
| `www.sompacare.com` | sompacare-website (root) |

Portals call **`https://api.sompacare.com/api/v1`** (`NEXT_PUBLIC_API_URL`).

Ops: [PHASE-1-VERCEL-PORTALS.md](./PHASE-1-VERCEL-PORTALS.md), `npm run vercel:sync-portals`, `npm run vercel:sync-portal-env`.

---

## Layer 1 — Database on Supabase (before moving API off Render)

Full runbook: **[LAYER-1-SUPABASE-REDIS.md](./LAYER-1-SUPABASE-REDIS.md)** (Postgres pooler, data copy, **Upstash Redis**).

1. Supabase → **Database** → copy **Transaction pooler** (`6543`) → `DATABASE_URL` and **direct** (`5432`) → `DIRECT_DATABASE_URL` in `.env.platform.live`.
2. `npm run supabase:cutover:check` → `npm run supabase:cutover:migrate` → GitHub **Supabase data migrate** (or `supabase:cutover:data` with `pg_dump`).
3. `npm run vercel:sync-api-env` + redeploy **sompacare-api**; connect **Upstash Redis** to set `REDIS_URL`.
4. GitHub secret `DATABASE_URL` (direct 5432) for [supabase-migrate.yml](../../.github/workflows/supabase-migrate.yml).

---

## Layer 2 — API on Vercel (code in repo)

| Item | Location |
|------|----------|
| Serverless Nest entry | `apps/api/api/index.js` → `dist/serverless.js` |
| Shared HTTP config | `apps/api/src/configure-app.ts` |
| Vercel config | `apps/api/vercel.json` |
| Build | `npm run vercel:build:api` |

**Create / configure project:**

```bash
npm run vercel:setup-api
npm run vercel:sync-api-framework   # rootDirectory apps/api + monorepo flag
npm run vercel:sync-api-env
```

**One-time in Vercel Dashboard → sompacare-api → Settings → General:**

- **Root Directory:** `apps/api`
- **Include source files outside root:** ON
- **Production Branch:** `platform`
- **Git:** connected to `sompacare/sompacare-website` (CLI: `vercel git connect` from `apps/api`)

**Deploy (preview first — test before `api.sompacare.com`):**

```bash
cd apps/api
npx vercel --scope sompacare-staffing
```

Hit **`/api/v1/health`** on the `*.vercel.app` URL. When good, **`npx vercel --prod`**.

If the preview URL returns a **Vercel login page** (HTML, not JSON), open **sompacare-api → Settings → Deployment Protection** and disable protection for **Preview** (or “Standard Protection” only on Production) so you can smoke-test before attaching `api.sompacare.com`.

**Not on Vercel:** Socket.IO `/realtime` (portals use polling/fallback). **Redis:** use [Upstash via Vercel integration](./LAYER-1-SUPABASE-REDIS.md#5-redis-on-vercel-upstash) (`REDIS_URL` / `rediss://`).

---

## Layer 3 — Cutover `api.sompacare.com`

1. Vercel → **sompacare-api** → **Domains** → add `api.sompacare.com`.
2. DNS: CNAME `api` → Vercel (remove Render target).
3. **Clerk** webhook: `https://api.sompacare.com/api/v1/auth/webhook/clerk`
4. **Stripe** webhook: `https://api.sompacare.com/api/v1/payments/stripe/webhook`
5. `npm run smoke:production`

---

## Layer 4 — Turn off Render

After smoke passes for **48h** (optional soak):

- Suspend/delete **sompacare-api** and **sompacare-db** on Render.
- Keep Blueprint archived or set `autoDeploy: off`.

---

## Production env checklist (API Vercel)

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Supabase pooler + `connection_limit=1` |
| `REDIS_URL` | Upstash Redis (`rediss://…`) when `JOBS_DEV_BYPASS=false` |
| `CLERK_SECRET_KEY` | Same as portals |
| `CLERK_WEBHOOK_SECRET` | Clerk dashboard |
| `CORS_ORIGINS` | All `*.sompacare.com` + www |
| `AUTH_ALLOW_DEV_TOKENS` | `false` |
| `*_DEV_BYPASS` | `false` |
| Stripe / Resend / Supabase | From Render env group today |

Sync: **`npm run vercel:sync-api-env`**

---

## Verify each layer

```bash
npm run smoke:production
```

Manual: sign in on **nurse** + **admin** → `/home` loads (proves API + Clerk + DB).

---

## What we are *not* doing in local dev for go-live

Local `.env.portals.local` and Clerk **Paths** are optional for feature work. **Production truth** is Vercel env + custom domains + Supabase + Clerk **production** keys (`pk_live_` / `sk_live_`).

See also: [STACK-VERCEL-SUPABASE.md](./STACK-VERCEL-SUPABASE.md).
