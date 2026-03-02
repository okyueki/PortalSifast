<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentReportController extends Controller
{
    /**
     * Laporan per departemen: tiket ditangani, lama penyelesaian, kategori, tag.
     * Bisa di-breakdown per petugas.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        if ($user->isPemohon()) {
            abort(403, 'Laporan per departemen hanya untuk admin dan staff.');
        }

        $monthFrom = $request->string('from', now()->subMonths(5)->startOfMonth()->format('Y-m'));
        $monthTo = $request->string('to', now()->format('Y-m'));
        $depId = $request->string('dep_id')->toString() ?: null;
        $breakdownPerPetugas = $request->boolean('per_petugas', true);

        $from = Carbon::parse($monthFrom.'-01')->startOfDay();
        $to = Carbon::parse($monthTo.'-01')->endOfMonth()->endOfDay();

        $baseQuery = Ticket::query()
            ->whereNotNull('assignee_id')
            ->whereBetween('closed_at', [$from, $to])
            ->join('users as assignee', 'assignee.id', '=', 'tickets.assignee_id');

        if ($user->isStaff()) {
            $baseQuery->where('assignee.dep_id', $user->dep_id);
        }

        if ($depId) {
            $baseQuery->where('assignee.dep_id', $depId);
        }

        $driver = DB::connection()->getDriverName();
        $avgResolutionSql = $driver === 'mysql'
            ? 'AVG(CASE WHEN tickets.resolved_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, tickets.created_at, tickets.resolved_at) END) as avg_resolution_minutes'
            : 'AVG(CASE WHEN tickets.resolved_at IS NOT NULL THEN (julianday(tickets.resolved_at) - julianday(tickets.created_at)) * 24 * 60 END) as avg_resolution_minutes';

        // Aggregasi per departemen (assignee.dep_id)
        $depQuery = (clone $baseQuery)
            ->select(
                'assignee.dep_id',
                DB::raw('COUNT(tickets.id) as total_tickets'),
                DB::raw('SUM(CASE WHEN tickets.resolved_at IS NOT NULL THEN 1 ELSE 0 END) as resolved_count'),
                DB::raw($avgResolutionSql)
            )
            ->groupBy('assignee.dep_id');

        $depRows = $depQuery->get();

        // Kategori per departemen: ticket_category_id + count (leftJoin: tiket tanpa kategori tetap masuk)
        $catQuery = (clone $baseQuery)
            ->leftJoin('ticket_categories as cat', 'cat.id', '=', 'tickets.ticket_category_id')
            ->select('assignee.dep_id', 'tickets.ticket_category_id', DB::raw('COALESCE(cat.name, \'(Tanpa kategori)\') as category_name'), DB::raw('COUNT(tickets.id) as count'))
            ->groupBy('assignee.dep_id', 'tickets.ticket_category_id', 'cat.name');
        $catRows = $catQuery->get()->groupBy('dep_id');

        // Tag per departemen: tag_id + count (via pivot)
        $tagQuery = (clone $baseQuery)
            ->join('ticket_ticket_tag as tt', 'tt.ticket_id', '=', 'tickets.id')
            ->join('ticket_tags as tag', 'tag.id', '=', 'tt.ticket_tag_id')
            ->select('assignee.dep_id', 'tag.id as tag_id', 'tag.name as tag_name', DB::raw('COUNT(tickets.id) as count'))
            ->groupBy('assignee.dep_id', 'tag.id', 'tag.name');
        $tagRows = $tagQuery->get()->groupBy('dep_id');

        $departments = $depRows->map(function ($row) use ($catRows, $tagRows) {
            return [
                'dep_id' => $row->dep_id,
                'total_tickets' => (int) $row->total_tickets,
                'resolved_count' => (int) $row->resolved_count,
                'avg_resolution_minutes' => $row->avg_resolution_minutes !== null ? round((float) $row->avg_resolution_minutes, 1) : null,
                'categories' => ($catRows->get($row->dep_id) ?? collect())->map(fn ($r) => [
                    'id' => $r->ticket_category_id,
                    'name' => $r->category_name,
                    'count' => (int) $r->count,
                ])->values()->all(),
                'tags' => ($tagRows->get($row->dep_id) ?? collect())->map(fn ($r) => [
                    'id' => $r->tag_id,
                    'name' => $r->tag_name,
                    'count' => (int) $r->count,
                ])->values()->all(),
            ];
        })->values()->all();

        // Breakdown per petugas (per assignee)
        $byAssignee = [];
        if ($breakdownPerPetugas) {
            $assigneeQuery = (clone $baseQuery)
                ->select(
                    'assignee.dep_id',
                    'assignee.id as assignee_id',
                    'assignee.name as assignee_name',
                    DB::raw('COUNT(tickets.id) as total_tickets'),
                    DB::raw('SUM(CASE WHEN tickets.resolved_at IS NOT NULL THEN 1 ELSE 0 END) as resolved_count'),
                    DB::raw($avgResolutionSql)
                )
                ->groupBy('assignee.dep_id', 'assignee.id', 'assignee.name');

            $assigneeRows = $assigneeQuery->get();

            // Kategori per assignee
            $acQuery = (clone $baseQuery)
                ->leftJoin('ticket_categories as cat', 'cat.id', '=', 'tickets.ticket_category_id')
                ->select('assignee.id as assignee_id', 'assignee.dep_id', 'tickets.ticket_category_id', DB::raw('COALESCE(cat.name, \'(Tanpa kategori)\') as category_name'), DB::raw('COUNT(tickets.id) as count'))
                ->groupBy('assignee.id', 'assignee.dep_id', 'tickets.ticket_category_id', 'cat.name');
            $acRows = $acQuery->get()->groupBy('assignee_id');

            // Tag per assignee
            $atQuery = (clone $baseQuery)
                ->join('ticket_ticket_tag as tt', 'tt.ticket_id', '=', 'tickets.id')
                ->join('ticket_tags as tag', 'tag.id', '=', 'tt.ticket_tag_id')
                ->select('assignee.id as assignee_id', 'assignee.dep_id', 'tag.id as tag_id', 'tag.name as tag_name', DB::raw('COUNT(tickets.id) as count'))
                ->groupBy('assignee.id', 'assignee.dep_id', 'tag.id', 'tag.name');
            $atRows = $atQuery->get()->groupBy('assignee_id');

            foreach ($assigneeRows as $r) {
                $byAssignee[] = [
                    'dep_id' => $r->dep_id,
                    'assignee_id' => $r->assignee_id,
                    'assignee_name' => $r->assignee_name,
                    'total_tickets' => (int) $r->total_tickets,
                    'resolved_count' => (int) $r->resolved_count,
                    'avg_resolution_minutes' => $r->avg_resolution_minutes !== null ? round((float) $r->avg_resolution_minutes, 1) : null,
                    'categories' => ($acRows->get($r->assignee_id) ?? collect())->map(fn ($x) => [
                        'id' => $x->ticket_category_id,
                        'name' => $x->category_name,
                        'count' => (int) $x->count,
                    ])->values()->all(),
                    'tags' => ($atRows->get($r->assignee_id) ?? collect())->map(fn ($x) => [
                        'id' => $x->tag_id,
                        'name' => $x->tag_name,
                        'count' => (int) $x->count,
                    ])->values()->all(),
                ];
            }
        }

        // Daftar dep_id untuk filter (admin: semua; staff: hanya dep mereka)
        $departmentsForFilter = $user->isAdmin()
            ? Ticket::query()
                ->whereNotNull('assignee_id')
                ->join('users as u', 'u.id', '=', 'tickets.assignee_id')
                ->distinct()
                ->pluck('u.dep_id')
                ->filter()
                ->values()
                ->all()
            : (array) $user->dep_id;

        // --- Insight: unit/departemen mana yang sering terjadi kerusakan (by ticket.dep_id)
        $unitKerusakanQuery = (clone $baseQuery)
            ->select('tickets.dep_id', DB::raw('COUNT(tickets.id) as total_tickets'))
            ->groupBy('tickets.dep_id');
        $unitKerusakanRows = $unitKerusakanQuery->get()->map(function ($r) {
            return [
                'dep_id' => $r->dep_id ?? '(Tanpa unit)',
                'total_tickets' => (int) $r->total_tickets,
            ];
        })->sortByDesc('total_tickets')->values()->take(10)->all();

        // --- Insight: kategori tiket terbanyak (global dalam periode)
        $topCatQuery = (clone $baseQuery)
            ->leftJoin('ticket_categories as cat', 'cat.id', '=', 'tickets.ticket_category_id')
            ->select(DB::raw('COALESCE(cat.name, \'(Tanpa kategori)\') as name'), DB::raw('COUNT(tickets.id) as count'))
            ->groupBy('cat.name')
            ->orderByDesc('count')
            ->limit(10);
        $insightsTopCategories = $topCatQuery->get()->map(fn ($r) => [
            'name' => $r->name,
            'count' => (int) $r->count,
        ])->all();

        // --- Insight: tag terbanyak (global dalam periode)
        $topTagQuery = (clone $baseQuery)
            ->join('ticket_ticket_tag as tt', 'tt.ticket_id', '=', 'tickets.id')
            ->join('ticket_tags as tag', 'tag.id', '=', 'tt.ticket_tag_id')
            ->select('tag.name', DB::raw('COUNT(tickets.id) as count'))
            ->groupBy('tag.id', 'tag.name')
            ->orderByDesc('count')
            ->limit(10);
        $insightsTopTags = $topTagQuery->get()->map(fn ($r) => [
            'name' => $r->name,
            'count' => (int) $r->count,
        ])->all();

        return Inertia::render('reports/department', [
            'departments' => $departments,
            'byAssignee' => $byAssignee,
            'insightsUnitKerusakan' => $unitKerusakanRows,
            'insightsTopCategories' => $insightsTopCategories,
            'insightsTopTags' => $insightsTopTags,
            'filters' => [
                'from' => $monthFrom,
                'to' => $monthTo,
                'dep_id' => $depId,
                'per_petugas' => $breakdownPerPetugas,
            ],
            'departmentsForFilter' => $departmentsForFilter,
        ]);
    }
}
