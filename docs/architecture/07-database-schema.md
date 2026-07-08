# Database Schema Reference

Full Prisma schema: [`packages/database/prisma/schema.prisma`](../../packages/database/prisma/schema.prisma)

## Entity Groups (40+ models)

### Identity & Access
- `User`, `Role`, `Permission`, `UserRole`, `RolePermission`

### Worker
- `WorkerProfile`, `WorkerAvailability`

### Organization
- `Organization`, `OrganizationMember`, `Team`, `OrganizationSetting`

### Facility
- `Facility`, `FacilityLocation`, `FacilityWorkerFavorite`, `FacilityBlacklist`, `FacilityFavorite`

### Shifts
- `Shift`, `ShiftTemplate`, `ShiftApplication`, `ShiftAssignment`, `SavedShift`, `ShiftMatchScore`

### Timekeeping
- `ClockEvent`, `Timecard`

### Payroll & Billing
- `PayRun`, `PayRunEntry`, `Deduction`, `Invoice`, `InvoiceLineItem`, `Payment`, `Wallet`, `WalletTransaction`

### Compliance
- `License`, `Certification`, `BackgroundCheck`, `Document`, `ComplianceAlert`

### Communications
- `Notification`, `Message`

### Ratings & Referrals
- `Rating`, `Referral`

### Admin & System
- `AuditLog`, `ActivityLog`, `SupportTicket`, `FeatureFlag`, `ApiKey`, `Webhook`, `WebhookDelivery`, `AnalyticsEvent`, `Report`

## Key Relationships

```
Organization 1──* Facility 1──* FacilityLocation
Facility 1──* Shift 1──* ShiftApplication 1──1 ShiftAssignment
ShiftAssignment 1──* ClockEvent 1──1 Timecard
Timecard *──1 PayRun 1──* PayRunEntry
User 1──1 WorkerProfile 1──* WorkerAvailability
User 1──* License, Certification, Document
User 1──1 Wallet 1──* WalletTransaction
```

## Indexes

Critical indexes are defined for:
- Shift search: `(status, startTime)`, `(role, status)`, `(facilityId, status)`
- User lookup: `(email)`, `(clerkId)`
- Compliance: `(expiresAt)` on licenses and certifications
- Audit: `(createdAt)`, `(entityType, entityId)`

## Enums

See schema for full list: `PlatformRole`, `ShiftStatus`, `ShiftType`, `ApplicationStatus`, `AssignmentStatus`, `TimecardStatus`, `PayRunStatus`, `ClinicalRole`, etc.
