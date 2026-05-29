# Dashboard Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance dashboard with tabbed layout, Quick Create, Quick Actions, Analytics Charts, Activity Feed, and Notification Center.

**Architecture:** Tab-based dashboard with 3 tabs (Overview, Analytics, Activity). Backend adds API endpoints for analytics data, activity feed, and notifications. Frontend uses Recharts for visualizations.

**Tech Stack:** Laravel (backend), Inertia.js + React (frontend), Recharts (charts), shadcn/ui (components), Radix Tabs

---

## File Structure

### Backend (Laravel)
```
app/Http/Controllers/
├── DashboardController.php       (modify - add tab routing)
├── Api/
│   ├── DashboardAnalyticsController.php  (create)
│   ├── DashboardActivityController.php   (create)
│   └── DashboardNotificationController.php (create)

app/Models/
├── ActivityLog.php              (create)
└── Notification.php             (create)

routes/
├── api.php                      (modify - add dashboard API routes)
└── web.php                      (modify - add tab query param)
```

### Frontend (React)
```
resources/js/
├── pages/dashboard.tsx          (modify - convert to tabs)
├── pages/dashboard/
│   ├── TabOverview.tsx          (create)
│   ├── TabAnalytics.tsx         (create)
│   └── TabActivity.tsx          (create)
├── components/dashboard/
│   ├── QuickCreateButton.tsx    (create)
│   ├── QuickActionsBar.tsx      (create)
│   ├── TicketVolumeChart.tsx    (create)
│   ├── DepartmentChart.tsx      (create)
│   ├── UserActivityChart.tsx    (create)
│   ├── ActivityFeed.tsx         (create)
│   └── NotificationCenter.tsx    (create)
└── hooks/
    └── useDashboardTabs.ts      (create)
```

---

## Task 1: Backend - Create API Endpoints

### Task 1.1: Create DashboardAnalyticsController

