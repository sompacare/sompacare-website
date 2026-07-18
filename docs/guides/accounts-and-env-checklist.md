# Sompacare — Accounts, Logins & Environment Variables

Printable checklist for everything you need subscribed and configured for the website + platform to work.

**Last updated:** July 2026 · **Branch:** `platform`

---

## 1. Accounts to have (login URLs)

| # | Service | Login URL | Used for | Subscribed? |
|---|---------|-----------|----------|-------------|
| 1 | **GitHub** | https://github.com | Code repo `sompacare/sompacare-website` | ☐ |
| 2 | **Render** | https://dashboard.render.com | API, 4 portals, PostgreSQL | ☐ |
| 3 | **Vercel** | https://vercel.com/dashboard | Marketing site `www.sompacare.com` | ☐ |
| 4 | **Clerk** | https://dashboard.clerk.com | Portal sign-in (nurse, facility, recruiter, admin) | ☐ |
| 5 | **Domain registrar** | (where you bought `sompacare.com`) | DNS → Vercel | ☐ |
| 6 | **Supabase** | https://supabase.com/dashboard | Resumes, marketing admin DB | ☐ |
| 7 | **Resend** | https://resend.com | Email (careers, contact, notifications) | ☐ |
| 8 | **Stripe** | https://dashboard.stripe.com | Payments & payouts | ☐ |
| 9 | **Checkr** | https://dashboard.checkr.com | Background checks (API pending approval) | ☐ |
| 10 | **Expo** | https://expo.dev | Mobile app builds (when ready) | ☐ |
| 11 | **Apple Developer** | https://developer.apple.com | iOS App Store (when ready) | ☐ |
| 12 | **Google Play Console** | https://play.google.com/console | Android (when ready) | ☐ |

### Optional (platform works without these today)

| Service | Login URL | Used for |
|---------|-----------|----------|
| **AWS** | https://console.aws.amazon.com | S3 document storage |
| **OpenAI** | https://platform.openai.com | Resume parsing, AI matching |
| **Twilio** | https://console.twilio.com | SMS |
| **Firebase** | https://console.firebase.google.com | Mobile push |
| **Sentry** | https://sentry.io | Error monitoring |

---

## 2. Your live URLs

| App | URL |
|-----|-----|
| Marketing site | https://www.sompacare.com |
| Platform API | https://sompacare-api.onrender.com/api/v1 |
| Nurse portal | https://sompacare-nurse.onrender.com |
| Facility portal | https://sompacare-facility.onrender.com |
| Recruiter portal | https://sompacare-recruiter.onrender.com |
| Admin portal | https://sompacare-admin.onrender.com |

---

## 3. Render — `sompacare-api` (Docker)

**Dashboard:** Render → Sompacare Blueprint → **sompacare-api** → **Environment**

### Auto-set by Render (do not paste manually)

| Variable | Source |
|----------|--------|
| `DATABASE_URL` | Linked from `sompacare-db` |
| `NODE_ENV` | `production` |
| `API_PORT` | `4000` |
| `CORS_ORIGINS` | In `render.yaml` |
| `NURSE_PORTAL_URL` | `https://sompacare-nurse.onrender.com` |
| `FACILITY_PORTAL_URL` | `https://sompacare-facility.onrender.com` |
| `RECRUITER_PORTAL_URL` | `https://sompacare-recruiter.onrender.com` |
| `ADMIN_PORTAL_URL` | `https://sompacare-admin.onrender.com` |
| `API_PUBLIC_URL` | `https://sompacare-api.onrender.com/api/v1` |
| `SITE_URL` | `https://www.sompacare.com` |
| `CHECKR_DEV_BYPASS` | `false` |
| `CHECKR_PACKAGE` | `tasker_standard` |
| `JOBS_DEV_BYPASS` | `true` |
| `AUTH_ALLOW_DEV_TOKENS` | `false` |

### You must paste these secrets

