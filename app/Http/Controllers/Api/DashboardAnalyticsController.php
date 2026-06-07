<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Departemen;
use App\Models\Ticket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

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
            ->map(fn ($item) => [
                'date' => $item->date,
                'count' => (int) $item->count,
            ]);

        // Ticket volume by week (last 12 weeks)
        $weeklyVolume = Ticket::query()
            ->published()
            ->where('created_at', '>=', $now->copy()->subWeeks(12))
            ->selectRaw('YEARWEEK(created_at, 1) as week, COUNT(*) as count')
            ->groupBy('week')
            ->orderBy('week')
            ->get()
            ->map(fn ($item) => [
                'week' => 'W'.substr($item->week, -2),
                'count' => (int) $item->count,
            ]);

        // Ticket volume by month (last 12 months)
        $monthlyVolume = Ticket::query()
            ->published()
            ->where('created_at', '>=', $now->copy()->subMonths(12))
            ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as count')
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn ($item) => [
                'month' => $item->month,
                'count' => (int) $item->count,
            ]);

        // Department breakdown - based on user who created the ticket
        $userDepartmentCounts = DB::table('tickets')
            ->join('users', 'tickets.requester_id', '=', 'users.id')
            ->where('tickets.is_draft', false)
            ->whereNotNull('users.dep_id')
            ->selectRaw('users.dep_id, COUNT(*) as count')
            ->groupBy('users.dep_id')
            ->pluck('count', 'dep_id')
            ->toArray();

        $byDepartment = Departemen::get()->map(fn ($dept) => [
            'dep_id' => $dept->dep_id,
            'name' => $dept->nama,
            'count' => $userDepartmentCounts[$dept->dep_id] ?? 0,
            'sla_rate' => 0,
        ])->sortByDesc('count')->values();

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
        $byCategory = $categoryCounts->map(fn ($item) => [
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
        $byType = $typeCounts->map(fn ($item) => [
            'type_id' => (int) $item->ticket_type_id,
            'name' => $item->name,
            'count' => (int) $item->count,
            'percentage' => $totalByType > 0 ? round($item->count / $totalByType * 100, 1) : 0,
        ]);

        // User activity - top 10 users
        $byUser = User::whereNotNull('dep_id')
            ->withCount(['requestedTickets as created_tickets_count' => fn ($q) => $q->published()])
            ->withCount(['assignedTickets as resolved_tickets_count' => fn ($q) => $q->published()->whereNotNull('closed_at')])
            ->orderByDesc('created_tickets_count')
            ->limit(10)
            ->get()
            ->map(fn ($user) => [
                'user_id' => $user->id,
                'name' => $user->name,
                'created' => $user->created_tickets_count ?? 0,
                'resolved' => $user->resolved_tickets_count ?? 0,
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
                'monthly' => $monthlyVolume,
            ],
            'by_department' => $byDepartment,
            'by_user' => $byUser,
            'by_category' => $byCategory,
            'by_type' => $byType,
            'summary' => [
                'total_tickets' => $currentMonthCount,
                'vs_previous' => $vsPrevious,
                'avg_resolution_hours' => round($avgResolutionHours, 1),
                'sla_compliance' => $slaCompliance,
            ],
        ]);
    }
}