**Files:**
- Create: `app/Http/Controllers/Api/DashboardAnalyticsController.php`
- Routes: `routes/api.php`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class DashboardAnalyticsController extends Controller
{
    public function index(): JsonResponse
    {
        $user = auth()->user();

        $query = Ticket::query()->published();

        if ($user->isPemohon()) {
            $query->where('requester_id', $user->id);
        } elseif ($user->isStaff()) {
            $query->where(function ($q) use ($user) {
                $q->where('dep_id', $user->dep_id)
                    ->orWhere('assignee_id', $user->id)
                    ->orWhere('requester_id', $user->id);
            });
        }

        // Get date ranges
        $now = Carbon::now();
        $startOfDay = $now->copy()->startOfDay();
        $startOfWeek = $now->copy()->startOfWeek();
        $startOfMonth = $now->copy()->startOfMonth();
        $startOfPrevDay = $now->copy()->subDay()->startOfDay();
        $startOfPrevWeek = $now->copy()->subWeek()->startOfWeek();
        $startOfPrevMonth = $now->copy()->subMonth()->startOfMonth();

        // Ticket volume by day (last 30 days)
        $dailyVolume = Ticket::query()
            ->published()
            ->where('created_at', '>=', $now->copy()->subDays(30))
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn($item) => [
                'date' => $item->date,
                'count' => $item->count
            ]);

        // Ticket volume by week (last 12 weeks)
        $weeklyVolume = Ticket::query()
            ->published()
            ->where('created_at', '>=', $now->copy()->subWeeks(12))
            ->selectRaw('YEARWEEK(created_at, 1) as week, COUNT(*) as count')
            ->groupBy('week')
            ->orderBy('week')
            ->get()
            ->map(fn($item) => [
                'week' => 'W' . substr($item->week, -2),
                'count' => $item->count
            ]);

        // Ticket volume by month (last 12 months)
        $monthlyVolume = Ticket::query()
            ->published()
            ->where('created_at', '>=', $now->copy()->subMonths(12))
            ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as count')
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn($item) => [
                'month' => $item->month,
                'count' => $item->count
            ]);

        // Department breakdown
        $byDepartment = \App\Models\Department::withCount([
            'tickets' => fn($q) => $q->published()
        ])->with(['tickets' => fn($q) => $q->published()->selectRaw('dep_id, COUNT(*) as total, SUM(CASE WHEN resolved_at <= resolution_due_at THEN 1 ELSE 0 END) as on_time')])
        ->get()
        ->map(fn($dept) => [
            'dep_id' => $dept->id,
            'name' => $dept->name,
            'count' => $dept->tickets_count ?? 0,
            'sla_rate' => $dept->tickets_count > 0
                ? round($dept->tickets->sum('on_time') / $dept->tickets_count, 2)
                : 0
        ])
        ->sortByDesc('count')
        ->values();

        // User activity
        $byUser = \App\Models\User::whereNotNull('dep_id')
            ->withCount(['createdTickets' => fn($q) => $q->published()])
            ->withCount(['assignedTickets' => fn($q) => $q->published()->whereNotNull('closed_at')])
            ->orderByDesc('created_tickets_count')
            ->limit(10)
            ->get()
            ->map(fn($user) => [
                'user_id' => $user->id,
                'name' => $user->name,
                'created' => $user->created_tickets_count ?? 0,
                'resolved' => $user->assigned_tickets_count ?? 0
            ]);

        // Summary stats
        $currentMonthCount = Ticket::query()->published()
            ->whereMonth('created_at', $now->month)
            ->whereYear('created_at', $now->year)
            ->count();

        $prevMonthCount = Ticket::query()->published()
            ->whereMonth('created_at', $now->copy()->subMonth()->month)
            ->whereYear('created_at', $now->copy()->subMonth()->year)
            ->count();

        $avgResolutionHours = Ticket::query()->published()
            ->whereNotNull('resolved_at')
            ->whereNotNull('created_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, created_at, resolved_at)) as avg_hours')
            ->value('avg_hours') ?? 0;

        $totalSlaCount = Ticket::query()->published()->whereNotNull('resolution_due_at')->count();
        $onTimeCount = Ticket::query()->published()
            ->whereNotNull('resolution_due_at')
            ->whereNotNull('resolved_at')
            ->whereColumn('resolved_at', '<=', 'resolution_due_at')
            ->count();
        $slaCompliance = $totalSlaCount > 0 ? round($onTimeCount / $totalSlaCount, 2) : 0;

        $vsPrevious = $prevMonthCount > 0
            ? round(($currentMonthCount - $prevMonthCount) / $prevMonthCount, 2)
            : 0;

        return response()->json([
            'ticket_volume' => [
                'daily' => $dailyVolume,
                'weekly' => $weeklyVolume,
                'monthly' => $monthlyVolume
            ],
            'by_department' => $byDepartment,
            'by_user' => $byUser,
            'summary' => [
                'total_tickets' => $currentMonthCount,
                'vs_previous' => $vsPrevious,
                'avg_resolution_hours' => round($avgResolutionHours, 1),
                'sla_compliance' => $slaCompliance
            ]
        ]);
    }
}
```

- [ ] **Step 1: Create DashboardAnalyticsController.php**

Create the file with the code above in `app/Http/Controllers/Api/DashboardAnalyticsController.php`

- [ ] **Step 2: Add API route**

Add to `routes/api.php`:
```php
Route::prefix('dashboard')->group(function () {
    Route::get('/analytics', [DashboardAnalyticsController::class, 'index']);
    Route::get('/activities', [DashboardActivityController::class, 'index']);
    Route::get('/notifications', [DashboardNotificationController::class, 'index']);
});
```

- [ ] **Step 3: Test API endpoint**

Run: `curl -s http://localhost/api/dashboard/analytics | head -100`
Expected: JSON response with ticket_volume, by_department, by_user, summary

---

### Task 1.2: Create DashboardActivityController

