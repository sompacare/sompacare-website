# Nurse Portal — User Guide

**URL:** https://nurse.yourdomain.com (local: http://localhost:3001)

For healthcare workers (RN, LPN, CNA) to find shifts, manage assignments, track earnings, and maintain credentials.

---

## Getting started

1. Sign in with your Sompacare account (Clerk)
2. Complete your worker profile and upload credentials
3. Browse open shifts and apply

**Mobile app:** Install the Sompacare Nurse app (iOS/Android) for GPS clock-in and offline mode.

---

## Home dashboard

| Card | What it shows |
|------|----------------|
| This week | Estimated earnings from confirmed assignments |
| Open shifts | Count of available shifts |
| Confirm shifts | Assignments awaiting your confirmation |
| Recommended | AI-ranked shifts based on your profile |

---

## Browse & apply to shifts

**Shifts tab**

1. Filter by role, pay, distance (coming soon)
2. Tap a shift to see facility, time, rate, and match score
3. Tap **Apply** — you'll receive a notification when the facility responds

**Requirements:** Active license, required certifications, and compliance score above threshold. Blocked applications show the reason on the credentials page.

---

## My schedule (assignments)

| Status | Action |
|--------|--------|
| PENDING_CONFIRMATION | Tap **Confirm** to accept the assignment |
| CONFIRMED | **Clock in** when you arrive (GPS required) |
| CHECKED_IN | **Clock out** when shift ends |
| COMPLETED | View timecard status in wallet |

**GPS clock-in:** Must be within the facility geofence during the allowed time window.

**Mobile offline mode:** If you lose signal, clock events queue locally and sync when back online.

---

## Wallet

- View available balance after approved timecards and processed pay runs
- **Instant pay** — withdraw earnings early (Stripe Connect required)
- Transaction history shows earnings, deductions, and payouts

---

## Credentials

Upload and track:

- State licenses (RN, LPN, etc.)
- Certifications (BLS, ACLS, etc.)
- Background check status

Expired or pending credentials block shift applications. You'll see alerts on the home page.

**Mobile:** Use **Scan document** in Profile to photograph credentials.

---

## Notifications

Bell icon → notification center. Live updates for:

- New shift matches
- Application approved/rejected
- Assignment reminders
- Credential expiry warnings

---

## Support

Issues with pay, credentials, or assignments? Contact your facility or submit a support ticket (admin team monitors the queue).

**Common fixes:**
- Can't apply → check Credentials page for blocked items
- Clock-in failed → enable location permissions, arrive within geofence
- Missing pay → confirm timecard was facility-approved
