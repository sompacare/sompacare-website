# Layer 1 — Supabase Postgres + Redis (Upstash) on Vercel

Project ref for careers/storage (from `.env.local`): **`erpnoiulwhcctuzcsthg`**. Platform Prisma data should use the **same Supabase project’s Postgres** unless you intentionally split databases.

---

## 1. Supabase connection strings

In [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Database** → **Connect**:

| Use | Mode | Port | Env var |
|-----|------|------|---------|
| Vercel API / Prisma runtime | **Transaction pooler** | **6543** | `DATABASE_URL` |
| Migrations + `pg_restore` | **Direct** or Session | **5432** | `DIRECT_DATABASE_URL` |
| One-time copy source | Render external URL | — | `RENDER_DATABASE_URL` |

**Pooler URL shape** (add params if missing):

```text
postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

Add to **`.env.platform.live`** (gitignored):

```env
RENDER_DATABASE_URL="postgresql://..."   # current Render DB (copy source)
DIRECT_DATABASE_URL="postgresql://..."   # Supabase 5432
DATABASE_URL="postgresql://..."          # Supabase 6543 pooler
```

Check hosts only:

```bash
npm run env:db-hosts
npm run supabase:cutover:check
```

---

## 2. Schema on Supabase

```bash
npm run supabase:cutover:migrate
```

---

## 3. Copy production data (Render → Supabase)

**On Windows** (no `pg_dump` locally): use GitHub Actions.

1. GitHub → **Settings → Secrets → Actions**:
   - `RENDER_DATABASE_URL` — from Render → sompacare-db → External Database URL
   - `SUPABASE_DIRECT_URL` — Supabase direct **5432** URI (same value as `DIRECT_DATABASE_URL`)

2. **Actions → Supabase data migrate → Run workflow**

**On Mac/Linux** with `pg_dump`:

```bash
npm run supabase:cutover:data
```

---

## 4. Point Vercel API at Supabase

After data is on Supabase and `DATABASE_URL` in `.env.platform.live` is the **6543 pooler**:

```bash
npm run vercel:sync-api-env
cd apps/api && npx vercel redeploy api.sompacare.com --scope sompacare-staffing
npm run smoke:production
```

Sign in on **admin** / **nurse** and load **`/home`**.

---

## 5. Redis on Vercel (Upstash)

BullMQ reminders need Redis when `JOBS_DEV_BYPASS=false`.

1. [Vercel Dashboard](https://vercel.com) → **Integrations** → **Upstash Redis** (or create DB in [Upstash Console](https://console.upstash.com)).
2. **Connect to project** → **sompacare-api** → enable **Production** (and Preview if you want).
3. Confirm **`REDIS_URL`** appears on **sompacare-api** (usually `rediss://…`).
4. Add the same URL to **`.env.vercel-api`** for future syncs, or run:

   ```bash
   npx vercel env add REDIS_URL production --sensitive --force --project sompacare-api --scope sompacare-staffing
   ```

5. **Redeploy** sompacare-api.

Health should show `"redis":"ok"` and `"status":"healthy"` when DB is ok.

**Note:** Code no longer loads `.env.platform` on Vercel (`REDIS_URL=localhost` was causing `"redis":"error"` when that file leaked into the runtime).

---

## 6. GitHub migrate workflow (ongoing)

For schema changes on `platform`, set Actions secret **`DATABASE_URL`** to Supabase **direct 5432** (see [supabase-migrate.yml](../../.github/workflows/supabase-migrate.yml)).

---

## 7. Retire Render Postgres

Only after smoke + sign-in pass on Supabase for **24–48h**:

- Suspend **sompacare-db** on Render
- Remove `RENDER_DATABASE_URL` from local env when done

See [PRODUCTION-LAYERS-VERCEL.md](./PRODUCTION-LAYERS-VERCEL.md) Layer 4.
