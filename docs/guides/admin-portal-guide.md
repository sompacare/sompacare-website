# Admin Portal — User Guide

**URL:** https://admin.yourdomain.com (local: http://localhost:3004)

For platform operators (`SUPER_ADMIN` role) to monitor KPIs, manage users, handle support, and control feature flags.

**Dev token (local only):** `Bearer dev_dev_admin`

---

## Dashboard

Platform-wide KPIs for the last 30 days:

| KPI | Description |
|-----|-------------|
| Active users / workers | Registered accounts and worker profiles |
| Facilities | Active healthcare facilities |
| Fill rate | Published shift slots filled |
| Revenue (30d) | Paid facility invoices |
| Payroll (30d) | Processed pay runs |
| Open tickets | Support queue size |
| Compliance queue | Licenses pending verification |
| Placements | Recruiter pipeline placements |

---

## Users

Browse all platform accounts with roles and status. Use for:

- Verifying onboarding completed
- Checking role assignments
- Identifying inactive accounts

*User editing and role assignment UI planned — use Clerk dashboard + seed scripts for now.*

---

## Facilities

View all facilities with ratings, locations, and active status. Monitor onboarding of new facilities.

---

## Support tickets

| Priority | SLA target |
|----------|------------|
| URGENT | 1 hour |
| HIGH | 4 hours |
| MEDIUM | 24 hours |
| LOW | 48 hours |

**Workflow:**
1. Review ticket subject and description
2. Investigate via audit logs if needed
3. Update status: OPEN → IN_PROGRESS → RESOLVED → CLOSED
4. Assign to team member if escalated

---

## Audit logs

Searchable trail of platform actions:

- User logins
- Shift publish/cancel
- Application approve/reject
- Feature flag changes
- Credential verifications

Filter by entity type or user. Required for compliance investigations.

---

## Feature flags

Toggle platform capabilities without deploys:

| Flag | Purpose |
|------|---------|
| `ai_matching` | AI shift recommendations |
| `instant_pay` | Worker instant pay |
| `recruiter_portal` | Recruiter pipeline access |
| `background_check_auto` | Auto-trigger Checkr on offer |

**Emergency:** Disable a flag to contain a bad release while engineering investigates.

---

## AI insights

Summary panel with:

- Platform health narrative
- Top-rated facilities
- Recent audit activity
- Urgent ticket count

Use for daily standup and executive reporting.

---

## Production checklist (admin)

Before go-live, verify in admin portal:

- [ ] Dashboard KPIs load without errors
- [ ] Audit logs recording actions
- [ ] Support tickets functional
- [ ] Feature flags match launch plan
- [ ] No urgent tickets unassigned

See [production-cutover-runbook.md](../launch/production-cutover-runbook.md) for full cutover steps.
