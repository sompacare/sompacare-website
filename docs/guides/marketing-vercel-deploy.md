# Marketing site (sompacare.com) — Vercel production

The root Next.js app (`/app`, `/privacy`, `/terms`, `/trust`) deploys separately from Render platform services.

## 1. Production branch

In **Vercel → Project → Settings → Git → Production Branch**, set:

```
platform
```

Or merge `platform` into your current production branch (`main`) and redeploy.

## 2. Required environment variables (Vercel)

| Variable | Production value |
|----------|------------------|
| `PLATFORM_API_URL` | `https://sompacare-api.onrender.com/api/v1` |
| `CAREERS_INGEST_SECRET` | Same secret as Render `sompacare-api` |
| `RESEND_API_KEY` | Resend production key |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role |
| `SITE_URL` | `https://www.sompacare.com` |

`PLATFORM_API_URL` is required for careers consent recording (`POST /legal/consent/public`) and funnel ingest.

## 3. API CORS

Render `sompacare-api` must allow the marketing origin. `render.yaml` includes:

```
https://www.sompacare.com,https://sompacare.com
```

Redeploy the API after pushing `platform`.

## 4. Deploy

```bash
npx vercel --prod
```

Or push to `platform` with Vercel Git integration enabled.

## 5. Verify

```bash
curl -I https://www.sompacare.com/privacy
curl -I https://www.sompacare.com/terms
curl -I https://www.sompacare.com/trust
```

Expect **200** (not 404).

## 6. App Store

Update App Store Connect privacy URL to:

```
https://www.sompacare.com/privacy
```