**Files:**
- Create: `app/Http/Controllers/Api/DashboardActivityController.php`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardActivityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 20);
        $filter = $request->input('filter', 'all');

        $query = ActivityLog::with('user')
            ->orderBy('created_at', 'desc');

        if ($filter !== 'all') {
            $query->where('type', $filter);
        }

        $activities = $query->paginate($perPage);

        return response()->json([
            'data' => $activities->items(),
            'next_cursor' => $activities->hasMorePages() ? $activities->currentPage() + 1 : null
        ]);
    }
}
```

- [ ] **Step 1: Create ActivityLog model and migration**

Run: `php artisan make:model ActivityLog -m`

Edit migration:
```php
public function up(): void
{
    Schema::create('activity_logs', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
        $table->string('type'); // ticket_update, user_action, system
        $table->string('action'); // created, updated, assigned, resolved, etc.
        $table->string('target_type'); // App\Models\Ticket
        $table->unsignedBigInteger('target_id');
        $table->json('metadata')->nullable();
        $table->timestamps();

        $table->index(['type', 'created_at']);
        $table->index(['target_type', 'target_id']);
    });
}
```

Edit Model:
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    protected $fillable = [
        'user_id', 'type', 'action', 'target_type', 'target_id', 'metadata'
    ];

    protected $casts = [
        'metadata' => 'array'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function target()
    {
        return $this->morphTo();
    }
}
```

Run: `php artisan migrate`

- [ ] **Step 2: Create DashboardActivityController.php**

Create the file in `app/Http/Controllers/Api/DashboardActivityController.php`

- [ ] **Step 3: Add route**

Add to api.php: `Route::get('/activities', [DashboardActivityController::class, 'index']);`

---

### Task 1.3: Create DashboardNotificationController

**Files:**
- Create: `app/Http/Controllers/Api/DashboardNotificationController.php`

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardNotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        $unreadCount = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'data' => $notifications,
            'unread_count' => $unreadCount
        ]);
    }

    public function markAsRead(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer'
        ]);

        Notification::whereIn('id', $request->ids)
            ->where('user_id', $request->user()->id)
            ->update(['is_read' => true]);

        return response()->json(['success' => true]);
    }
}
```

- [ ] **Step 1: Create Notification model and migration**

Run: `php artisan make:model Notification -m`

Edit migration:
```php
public function up(): void
{
    Schema::create('notifications', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        $table->string('type'); // sla_warning, overdue, draft_reminder, assignment
        $table->string('title');
        $table->text('description')->nullable();
        $table->string('target_type')->nullable();
        $table->unsignedBigInteger('target_id')->nullable();
        $table->boolean('is_read')->default(false);
        $table->timestamps();

        $table->index(['user_id', 'is_read']);
    });
}
```

Edit Model:
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    protected $fillable = [
        'user_id', 'type', 'title', 'description', 'target_type', 'target_id', 'is_read'
    ];

    protected $casts = [
        'is_read' => 'boolean'
    ];
}
```

Run: `php artisan migrate`

- [ ] **Step 2: Create DashboardNotificationController.php**

Create the file in `app/Http/Controllers/Api/DashboardNotificationController.php`

- [ ] **Step 3: Add route**

Add to api.php: `Route::get('/notifications', [DashboardNotificationController::class, 'index']);`

---

## Task 2: Frontend - Tab Structure

### Task 2.1: Install shadcn Tabs component

- [ ] **Step 1: Add Tabs component**

Run: `cd /www/wwwroot/portalsifast.rsaisyiyahsitifatimah.com/PortalSifast && npx shadcn@latest add tabs`

Expected: Creates `resources/js/components/ui/tabs.tsx`

---

### Task 2.2: Create dashboard subfolder and tab components

- [ ] **Step 1: Create directory structure**

Run: `mkdir -p resources/js/pages/dashboard resources/js/components/dashboard resources/js/hooks`

- [ ] **Step 2: Create useDashboardTabs hook**

Create `resources/js/hooks/use-dashboard-tabs.ts`:
```typescript
import { useState } from 'react';

type Tab = 'overview' | 'analytics' | 'activity';

export function useDashboardTabs() {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [notificationCount, setNotificationCount] = useState(0);

    return {
        activeTab,
        setActiveTab,
        notificationCount,
        setNotificationCount
    };
}
```

