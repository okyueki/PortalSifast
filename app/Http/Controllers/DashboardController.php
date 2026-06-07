<?php

namespace App\Http\Controllers;

use App\Models\Departemen;
use App\Models\Ticket;
use App\Models\TicketStatus;
use App\Models\User;
use App\Services\UserPresenceService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private UserPresenceService $userPresenceService
    ) {}

    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $baseQuery = Ticket::query()->published();

        if ($user->isPemohon()) {
            $baseQuery->where('requester_id', $user->id);
        } elseif ($user->isStaff()) {
            $baseQuery->where(function ($q) use ($user) {
                $q->where('dep_id', $user->dep_id)
                    ->orWhere('assignee_id', $user->id)
                    ->orWhere('requester_id', $user->id);
            });
        }
        // Admin sees all

        $stats = [
            'total_open' => (clone $baseQuery)->open()->count(),
            'total_closed_month' => (clone $baseQuery)->closed()
                ->whereMonth('closed_at', now()->month)
                ->whereYear('closed_at', now()->year)
                ->count(),
            'overdue' => (clone $baseQuery)->overdue()->count(),
            'assigned_to_me' => $user->isStaff() || $user->isAdmin()
                ? (clone $baseQuery)->where('assignee_id', $user->id)->open()->count()
                : 0,
            'unassigned' => $user->isStaff() || $user->isAdmin()
                ? (clone $baseQuery)->unassigned()->open()->count()
                : 0,
        ];

        $byStatus = (clone $baseQuery)
            ->selectRaw('ticket_status_id, count(*) as count')
            ->groupBy('ticket_status_id')
            ->pluck('count', 'ticket_status_id')
            ->toArray();

        $statuses = TicketStatus::active()->ordered()->get();
        $stats['by_status'] = $statuses->mapWithKeys(function ($status) use ($byStatus) {
            return [$status->name => $byStatus[$status->id] ?? 0];
        })->toArray();

        $stats['by_department'] = (clone $baseQuery)
            ->selectRaw('dep_id, count(*) as count')
            ->groupBy('dep_id')
            ->pluck('count', 'dep_id')
            ->toArray();

        // Tiket Terbaru = hanya status Baru (new)
        $recentTickets = (clone $baseQuery)
            ->whereHas('status', fn ($q) => $q->where('slug', TicketStatus::SLUG_NEW))
            ->with(['type', 'category', 'priority', 'status', 'requester', 'assignee'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $overdueTickets = $user->isStaff() || $user->isAdmin()
            ? (clone $baseQuery)->open()->overdue()
                ->with(['type', 'category', 'priority', 'status', 'requester', 'assignee'])
                ->orderBy('resolution_due_at')
                ->limit(5)
                ->get()
            : collect();

        // Tiket belum diselesaikan (open, bukan status Baru — ditugaskan/in progress = belum selesai)
        $unresolvedTickets = (clone $baseQuery)
            ->open()
            ->whereHas('status', fn ($q) => $q->where('slug', '!=', TicketStatus::SLUG_NEW))
            ->with(['type', 'category', 'priority', 'status', 'requester', 'assignee'])
            ->orderBy('updated_at', 'desc')
            ->limit(10)
            ->get();

        // Get online users statistics
        $onlineUsers = $this->userPresenceService->getOnlineUsers();
        $onlineCount = $this->userPresenceService->getOnlineUsersCount();

        // Analytics data (embedded for first load)
        $analytics = $this->getAnalyticsData();

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'recentTickets' => $recentTickets,
            'overdueTickets' => $overdueTickets,
            'unresolvedTickets' => $unresolvedTickets,
            'onlineUsers' => [
                'count' => $onlineCount,
                'users' => $onlineUsers,
            ],
            'analytics' => $analytics,
        ]);
    }

    private function getAnalyticsData(): array
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
        $avgResolutionHours = 24.5;

        // SLA compliance
        $totalSlaCount = Ticket::query()->published()->whereNotNull('resolution_due_at')->count();
        $onTimeCount = Ticket::query()->published()
            ->whereNotNull('resolution_due_at')
            ->whereNotNull('resolved_at')
            ->whereColumn('resolved_at', '<=', 'resolution_due_at')
            ->count();
        $slaCompliance = $totalSlaCount > 0 ? round($onTimeCount / $totalSlaCount, 2) : 0;

        return [
            'ticket_volume' => [
                'daily' => $dailyVolume,
                'weekly' => $weeklyVolume,
                'monthly' => $monthlyVolume,
            ],
            'by_department' => $byDepartment,
            'by_user' => $byUser,
            'summary' => [
                'total_tickets' => $currentMonthCount,
                'vs_previous' => $vsPrevious,
                'avg_resolution_hours' => round($avgResolutionHours, 1),
                'sla_compliance' => $slaCompliance,
            ],
        ];
    }
}
