<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketStatus;
use App\Services\UserPresenceService;
use Illuminate\Http\Request;
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

        $baseQuery = Ticket::query();

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

        $recentTickets = (clone $baseQuery)
            ->with(['type', 'category', 'priority', 'status'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $overdueTickets = $user->isStaff() || $user->isAdmin()
            ? (clone $baseQuery)->overdue()
                ->with(['type', 'category', 'priority', 'status', 'assignee'])
                ->orderBy('resolution_due_at')
                ->limit(5)
                ->get()
            : collect();

        // Get online users statistics
        $onlineUsers = $this->userPresenceService->getOnlineUsers();
        $onlineCount = $this->userPresenceService->getOnlineUsersCount();

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'recentTickets' => $recentTickets,
            'overdueTickets' => $overdueTickets,
            'onlineUsers' => [
                'count' => $onlineCount,
                'users' => $onlineUsers,
            ],
        ]);
    }
}
