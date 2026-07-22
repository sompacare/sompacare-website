# Go live on Render — final steps

Use this after code on branch **`platform`** is deployed. Automated check:

```bash
npm run smoke:production
```

As of the last smoke run, **all four portals + API + marketing** returned healthy entry points on `*.sompacare.com`.

---

## 1. Render (one-time — you already did most of this)

| Item | Status |
|------|--------|
| Workspace on **Performance** (or Pro) plan | You upgraded — good for builds/memory |
| **`sompacare-portal-auth`** env group with `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` | Required |
| **All 4 portal services** linked to that env group | Required — not just keys in the group |
| **`sompacare-api`** `CLERK_SECRET_KEY` = same `sk_live_...` as the env group | Required |
| After any Clerk env change: **Manual deploy + Clear build cache** on API + all 4 portals | Required once |

Blueprint services are in root `render.yaml` on branch `platform`.

---

## 2. Clerk Dashboard (5 minutes)

1. **API keys** — production app: same keys as Render.
2. **Paths → Allowed redirect URLs** — paste list from:

   ```bash
   node scripts/clerk-redirect-urls.mjs
   ```

   (Uses `scripts/production-urls.mjs` — all `*.sompacare.com` portals.)
3. **Webhooks** — endpoint  
   `https://api.sompacare.com/api/v1/auth/webhook/clerk`  
   Events: `user.created`, `user.updated`  
   Signing secret → Render **`CLERK_WEBHOOK_SECRET`** on API.

---

## 3. First admin user

1. Sign up / sign in at **https://admin.sompacare.com/sign-in**
2. Accept legal terms when prompted.
3. Grant platform admin in DB (if not already):

   ```bash
   # With DATABASE_URL pointing at production (careful):
   npm run link:user
   ```

   Or use your existing admin-provisioning script / Supabase role flow documented in `docs/guides/accounts-and-env-checklist.md`.

---

## 4. Stripe + Checkr (when you take money / run background checks)

| Integration | Webhook base |
|-------------|----------------|
| Stripe | `https://api.sompacare.com/api/v1/payments/stripe/webhook` |
| Checkr | `https://api.sompacare.com/api/v1/compliance/checkr/webhook` |

Details: `docs/stripe-live-setup.md`, `docs/guides/checkr-production-setup.md`.

---

## 5. Pilot smoke (10 minutes — real users)

Do once with real accounts:

1. **Facility** — sign in → post or publish a shift.
2. **Nurse** — sign in → see shifts → apply or claim (per your flow).
3. **Recruiter** — sign in → pipeline / invite employee (if used day one).
4. **Admin** — sign in → `/users`, support, flags load without 401.

---

## 6. Launch = DNS already on custom domains

You are already on:

- https://nurse.sompacare.com  
- https://facility.sompacare.com  
- https://recruiter.sompacare.com  
- https://admin.sompacare.com  
- https://api.sompacare.com  

**Launch** here means: announce URLs to pilot facilities/nurses, monitor Render logs for 24h, run `npm run smoke:production` daily.

---

## If something breaks again

| Symptom | Fix |
|---------|-----|
| **Failed deploy** in ~1s, log says **out of build pipeline minutes** | [RENDER-BUILD-PIPELINE.md](./RENDER-BUILD-PIPELINE.md) — billing + redeploy one service at a time |
| White “Application error” on `/home` | Redeploy portal with env group linked + **clear build cache** |
| `401` / invalid token on API | Match API `CLERK_SECRET_KEY` to env group |
| Build fails on portal | Log says missing `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — link env group |
| Render OOM on recruiter build | Performance plan + `NODE_OPTIONS=--max-old-space-size=4096` (already in `render.yaml`) |

---

## Code / config shipped for launch

- Portal auth + legal consent retries (`31881ee`)
- Clerk publishable key required at build (`bfde5a6`)
- `JOBS_DEV_BYPASS=false` on API in `render.yaml` (no job-ingest dev shortcut in prod)
- `npm run smoke:production` — extended health + HTML sanity checks

No further code churn is required to **open** the apps; remaining work is **Clerk redirects**, **admin role**, and **pilot validation** above.
