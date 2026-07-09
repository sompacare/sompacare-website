# Deploy Sompacare Platform

Production layout:

| Service | Host | Path |
|---------|------|------|
| NestJS API | Render or Railway | `apps/api` (Docker) |
| Nurse portal | Vercel | `apps/nurse-portal` |
| Facility portal | Vercel | `apps/facility-portal` |
| Postgres | Render DB or Railway Postgres | — |

## 1. API (Render or Railway)

### Render
1. Connect repo → **New Blueprint** → use root `render.yaml`
2. Set secrets in dashboard:
   - `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`
   - `CORS_ORIGINS` — comma-separated portal URLs
   - `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
   - `NURSE_PORTAL_URL`, `FACILITY_PORTAL_URL`
3. After first deploy, run migrations:
   ```bash
   DATABASE_URL="..." npm run db:migrate:deploy --workspace=@sompacare/database
   npm run db:seed --workspace=@sompacare/database  # optional for demo data
   ```

### Railway
1. New project → deploy from repo
2. Set root `railway.toml` + Dockerfile at `apps/api/Dockerfile`
3. Add Postgres plugin; set `DATABASE_URL` and other env vars from `.env.platform.example`

### Required API env (production)
```
DATABASE_URL=
API_PORT=4000
CORS_ORIGINS=https://nurse.example.com,https://facility.example.com
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=
AUTH_ALLOW_DEV_TOKENS=false
GEOFENCE_DEV_BYPASS=false
RESEND_API_KEY=
RESEND_FROM_EMAIL=Sompacare <notifications@yourdomain.com>
NURSE_PORTAL_URL=https://nurse.example.com
FACILITY_PORTAL_URL=https://facility.example.com
```

Clerk webhook URL: `https://<api-host>/api/v1/auth/webhook/clerk`

## 2. Nurse Portal (Vercel)

1. **New Project** → import repo
2. **Root Directory:** `apps/nurse-portal`
3. Framework: Next.js (auto-detected; `vercel.json` included)
4. Environment variables:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_API_URL=https://<api-host>/api/v1
   ```
5. Do **not** set `NEXT_PUBLIC_NURSE_PORTAL_DEV_TOKEN` in production.

## 3. Facility Portal (Vercel)

Same as nurse portal, but:
- **Root Directory:** `apps/facility-portal`
- `NEXT_PUBLIC_API_URL=https://<api-host>/api/v1`
- Omit dev token env vars.

## 4. Post-deploy checklist

- [ ] Clerk: add production portal URLs to allowed origins
- [ ] Clerk webhook → API `/api/v1/auth/webhook/clerk`
- [ ] Link users: `node scripts/link-clerk-user.mjs --email ...` (RN)
- [ ] Link facility managers: `node scripts/link-facility-user.mjs --email ...`
- [ ] Resend: verify sending domain for production emails
- [ ] Test: apply → facility email → approve → nurse email

## Launch (M14)

Full go-live documentation: [docs/launch/README.md](./launch/README.md)

- [production-cutover-runbook.md](./launch/production-cutover-runbook.md) — cutover sequence & rollback
- [launch-checklist.md](./launch/launch-checklist.md) — master checklist
- [incident-response.md](./launch/incident-response.md) — on-call playbooks
- [.env.production.example](../.env.production.example) — hardened production env

```bash
npm run test:launch
```

## Local Docker API build

```bash
docker build -f apps/api/Dockerfile -t sompacare-api .
docker run -p 4000:4000 --env-file .env sompacare-api
```
