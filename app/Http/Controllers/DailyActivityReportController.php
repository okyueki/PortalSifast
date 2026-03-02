<?php

namespace App\Http\Controllers;

use App\Models\TicketActivity;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DailyActivityReportController extends Controller
{
    /**
     * Laporan aktivitas harian: apa saja yang dilakukan user pada tiket (komentar,
     * ubah status, lampiran, dll.) per tanggal. Bukan hanya tiket selesai — jadi
     * kerja pengembangan yang belum selesai tetap terlihat dari aktivitasnya.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        if ($user->isPemohon()) {
            abort(403, 'Laporan aktivitas harian hanya untuk admin dan staff.');
        }

        $date = $request->string('date')->isNotEmpty()
            ? Carbon::parse($request->string('date'))->startOfDay()
            : now()->startOfDay();

        $targetUserId = $request->integer('user_id') ?: null;
        if ($user->isStaff()) {
            $targetUserId = $user->id;
        } elseif (! $targetUserId && $user->isAdmin()) {
            $targetUserId = $user->id;
        }

        $activities = [];
        $summary = [];

        if ($targetUserId) {
            $activities = TicketActivity::query()
                ->where('user_id', $targetUserId)
                ->whereDate('created_at', $date)
                ->with('ticket:id,title')
                ->orderByDesc('created_at')
                ->get()
                ->map(fn (TicketActivity $a) => [
                    'id' => $a->id,
                    'action' => $a->action,
                    'action_label' => $a->action_label,
                    'old_value' => $a->old_value,
                    'new_value' => $a->new_value,
                    'description' => $a->description,
                    'created_at' => $a->created_at->toIso8601String(),
                    'ticket' => $a->ticket ? ['id' => $a->ticket->id, 'title' => $a->ticket->title] : null,
                ])
                ->values()
                ->all();

            $summaryRows = TicketActivity::query()
                ->where('user_id', $targetUserId)
                ->whereDate('created_at', $date)
                ->select('action', DB::raw('COUNT(*) as count'))
                ->groupBy('action')
                ->get();
            $summary = $summaryRows->map(fn ($row) => [
                'action' => $row->action,
                'count' => (int) $row->count,
                'action_label' => (new TicketActivity(['action' => $row->action]))->action_label,
            ])->values()->all();
        }

        $usersForFilter = [];
        if ($user->isAdmin()) {
            $usersForFilter = User::query()
                ->whereHas('ticketActivities')
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (User $u) => ['id' => $u->id, 'name' => $u->name])
                ->values()
                ->all();
        }

        $targetUser = $targetUserId ? User::find($targetUserId) : null;

        return Inertia::render('reports/daily-activity', [
            'activities' => $activities,
            'summary' => $summary, // array of { action, count, action_label }
            'date' => $date->format('Y-m-d'),
            'targetUser' => $targetUser ? ['id' => $targetUser->id, 'name' => $targetUser->name] : null,
            'usersForFilter' => $usersForFilter,
            'canSelectUser' => $user->isAdmin(),
            'currentUserId' => $user->id,
            'filters' => [
                'date' => $date->format('Y-m-d'),
                'user_id' => $targetUserId,
            ],
        ]);
    }
}