- [ ] **Step 3: Modify dashboard.tsx to use tabs**

Replace current dashboard.tsx with tabbed structure. Keep existing imports, add Tabs components, wrap content in Tabs.

```typescript
// Add imports
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TabOverview from './TabOverview';
import TabAnalytics from './TabAnalytics';
import TabActivity from './TabActivity';

// Replace return statement
return (
    <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Dashboard" />
        <div className="flex h-full flex-1 flex-col gap-6 p-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)}>
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="activity">
                        Activity
                        {notificationCount > 0 && (
                            <Badge variant="destructive" className="ml-2">
                                {notificationCount}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <TabOverview />
                </TabsContent>
                <TabsContent value="analytics">
                    <TabAnalytics />
                </TabsContent>
                <TabsContent value="activity">
                    <TabActivity />
                </TabsContent>
            </Tabs>
        </div>
    </AppLayout>
);
```

---

## Task 3: Frontend - TabOverview

### Task 3.1: Create QuickActionsBar component

**Files:**
- Create: `resources/js/components/dashboard/QuickActionsBar.tsx`

```typescript
import { Link } from '@inertiajs/react';
import { Ticket, AlertTriangle, Users } from 'lucide-react';

const actions = [
    { title: 'Tiket Saya', href: '/tickets?assignee=me', icon: Ticket },
    { title: 'Belum Ditugaskan', href: '/tickets?unassigned=1', icon: Users },
    { title: 'SLA Warning', href: '/tickets?sla_warning=1', icon: AlertTriangle },
];

export function QuickActionsBar() {
    return (
        <div className="flex flex-wrap gap-2">
            {actions.map(({ title, href, icon: Icon }) => (
                <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/80"
                >
                    <Icon className="h-4 w-4" />
                    {title}
                </Link>
            ))}
        </div>
    );
}
```

### Task 3.2: Create QuickCreateButton component

**Files:**
- Create: `resources/js/components/dashboard/QuickCreateButton.tsx`

```typescript
import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export function QuickCreateButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <Button
                asChild
                size="lg"
                className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
                style={{ borderRadius: '50%' }}
            >
                <Link href="/tickets/create">
                    <Plus className="h-6 w-6" />
                </Link>
            </Button>
        </>
    );
}
```

### Task 3.3: Create TabOverview component

**Files:**
- Create: `resources/js/pages/dashboard/TabOverview.tsx`

```typescript
import { QuickActionsBar } from '@/components/dashboard/QuickActionsBar';
import { QuickCreateButton } from '@/components/dashboard/QuickCreateButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { ListTodo, CheckCircle, AlertTriangle, Clock, UserCircle } from 'lucide-react';
import type { Ticket as TicketType } from '@/types/ticket';

type Props = {
    stats: {
        total_open: number;
        total_closed_month: number;
        overdue: number;
        assigned_to_me: number;
        unassigned: number;
    };
    recentTickets: TicketType[];
    overdueTickets: TicketType[];
    unresolvedTickets: TicketType[];
};

// Copy existing stat cards and ticket lists from dashboard.tsx
export default function TabOverview({ stats, recentTickets, overdueTickets, unresolvedTickets }: Props) {
    return (
        <div className="space-y-6">
            <QuickActionsBar />
            
            {/* Stat cards - same as existing */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* ... copy stat cards from original dashboard.tsx ... */}
            </div>

            {/* 3-column ticket lists - same as existing */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* ... copy ticket lists from original dashboard.tsx ... */}
            </div>

            <QuickCreateButton />
        </div>
    );
}
```

- [ ] **Step 1: Create QuickActionsBar.tsx** with the code above
- [ ] **Step 2: Create QuickCreateButton.tsx** with the code above
- [ ] **Step 3: Create TabOverview.tsx** - copy existing stat cards and ticket lists, wrap in space-y-6, add QuickActionsBar and QuickCreateButton
- [ ] **Step 4: Update dashboard.tsx** to render TabOverview inside TabsContent

