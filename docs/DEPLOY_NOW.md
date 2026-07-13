# Deploy Sompacare Now — Step-by-Step

Complete this checklist in order. Estimated time: 1–2 hours.

---

## Phase 1 — Push code to GitHub (required first)

Render and Vercel deploy from your Git repo.

```bash
cd C:\Users\abrah\OneDrive\Desktop\Sompacare
git add render.yaml apps/api/Dockerfile apps/api/docker-entrypoint.sh apps/*/vercel.json docs/
git commit -m "Add production deploy config for API and portals"
git push origin platform
```

> Use branch `platform` (or `main` if that's your deploy branch).

---

## Phase 2 — Deploy API + Database on Render

1. Go to [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**
2. Connect GitHub repo `sompacare/sompacare-website`
3. Select branch `platform`
4. Render reads root `render.yaml` → creates **sompacare-api** + **sompacare-db**
5. When prompted for secrets, paste from `docs/render-env-template.txt`:

| Variable | Your value |
|----------|------------|
| `STRIPE_SECRET_KEY` | `sk_live_...` (from `.env.platform`) |
| `STRIPE_WEBHOOK_SECRET` | Leave blank for now — fill after Phase 5 |
| `CLERK_SECRET_KEY` | From Clerk production dashboard |
| `CLERK_WEBHOOK_SECRET` | From Clerk webhooks |
| `CORS_ORIGINS` | Fill after Phase 3 (Vercel URLs) |
| `NURSE_PORTAL_URL` etc. | Fill after Phase 3 |

6. Click **Apply** → wait for first deploy (~10–15 min)
7. Copy your API URL: `https://sompacare-api.onrender.com` (or similar)

**Verify:**
```bash
curl https://YOUR-API.onrender.com/api/v1/health
```
Expect: `"status":"healthy"`

---

## Phase 3 — Deploy portals on Render

All four portals are defined in root `render.yaml` and deploy automatically when you push branch `platform`:

- Nurse: `https://sompacare-nurse.onrender.com`
- Facility: `https://sompacare-facility.onrender.com`
- Recruiter: `https://sompacare-recruiter.onrender.com`
- Admin: `https://sompacare-admin.onrender.com`

Attach the `sompacare-portal-auth` env group with Clerk keys (`CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`).

**Verify:** open each portal `/sign-in` — expect HTTP 200.

---

## Phase 3 (legacy) — Deploy portals on Vercel

For **each** portal, create a Vercel project:

| Portal | Root directory |
|--------|----------------|
| Nurse | `apps/nurse-portal` |
| Facility | `apps/facility-portal` |
| Recruiter | `apps/recruiter-portal` |
| Admin | `apps/admin-portal` |

### Per-portal env vars (Vercel → Settings → Environment Variables)

**All portals:**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...   (Clerk production)
CLERK_SECRET_KEY=sk_live_...                     (Clerk production)
NEXT_PUBLIC_API_URL=https://YOUR-API.onrender.com/api/v1
```

**Nurse + Facility only:**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51TrLFRExydo0cTefW5v7MsXRTFqLGk4JCbLEjYbDMXU7c6suSzJ2WP16iKNJ9sXFULvajqkBHrYdExZTXzm9uieM00OroLJ96T
```

**Do NOT set** `NEXT_PUBLIC_*_DEV_TOKEN` in production.

Deploy each project → copy the 4 Vercel URLs.

---

## Phase 4 — Update Render with portal URLs

Back in **Render → sompacare-api → Environment**, update:

```
CORS_ORIGINS=https://nurse-xxx.vercel.app,https://facility-xxx.vercel.app,https://recruiter-xxx.vercel.app,https://admin-xxx.vercel.app
NURSE_PORTAL_URL=https://nurse-xxx.vercel.app
FACILITY_PORTAL_URL=https://facility-xxx.vercel.app
RECRUITER_PORTAL_URL=https://recruiter-xxx.vercel.app
ADMIN_PORTAL_URL=https://admin-xxx.vercel.app
```

Save → Render redeploys automatically.

---

## Phase 5 — Stripe live webhook

1. Stripe Dashboard → **Live mode** ON
2. **Developers → Webhooks → Add destination**
3. **Your account** → **Snapshot payload**
4. Events: `payment_intent.succeeded`, `account.updated`, `v2.core.account.updated`
5. **Endpoint URL:**
   ```
   https://YOUR-API.onrender.com/api/v1/payments/stripe/webhook
   ```
6. Copy signing secret `whsec_...`
7. Paste into **Render → STRIPE_WEBHOOK_SECRET** → redeploy

---

## Phase 6 — Clerk production webhooks

1. [Clerk Dashboard](https://dashboard.clerk.com) → production app
2. **Webhooks** → add endpoint:
   ```
   https://YOUR-API.onrender.com/api/v1/auth/webhook/clerk
   ```
3. Copy `whsec_...` → Render `CLERK_WEBHOOK_SECRET`
4. Add all 4 Vercel portal URLs to Clerk **Allowed origins**

---

## Phase 7 — Seed production database

**Roles (GNA, CMA, Med Tech, etc.)** — seeded automatically on every API deploy via `docker-entrypoint.sh` (`db:seed:roles`). No manual step required.

**Demo data** (optional, one time from your machine):

```bash
DATABASE_URL="postgresql://..." npm run db:seed --workspace=@sompacare/database
```

Get `DATABASE_URL` from Render → sompacare-db → **Connections**.

Or link real Clerk users (after roles are seeded):

```bash
node scripts/link-clerk-user.mjs --email nurse@yourdomain.com --role GNA
node scripts/link-facility-user.mjs --email facility@yourdomain.com
```

---

## Phase 8 — Smoke test (production)

1. **Nurse portal** → sign in → browse shifts
2. **Facility portal** → sign in → view applications
3. **Admin portal** → dashboard loads KPIs
4. **Nurse** → Wallet → **Set up payouts** (Stripe Connect live)
5. Run end-to-end shift → timecard → invoice → instant pay

```bash
API_URL=https://YOUR-API.onrender.com node scripts/test-m14-launch.mjs
```

---

## Your webhook URL (fill in Stripe now)

Once API is deployed, your Stripe webhook URL is:

```
https://YOUR-API.onrender.com/api/v1/payments/stripe/webhook
```

Replace `YOUR-API` with your actual Render hostname.

---

## Custom domains (later)

| Service | Suggested domain |
|---------|------------------|
| API | `api.sompacare.com` |
| Nurse | `nurse.sompacare.com` |
| Facility | `facility.sompacare.com` |
| Recruiter | `recruiter.sompacare.com` |
| Admin | `admin.sompacare.com` |

Point DNS → update Render/Vercel env vars → update Stripe webhook URL.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| API deploy fails | Check Render logs; verify Docker build locally: `docker build -f apps/api/Dockerfile .` |
| CORS errors | Update `CORS_ORIGINS` with exact Vercel URLs (no trailing slash) |
| 401 on API | Clerk keys mismatch; use production keys on portals + API |
| Invoice stays SENT | `STRIPE_WEBHOOK_SECRET` wrong or webhook URL incorrect |
| DB connection error | Wait for Render Postgres to be `Available`; check `DATABASE_URL` |

See also: [stripe-live-setup.md](./stripe-live-setup.md) | [deploy-platform.md](./deploy-platform.md)