| Variable | Where to get it | Set? |
|----------|-----------------|------|
| `CLERK_SECRET_KEY` | Clerk → API Keys → Secret (`sk_live_...`) | ☐ |
| `CLERK_PUBLISHABLE_KEY` | Clerk → API Keys → Publishable (`pk_live_...`) | ☐ |
| `CLERK_WEBHOOK_SECRET` | Clerk → Webhooks → Signing secret (`whsec_...`) | ☐ |
| `STRIPE_SECRET_KEY` | Stripe → Developers → API keys (`sk_live_...`) | ☐ |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → Signing secret (`whsec_...`) | ☐ |
| `RESEND_API_KEY` | Resend → API Keys (`re_...`) | ☐ |
| `RESEND_FROM_EMAIL` | `Sompacare <careers@sompacare.com>` (domain verified in Resend) | ☐ |
| `SUPABASE_URL` | Supabase → Project Settings → API → Project URL | ☐ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → service_role key (Reveal) | ☐ |
| `CAREERS_INGEST_SECRET` | Generate a long random string (must match Vercel) | ☐ |
| `CHECKR_API_KEY` | Checkr → Developer settings (after approval) | ☐ |
| `CHECKR_WEBHOOK_SECRET` | Same as Checkr Secret API key (or webhook secret) | ☐ |
| `AWS_ACCESS_KEY_ID` | AWS IAM (optional — S3 docs) | ☐ |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM (optional) | ☐ |
| `S3_BUCKET_DOCUMENTS` | Your S3 bucket name (optional) | ☐ |
| `OPENAI_API_KEY` | OpenAI platform (optional) | ☐ |
| `TWILIO_ACCOUNT_SID` | Twilio (optional) | ☐ |
| `TWILIO_AUTH_TOKEN` | Twilio (optional) | ☐ |
| `TWILIO_FROM_NUMBER` | Twilio (optional) | ☐ |
| `FIREBASE_PROJECT_ID` | Firebase (optional — push) | ☐ |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account (optional) | ☐ |
| `FIREBASE_PRIVATE_KEY` | Firebase service account (optional) | ☐ |
| `SENTRY_DSN` | Sentry project (optional) | ☐ |

### Webhooks to register in external dashboards

| Provider | Webhook URL | Events |
|----------|-------------|--------|
| **Clerk** | `https://sompacare-api.onrender.com/api/v1/auth/webhook/clerk` | `user.created`, `user.updated` |
| **Stripe** | `https://sompacare-api.onrender.com/api/v1/payments/stripe/webhook` | `payment_intent.succeeded`, `account.updated` |
| **Checkr** | `https://sompacare-api.onrender.com/api/v1/compliance/checkr/webhook` | `report.completed`, `report.updated` |

---

## 4. Render — Env group `sompacare-portal-auth`

**Dashboard:** Render → Sompacare Blueprint → **Env Groups** → `sompacare-portal-auth`

Shared by all four portals (nurse, facility, recruiter, admin).

| Variable | Where to get it | Set? |
|----------|-----------------|------|
| `CLERK_SECRET_KEY` | Same as API (`sk_live_...`) | ☐ |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk → Publishable (`pk_live_...`) | ☐ |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` (portal-hosted, not Account Portal) | ☐ |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | ☐ |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/home` | ☐ |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/home` | ☐ |

---

## 5. Render — Portal services

Each portal also needs `NEXT_PUBLIC_API_URL` (already in `render.yaml`).

| Service | Extra env vars | Set? |
|---------|----------------|------|
| **sompacare-nurse** | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...` | ☐ |
| **sompacare-facility** | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...` | ☐ |
| **sompacare-recruiter** | (none beyond env group + API URL) | ☐ |
| **sompacare-admin** | (none beyond env group + API URL) | ☐ |

**Do NOT set** `NEXT_PUBLIC_*_DEV_TOKEN` or `FORCE_DEV_TOKEN` in production.

---

## 6. Vercel — Marketing site (`sompacare-website`)

**Dashboard:** Vercel → **sompacare-website** → Settings → **Environment Variables** → Production

| Variable | Production value | Set? |
|----------|------------------|------|
| `PLATFORM_API_URL` | `https://sompacare-api.onrender.com/api/v1` | ☐ |
| `CAREERS_INGEST_SECRET` | **Same string** as Render `sompacare-api` | ☐ |
| `RESEND_API_KEY` | Resend `re_...` | ☐ |
| `RESEND_FROM_EMAIL` | `Sompacare <careers@sompacare.com>` | ☐ |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://YOUR-PROJECT.supabase.co` | ☐ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key | ☐ |
| `SITE_URL` | `https://www.sompacare.com` | ☐ |
| `STRIPE_SECRET_KEY` | Stripe secret (marketing admin payments) | ☐ |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | ☐ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook for `/api/stripe/webhook` | ☐ |
| `ADMIN_PASSWORD` | Password for `/admin/login` on marketing site | ☐ |
| `ADMIN_SESSION_TOKEN` | Long random string for admin cookie | ☐ |
| `INFO_TO_EMAIL` | `info@sompacare.com` | ☐ |
| `CAREERS_TO_EMAIL` | `careers@sompacare.com` | ☐ |
| `STAFFING_TO_EMAIL` | `staffing@sompacare.com` | ☐ |

### Vercel Git settings

| Setting | Value | Done? |
|---------|-------|-------|
| Production branch | `platform` | ☐ |
| Root directory | `/` (repo root) | ☐ |

### Stripe webhook (marketing site only)

| Provider | Webhook URL |
|----------|-------------|
| **Stripe** | `https://www.sompacare.com/api/stripe/webhook` |

