# Dashboard Analytics: Category & Type Breakdown — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan 2 donut chart (Category & Type) di TabAnalytics dashboard, dengan data dari backend controller.

**Architecture:** Backend `DashboardAnalyticsController` menambahkan query `by_category` dan `by_type` ke response JSON. Frontend `TabAnalytics.tsx` menerima data baru dan merender 2 `PieChart` dengan donut style (innerRadius).

**Tech Stack:** Laravel/PHP backend, React + Recharts frontend, Inertia.js routing.

---

## File Map

| Action | File |
|--------|------|
| Modify | `app/Http/Controllers/Api/DashboardAnalyticsController.php` |
| Modify | `resources/js/pages/dashboard/TabAnalytics.tsx` |

---

## Task 1: Backend — Add by_category & by_type to DashboardAnalyticsController

**File:** `app/Http/Controllers/Api/DashboardAnalyticsController.php`

Locate line after `$byDepartment` query block (line 73). Add after it:

```php
// Breakdown by category
$categoryCounts = DB::table('tickets')
    ->join('ticket_categories', 'tickets.ticket_category_id', '=', 'ticket_categories.id')
    ->where('tickets.is_draft', false)
    ->whereNotNull('tickets.ticket_category_id')
    ->selectRaw('tickets.ticket_category_id, ticket_categories.name, COUNT(*) as count')
    ->groupBy('tickets.ticket_category_id', 'ticket_categories.name')
    ->orderByDesc('count')
    ->get();

$totalByCategory = $categoryCounts->sum('count');
$byCategory = $categoryCounts->map(fn($item) => [
    'category_id' => (int) $item->ticket_category_id,
    'name' => $item->name,
    'count' => (int) $item->count,
    'percentage' => $totalByCategory > 0 ? round($item->count / $totalByCategory * 100, 1) : 0,
]);

// Breakdown by type
$typeCounts = DB::table('tickets')
    ->join('ticket_types', 'tickets.ticket_type_id', '=', 'ticket_types.id')
    ->where('tickets.is_draft', false)
    ->whereNotNull('tickets.ticket_type_id')
    ->selectRaw('tickets.ticket_type_id, ticket_types.name, COUNT(*) as count')
    ->groupBy('tickets.ticket_type_id', 'ticket_types.name')
    ->orderByDesc('count')
    ->get();

$totalByType = $typeCounts->sum('count');
$byType = $typeCounts->map(fn($item) => [
    'type_id' => (int) $item->ticket_type_id,
    'name' => $item->name,
    'count' => (int) $item->count,
    'percentage' => $totalByType > 0 ? round($item->count / $totalByType * 100, 1) : 0,
]);
```

Then add `$byCategory` and `$byType` to the return JSON (inside the response):

```php
return response()->json([
    'ticket_volume' => [...],
    'by_department' => $byDepartment,
    'by_user' => $byUser,
    'by_category' => $byCategory,
    'by_type' => $byType,
    'summary' => [...],
]);
```

---

## Task 2: Frontend — Extend AnalyticsData Type

**File:** `resources/js/pages/dashboard/TabAnalytics.tsx`

Add after `by_user` type definition (line 37):

```ts
by_category: Array<{ category_id: number; name: string; count: number; percentage: number }>;
by_type: Array<{ type_id: number; name: string; count: number; percentage: number }>;
```

---

## Task 3: Frontend — Add PieChart imports

**File:** `resources/js/pages/dashboard/TabAnalytics.tsx`

Add to existing recharts import (line 3-15):

```ts
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend,
    PieChart,
    Pie,
} from 'recharts';
```

Also add color palette constant near top of component function (after `useState` declarations):

```ts
const CHART_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff729f', '#00bcd4', '#ff9800', '#9c27b0', '#607d8b'];
```

---

## Task 4: Frontend — Render Category & Type Donut Charts

**File:** `resources/js/pages/dashboard/TabAnalytics.tsx`

After the closing `</div>` of the "User Activity" chart card (line 276), add:

```tsx
{/* Breakdown Charts */}
<div className="grid gap-6 lg:grid-cols-2">
    {/* Tiket per Kategori */}
    <Card>
        <CardHeader>
            <CardTitle>Tiket per Kategori</CardTitle>
        </CardHeader>
        <CardContent>
            {data.by_category && data.by_category.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={data.by_category}
                            dataKey="count"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                        >
                            {data.by_category.map((_, index) => (
                                <Cell
                                    key={`cat-${index}`}
                                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number, name: string) => [
                                `${value} tiket`,
                                name,
                            ]}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <p className="py-8 text-center text-muted-foreground">
                    Belum ada data kategori
                </p>
            )}
        </CardContent>
    </Card>

    {/* Tiket per Jenis */}
    <Card>
        <CardHeader>
            <CardTitle>Tiket per Jenis</CardTitle>
        </CardHeader>
        <CardContent>
            {data.by_type && data.by_type.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            data={data.by_type}
                            dataKey="count"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                        >
                            {data.by_type.map((_, index) => (
                                <Cell
                                    key={`type-${index}`}
                                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number, name: string) => [
                                `${value} tiket`,
                                name,
                            ]}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <p className="py-8 text-center text-muted-foreground">
                    Belum ada data jenis tiket
                </p>
            )}
        </CardContent>
    </Card>
</div>
```

---

## Task 5: Verify and Test

1. Visit `/dashboard` → Tab Analytics → scroll to bottom
2. Confirm 2 new donut charts appear: "Tiket per Kategori" and "Tiket per Jenis"
3. Confirm charts are responsive (stack on mobile)
4. Confirm legend and tooltip work on hover
5. Confirm empty state text if no data

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-29-dashboard-category-type-breakdown.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?