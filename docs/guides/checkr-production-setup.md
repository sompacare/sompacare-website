# Checkr production setup

Configure employment background screening for Sompacare platform production.

## 1. Checkr dashboard

1. Create a Checkr account at [checkr.com](https://checkr.com) and complete business verification.
2. Create an API key under **Developer Settings**.
3. Note your package slug (default: `tasker_standard`) or create a custom healthcare package.

## 2. Render environment variables

Set on the **sompacare-api** service (`render.yaml` already declares these keys):

| Variable | Value |
|----------|--------|
| `CHECKR_DEV_BYPASS` | `false` |
| `CHECKR_API_KEY` | Checkr API key |
| `CHECKR_WEBHOOK_SECRET` | Webhook signing secret from Checkr |
| `CHECKR_PACKAGE` | `tasker_standard` (or your package) |

## 3. Webhook URL

Register this endpoint in Checkr:

```
https://api.sompacare.com/api/v1/compliance/checkr/webhook
```

Events: report lifecycle updates (`report.completed`, `report.updated`, etc.).

The API verifies `x-checkr-signature` using `CHECKR_WEBHOOK_SECRET`.

## 4. Auto screening on offer

Migration `20260713240000_enable_background_check_auto` enables the `background_check_auto` feature flag.

When enabled, accepting a recruiter offer triggers Checkr for linked workers who have already authorized the FCRA disclosure in the nurse portal.

## 5. FCRA consent flow

Workers must:

1. Open **Credentials** in the nurse portal
2. Accept the background check disclosure (`POST /legal/consent`)
3. Tap **Authorize screening** (`POST /compliance/background-checks`)

## 6. Marketing & legal URLs

App Store requires a live privacy policy:

- `https://www.sompacare.com/privacy`
- `https://www.sompacare.com/terms`

Redeploy the marketing site (Vercel root project) after merging `platform`.

## 7. Database migrations

API Docker entrypoint runs `prisma migrate deploy` on every deploy. No manual migration step is required on Render after pushing `platform`.

## 8. Smoke test

```bash
npm run test:trust-layer
```

Verifies legal documents, consent recording, tenant-scoped facilities, and background check initiation (dev bypass when `CHECKR_API_KEY` unset).
