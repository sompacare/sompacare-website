# Launch Checklist

Master checklist for Sompacare platform go-live. Check items in order.

---

## Engineering readiness

- [ ] All milestones M1–M13 complete
- [ ] `node scripts/test-m14-launch.mjs` passes
- [ ] CI pipeline green on `main`
- [ ] `.env.production.example` reviewed — no dev bypass flags
- [ ] Docker image builds (`docker build -f apps/api/Dockerfile .`)
- [ ] Terraform plan reviewed (`infra/terraform`)
- [ ] k6 load test passed on staging (100+ VUs, p95 < 2s)
- [ ] Database migrations tested on staging snapshot

## Security & compliance

- [ ] [Security pentest remediation](./security-pentest-remediation.md) — no open Critical/High
- [ ] `AUTH_ALLOW_DEV_TOKENS=false` in production
- [ ] Clerk MFA enabled for admin accounts
- [ ] CORS locked to production portal domains
- [ ] Audit logging verified
- [ ] HIPAA access controls documented

## Documentation

- [ ] [Production cutover runbook](./production-cutover-runbook.md) reviewed by team
- [ ] [Incident response](./incident-response.md) — on-call rotation set
- [ ] [Nurse guide](../guides/nurse-portal-guide.md) published to help center
- [ ] [Facility guide](../guides/facility-portal-guide.md) published
- [ ] [Admin guide](../guides/admin-portal-guide.md) internal
- [ ] [Recruiter guide](../guides/recruiter-portal-guide.md) published
- [ ] API docs (Swagger) accessible on staging

## Integrations

- [ ] Clerk production — portals + webhook
- [ ] Stripe live — Connect + invoicing webhooks ([stripe-live-setup.md](../stripe-live-setup.md))
- [ ] Checkr — API key, webhook, FCRA flow ([checkr-production-setup.md](../guides/checkr-production-setup.md))
- [ ] Resend — verified sending domain
- [ ] Firebase push (optional) — mobile notifications
- [ ] OpenAI (optional) — AI matching
- [ ] Sentry — error tracking live
- [ ] Prometheus/Grafana — dashboards configured

## Portal deployments

- [ ] Nurse portal on Render (`sompacare-nurse`) — [GO-LIVE-RENDER.md](./GO-LIVE-RENDER.md)
- [ ] Facility portal on Render (`sompacare-facility`)
- [ ] Recruiter portal on Render (`sompacare-recruiter`)
- [ ] Admin portal on Render (`sompacare-admin`)
- [ ] Env group `sompacare-portal-auth` linked to all four portal services
- [ ] Marketing site — verify `/privacy` and `/terms` return 200 (`npm run smoke:production`)
- [ ] Mobile apps submitted to App Store / Play Store (or TestFlight beta)

## Pilot validation

- [ ] 1 facility onboarded with real locations
- [ ] 3+ nurses credentialed and compliant
- [ ] End-to-end shift lifecycle completed:
  - Post → apply → approve → confirm → clock in/out → timecard → pay
- [ ] Support ticket submitted and resolved via admin portal

## Go-live

- [ ] DNS cutover complete
- [ ] Production smoke test passed
- [ ] Go/No-Go meeting held
- [ ] Launch announcement sent
- [ ] Monitoring dashboards on big screen for first 24h

## Post-launch (week 1)

- [ ] Daily error rate review (Sentry + Grafana)
- [ ] Support ticket volume tracked
- [ ] First payroll cycle completed
- [ ] Retrospective scheduled
- [ ] Legacy Supabase admin migration plan updated

---

**Sign-off**

| Role | Name | Date |
|------|------|------|
| Engineering lead | | |
| Product | | |
| Operations | | |
| Security | | |
