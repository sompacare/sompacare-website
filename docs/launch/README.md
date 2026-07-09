# Launch Documentation Index

M14 deliverables for production launch.

| Document | Audience | Purpose |
|----------|----------|---------|
| [launch-checklist.md](./launch-checklist.md) | All teams | Master go-live checklist |
| [production-cutover-runbook.md](./production-cutover-runbook.md) | Engineering, DevOps | Step-by-step cutover & rollback |
| [incident-response.md](./incident-response.md) | On-call engineers | Severity levels, escalation, playbooks |
| [security-pentest-remediation.md](./security-pentest-remediation.md) | Security, Engineering | Pentest tracker & controls |

## User guides

| Guide | Audience |
|-------|----------|
| [nurse-portal-guide.md](../guides/nurse-portal-guide.md) | Healthcare workers |
| [facility-portal-guide.md](../guides/facility-portal-guide.md) | Facility managers |
| [admin-portal-guide.md](../guides/admin-portal-guide.md) | Platform admins |
| [recruiter-portal-guide.md](../guides/recruiter-portal-guide.md) | Recruiters |

## Related

- [deploy-platform.md](../deploy-platform.md) — Vercel + Render/Railway deploy
- [developer-onboarding.md](../developer-onboarding.md) — Local dev setup
- [PLATFORM.md](../../PLATFORM.md) — Build status & milestone progress
- [.env.production.example](../../.env.production.example) — Production env template

## Verification

```bash
node scripts/test-m14-launch.mjs
```
