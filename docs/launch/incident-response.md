# Incident Response & On-Call

## Severity levels

| Level | Definition | Response time | Examples |
|-------|------------|---------------|----------|
| **P1** | Platform down or data breach | 15 min | API 5xx > 50%, auth broken, credential leak |
| **P2** | Major feature degraded | 1 hour | Shifts not publishing, payments failing, WebSocket down |
| **P3** | Minor degradation | 4 hours | Slow queries, single portal UI bug, email delay |
| **P4** | Low impact | Next business day | Cosmetic issues, non-critical report errors |

## On-call rotation

Rotate weekly. Primary carries the pager; secondary backs up if no ack in 15 minutes.

| Week | Primary | Secondary |
|------|---------|-----------|
| Template | `@engineer-a` | `@engineer-b` |

**Handoff checklist (every Monday):**
- [ ] Review open Sentry issues
- [ ] Check Grafana error-rate dashboard
- [ ] Confirm PagerDuty / Slack `#oncall` routing
- [ ] Verify runbook links in team wiki

## Detection

| Source | Alert |
|--------|-------|
| Sentry | Unhandled exceptions, error spike |
| Prometheus/Grafana | `http_requests_total` 5xx rate > 5% |
| ALB health checks | Target unhealthy |
| Uptime monitor | `/api/v1/health` failing |
| User reports | Support tickets tagged `incident` |

## Response playbook

### 1. Acknowledge
- Post in `#incidents`: severity, symptoms, incident commander
- Create incident doc (shared notes)

### 2. Contain
- **Auth compromise:** rotate Clerk keys, revoke sessions via Clerk dashboard
- **API overload:** scale ECS `desired_count`, enable `LOAD_TEST_MODE` only if legitimate traffic
- **Bad deploy:** rollback ECS task definition (see [production-cutover-runbook.md](./production-cutover-runbook.md))
- **Feature-specific:** disable feature flag in admin portal (`/flags`)

### 3. Investigate
```bash
# Health
curl https://api.yourdomain.com/api/v1/health

# Recent audit activity
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "https://api.yourdomain.com/api/v1/admin/audit-logs?limit=20"

# ECS logs
aws logs tail /ecs/sompacare-api-prod --follow
```

### 4. Remediate
- Fix forward or rollback
- Deploy patch via `deploy.yml` workflow
- Run `node scripts/test-m14-launch.mjs` against staging before prod push

### 5. Communicate
- **P1/P2:** Status page update every 30 min until resolved
- **Internal:** `#incidents` thread with timeline
- **External:** Support macro for affected users (if needed)

### 6. Post-mortem (within 48h)
Template:
1. **Summary** — what happened, duration, impact
2. **Timeline** — detection → mitigation → resolution
3. **Root cause** — technical and process gaps
4. **Action items** — owners and due dates
5. **Lessons learned**

## Escalation

```
On-call engineer (15 min)
  → Engineering lead (30 min)
    → CTO / founder (P1 only, 1 hour)
```

## Useful commands

```bash
# Scale API tasks
aws ecs update-service --cluster sompacare-prod --service sompacare-api-prod --desired-count 4

# Disable dev tokens (verify production)
# AUTH_ALLOW_DEV_TOKENS must be false — check ECS task env

# Database connection check
npm run db:studio --workspace=@sompacare/database  # read-only investigation
```

## HIPAA / security incidents

If PHI may be involved:
1. Contain immediately — disable affected user accounts
2. Notify security lead and legal within 1 hour
3. Preserve audit logs — do not delete
4. Follow breach notification procedures per organizational policy