---

## Task 4: Frontend - TabAnalytics

### Task 4.1: Create chart components

**Files:**
- Create: `resources/js/components/dashboard/TicketVolumeChart.tsx`

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

type DataPoint = { date?: string; week?: string; month?: string; count: number };

type Props = {
    data: DataPoint[];
    dataKey: 'date' | 'week' | 'month';
};

export function TicketVolumeChart({ data, dataKey }: Props) {
    const chartData = data.map(item => ({
        name: item[dataKey],
        tickets: item.count
    }));

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="tickets" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
            </AreaChart>
        </ResponsiveContainer>
    );
}
```

- [ ] **Step 1: Create TicketVolumeChart.tsx** with Recharts AreaChart
- [ ] **Step 2: Create DepartmentChart.tsx** with BarChart (horizontal)

```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

type Props = {
    data: Array<{ dep_id: number; name: string; count: number; sla_rate: number }>;
};

function getSlaColor(rate: number): string {
    if (rate >= 0.8) return '#22c55e'; // green
    if (rate >= 0.5) return '#eab308'; // yellow
    return '#ef4444'; // red
}

export function DepartmentChart({ data }: Props) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {data.map((entry, index) => (
                        <Cell key={index} fill={getSlaColor(entry.sla_rate)} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
```

- [ ] **Step 3: Create UserActivityChart.tsx** with BarChart (vertical)

```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type Props = {
    data: Array<{ user_id: number; name: string; created: number; resolved: number }>;
};

export function UserActivityChart({ data }: Props) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="created" name="Created" fill="#8884d8" />
                <Bar dataKey="resolved" name="Resolved" fill="#82ca9d" />
            </BarChart>
        </ResponsiveContainer>
    );
}
```

### Task 4.2: Create TabAnalytics component

**Files:**
- Create: `resources/js/pages/dashboard/TabAnalytics.tsx`

```typescript
import { useState, useEffect } from 'react';
import { TicketVolumeChart } from '@/components/dashboard/TicketVolumeChart';
import { DepartmentChart } from '@/components/dashboard/DepartmentChart';
import { UserActivityChart } from '@/components/dashboard/UserActivityChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, CheckCircle } from 'lucide-react';

type TimeRange = 'daily' | 'weekly' | 'monthly';

type AnalyticsData = {
    ticket_volume: {
        daily: Array<{ date: string; count: number }>;
        weekly: Array<{ week: string; count: number }>;
        monthly: Array<{ month: string; count: number }>;
    };
    by_department: Array<{ dep_id: number; name: string; count: number; sla_rate: number }>;
    by_user: Array<{ user_id: number; name: string; created: number; resolved: number }>;
    summary: {
        total_tickets: number;
        vs_previous: number;
        avg_resolution_hours: number;
        sla_compliance: number;
    };
};

export default function TabAnalytics() {
    const [timeRange, setTimeRange] = useState<TimeRange>('weekly');
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/dashboard/analytics`)
            .then(res => res.json())
            .then(setData)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8 text-center">Loading analytics...</div>;
    if (!data) return <div className="p-8 text-center text-destructive">Failed to load analytics</div>;

    const volumeData = data.ticket_volume[timeRange];
    const dataKey = timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'week' : 'month';

    return (
        <div className="space-y-6">
            {/* Time Range Selector */}
            <div className="flex gap-2">
                {(['daily', 'weekly', 'monthly'] as TimeRange[]).map(range => (
                    <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                            timeRange === range
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted hover:bg-muted/80'
                        }`}
                    >
                        {range.charAt(0).toUpperCase() + range.slice(1)}
                    </button>
                ))}
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Tiket
                        </CardTitle>
                        {data.summary.vs_previous >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.summary.total_tickets}</div>
                        <p className="text-xs text-muted-foreground">
                            {data.summary.vs_previous >= 0 ? '+' : ''}{data.summary.vs_previous * 100}% vs last month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Avg Resolution
                        </CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.summary.avg_resolution_hours}h</div>
                        <p className="text-xs text-muted-foreground">Average time to resolve</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            SLA Compliance
                        </CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.summary.sla_compliance * 100}%</div>
                        <p className="text-xs text-muted-foreground">Tickets resolved on time</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Departments
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.by_department.length}</div>
                        <p className="text-xs text-muted-foreground">Active departments</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Ticket Volume</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <TicketVolumeChart data={volumeData} dataKey={dataKey} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Department Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DepartmentChart data={data.by_department} />
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>User Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <UserActivityChart data={data.by_user} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
```

- [ ] **Step 1: Create TicketVolumeChart.tsx**
- [ ] **Step 2: Create DepartmentChart.tsx**
- [ ] **Step 3: Create UserActivityChart.tsx**
- [ ] **Step 4: Create TabAnalytics.tsx**

---

## Task 5: Frontend - TabActivity

### Task 5.1: Create ActivityFeed component

**Files:**
- Create: `resources/js/components/dashboard/ActivityFeed.tsx`

```typescript
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Activity = {
    id: number;
    user: { id: number; name: string; avatar_url?: string } | null;
    type: 'ticket_update' | 'user_action' | 'system';
    action: string;
    target: string;
    timestamp: string;
};

