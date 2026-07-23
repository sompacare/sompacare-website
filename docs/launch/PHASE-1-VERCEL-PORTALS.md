# Phase 1 — Portals on Vercel (do this once)

Goal: **four portals on Vercel**, API stays **`https://api.sompacare.com`** on Render. No Render builds for frontends.

Branch: **`platform`**

---

## Step A — Create four Vercel projects

### Automated (recommended — Vercel CLI already logged in on this machine)

From repo root, after Clerk keys exist in **`.env.platform.live`** or **`.env.vercel-portals`**:

```bash
npm run vercel:setup-phase1
```

Creates four projects, sets Production env vars, links, and deploys. Then do **Step C** (domains) and **Step D** (suspend Render portals).

### Manual (Vercel dashboard)

1. [vercel.com/new](https://vercel.com/new) → Import **sompacare/sompacare-website**
2. Repeat four times (one project per portal). Each time:

| Project name (suggested) | Root Directory | Production branch |
|--------------------------|----------------|-------------------|
| `sompacare-admin` | `apps/admin-portal` | `platform` |
| `sompacare-nurse` | `apps/nurse-portal` | `platform` |
| `sompacare-facility` | `apps/facility-portal` | `platform` |
| `sompacare-recruiter` | `apps/recruiter-portal` | `platform` |

3. On each project → **Settings** → **General**:
   - Enable **Include source files outside of the Root Directory in the Build Step** (monorepo; often on by default).

4. First deploy will fail until env vars exist (Step B). That is expected.

---

## Step B — Environment variables (copy to all four)

Vercel → project → **Settings** → **Environment Variables** → apply to **Production** (and Preview if you use preview URLs).

Copy from your Render env group **`sompacare-portal-auth`** + API URL:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/home
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/home
NEXT_PUBLIC_CLERK_IS_SATELLITE=false
NEXT_PUBLIC_API_URL=https://api.sompacare.com/api/v1
```

**Nurse + facility projects only** (same as Render):

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

Redeploy each project: **Deployments** → **Redeploy** (Production).

Template file (no secrets): `docs/launch/vercel-portal.env.example`

---

## Step C — Custom domains

Per project → **Settings** → **Domains** → add:

| Project | Domain |
|---------|--------|
| sompacare-admin | `admin.sompacare.com` |
| sompacare-nurse | `nurse.sompacare.com` |
| sompacare-facility | `facility.sompacare.com` |
| sompacare-recruiter | `recruiter.sompacare.com` |

Update DNS at your registrar to Vercel’s records (remove Render CNAME for these four when SSL is valid on Vercel).

**Do not** move `api.sompacare.com` yet.

---

## Step D — Turn off Render portals

Render → Blueprint or each service:

- **Suspend** or **delete**: `sompacare-admin`, `sompacare-nurse`, `sompacare-facility`, `sompacare-recruiter`
- **Keep running**: `sompacare-api`, `sompacare-db`

Optional: Blueprint **Manual sync** after pushing `platform` so `autoDeployTrigger: off` on portals stays in sync.

---

## Step E — Verify

```bash
npm run smoke:production
```

Manual: sign in on admin + one other portal → accept terms → open `/home`.

---

## Troubleshooting

| Build log | Fix |
|-----------|-----|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing` | Step B on that Vercel project |
| `Cannot find module @sompacare/shared` | Turn on “include files outside root directory”; confirm `installCommand` runs from repo root (in `vercel.json`) |
| Git push builds **Error** (~1 min), Framework **Other** | From repo root: `node scripts/vercel-sync-portal-framework.mjs` — sets Next.js + monorepo root |
| Pushes to `platform` only update **Preview**, not `admin.sompacare.com` | Vercel → project → **Settings → Git → Production Branch** = `platform`, then **Redeploy** Production |
| “Application error” on sign-in | Use **https://admin.sompacare.com/sign-in** (not `*-git-platform-*.vercel.app` preview URLs) |
| Site loads but API 401 | Render API `CLERK_SECRET_KEY` must match portal Clerk app |
| Old Render site still shows | DNS still pointing at Render — update to Vercel |

---

## After Phase 1

- Portals: **Vercel** (no Render build minutes)
- API + DB: **Render** until [STACK-VERCEL-SUPABASE.md](./STACK-VERCEL-SUPABASE.md) Phase 2–3
