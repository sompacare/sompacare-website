# Deploy portals on Vercel (recommended)

**Full stack without Render:** [STACK-VERCEL-SUPABASE.md](./STACK-VERCEL-SUPABASE.md).

**Yes — use Vercel for the four Next.js portals.** Keep **Render only for API + DB** until Phase 3 in the stack doc (or skip Render entirely once API is on Vercel).

| Component | Host | Domain |
|-----------|------|--------|
| Marketing | Vercel (root project) | `www.sompacare.com` |
| Nurse / Facility / Recruiter / Admin portals | **Vercel** (4 projects) | `*.sompacare.com` |
| NestJS API + PostgreSQL | **Render** | `api.sompacare.com` |

The API stays on Render because it is a long-running Docker/NestJS service with a database—not a good fit for Vercel serverless.

---

## 1. Create four Vercel projects

**Checklist:** [PHASE-1-VERCEL-PORTALS.md](./PHASE-1-VERCEL-PORTALS.md)

Vercel → **Add New** → **Project** → import `sompacare/sompacare-website`.

For **each** row, set **Root Directory** to the app folder and **Production Branch** to `platform`:

| Vercel project name | Root directory |
|---------------------|----------------|
| sompacare-nurse | `apps/nurse-portal` |
| sompacare-facility | `apps/facility-portal` |
| sompacare-recruiter | `apps/recruiter-portal` |
| sompacare-admin | `apps/admin-portal` |

Each app’s `vercel.json` runs `install` / `build` from the monorepo root so `@sompacare/shared` compiles correctly.

---

## 2. Environment variables (every portal)

Vercel → project → **Settings** → **Environment Variables** → **Production**:

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk production `pk_live_...` |
| `CLERK_SECRET_KEY` | Same `sk_live_...` as Render API |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/home` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/home` |
| `NEXT_PUBLIC_CLERK_IS_SATELLITE` | `false` |
| `NEXT_PUBLIC_API_URL` | `https://api.sompacare.com/api/v1` |

**Nurse + facility only:**

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Your Stripe `pk_live_...` |

Do **not** set `NEXT_PUBLIC_*_DEV_TOKEN` or `FORCE_DEV_TOKEN` in production.

Redeploy after saving env vars (Vercel rebuilds automatically).

---

## 3. Custom domains

For each Vercel portal project → **Settings** → **Domains**:

| Project | Domain |
|---------|--------|
| sompacare-nurse | `nurse.sompacare.com` |
| sompacare-facility | `facility.sompacare.com` |
| sompacare-recruiter | `recruiter.sompacare.com` |
| sompacare-admin | `admin.sompacare.com` |

Vercel shows DNS records. At your DNS host, **point each subdomain to Vercel** (remove or stop using Render DNS for those four once Vercel verifies SSL).

**Keep** `api.sompacare.com` on Render.

---

## 4. Clerk

In Clerk → **Paths** → **Allowed redirect URLs**, include (already listed in `scripts/production-urls.mjs`):

- `https://admin.sompacare.com`, `/sign-in`, `/sign-up`, `/home`
- Same pattern for nurse, facility, recruiter

No change needed if you already use custom domains (URLs stay the same; only the host behind DNS changes).

Render API **`CLERK_SECRET_KEY`** must still match these portals’ Clerk app.

---

## 5. Render API (unchanged)

On **sompacare-api**, `CORS_ORIGINS` in `render.yaml` already includes `https://admin.sompacare.com`, etc. No change if domains stay the same.

After portals live on Vercel, you can **suspend or delete** the four Render **portal** web services to save cost and avoid duplicate deploys. **Do not** remove `sompacare-api` or `sompacare-db`.

---

## 6. Verify

```bash
npm run smoke:production
```

Sign in on each portal → accept legal terms → smoke-test one admin and one facility flow.

---

## CLI deploy (optional)

From repo root, with Vercel CLI linked:

```bash
cd apps/admin-portal && npx vercel --prod
```

Repeat per portal, or rely on Git push to `platform` with Vercel Git integration.

---

## Why this helps

- Vercel builds are included for Next.js; no Render **build pipeline minutes** for portals.
- Faster, more reliable Next.js CI than self-managed Render Node builds.
- Same codebase—no fork; switch is DNS + four Vercel projects + env vars.