---

## 7. Clerk dashboard setup

**Dashboard:** https://dashboard.clerk.com → your production application

| Setting | Value | Done? |
|---------|-------|-------|
| Allowed redirect URLs | All four `*.onrender.com` portal URLs | ☐ |
| Sign-in URL (Paths) | Each portal's `/sign-in` on its own domain — **not** `accounts.sompacare.com` | ☐ |
| Sign-up URL (Paths) | Each portal's `/sign-up` on its own domain | ☐ |
| Custom frontend API (optional) | `clerk.sompacare.com` if using Clerk production domain | ☐ |
| Webhook endpoint | `https://sompacare-api.onrender.com/api/v1/auth/webhook/clerk` | ☐ |
| Production keys in Render | `pk_live_` + `sk_live_` (not test keys) | ☐ |

---

## 8. Supabase setup

**Dashboard:** https://supabase.com/dashboard → your project

| Task | Done? |
|------|-------|
| Project created | ☐ |
| Storage bucket `application-files` (private) | ☐ |
| Storage bucket `business-documents` (private) | ☐ |
| `SUPABASE_URL` + service role key in Render API | ☐ |
| Same keys in Vercel (marketing site) | ☐ |

---

## 9. Resend setup

**Dashboard:** https://resend.com/domains

| Task | Done? |
|------|-------|
| Domain `sompacare.com` verified | ☐ |
| API key in Render `sompacare-api` | ☐ |
| API key in Vercel | ☐ |
| Sender `careers@sompacare.com` works | ☐ |

---

## 10. Checkr setup (when approved)

**Dashboard:** https://dashboard.checkr.com → Account → Developer settings

| Task | Done? |
|------|-------|
| Business account verified | ☐ |
| Developer API access approved | ☐ |
| Secret API key created | ☐ |
| Webhook URL registered | ☐ |
| `CHECKR_API_KEY` in Render API | ☐ |
| `CHECKR_WEBHOOK_SECRET` in Render API | ☐ |
| `CHECKR_DEV_BYPASS` = `false` | ☐ |

---

## 11. Secrets that MUST match across services

| Secret | Must match in |
|--------|----------------|
| `CAREERS_INGEST_SECRET` | Render `sompacare-api` **and** Vercel marketing |
| `CLERK_SECRET_KEY` | Render `sompacare-api` **and** env group `sompacare-portal-auth` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Env group **and** Clerk dashboard app |
| `SUPABASE_SERVICE_ROLE_KEY` | Render API **and** Vercel (if marketing uses Supabase) |

---

## 12. Verification checklist (run after setup)

```bash
# API healthy
curl https://sompacare-api.onrender.com/api/v1/health

# Marketing legal pages
curl -I https://www.sompacare.com/privacy
curl -I https://www.sompacare.com/terms

# Portals load
curl -I https://sompacare-nurse.onrender.com/sign-in
curl -I https://sompacare-facility.onrender.com/sign-in
curl -I https://sompacare-recruiter.onrender.com/sign-in
curl -I https://sompacare-admin.onrender.com/sign-in
```

| Check | Expected | Pass? |
|-------|----------|-------|
| API `/health` | `200` + `"status":"healthy"` | ☐ |
| `/privacy` | `200` | ☐ |
| `/terms` | `200` | ☐ |
| Portal sign-in pages | `200` | ☐ |
| Portal ToS gate → I agree | No `401` error | ☐ |
| Careers form on marketing site | Submits without error | ☐ |
| Clerk sign-in on a portal | Lands in app | ☐ |

---

## 13. Quick reference — who owns what

```
sompacare.com (DNS)
    └── Vercel → marketing site + /admin + /api/contact + /api/careers

Render Blueprint
    ├── sompacare-api (Docker)     → NestJS API + webhooks
    ├── sompacare-db (Postgres)    → platform database
    ├── sompacare-nurse            → Clerk + API
    ├── sompacare-facility         → Clerk + API + Stripe
    ├── sompacare-recruiter        → Clerk + API
    └── sompacare-admin            → Clerk + API

External APIs called by sompacare-api
    ├── Clerk (auth)
    ├── Stripe (payments)
    ├── Resend (email)
    ├── Supabase (resume files)
    ├── Checkr (background checks)
    ├── OpenAI (optional AI)
    └── Twilio (optional SMS)
```

---

## Related docs

- [marketing-vercel-deploy.md](./marketing-vercel-deploy.md)
- [checkr-production-setup.md](./checkr-production-setup.md)
- [../stripe-live-setup.md](../stripe-live-setup.md)
- [../clerk-setup.md](../clerk-setup.md)
- [../DEPLOY_NOW.md](../DEPLOY_NOW.md)
