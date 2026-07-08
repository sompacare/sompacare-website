# Security Architecture

## Authentication

- **Clerk** handles primary auth: email/password, OAuth (Google, Apple), MFA (TOTP, SMS)
- Platform receives Clerk webhooks → syncs User record in PostgreSQL
- API validates Clerk JWT via `@clerk/backend` or custom JWKS verification
- Refresh tokens stored in HttpOnly secure cookies (web) or secure storage (mobile)

## Authorization (RBAC)

```
User → UserRole → Role → RolePermission → Permission
```

- Permissions are granular: `shifts:create`, `shifts:read`, `payroll:approve`, etc.
- NestJS `@RequirePermissions('shifts:create')` guard checks JWT claims + DB roles
- Super Admin bypasses all permission checks (audited)

## Data Protection

| Layer | Control |
|-------|---------|
| Transit | TLS 1.3 everywhere |
| Rest | RDS encryption (AES-256), S3 SSE-KMS |
| PII | Field-level encryption for SSN, bank account (AWS KMS) |
| Documents | S3 private buckets, presigned URLs (15 min expiry) |
| Passwords | Never stored (Clerk handles) |

## API Security

- **Rate limiting:** Redis sliding window (100/min auth, 20/min public)
- **Input validation:** Zod/class-validator on all DTOs
- **SQL injection:** Prisma parameterized queries only
- **XSS:** React auto-escape, CSP headers, sanitize rich text
- **CSRF:** SameSite cookies, CSRF token for cookie-based auth
- **CORS:** Whitelist portal domains only

## Audit & Compliance

- All mutations logged to `AuditLog` (who, what, when, IP, user agent)
- HIPAA-aligned access controls (minimum necessary principle)
- 7-year data retention for payroll/compliance records
- SOC 2 Type II target (access reviews, change management)

## Infrastructure Security

- VPC with private subnets for RDS/Redis
- WAF (Cloudflare) — OWASP rules, bot protection
- Secrets in AWS Secrets Manager / Vercel env vars
- Dependency scanning (Dependabot, Snyk)
- Container image scanning (Trivy)

## Incident Response

1. Detect (Sentry alert, anomaly detection)
2. Contain (revoke tokens, disable feature flag)
3. Investigate (audit log query)
4. Remediate (patch, deploy)
5. Post-mortem (document within 48h)
