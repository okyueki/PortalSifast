<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SlaReportController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        if ($user->isPemohon()) {
            abort(403, 'Laporan SLA hanya untuk admin dan staff.');
        }

        $monthFrom = $request->string('from', now()->subMonths(5)->startOfMonth()->format('Y-m'));
        $monthTo = $request->string('to', now()->format('Y-m'));
        $depId = $request->string('dep_id')->toString() ?: null;

        $from = Carbon::parse($monthFrom.'-01')->startOfDay();
        $to = Carbon::parse($monthTo.'-01')->endOfMonth()->endOfDay();

        $baseQuery = Ticket::query()
            ->whereBetween('tickets.created_at', [$from, $to])
            ->where(function ($q) {
                $q->whereNotNull('response_due_at')
                    ->orWhereNotNull('resolution_due_at');
            });

        if ($user->isStaff()) {
            $baseQuery->where('dep_id', $user->dep_id);
        }

        if ($depId) {
            $baseQuery->where('dep_id', $depId);
        }

        // Exclude development tickets (no SLA)
        $baseQuery->whereDoesntHave('category', fn ($q) => $q->where('is_development', true));

        $responseSla = $this->calculateResponseSla(clone $baseQuery);
        $resolutionSla = $this->calculateResolutionSla(clone $baseQuery);
        $monthlyTrend = $this->calculateMonthlyTrend($baseQuery, $from, $to);
        $byDepartment = $this->calculateByDepartment($baseQuery);
        $byPriority = $this->calculateByPriority($baseQuery);

        $departments = $user->isAdmin()
            ? (clone $baseQuery)->distinct()->pluck('dep_id')->filter()->values()->all()
            : (array) $user->dep_id;

        return Inertia::render('reports/sla', [
            'responseSla' => $responseSla,
            'resolutionSla' => $resolutionSla,
            'monthlyTrend' => $monthlyTrend,
            'byDepartment' => $byDepartment,
            'byPriority' => $byPriority,
            'filters' => [
                'from' => $monthFrom,
                'to' => $monthTo,
                'dep_id' => $depId,
            ],
            'departments' => $departments,
        ]);
    }

    /**
     * @return array{total: int, met: int, breached: int, pending: int, percentage: float}
     */
    private function calculateResponseSla($query): array
    {
        $withResponseDue = (clone $query)->whereNotNull('response_due_at');
        $total = $withResponseDue->count();

        if ($total === 0) {
            return [
                'total' => 0,
                'met' => 0,
                'breached' => 0,
                'pending' => 0,
                'percentage' => 0.0,
            ];
        }

        $met = (clone $withResponseDue)
            ->whereNotNull('first_response_at')
            ->whereRaw('first_response_at <= response_due_at')
            ->count();

        $breached = (clone $withResponseDue)
            ->where(function ($q) {
                $q->whereNull('first_response_at')
                    ->where('response_due_at', '<', now());
            })
            ->orWhere(function ($q) {
                $q->whereNotNull('first_response_at')
                    ->whereRaw('first_response_at > response_due_at');
            })
            ->count();

        $pending = $total - $met - $breached;

        $counted = $met + $breached;
        $percentage = $counted > 0 ? round(($met / $counted) * 100, 1) : 0.0;

        return [
            'total' => $total,
            'met' => $met,
            'breached' => $breached,
            'pending' => $pending,
            'percentage' => $percentage,
        ];
    }

    /**
     * @return array{total: int, met: int, breached: int, pending: int, percentage: float}
     */
    private function calculateResolutionSla($query): array
    {
        $withResolutionDue = (clone $query)->whereNotNull('resolution_due_at');
        $total = $withResolutionDue->count();

        if ($total === 0) {
            return [
                'total' => 0,
                'met' => 0,
                'breached' => 0,
                'pending' => 0,
                'percentage' => 0.0,
            ];
        }

        $resolved = (clone $withResolutionDue)->whereNotNull('resolved_at');

        $met = (clone $resolved)
            ->whereRaw('resolved_at <= resolution_due_at')
            ->count();

        $breached = (clone $resolved)
            ->whereRaw('resolved_at > resolution_due_at')
            ->count();

        $pending = (clone $withResolutionDue)
            ->whereNull('resolved_at')
            ->count();

        $counted = $met + $breached;
        $percentage = $counted > 0 ? round(($met / $counted) * 100, 1) : 0.0;

        return [
            'total' => $total,
            'met' => $met,
            'breached' => $breached,
            'pending' => $pending,
            'percentage' => $percentage,
        ];
    }

    /**
     * @return array<int, array{month: string, response_met: int, response_breached: int, resolution_met: int, resolution_breached: int}>
     */
    private function calculateMonthlyTrend($query, Carbon $from, Carbon $to): array
    {
        $months = [];
        $current = $from->copy();

        while ($current <= $to) {
            $months[] = $current->format('Y-m');
            $current->addMonth();
        }

        $trend = [];
        foreach ($months as $month) {
            $monthStart = Carbon::parse($month.'-01')->startOfDay();
            $monthEnd = Carbon::parse($month.'-01')->endOfMonth()->endOfDay();

            $monthQuery = (clone $query)->whereBetween('created_at', [$monthStart, $monthEnd]);

            $response = $this->calculateResponseSla($monthQuery);
            $resolution = $this->calculateResolutionSla($monthQuery);

            $trend[] = [
                'month' => $month,
                'month_label' => Carbon::parse($month.'-01')->locale('id')->translatedFormat('M Y'),
                'response_met' => $response['met'],
                'response_breached' => $response['breached'],
                'response_total' => $response['met'] + $response['breached'],
                'resolution_met' => $resolution['met'],
                'resolution_breached' => $resolution['breached'],
                'resolution_total' => $resolution['met'] + $resolution['breached'],
            ];
        }

        return $trend;
    }

    /**
     * @return array<string, array{response_met: int, response_breached: int, resolution_met: int, resolution_breached: int}>
     */
    private function calculateByDepartment($query): array
    {
        $now = now()->format('Y-m-d H:i:s');
        $rows = (clone $query)
            ->select('dep_id')
            ->selectRaw('
                SUM(CASE WHEN response_due_at IS NOT NULL AND first_response_at IS NOT NULL AND first_response_at <= response_due_at THEN 1 ELSE 0 END) as response_met,
                SUM(CASE WHEN response_due_at IS NOT NULL AND ((first_response_at IS NULL AND response_due_at < ?) OR (first_response_at IS NOT NULL AND first_response_at > response_due_at)) THEN 1 ELSE 0 END) as response_breached,
                SUM(CASE WHEN resolution_due_at IS NOT NULL AND resolved_at IS NOT NULL AND resolved_at <= resolution_due_at THEN 1 ELSE 0 END) as resolution_met,
                SUM(CASE WHEN resolution_due_at IS NOT NULL AND resolved_at IS NOT NULL AND resolved_at > resolution_due_at THEN 1 ELSE 0 END) as resolution_breached
            ', [$now])
            ->groupBy('dep_id')
            ->get();

        $result = [];
        foreach ($rows as $row) {
            $dep = $row->dep_id ?? 'Lainnya';
            $result[$dep] = [
                'response_met' => (int) $row->response_met,
                'response_breached' => (int) $row->response_breached,
                'resolution_met' => (int) $row->resolution_met,
                'resolution_breached' => (int) $row->resolution_breached,
            ];
        }

        return $result;
    }

    /**
     * @return array<string, array{response_met: int, response_breached: int, resolution_met: int, resolution_breached: int}>
     */
    private function calculateByPriority($query): array
    {
        $now = now()->format('Y-m-d H:i:s');
        $rows = (clone $query)
            ->join('ticket_priorities', 'tickets.ticket_priority_id', '=', 'ticket_priorities.id')
            ->select('ticket_priorities.name as priority_name')
            ->selectRaw('
                SUM(CASE WHEN tickets.response_due_at IS NOT NULL AND tickets.first_response_at IS NOT NULL AND tickets.first_response_at <= tickets.response_due_at THEN 1 ELSE 0 END) as response_met,
                SUM(CASE WHEN tickets.response_due_at IS NOT NULL AND ((tickets.first_response_at IS NULL AND tickets.response_due_at < ?) OR (tickets.first_response_at IS NOT NULL AND tickets.first_response_at > tickets.response_due_at)) THEN 1 ELSE 0 END) as response_breached,
                SUM(CASE WHEN tickets.resolution_due_at IS NOT NULL AND tickets.resolved_at IS NOT NULL AND tickets.resolved_at <= tickets.resolution_due_at THEN 1 ELSE 0 END) as resolution_met,
                SUM(CASE WHEN tickets.resolution_due_at IS NOT NULL AND tickets.resolved_at IS NOT NULL AND tickets.resolved_at > tickets.resolution_due_at THEN 1 ELSE 0 END) as resolution_breached
            ', [$now])
            ->groupBy('ticket_priorities.id', 'ticket_priorities.name')
            ->orderBy('ticket_priorities.level')
            ->get();

        $result = [];
        foreach ($rows as $row) {
            $result[$row->priority_name] = [
                'response_met' => (int) $row->response_met,
                'response_breached' => (int) $row->response_breached,
                'resolution_met' => (int) $row->resolution_met,
                'resolution_breached' => (int) $row->resolution_breached,
            ];
        }

        return $result;
    }
}
