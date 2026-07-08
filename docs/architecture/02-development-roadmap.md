# Development Roadmap

## Milestone Overview

| # | Milestone | Duration | Deliverable |
|---|-----------|----------|-------------|
| M1 | Foundation | 2 weeks | Monorepo, Prisma schema, NestJS API skeleton, RBAC, Docker |
| M2 | Authentication & Users | 2 weeks | Clerk integration, MFA, profiles, organizations, teams |
| M3 | Shift Marketplace Core | 3 weeks | Post shifts, search, apply, approve, assign lifecycle |
| M4 | Timekeeping & GPS | 2 weeks | Clock in/out, geofence, timecards, facility approval |
| M5 | Payments & Wallet | 3 weeks | Stripe Connect, instant pay, invoices, wallet |
| M6 | Payroll Module | 2 weeks | Pay runs, overtime, deductions, tax forms, exports |
| M7 | Compliance Module | 2 weeks | License tracking, expirations, background checks, scoring |
| M8 | Recruiter Portal | 2 weeks | Pipeline, parsing, onboarding, placement metrics |
| M9 | AI Engine | 3 weeks | Matching, scheduling, compliance AI, payroll anomalies |
| M10 | Real-time & Notifications | 2 weeks | WebSockets, push, SMS, email, escalation |
| M11 | Admin & Analytics | 3 weeks | Dashboards, forecasting, audit, feature flags |
| M12 | Mobile Apps | 4 weeks | React Native nurse + facility apps |
| M13 | DevOps & Hardening | 2 weeks | Terraform, CI/CD, load tests, security audit |
| M14 | Documentation & Launch | 1 week | Runbooks, admin guide, production cutover |

**Total estimated timeline: ~29 weeks**

---

## Milestone 1 — Foundation (Current)

### Goals
- Turborepo monorepo with shared packages
- Production Prisma schema (all core entities)
- NestJS API with health, auth guards, users, organizations, facilities, shifts
- Shared RBAC permission matrix
- Docker Compose for local PostgreSQL + Redis
- Architecture & API documentation

### Exit Criteria
- [ ] `pnpm install && pnpm build` succeeds across workspace
- [ ] `pnpm db:migrate` applies schema to local PostgreSQL
- [ ] API serves OpenAPI docs at `/api/v1/docs`
- [ ] CRUD for shifts with RBAC enforced
- [ ] Unit tests for RBAC permission checks

---

## Milestone 2 — Authentication & Users

- Clerk webhook sync → platform User records
- Role assignment UI in admin
- Worker profile: photo, resume, licenses, availability calendar
- Facility profile: locations, specialties, billing info
- Device management & session revocation

---

## Milestone 3 — Shift Marketplace Core

Full shift lifecycle (post → apply → approve → confirm):

```
Facility posts shift → Notifications sent → Workers apply
→ Facility approves → Worker confirms → Assignment created
```

- Shift search with filters (distance, pay, specialty, length)
- Map-based search (Mapbox/Google Maps)
- Saved shifts & favorite facilities
- One-click apply

---

## Milestone 4 — Timekeeping

- GPS-verified clock in/out with geofence radius
- Break tracking
- Timecard submission & facility approval
- Dispute workflow

---

## Milestone 5 — Payments

- Stripe Connect onboarding (workers + facilities)
- Wallet balance & transaction history
- Instant pay (Stripe Instant Payouts)
- Facility invoicing

---

## Milestone 6 — Payroll

- Pay run generation from approved timecards
- Overtime, holiday, bonus rules engine
- Payroll approval workflow
- ACH/Stripe payouts
- W-2 / 1099 export

---

## Milestone 7 — Compliance

- License & certification upload + verification queue
- Expiration reminders (30/14/7 day)
- Background check integration (Checkr API)
- Compliance score per worker
- Audit history

---

## Milestone 8 — Recruiter Portal

- Kanban candidate pipeline
- AI resume parser integration
- Interview scheduling
- Reference & background check tracking
- Offer letters & onboarding packages
- Recruiter leaderboard

---

## Milestone 9 — AI Engine

| Feature | Model | Input | Output |
|---------|-------|-------|--------|
| Resume Parser | GPT-4o | PDF/text resume | Structured profile JSON |
| Shift Matching | GPT-4o + rules | Shift + candidates | Match score 0-100 |
| Auto-Scheduler | Rules + ML | Open shifts + pool | Recommended assignments |
| Compliance AI | Rules engine | License data | Risk flags |
| Payroll Anomalies | Statistical + AI | Timecards | Fraud/missing clock-out alerts |
| Demand Forecast | Time series | Historical shifts | Shortage predictions |

---

## Milestone 10 — Real-time

- Socket.io gateway for live shift updates
- In-app notification center
- Twilio SMS for urgent shifts
- Firebase push for mobile
- Reminder & escalation engine (BullMQ delayed jobs)

---

## Milestone 11 — Admin Platform

- Revenue, margin, payroll dashboards
- User/facility/worker management
- Support ticket system
- Audit log viewer
- Feature flags (LaunchDarkly or DB-backed)
- AI insights panel

---

## Milestone 12 — Mobile

- React Native (Expo) for nurse & facility
- Offline clock events queue
- Biometric login
- Camera document upload
- Push notifications

---

## Milestone 13 — DevOps

- Terraform: VPC, RDS, ElastiCache, ECS, S3
- GitHub Actions: lint, test, build, deploy
- Sentry + Prometheus + Grafana
- Load testing (k6): 10K concurrent shift searches

---

## Milestone 14 — Launch

- Production cutover runbook
- Admin & user guides
- Security penetration test remediation
- On-call rotation & incident response
