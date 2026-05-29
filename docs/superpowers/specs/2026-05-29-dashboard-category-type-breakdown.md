# Dashboard Analytics: Category & Type Breakdown

**Date:** 2026-05-29
**Status:** Approved
**Changelog:** Initial spec

---

## Overview

Menambahkan 2 donut chart baru di TabAnalytics dashboard untuk menampilkan distribusi tiket berdasarkan kategori dan jenis tiket.

---

## Backend Changes

### `app/Http/Controllers/Api/DashboardAnalyticsController.php`

Tambahkan 2 method baru dan include datanya di `index()`:

**`getByCategory()`**
- Query: `TicketCategory` di-join dengan `tickets` (where `is_draft = false`, `published`)
- Select: `ticket_category_id`, `name` (dari `ticket_categories.name`), `COUNT(*)` as `count`
- Hitung `percentage = (count / total) * 100` per category
- Urutkan descending by count

**`getByType()`**
- Query: `TicketType` di-join dengan `tickets` (where `is_draft = false`, `published`)
- Select: `ticket_type_id`, `name` (dari `ticket_types.name`), `COUNT(*)` as `count`
- Hitung `percentage = (count / total) * 100` per type
- Urutkan descending by count

Return format:
```json
{
  "by_category": [
    { "category_id": 1, "name": "IT Support", "count": 45, "percentage": 38.1 },
    ...
  ],
  "by_type": [
    { "type_id": 1, "name": "Incident", "count": 30, "percentage": 25.4 },
    ...
  ]
}
```

---

## Frontend Changes

### `resources/js/pages/dashboard/TabAnalytics.tsx`

**Type definitions (extend AnalyticsData):**
```ts
by_category: Array<{ category_id: number; name: string; count: number; percentage: number }>
by_type: Array<{ type_id: number; name: string; count: number; percentage: number }>
```

**Imports baru (Recharts):**
```ts
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
```

**UI placement:** Di bawah section `<div className="grid gap-6 lg:grid-cols-2">` yang sudah ada (setelah User Activity chart).

**Layout:**
```tsx
<div className="grid gap-6 lg:grid-cols-2">
  {/* Kategori Donut */}
  <Card>
    <CardHeader><CardTitle>Tiket per Kategori</CardTitle></CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data.by_category} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100}>
            {data.by_category.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v, n) => [`${v} tiket`, n]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>

  {/* Type Donut */}
  <Card>...</Card>
</div>
```

**Color palette (`CHART_COLORS`):**
```ts
const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff729f', '#00bcd4', '#ff9800', '#9c27b0', '#607d8b'];
```

**Empty state:** Kalau `by_category` / `by_type` kosong, tampilkan `<p className="p-8 text-center text-muted-foreground">Belum ada data</p>`.

---

## Placement

TabAnalytics — di bawah chart "User Activity", dalam grid 2 kolom berdampingan.

---

## Acceptance Criteria

- [ ] Backend mengembalikan `by_category` dan `by_type` dengan `name`, `count`, `percentage`
- [ ] Donut chart Kategori muncul dengan legend dan tooltip
- [ ] Donut chart Type muncul dengan legend dan tooltip
- [ ] Responsive: 1 kolom mobile, 2 kolom lg+
- [ ] Tidak ada breaking change pada data lain di TabAnalytics