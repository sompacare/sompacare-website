# API Design — Sompacare Platform v1

Base URL: `https://api.sompacare.com/api/v1`

All endpoints require `Authorization: Bearer <jwt>` unless marked **Public**.

## Conventions

| Convention | Value |
|------------|-------|
| Versioning | URL prefix `/api/v1` |
| Pagination | `?page=1&limit=20` → `{ data, meta: { page, limit, total, totalPages } }` |
| Sorting | `?sort=createdAt&order=desc` |
| Filtering | Query params per resource |
| Search | `?q=search term` |
| Errors | `{ statusCode, message, error, details? }` |
| Rate limit | 100 req/min (authenticated), 20 req/min (public) |

## Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/webhook/clerk` | **Public** Clerk user sync webhook |
| GET | `/auth/me` | Current user + roles + permissions |
| POST | `/auth/refresh` | Refresh access token |
| DELETE | `/auth/sessions/:id` | Revoke session |

## Users & Profiles

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | List users (Admin) |
| GET | `/users/:id` | Get user |
| PATCH | `/users/:id` | Update user |
| GET | `/users/:id/profile` | Worker profile |
| PATCH | `/users/:id/profile` | Update profile |
| POST | `/users/:id/documents` | Upload document (signed S3 URL flow) |
| GET | `/users/:id/availability` | Availability calendar |
| PUT | `/users/:id/availability` | Set availability |

## Organizations & Facilities

| Method | Path | Description |
|--------|------|-------------|
| GET | `/organizations` | List organizations |
| POST | `/organizations` | Create organization |
| GET | `/organizations/:id/facilities` | List facilities |
| POST | `/facilities` | Create facility |
| GET | `/facilities/:id` | Facility detail |
| PATCH | `/facilities/:id` | Update facility |
| GET | `/facilities/:id/locations` | Facility locations |
| POST | `/facilities/:id/favorite-workers` | Add favorite worker |
| POST | `/facilities/:id/blacklist-workers` | Blacklist worker |

## Shifts

| Method | Path | Description |
|--------|------|-------------|
| GET | `/shifts` | Search shifts (filters: role, pay, distance, specialty) |
| POST | `/shifts` | Create shift (Facility) |
| GET | `/shifts/:id` | Shift detail |
| PATCH | `/shifts/:id` | Update shift |
| DELETE | `/shifts/:id` | Cancel shift |
| POST | `/shifts/:id/publish` | Publish draft shift |
| GET | `/shifts/:id/matches` | AI-ranked worker matches |
| POST | `/shifts/bulk` | Bulk create from template |

## Applications & Assignments

| Method | Path | Description |
|--------|------|-------------|
| POST | `/shifts/:id/applications` | Apply to shift (Worker) |
| GET | `/applications` | List applications |
| PATCH | `/applications/:id` | Approve/reject (Facility) |
| POST | `/assignments/:id/confirm` | Worker confirms assignment |
| GET | `/assignments` | List assignments |
| PATCH | `/assignments/:id/cancel` | Cancel assignment |

## Timekeeping

| Method | Path | Description |
|--------|------|-------------|
| POST | `/assignments/:id/clock-in` | GPS clock in |
| POST | `/assignments/:id/clock-out` | GPS clock out |
| POST | `/assignments/:id/break/start` | Start break |
| POST | `/assignments/:id/break/end` | End break |
| GET | `/timecards` | List timecards |
| PATCH | `/timecards/:id/approve` | Facility approve |
| PATCH | `/timecards/:id/dispute` | Dispute timecard |

## Payroll

| Method | Path | Description |
|--------|------|-------------|
| GET | `/payroll/runs` | List pay runs |
| POST | `/payroll/runs` | Generate pay run |
| GET | `/payroll/runs/:id` | Pay run detail |
| POST | `/payroll/runs/:id/approve` | Approve pay run |
| POST | `/payroll/runs/:id/process` | Process Stripe payouts |
| GET | `/payroll/runs/:id/export` | Export CSV/PDF |

## Compliance

| Method | Path | Description |
|--------|------|-------------|
| GET | `/compliance/licenses` | List licenses |
| POST | `/compliance/licenses` | Submit license |
| PATCH | `/compliance/licenses/:id/verify` | Verify license |
| GET | `/compliance/score/:userId` | Compliance score |
| GET | `/compliance/alerts` | Active alerts |

## Payments & Wallet

| Method | Path | Description |
|--------|------|-------------|
| GET | `/wallet` | Worker wallet balance |
| GET | `/wallet/transactions` | Transaction history |
| POST | `/wallet/instant-pay` | Request instant payout |
| GET | `/invoices` | List invoices |
| POST | `/invoices/:id/pay` | Pay invoice (Stripe) |

## Notifications

| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications` | List notifications |
| PATCH | `/notifications/:id/read` | Mark read |
| PUT | `/notifications/preferences` | Update preferences |

## Messages

| Method | Path | Description |
|--------|------|-------------|
| GET | `/messages/conversations` | List conversations |
| GET | `/messages/conversations/:id` | Get messages |
| POST | `/messages/conversations/:id` | Send message |

## Ratings

| Method | Path | Description |
|--------|------|-------------|
| POST | `/ratings` | Submit rating |
| GET | `/ratings/users/:id` | User ratings |

## Admin

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/dashboard` | KPI overview |
| GET | `/admin/audit-logs` | Audit log search |
| GET | `/admin/analytics/*` | Analytics endpoints |
| GET | `/admin/feature-flags` | Feature flags |
| PATCH | `/admin/feature-flags/:key` | Toggle flag |

## Webhooks (Outbound)

| Event | Payload |
|-------|---------|
| `shift.published` | Shift object |
| `application.approved` | Application + Assignment |
| `timecard.approved` | Timecard |
| `payroll.processed` | PayRun |
| `compliance.expiring` | License + days remaining |

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `shift:updated` | Server → Client | Shift status change |
| `notification:new` | Server → Client | New notification |
| `clock:status` | Server → Client | Clock in/out update |
| `message:new` | Server → Client | New chat message |
