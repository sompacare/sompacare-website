# Render — “Failed deploy” / out of build pipeline minutes

If the build log says:

> **Build canceled: your workspace has run out of build pipeline minutes for the current billing period.**

That is **not an application bug**. Render refused to start the build. Your **last successful deploy is still serving traffic** until a new deploy succeeds.

---

## Fix billing (required once)

1. Open **[Render → Workspace Settings → Build Pipeline](https://dashboard.render.com)** (gear icon on the workspace, not inside a service).
2. Confirm the workspace is on **Professional / Performance** (not Hobby/Starter if you need more minutes).
3. Set **Monthly build spend limit** high enough to cover 5 services (or raise the included tier).
4. Wait until the dashboard shows **available build minutes** for this billing period (upgrading sometimes takes a few minutes to apply).

---

## Redeploy without burning all minutes at once

**Do not** use Blueprint **Manual sync** if it triggers **five builds in parallel** — that drains minutes fast.

Deploy **one service at a time**, wait until each shows **Live**:

| Order | Service | Why |
|-------|---------|-----|
| 1 | **sompacare-api** | Backend for all portals |
| 2 | **sompacare-admin** | Operations |
| 3 | **sompacare-nurse** | Workers |
| 4 | **sompacare-facility** | Customers |
| 5 | **sompacare-recruiter** | Heaviest Next build — do last |

Per service:

1. Open the service → **Deploys** → **Manual Deploy** → branch **`platform`**
2. **Clear build cache** only if you changed Clerk env vars or a build failed with missing `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
3. Wait for **Live** before starting the next service

---

## After deploys succeed

```bash
npm run smoke:production
```

Expect all checks **OK**.

---

## Repo changes that reduce future minute usage

- **Build filters** in `render.yaml` — a docs-only push does not rebuild all five services.
- **Scoped `npm ci`** in `scripts/render-build-portal.mjs` — portal builds install only that portal + `@sompacare/shared`.

---

## Still failing with a real build error?

| Log message | Action |
|-------------|--------|
| Missing `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Link env group **`sompacare-portal-auth`** to the portal, redeploy with clear cache |
| JavaScript heap out of memory | Recruiter already has `NODE_OPTIONS`; confirm service **Pro** plan |
| Docker API build fails | Open **sompacare-api** logs; fix TypeScript/migrate errors shown there |