type Props = {
    filter?: string;
};

export function ActivityFeed({ filter = 'all' }: Props) {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [cursor, setCursor] = useState<string | null>(null);

    useEffect(() => {
        loadActivities();
    }, [filter]);

    async function loadActivities() {
        setLoading(true);
        const params = new URLSearchParams({ per_page: '20' });
        if (filter !== 'all') params.append('filter', filter);

        const res = await fetch(`/api/dashboard/activities?${params}`);
        const json = await res.json();
        setActivities(json.data);
        setCursor(json.next_cursor);
        setLoading(false);
    }

    async function loadMore() {
        if (!cursor) return;
        const res = await fetch(`/api/dashboard/activities?page=${cursor}&per_page=20`);
        const json = await res.json();
        setActivities(prev => [...prev, ...json.data]);
        setCursor(json.next_cursor);
    }

    const typeColors = {
        ticket_update: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
        user_action: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
        system: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    };

    return (
        <div className="space-y-4">
            {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : activities.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">Belum ada aktivitas</div>
            ) : (
                <>
                    {activities.map(activity => (
                        <div key={activity.id} className="flex items-start gap-3 rounded-lg border p-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={activity.user?.avatar_url} />
                                <AvatarFallback>
                                    {activity.user?.name?.charAt(0) || 'S'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">
                                        {activity.user?.name || 'System'}
                                    </span>
                                    <Badge className={cn('text-xs', typeColors[activity.type])}>
                                        {activity.action}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">
                                    {activity.target}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {new Date(activity.timestamp).toLocaleString('id-ID')}
                                </p>
                            </div>
                        </div>
                    ))}

                    {cursor && (
                        <button
                            onClick={loadMore}
                            className="w-full rounded-lg border border-dashed p-3 text-center text-sm text-muted-foreground hover:bg-muted/50"
                        >
                            Load more
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
```

### Task 5.2: Create NotificationCenter component

**Files:**
- Create: `resources/js/components/dashboard/NotificationCenter.tsx`

```typescript
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AlertTriangle, Clock, FileText, UserPlus, Bell } from 'lucide-react';

type Notification = {
    id: number;
    type: 'sla_warning' | 'overdue' | 'draft_reminder' | 'assignment';
    title: string;
    description: string;
    target_id: number;
    is_read: boolean;
    created_at: string;
};

type Props = {
    onUnreadCountChange?: (count: number) => void;
};

const typeConfig = {
    sla_warning: { icon: Clock, color: 'text-yellow-600', label: 'SLA Warning' },
    overdue: { icon: AlertTriangle, color: 'text-red-600', label: 'Overdue' },
    draft_reminder: { icon: FileText, color: 'text-blue-600', label: 'Draft' },
    assignment: { icon: UserPlus, color: 'text-green-600', label: 'Assignment' }
};

export function NotificationCenter({ onUnreadCountChange }: Props) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    async function fetchNotifications() {
        setLoading(true);
        const res = await fetch('/api/dashboard/notifications');
        const json = await res.json();
        setNotifications(json.data);
        onUnreadCountChange?.(json.unread_count);
        setLoading(false);
    }

    async function markAsRead(ids: number[]) {
        await fetch('/api/dashboard/notifications/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
        });
        setNotifications(prev =>
            prev.map(n => ids.includes(n.id) ? { ...n, is_read: true } : n)
        );
    }

    return (
        <div className="space-y-3">
            {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading...</div>
            ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                    <Bell className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No notifications</p>
                </div>
            ) : (
                notifications.map(notif => {
                    const config = typeConfig[notif.type];
                    const Icon = config.icon;

                    return (
                        <div
                            key={notif.id}
                            className={cn(
                                'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                                !notif.is_read && 'bg-primary/5 border-primary/20'
                            )}
                        >
                            <Icon className={cn('h-5 w-5 shrink-0', config.color)} />
                            <div className="flex-1 min-w-0">
                                <p className="font-medium">{notif.title}</p>
                                {notif.description && (
                                    <p className="text-sm text-muted-foreground">
                                        {notif.description}
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(notif.created_at).toLocaleString('id-ID')}
                                </p>
                            </div>
                            {!notif.is_read && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => markAsRead([notif.id])}
                                >
                                    Read
                                </Button>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}
```

### Task 5.3: Create TabActivity component

**Files:**
- Create: `resources/js/pages/dashboard/TabActivity.tsx`

```typescript
import { useState } from 'react';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { NotificationCenter } from '@/components/dashboard/NotificationCenter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
    onNotificationCountChange?: (count: number) => void;
};

export default function TabActivity({ onNotificationCountChange }: Props) {
    const [activityFilter, setActivityFilter] = useState('all');

    return (
        <div className="grid gap-6 lg:grid-cols-5">
            {/* Activity Feed - 60% */}
            <Card className="lg:col-span-3">
                <CardHeader>
                    <div className="flex flex-row items-center justify-between">
                        <CardTitle>Activity Feed</CardTitle>
                        <select
                            value={activityFilter}
                            onChange={e => setActivityFilter(e.target.value)}
                            className="rounded-md border bg-background px-3 py-1 text-sm"
                        >
                            <option value="all">All</option>
                            <option value="ticket_update">Ticket Updates</option>
                            <option value="user_action">User Actions</option>
                            <option value="system">System</option>
                        </select>
                    </div>
                </CardHeader>
                <CardContent>
                    <ActivityFeed filter={activityFilter} />
                </CardContent>
            </Card>

            {/* Notification Center - 40% */}
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                    <NotificationCenter onUnreadCountChange={onNotificationCountChange} />
                </CardContent>
            </Card>
        </div>
    );
}
```

- [ ] **Step 1: Create ActivityFeed.tsx**
- [ ] **Step 2: Create NotificationCenter.tsx**
- [ ] **Step 3: Create TabActivity.tsx**

---

## Task 6: Update dashboard.tsx to wire everything

- [ ] **Step 1: Update dashboard.tsx**

```typescript
// Full updated dashboard.tsx

import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import TabOverview from './TabOverview';
import TabAnalytics from './dashboard/TabAnalytics';
import TabActivity from './dashboard/TabActivity';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type { Ticket as TicketType } from '@/types/ticket';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
];

type DashboardStats = {
    total_open: number;
    total_closed_month: number;
    overdue: number;
    assigned_to_me: number;
    unassigned: number;
    by_status: Record<string, number>;
    by_department: Record<string, number>;
};

type Props = {
    stats: DashboardStats;
    recentTickets: TicketType[];
    overdueTickets: TicketType[];
    unresolvedTickets: TicketType[];
    onlineUsers: {
        count: number;
        users: Array<{ id: number; name: string; email: string; avatar_url?: string }>;
    };
};

export default function Dashboard({
    stats,
    recentTickets,
    overdueTickets,
    unresolvedTickets,
    onlineUsers,
}: Props) {
    const [activeTab, setActiveTab] = useState('overview');
    const [notificationCount, setNotificationCount] = useState(0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        <TabsTrigger value="activity">
                            Activity
                            {notificationCount > 0 && (
                                <Badge variant="destructive" className="ml-2">
                                    {notificationCount}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        <TabOverview
                            stats={stats}
                            recentTickets={recentTickets}
                            overdueTickets={overdueTickets}
                            unresolvedTickets={unresolvedTickets}
                        />
                    </TabsContent>

                    <TabsContent value="analytics">
                        <TabAnalytics />
                    </TabsContent>

                    <TabsContent value="activity">
                        <TabActivity onNotificationCountChange={setNotificationCount} />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
```

Note: The TabOverview component will render inside TabsContent and needs access to the data. Pass the props through.

---

## Task 7: Backend - Create Notification Generation Job (optional - for real-time)

- [ ] **Step 1: Create CheckOverdueNotifications command**

```php
<?php

namespace App\Console\Commands;

use App\Models\Notification;
use App\Models\Ticket;
use Illuminate\Console\Command;

class CheckOverdueNotifications extends Command
{
    protected $signature = 'notifications:check-overdue';
    protected $description = 'Check for overdue tickets and create notifications';

    public function handle()
    {
        $user = auth()->user();

        // SLA Warning - tickets due within 1 hour
        $slaWarning = Ticket::query()
            ->open()
            ->whereNotNull('resolution_due_at')
            ->where('resolution_due_at', '>', now())
            ->where('resolution_due_at', '<=', now()->addHour())
            ->whereDoesntHave('notifications', fn($q) => $q->where('type', 'sla_warning'))
            ->get();

        foreach ($slaWarning as $ticket) {
            if ($ticket->assignee_id) {
                Notification::create([
                    'user_id' => $ticket->assignee_id,
                    'type' => 'sla_warning',
                    'title' => 'SLA Warning: ' . $ticket->ticket_number,
                    'description' => 'Ticket will be overdue within 1 hour',
                    'target_type' => 'App\\Models\\Ticket',
                    'target_id' => $ticket->id
                ]);
            }
        }

        // Overdue Alert
        $overdue = Ticket::query()
            ->open()
            ->whereNotNull('resolution_due_at')
            ->where('resolution_due_at', '<', now())
            ->whereDoesntHave('notifications', fn($q) => $q->where('type', 'overdue'))
            ->get();

        foreach ($overdue as $ticket) {
            if ($ticket->assignee_id) {
                Notification::create([
                    'user_id' => $ticket->assignee_id,
                    'type' => 'overdue',
                    'title' => 'Overdue: ' . $ticket->ticket_number,
                    'description' => 'Ticket is past its deadline',
                    'target_type' => 'App\\Models\\Ticket',
                    'target_id' => $ticket->id
                ]);
            }
        }

        $this->info('Notifications checked.');
    }
}
```

- [ ] **Step 2: Schedule in crontab**

Add to `routes/console.php`:
```php
$schedule->command('notifications:check-overdue')->everyFiveMinutes();
```

---

## Verification Steps

- [ ] Run `npm run types` to check TypeScript
- [ ] Run `npm run lint` to check ESLint
- [ ] Test manually: visit /dashboard, switch tabs, verify charts load
- [ ] Test API: `curl /api/dashboard/analytics` returns data
- [ ] Test Activity: create ticket, verify it appears in activity feed
- [ ] Test Notifications: check overdue ticket, verify notification created

---

## Notes

- ActivityLog model needs to be populated via observers or events when tickets change
- For MVP, activity logging can be done in Ticket model's `boot` method using `creating`, `updating` events
- Real-time updates can be added later with Laravel Echo + Pusher (already in package.json)

---

**Plan complete.** Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**