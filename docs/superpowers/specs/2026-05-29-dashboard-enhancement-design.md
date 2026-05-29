# Dashboard Enhancement Spec

**Date:** 2026-05-29
**Author:** Claude
**Status:** Approved

---

## Overview

Enhance the existing dashboard with new features: Quick Create, Quick Actions, Analytics (Charts), Activity Feed, and Notification Center. Organize into 3 tabs: Overview, Analytics, Activity.

---

## Tech Stack

- **Charts:** Recharts (already compatible with React)
- **UI Components:** shadcn/ui (existing)
- **Icons:** Lucide React (existing)
- **Time Selector:** useState + derived data (no extra library)
- **Real-time:** Optional Pusher/Echo, fallback to polling

---

## Tab Structure

```
┌─────────────────────────────────────────────────────────┐
│  Overview | Analytics | Activity (badge count)          │
├─────────────────────────────────────────────────────────┤
│  Tab content (lazy loaded on tab switch)                │
└─────────────────────────────────────────────────────────┘
```

---

## Tab 1: Overview

### 1.1 Quick Create Button
- **Position:** Floating bottom-right corner
- **Style:** Primary color, circle button with Plus icon
- **Size:** 56px diameter
- **States:**
  - Default: Primary background
  - Hover: Scale 1.1, shadow, tooltip "Buat Tiket Baru"
- **Action:** Opens modal overlay for quick ticket creation

### 1.2 Quick Actions Bar
- **Position:** Below welcome card, above stat cards
- **Items:**
  - Tiket Saya (my tickets)
  - Belum Ditugaskan (unassigned)
  - SLA Warning (tickets at risk)
- **Style:** Horizontal pills/buttons with icon + text
- **States:** Hover highlight, click navigates to filtered list

### 1.3 Stats Cards (existing + potential addition)
- **Keep existing:** Open, Closed, Overdue, Assigned to Me
- **Optional enhancement:** Add trend arrow (↑↓) showing vs last period

### 1.4 Ticket Lists (existing)
- Tiket Terbaru (status: Baru)
- Tiket Menggantung (overdue)
- Tiket Belum Diselesaikan (open, not Baru)

---

## Tab 2: Analytics

### 2.1 Time Range Selector
- **Position:** Top of Analytics tab
- **Options:** Daily | Weekly | Monthly
- **Style:** Segmented control / toggle group
- **Default:** Weekly

### 2.2 Ticket Volume Chart
- **Type:** Line chart
- **X-axis:** Time (days/weeks/months based on selector)
- **Y-axis:** Number of tickets
- **Data:** Tickets created per period
- **Features:**
  - Tooltip on hover showing exact count
  - Area fill under line
  - Responsive width

### 2.3 Department Breakdown Chart
- **Type:** Horizontal bar chart
- **Data:** Ticket count per department
- **Color coding:**
  - Green: >80% SLA compliance
  - Yellow: 50-80% SLA compliance
  - Red: <50% SLA compliance
- **Features:**
  - Labels on bars
  - Sort by ticket count (highest first)

### 2.4 User Activity Chart
- **Type:** Vertical bar chart
- **Data:** Top 10 users by ticket count
- **Metrics:** Created + Resolved tickets
- **Features:**
  - Legend
  - Tooltip with detailed stats

### 2.5 Quick Stats Summary
- **Position:** Below charts
- **Content:**
  - Total tickets this period vs previous (%)
  - Average resolution time
  - SLA compliance rate

---

## Tab 3: Activity

### 3.1 Layout
- Two-column: Activity Feed (60%) | Notifications (40%)

### 3.2 Activity Feed
- **Content:** Log of all system activities
- **Format:** `[Avatar] [User Name] [Action] [Target] [Timestamp]`
- **Examples:**
  - "John assigned ticket #123 to Sarah"
  - "Admin changed status of Ticket #456 to Resolved"
  - "System: Ticket #789 is now overdue"
- **Filter:** All | Ticket Updates | User Actions | System
- **Loading:** Infinite scroll, load 20 items at a time
- **Empty state:** "Belum ada aktivitas"

### 3.3 Notification Center
- **Categories:**
  - 🚨 SLA Warning (due in <1 hour)
  - ⚠️ Overdue Alert (past deadline)
  - 📝 Draft Reminder (unpublished drafts >24h)
  - 👤 New Assignment (ticket assigned to you)
- **Item structure:**
  - Icon + Title + Description + Timestamp
  - Action buttons: Mark as Read, Dismiss
- **Badge:** Red dot on "Activity" tab with unread count

---

## Data Flow

### Backend (DashboardController)
- Add new endpoint for analytics data: `/api/dashboard/analytics`
- Add new endpoint for activity feed: `/api/dashboard/activities`
- Add new endpoint for notifications: `/api/dashboard/notifications`
- Query optimization: batch queries, use indexes

### Frontend (dashboard.tsx)
- Convert to tabbed layout with state management
- Lazy load tab content (React Suspense or manual)
- Cache analytics data per time range

---

## API Endpoints

### GET /api/dashboard/analytics
```json
{
  "ticket_volume": {
    "daily": [{"date": "2026-05-28", "count": 15}, ...],
    "weekly": [{"week": "W22", "count": 45}, ...],
    "monthly": [{"month": "2026-05", "count": 120}, ...]
  },
  "by_department": [{"dep_id": 1, "name": "IT", "count": 50, "sla_rate": 0.85}, ...],
  "by_user": [{"user_id": 1, "name": "John", "created": 20, "resolved": 15}, ...],
  "summary": {
    "total_tickets": 150,
    "vs_previous": 0.12,
    "avg_resolution_hours": 24,
    "sla_compliance": 0.78
  }
}
```

### GET /api/dashboard/activities
```json
{
  "data": [
    {"id": 1, "user": {...}, "action": "assigned", "target": "Ticket #123", "timestamp": "..."},
    ...
  ],
  "next_cursor": "abc123"
}
```

### GET /api/dashboard/notifications
```json
{
  "data": [
    {"id": 1, "type": "sla_warning", "title": "...", "ticket_id": 123, "created_at": "..."},
    ...
  ],
  "unread_count": 5
}
```

---

## Component Structure

```
pages/dashboard.tsx (main container)
├── tabs (Overview | Analytics | Activity)
├── TabOverview
│   ├── QuickActionsBar
│   ├── StatCards
│   └── TicketLists
├── TabAnalytics
│   ├── TimeRangeSelector
│   ├── TicketVolumeChart
│   ├── DepartmentChart
│   ├── UserActivityChart
│   └── QuickStatsSummary
└── TabActivity
    ├── ActivityFeed
    │   └── ActivityItem[]
    └── NotificationCenter
        └── NotificationItem[]
```

---

## Implementation Order

1. **Tab structure** — Basic layout, routing
2. **Overview enhancements** — Quick Create button, Quick Actions bar
3. **Analytics tab** — Charts and stats
4. **Activity tab** — Feed and Notifications
5. **Backend API** — New endpoints for analytics/activities
6. **Real-time** (optional) — Polling or Pusher

---

## Out of Scope

- Mobile-specific design (keep responsive, but mobile tab UX is future work)
- Export to PDF/CSV
- Custom date range picker (use preset: daily/weekly/monthly)

---

## Notes

- Use Recharts for all charts (install if not present)
- Keep existing shadcn/ui components where possible
- Activity feed should be performant — paginate, don't load all at once
- Notification badge should update in real-time if using polling