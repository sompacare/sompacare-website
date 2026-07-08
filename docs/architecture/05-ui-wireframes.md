# UI Wireframes (Text Specification)

## Design System

- **Primary:** `#0B5ED7` (Sompacare Blue)
- **Success:** `#059669` (Green)
- **Navy:** `#0C1E3D`
- **Font:** Geist Sans / system-ui
- **Components:** shadcn/ui — Card, DataTable, Dialog, Sheet, Calendar, Command (search)
- **Dark mode:** System preference + toggle, all portals
- **Accessibility:** WCAG 2.1 AA — focus rings, ARIA labels, 4.5:1 contrast

---

## Nurse Portal

### Layout
```
┌─────────────────────────────────────────────────────────┐
│ [Logo]  Marketplace  My Shifts  Earnings  Profile  🔔 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌──────────────────────────────────┐  │
│  │  Filters    │  │  Shift Cards (grid)              │  │
│  │  ─────────  │  │  ┌──────┐ ┌──────┐ ┌──────┐     │  │
│  │  Role       │  │  │ RN   │ │ LPN  │ │ CNA  │     │  │
│  │  Pay range  │  │  │ $52/h│ │ $38/h│ │ $22/h│     │  │
│  │  Distance   │  │  │ 92%  │ │ 88%  │ │ 95%  │     │  │
│  │  Specialty  │  │  │ match│ │ match│ │ match│     │  │
│  │  Date       │  │  └──────┘ └──────┘ └──────┘     │  │
│  │  [Map View] │  │                                  │  │
│  └─────────────┘  └──────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Key Screens
1. **Marketplace** — Filter sidebar + shift cards with AI match badge
2. **Shift Detail** — Facility info, rate, requirements, map, Apply button
3. **My Shifts** — Calendar + list view, upcoming / completed / cancelled tabs
4. **Clock In/Out** — Large button, GPS status indicator, break timer
5. **Earnings** — Chart (weekly), transaction list, instant pay CTA
6. **Profile** — Photo, licenses, certifications, availability calendar
7. **Wallet** — Balance, instant pay, tax documents

---

## Facility Portal

### Layout
```
┌─────────────────────────────────────────────────────────┐
│ [Logo]  Dashboard  Shifts  Staff  Billing  Reports  🔔  │
├─────────────────────────────────────────────────────────┤
│  KPI Cards: Open Shifts | Fill Rate | Spend | Rating    │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────────┐   │
│  │  Shift Calendar     │  │  Pending Approvals      │   │
│  │  (week view)        │  │  • 3 applications       │   │
│  │                     │  │  • 2 timecards          │   │
│  └─────────────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Key Screens
1. **Dashboard** — KPIs, calendar, pending approvals queue
2. **Create Shift** — Form + templates + recurring rules + emergency toggle
3. **Shift Detail** — Applicants list, AI-ranked, approve/reject actions
4. **Staff** — Favorites, blacklist, worker ratings
5. **Timecards** — Approval queue with GPS map preview
6. **Billing** — Invoices, payment history, download PDF
7. **Analytics** — Fill rate, cancellation, cost trends (Recharts)

---

## Admin Portal

### Layout
```
┌──────┬──────────────────────────────────────────────────┐
│ Nav  │  Command Palette [⌘K Search everywhere]          │
│      ├──────────────────────────────────────────────────┤
│ Dash │  Revenue | Users | Shifts | Compliance | Health  │
│ Users│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐  │
│ Facil│  │ $2.4M   │ │ 12,450  │ │ 94.2%   │ │ 99.9%  │  │
│ Shift│  │ Revenue │ │ Workers │ │ Fill    │ │ Uptime │  │
│ Pay  │  └─────────┘ └─────────┘ └─────────┘ └────────┘  │
│ Comp │  [Charts: revenue trend, shift volume, map heat]  │
│ AI   │  [AI Insights panel: shortages, anomalies]       │
│ Audit│                                                  │
└──────┴──────────────────────────────────────────────────┘
```

---

## Recruiter Portal

### Pipeline (Kanban)
```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ Applied  │ Screen   │ Interview│ Offer    │ Placed   │
│ (24)     │ (12)     │ (8)      │ (3)      │ (156)    │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ [Card]   │ [Card]   │ [Card]   │ [Card]   │ [Card]   │
│ [Card]   │ [Card]   │          │          │          │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

---

## Mobile (Nurse App)

- Bottom tab bar: Home | Shifts | Clock | Earnings | Profile
- Clock screen: Full-screen green/red button, GPS accuracy meter
- Push notification → deep link to shift detail

---

## Shared Patterns

| Pattern | Usage |
|---------|-------|
| Command palette (⌘K) | Global search all entities |
| Data tables | Sortable, filterable, export CSV |
| Empty states | Illustration + CTA |
| Loading | Skeleton screens |
| Errors | Toast + inline validation (Zod + RHF) |
| Confirmations | Dialog for destructive actions |
