# Stripe Live Mode Setup — Sompacare

Use this guide to move from **test mode** to **live** Stripe for real payments.

---

## Before you start

- [ ] Business verification complete in [Stripe Dashboard](https://dashboard.stripe.com)
- [ ] Connect enabled as **Marketplace** (you already did this in test)
- [ ] Production API deployed with HTTPS (e.g. `https://api.yourdomain.com`)
- [ ] Production portals deployed (nurse, facility, admin)

---

## Step 1 — Switch Stripe to Live mode

1. Open [Stripe Dashboard](https://dashboard.stripe.com)
2. Toggle **Test mode** → **Live** (top-right)
3. Complete any remaining activation steps (identity, bank account for payouts)

---

## Step 2 — Get live API keys

1. Go to **Developers → API keys** (while in **Live** mode)
2. Copy:
   - **Publishable key** → `pk_live_...`
   - **Secret key** → `sk_live_...`

**Never commit live keys to git.** Store in your secrets manager or hosting env vars.

---

## Step 3 — Set production environment variables

Copy `.env.production.example` values into your production secrets:

| Variable | Live value |
|----------|------------|
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | From Step 4 (`whsec_...`) |
| `PAYMENTS_DEV_BYPASS` | `false` |
| `NURSE_PORTAL_URL` | `https://nurse.yourdomain.com` |
| `FACILITY_PORTAL_URL` | `https://facility.yourdomain.com` |

**Nurse portal** (`apps/nurse-portal` on Vercel):

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Facility portal** (if invoice card UI added later):

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Step 4 — Register live webhooks

1. Stripe Dashboard → **Developers → Webhooks** (Live mode)
2. **Add endpoint**
3. URL:

```
https://api.yourdomain.com/api/v1/payments/stripe/webhook
```

4. Select events:
   - `payment_intent.succeeded` — facility invoice payments
   - `account.updated` — nurse Connect onboarding (legacy v1 accounts)
   - `v2.core.account.updated` — nurse Connect onboarding (v2 accounts)

5. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET` in production API env
6. Redeploy / restart API

> **Local dev:** use `npm run stripe:listen` (test mode only). Production uses Dashboard webhooks, not Stripe CLI.

---

## Step 5 — Connect live settings

In **Live** mode → **Connect → Settings**:

| Setting | Value |
|---------|--------|
| Business model | **Marketplace** |
| Account type | **Express** |
| Branding | Sompacare logo + support email |

Enable **Accounts v2** if prompted (Sompacare uses the v2 API).

---

## Step 6 — Verify live flow (pilot)

Run with real small amounts first ($1 test shift if possible):

1. **Facility** — pay an invoice with a real card
2. **Nurse** — Wallet → **Set up payouts** → complete Connect onboarding with real identity/bank
3. **Nurse** — **Instant pay** after wallet has balance
4. **Admin** — confirm no payment errors in audit/logs

---

## Step 7 — Go-live checklist

- [ ] `AUTH_ALLOW_DEV_TOKENS=false`
- [ ] All `*_DEV_BYPASS=false`
- [ ] Live `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` on API
- [ ] Live `pk_live_...` on nurse portal
- [ ] Webhook endpoint returns 200 in Stripe Dashboard → Webhooks → recent deliveries
- [ ] `instant_pay` feature flag enabled in admin portal
- [ ] Platform Stripe balance can cover transfers (fund from facility invoice payments)

---

## Money flow (live)

```
Facility pays invoice → Sompacare platform Stripe balance
       ↓
Payroll approved → Nurse wallet credited (internal ledger)
       ↓
Nurse instant pay → Stripe transfer → Nurse bank account
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Invoice stays SENT after card pay | Check webhook deliveries; verify `STRIPE_WEBHOOK_SECRET` |
| Set up payouts fails | Connect must be Marketplace + Express in **live** mode |
| Instant pay disabled after onboarding | Webhook missing; nurse can revisit wallet (auto-sync) or call sync endpoint |
| Payroll fails on transfer | Nurse must finish Connect first; wallet still credits if transfer skipped |
| `insufficient funds` on transfer | Platform needs balance from facility invoice payments first |

---

## Rollback

If live payments fail at launch:

1. Switch portals back to test `pk_test_...` (emergency only)
2. Disable `instant_pay` flag in admin
3. Revert API to previous deployment
4. Investigate webhook logs in Stripe Dashboard

See [production-cutover-runbook.md](./launch/production-cutover-runbook.md) for full cutover steps.
