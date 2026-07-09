# Production Cutover Runbook

Step-by-step guide for launching the Sompacare platform to production.

**Estimated duration:** 4–6 hours (excluding DNS propagation)  
**Rollback window:** 30 minutes after go-live decision

---

## Pre-cutover (T-7 days)

- [ ] All milestone smoke tests pass locally (`node scripts/test-m14-launch.mjs`)
- [ ] CI pipeline green on `main`
- [ ] Terraform plan reviewed and approved (`infra/terraform`)
- [ ] Production secrets stored in AWS Secrets Manager / Vercel
- [ ] Clerk production instance configured with portal URLs
- [ ] Stripe live mode webhooks registered
- [ ] Resend domain verified
- [ ] DNS records prepared (CNAME for portals, API subdomain)
- [ ] On-call rotation scheduled ([incident-response.md](./incident-response.md))
- [ ] Pentest remediation complete ([security-pentest-remediation.md](./security-pentest-remediation.md))

## Pre-cutover (T-1 day)

```bash
# Final staging validation
node scripts/test-m14-launch.mjs
k6 run loadtests/shift-search.k6.js   # with LOAD_TEST_MODE=true on staging API
```

- [ ] Database backup verified (RDS snapshot)
- [ ] Rollback image tagged in ECR
- [ ] Feature flags reviewed in admin portal (`/flags`)
- [ ] Support team briefed on launch window

---

## Cutover sequence (T-0)

### Phase 1 — Infrastructure (30 min)

```bash
cd infra/terraform
terraform apply -var-file=terraform.tfvars
```

- [ ] VPC, RDS, ElastiCache, ECS, S3 provisioned
- [ ] ALB health check passing (`/api/v1/health`)
- [ ] Security groups restrict RDS/Redis to VPC only

### Phase 2 — Database (15 min)

```bash
DATABASE_URL="postgresql://..." npm run db:migrate:deploy --workspace=@sompacare/database
# Optional: seed only non-PII reference data
# npm run db:seed --workspace=@sompacare/database
```

- [ ] Migrations applied without error
- [ ] Roles and permissions present (`SUPER_ADMIN`, `RN`, `FACILITY_MANAGER`, etc.)

### Phase 3 — API deploy (20 min)

```bash
# Via GitHub Actions → Deploy API workflow
# Or manually:
docker build -f apps/api/Dockerfile -t sompacare-api:RELEASE .
# push to ECR, update ECS task definition
```

- [ ] `AUTH_ALLOW_DEV_TOKENS=false` confirmed
- [ ] All `*_DEV_BYPASS` flags set to `false`
- [ ] Health returns `healthy` with database + redis `ok`
- [ ] Metrics endpoint reachable by Prometheus

### Phase 4 — Portals (30 min)

Deploy each Vercel project (see [deploy-platform.md](../deploy-platform.md)):

| Portal | Root directory | URL |
|--------|----------------|-----|
| Nurse | `apps/nurse-portal` | `nurse.yourdomain.com` |
| Facility | `apps/facility-portal` | `facility.yourdomain.com` |
| Recruiter | `apps/recruiter-portal` | `recruiter.yourdomain.com` |
| Admin | `apps/admin-portal` | `admin.yourdomain.com` |

- [ ] `NEXT_PUBLIC_API_URL` points to production API
- [ ] No dev token env vars set
- [ ] Clerk production keys configured

### Phase 5 — Integrations (15 min)

- [ ] Clerk webhook → `https://api.yourdomain.com/api/v1/auth/webhook/clerk`
- [ ] Stripe webhook → `https://api.yourdomain.com/api/v1/payments/stripe/webhook`
- [ ] Link pilot users:
  ```bash
  node scripts/link-facility-user.mjs --email facility-pilot@yourdomain.com
  node scripts/link-clerk-user.mjs --email nurse-pilot@yourdomain.com
  ```

### Phase 6 — DNS cutover (variable)

- [ ] API: `api.yourdomain.com` → ALB DNS
- [ ] Portals: CNAME to Vercel
- [ ] TLS certificates valid (ACM / Vercel auto)

### Phase 7 — Smoke test (15 min)

```bash
API_URL=https://api.yourdomain.com node scripts/test-m14-launch.mjs
```

**Golden path validation (manual):**

1. Nurse signs in → browses shifts → applies
2. Facility signs in → approves applicant
3. Nurse confirms assignment
4. Notification received in both portals
5. Admin dashboard shows KPIs

---

## Go / No-Go criteria

| Check | Required |
|-------|----------|
| API health `healthy` | Yes |
| All portals load without 5xx | Yes |
| Clerk sign-in works | Yes |
| Shift apply → approve flow | Yes |
| No P1 Sentry errors in 15 min | Yes |
| p95 API latency < 2s | Yes |

**Go:** All checks pass → announce launch  
**No-Go:** Any P1 failure → execute rollback

---

## Rollback procedure

1. Revert ECS task definition to previous image tag
2. Revert portal Vercel deployments to prior release
3. If schema migration caused issues: restore RDS snapshot (last resort — coordinate with eng lead)
4. Set feature flag `maintenance_mode` if needed
5. Post incident channel update within 15 minutes

```bash
# Quick API rollback (ECS)
aws ecs update-service --cluster sompacare-prod --service sompacare-api-prod \
  --task-definition sompacare-api-prod:PREVIOUS_REVISION
```

---

## Post-cutover (T+24h)

- [ ] Monitor Grafana dashboards for error rate and latency
- [ ] Review Sentry for new issues
- [ ] Confirm first real shift lifecycle completed end-to-end
- [ ] Send launch summary to stakeholders
- [ ] Schedule post-launch retrospective (within 1 week)

---

## Contacts

| Role | Responsibility |
|------|----------------|
| Eng lead | Cutover decision, rollback authority |
| DevOps | Terraform, ECS, RDS |
| Support | User onboarding, ticket triage |
| On-call | P1/P2 incident response |

See [incident-response.md](./incident-response.md) for escalation paths.
