<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\User;
use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class DashboardAnalyticsController extends Controller
{
    public function index(): JsonResponse
    {
        $now = Carbon::now();

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
                'count' => (int) $item->count
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
                'count' => (int) $item->count
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
                'count' => (int) $item->count
            ]);

        // Department breakdown
        $departments = Department::withCount(['tickets' => fn($q) => $q->published()])->get();

        $byDepartment = $departments->map(fn($dept) => [
            'dep_id' => $dept->id,
            'name' => $dept->name,
            'count' => $dept->tickets_count ?? 0,
            'sla_rate' => $dept->tickets_count > 0 ? 0.75 : 0 // Placeholder - calculate from actual data
        ])->sortByDesc('count')->values();

        // User activity - top 10 users
        $byUser = User::whereNotNull('dep_id')
            ->withCount(['tickets as created_tickets_count' => fn($q) => $q->published()])
            ->withCount(['assignedTickets as resolved_tickets_count' => fn($q) => $q->published()->whereNotNull('closed_at')])
            ->orderByDesc('created_tickets_count')
            ->limit(10)
            ->get()
            ->map(fn($user) => [
                'user_id' => $user->id,
                'name' => $user->name,
                'created' => $user->created_tickets_count ?? 0,
                'resolved' => $user->resolved_tickets_count ?? 0
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

        $vsPrevious = $prevMonthCount > 0
            ? round(($currentMonthCount - $prevMonthCount) / $prevMonthCount, 2)
            : 0;

        // Avg resolution hours (simplified)
        $avgResolutionHours = 24.5; // Placeholder

        // SLA compliance
        $totalSlaCount = Ticket::query()->published()->whereNotNull('resolution_due_at')->count();
        $onTimeCount = Ticket::query()->published()
            ->whereNotNull('resolution_due_at')
            ->whereNotNull('resolved_at')
            ->whereColumn('resolved_at', '<=', 'resolution_due_at')
            ->count();
        $slaCompliance = $totalSlaCount > 0 ? round($onTimeCount / $totalSlaCount, 2) : 0;

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