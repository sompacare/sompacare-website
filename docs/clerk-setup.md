# Clerk Authentication Setup

Sompacare uses [Clerk](https://clerk.com) for worker and facility authentication across the Nurse Portal, Facility Portal, and NestJS API.

## 1. Create a Clerk Application

1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com) and create an application named **Sompacare Staffing**.
2. Enable sign-in methods:
   - Email
   - Phone (optional)
   - Google
   - Apple
3. Enable **Multi-factor authentication** under User & Authentication → Multi-factor.

## 2. Copy API Keys

From **Configure → API Keys**:

| Key | Where to put it |
|-----|-----------------|
| Publishable key (`pk_test_...` or `pk_live_...`) | `apps/nurse-portal/.env.local` → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| Secret key (`sk_test_...` or `sk_live_...`) | `apps/nurse-portal/.env.local` → `CLERK_SECRET_KEY` |
| Secret key (same) | Root `.env.platform` → `CLERK_SECRET_KEY` |

```bash
cp apps/nurse-portal/.env.local.example apps/nurse-portal/.env.local
cp .env.platform.example .env.platform
# Paste your keys into both files
```

## 3. Configure Clerk Webhook (API user sync)

1. In Clerk Dashboard → **Webhooks** → Add Endpoint
2. URL: `https://your-api-domain.com/api/v1/auth/webhook/clerk`  
   Local dev: use [ngrok](https://ngrok.com) → `https://xxxx.ngrok.io/api/v1/auth/webhook/clerk`
3. Subscribe to events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
4. Copy the **Signing Secret** (`whsec_...`) to `.env.platform` → `CLERK_WEBHOOK_SECRET`

## 4. Assign Platform Roles (first-time users)

New Clerk users sync to the platform database as `ACTIVE` but have **no RBAC role** until assigned.

**Option A — Link to seed nurse (local dev):**

Update the seed user's `clerkId` in the database to match your Clerk user ID after first sign-in.

**Option B — Admin assigns role (production):**

Use the admin dashboard (M11) or run:

```sql
-- After user signs in, find their id:
SELECT id, email, clerk_id FROM users WHERE email = 'you@example.com';

-- Assign RN role:
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'you@example.com' AND r.name = 'RN';
```

Also create a worker profile:

```sql
INSERT INTO worker_profiles (id, user_id, clinical_role, specialties, preferred_shift_types)
SELECT gen_random_uuid()::text, u.id, 'RN', ARRAY['Med-Surg'], ARRAY['PER_DIEM']::"ShiftType"[]
FROM users u WHERE u.email = 'you@example.com';
```

## 5. JWT for API Calls

The Nurse Portal sends Clerk session tokens as `Authorization: Bearer <jwt>` to the NestJS API. The API verifies tokens via `@clerk/backend` using `CLERK_SECRET_KEY`.

**Local dev without Clerk:** set in `apps/nurse-portal/.env.local`:

```
NEXT_PUBLIC_NURSE_PORTAL_DEV_TOKEN=dev_nurse_rn
```

And ensure `AUTH_ALLOW_DEV_TOKENS=true` in `.env.platform`.

## 6. Run the Stack

```bash
docker compose up -d
npm run db:migrate
npm run db:seed
npm run dev:api          # http://localhost:4000
npm run dev --workspace=@sompacare/nurse-portal   # http://localhost:3001
```

## 7. Clerk Dashboard Checklist

- [ ] Application created
- [ ] Google + Apple OAuth configured (optional)
- [ ] MFA enabled
- [ ] Webhook endpoint added with signing secret
- [ ] Keys in `.env.local` and `.env.platform`
- [ ] First user assigned RN/CNA/LPN role in database

## 8. Production custom domains (`*.sompacare.com`)

Portals run on subdomains of your primary Clerk domain with **satellite mode off** (`NEXT_PUBLIC_CLERK_IS_SATELLITE=false`).

1. Verify `clerk.sompacare.com` DNS in Clerk Dashboard → **Domains**
2. Add allowed subdomains under **Domains → Allowed subdomains** (see checklist)
3. Webhook: `https://api.sompacare.com/api/v1/auth/webhook/clerk`
4. **Recruiter portal:** optional **Restrictions → Allowlist** with email domain `sompacare.com` so Clerk rejects non-company sign-ups at the source. Sign-in and sign-up use the same pattern as the admin portal (email + password form and Clerk `<SignUp />`).

## Troubleshooting: `host_invalid` / "Invalid host"

This JSON error from `*.clerk.accounts.dev/v1/client/handshake` almost always means the **publishable key is wrong or incomplete** — not a code bug.

1. Open [Clerk Dashboard → API Keys](https://dashboard.clerk.com/last-active?path=api-keys) for **Sompacare Staffing**.
2. Click **Copy** on the publishable key (do not type it manually).
3. Paste into `apps/nurse-portal/.env.local` as a single line:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```
   The key must appear **exactly once** — no duplicate `pk_test_` prefix.
4. Use `http://localhost:3001` in the browser (not `127.0.0.1`).
5. Clear cookies for `localhost` and `clerk.accounts.dev`, then restart the nurse portal:
   ```bash
   npm run dev --workspace=@sompacare/nurse-portal
   ```

If it still fails, regenerate the publishable key in Clerk and paste the new value.
