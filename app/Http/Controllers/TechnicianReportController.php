<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TechnicianReportController extends Controller
{
    /**
     * Laporan per teknisi: tiket yang ditangani oleh satu assignee dalam periode,
     * dengan ringkasan (total, selesai, rata-rata lama) serta kategori dan tag.
     */
    public function __invoke(Request $request): Response
    {
        return Inertia::render('reports/technician', $this->reportData($request));
    }

    /**
     * Data laporan untuk view (web atau print). Pemohon akan abort 403.
     *
     * @return array<string, mixed>
     */
    public function reportData(Request $request): array
    {
        $user = $request->user();
        if ($user->isPemohon()) {
            abort(403, 'Laporan per teknisi hanya untuk admin dan staff.');
        }

        $monthFrom = $request->string('from', now()->subMonths(2)->startOfMonth()->format('Y-m'));
        $monthTo = $request->string('to', now()->format('Y-m'));
        $assigneeIdInput = $request->input('assignee_id');
        $assigneeId = null;
        $showAllTechnicians = false;
        if ($assigneeIdInput === '__all__' || $assigneeIdInput === '' || $assigneeIdInput === null) {
            if ($user->isAdmin()) {
                $showAllTechnicians = true;
            }
        } else {
            $assigneeId = $request->integer('assignee_id') ?: null;
        }

        if ($user->isStaff()) {
            $assigneeId = $user->id;
            $showAllTechnicians = false;
        }

        $from = Carbon::parse($monthFrom.'-01')->startOfDay();
        $to = Carbon::parse($monthTo.'-01')->endOfMonth()->endOfDay();

        $techniciansForFilter = $this->getTechniciansForFilter($user);

        $technician = null;
        $technicians = [];
        $totalTickets = 0;
        $resolvedCount = 0;
        $avgResolutionMinutes = null;
        $categories = [];
        $tags = [];
        $kpi = null;
        $insights = [];
        $recommendations = [];

        if ($showAllTechnicians) {
            $technicians = $this->buildAllTechniciansReport($user, $from, $to);
        } elseif ($assigneeId && $this->canViewTechnician($user, $assigneeId, $techniciansForFilter)) {
            $driver = DB::connection()->getDriverName();
            $avgResolutionSql = $driver === 'mysql'
                ? 'AVG(CASE WHEN tickets.resolved_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, tickets.created_at, tickets.resolved_at) END) as avg_resolution_minutes'
                : 'AVG(CASE WHEN tickets.resolved_at IS NOT NULL THEN (julianday(tickets.resolved_at) - julianday(tickets.created_at)) * 24 * 60 END) as avg_resolution_minutes';

            $baseQuery = Ticket::query()
                ->where('tickets.assignee_id', $assigneeId)
                ->whereBetween('tickets.closed_at', [$from, $to]);

            if ($user->isStaff()) {
                $baseQuery->where('tickets.assignee_id', $user->id);
            }

            $assignee = User::find($assigneeId);
            if ($assignee) {
                $technician = [
                    'id' => $assignee->id,
                    'name' => $assignee->name,
                    'dep_id' => $assignee->dep_id,
                ];

                $summaryRow = (clone $baseQuery)
                    ->select(
                        DB::raw('COUNT(tickets.id) as total_tickets'),
                        DB::raw('SUM(CASE WHEN tickets.resolved_at IS NOT NULL THEN 1 ELSE 0 END) as resolved_count'),
                        DB::raw($avgResolutionSql)
                    )
                    ->first();

                $totalTickets = (int) $summaryRow->total_tickets;
                $resolvedCount = (int) $summaryRow->resolved_count;
                $avgResolutionMinutes = $summaryRow->avg_resolution_minutes !== null
                    ? round((float) $summaryRow->avg_resolution_minutes, 1) : null;

                $catRows = (clone $baseQuery)
                    ->leftJoin('ticket_categories as cat', 'cat.id', '=', 'tickets.ticket_category_id')
                    ->select(DB::raw('COALESCE(cat.name, \'(Tanpa kategori)\') as name'), DB::raw('COUNT(tickets.id) as count'))
                    ->groupBy('cat.name')
                    ->get();
                $categories = $catRows->map(fn ($r) => [
                    'id' => null,
                    'name' => $r->name,
                    'count' => (int) $r->count,
                ])->values()->all();

                $tagRows = (clone $baseQuery)
                    ->join('ticket_ticket_tag as tt', 'tt.ticket_id', '=', 'tickets.id')
                    ->join('ticket_tags as tag', 'tag.id', '=', 'tt.ticket_tag_id')
                    ->select('tag.id', 'tag.name', DB::raw('COUNT(tickets.id) as count'))
                    ->groupBy('tag.id', 'tag.name')
                    ->get();
                $tags = $tagRows->map(fn ($r) => [
                    'id' => $r->id,
                    'name' => $r->name,
                    'count' => (int) $r->count,
                ])->values()->all();

                $kpi = $this->buildKpi($totalTickets, $resolvedCount, $avgResolutionMinutes);
                $insights = $this->buildInsights($totalTickets, $resolvedCount, $avgResolutionMinutes, $kpi['resolution_rate_percent']);
                $recommendations = $this->buildRecommendations($totalTickets, $resolvedCount, $avgResolutionMinutes, $kpi['resolution_rate_percent'], $categories, $tags);
            }
        }

        return [
            'technician' => $technician,
            'technicians' => $technicians,
            'totalTickets' => $totalTickets,
            'resolvedCount' => $resolvedCount,
            'avgResolutionMinutes' => $avgResolutionMinutes,
            'categories' => $categories,
            'tags' => $tags,
            'kpi' => $kpi ?? null,
            'insights' => $insights ?? [],
            'recommendations' => $recommendations ?? [],
            'techniciansForFilter' => $techniciansForFilter,
            'canSelectTechnician' => $user->isAdmin(),
            'filters' => [
                'from' => $monthFrom,
                'to' => $monthTo,
                'assignee_id' => $assigneeId ?? ($showAllTechnicians ? '__all__' : null),
            ],
        ];
    }

    /**
     * Laporan agregat per teknisi (semua assignee yang punya tiket closed dalam periode).
     *
     * @return array<int, array{id: int, name: string, dep_id: string|null, total_tickets: int, resolved_count: int, avg_resolution_minutes: float|null, categories: array, tags: array}>
     */
    private function buildAllTechniciansReport(\App\Models\User $user, Carbon $from, Carbon $to): array
    {
        $driver = DB::connection()->getDriverName();
        $avgResolutionSql = $driver === 'mysql'
            ? 'AVG(CASE WHEN tickets.resolved_at IS NOT NULL THEN TIMESTAMPDIFF(MINUTE, tickets.created_at, tickets.resolved_at) END) as avg_resolution_minutes'
            : 'AVG(CASE WHEN tickets.resolved_at IS NOT NULL THEN (julianday(tickets.resolved_at) - julianday(tickets.created_at)) * 24 * 60 END) as avg_resolution_minutes';

        $baseQuery = Ticket::query()
            ->whereNotNull('tickets.assignee_id')
            ->whereBetween('tickets.closed_at', [$from, $to])
            ->join('users as assignee', 'assignee.id', '=', 'tickets.assignee_id');

        $summaryRows = (clone $baseQuery)
            ->select(
                'assignee.id',
                'assignee.name',
                'assignee.dep_id',
                DB::raw('COUNT(tickets.id) as total_tickets'),
                DB::raw('SUM(CASE WHEN tickets.resolved_at IS NOT NULL THEN 1 ELSE 0 END) as resolved_count'),
                DB::raw($avgResolutionSql)
            )
            ->groupBy('assignee.id', 'assignee.name', 'assignee.dep_id')
            ->orderByDesc(DB::raw('COUNT(tickets.id)'))
            ->get();

        $catQuery = (clone $baseQuery)
            ->leftJoin('ticket_categories as cat', 'cat.id', '=', 'tickets.ticket_category_id')
            ->select('assignee.id as assignee_id', DB::raw('COALESCE(cat.name, \'(Tanpa kategori)\') as name'), DB::raw('COUNT(tickets.id) as count'))
            ->groupBy('assignee.id', 'cat.name');
        $catRows = $catQuery->get()->groupBy('assignee_id');

        $tagQuery = (clone $baseQuery)
            ->join('ticket_ticket_tag as tt', 'tt.ticket_id', '=', 'tickets.id')
            ->join('ticket_tags as tag', 'tag.id', '=', 'tt.ticket_tag_id')
            ->select('assignee.id as assignee_id', 'tag.id as tag_id', 'tag.name', DB::raw('COUNT(tickets.id) as count'))
            ->groupBy('assignee.id', 'tag.id', 'tag.name');
        $tagRows = $tagQuery->get()->groupBy('assignee_id');

        $result = [];
        foreach ($summaryRows as $row) {
            $result[] = [
                'id' => $row->id,
                'name' => $row->name,
                'dep_id' => $row->dep_id,
                'total_tickets' => (int) $row->total_tickets,
                'resolved_count' => (int) $row->resolved_count,
                'avg_resolution_minutes' => $row->avg_resolution_minutes !== null ? round((float) $row->avg_resolution_minutes, 1) : null,
                'categories' => ($catRows->get($row->id) ?? collect())->map(fn ($r) => [
                    'id' => null,
                    'name' => $r->name,
                    'count' => (int) $r->count,
                ])->values()->all(),
                'tags' => ($tagRows->get($row->id) ?? collect())->map(fn ($r) => [
                    'id' => $r->tag_id,
                    'name' => $r->name,
                    'count' => (int) $r->count,
                ])->values()->all(),
            ];
        }

        return $result;
    }

    /**
     * @return array<int, array{id: int, name: string, dep_id: string|null}>
     */
    private function getTechniciansForFilter(User $user): array
    {
        $query = User::query()
            ->whereIn('role', ['admin', 'staff'])
            ->orderBy('name')
            ->get(['id', 'name', 'dep_id']);

        if ($user->isStaff()) {
            $query = $query->where('dep_id', $user->dep_id)->values();
        }

        return $query->map(fn (User $u) => [
            'id' => $u->id,
            'name' => $u->name,
            'dep_id' => $u->dep_id,
        ])->values()->all();
    }

    private function canViewTechnician(User $user, int $assigneeId, array $techniciansForFilter): bool
    {
        if ($user->isAdmin()) {
            return true;
        }
        if ($user->isStaff()) {
            return $assigneeId === $user->id;
        }
        $ids = array_column($techniciansForFilter, 'id');

        return in_array($assigneeId, $ids, true);
    }

    /**
     * @return array{resolution_rate_percent: int|null, avg_resolution_minutes: float|null, total_tickets: int, resolved_count: int}
     */
    private function buildKpi(int $totalTickets, int $resolvedCount, ?float $avgResolutionMinutes): array
    {
        $resolutionRatePercent = $totalTickets > 0
            ? (int) round(100 * $resolvedCount / $totalTickets)
            : null;

        return [
            'resolution_rate_percent' => $resolutionRatePercent,
            'avg_resolution_minutes' => $avgResolutionMinutes,
            'total_tickets' => $totalTickets,
            'resolved_count' => $resolvedCount,
        ];
    }

    /**
     * @return array<int, string>
     */
    private function buildInsights(int $totalTickets, int $resolvedCount, ?float $avgResolutionMinutes, ?int $resolutionRatePercent): array
    {
        $insights = [];

        if ($totalTickets > 0) {
            $pct = $resolutionRatePercent ?? (int) round(100 * $resolvedCount / $totalTickets);
            $insights[] = "Menangani {$totalTickets} tiket, {$resolvedCount} selesai ({$pct}%) dalam periode ini.";
        }

        if ($resolutionRatePercent !== null && $resolutionRatePercent >= 80) {
            $insights[] = 'Tingkat penyelesaian sangat baik (≥80%).';
        }

        if ($avgResolutionMinutes !== null && $avgResolutionMinutes > 0 && $avgResolutionMinutes < 24 * 60) {
            $insights[] = 'Rata-rata waktu selesai di bawah 24 jam.';
        }

        if ($totalTickets >= 10) {
            $insights[] = "Throughput baik: {$totalTickets} tiket ditutup dalam periode — cocok untuk KPI produktivitas.";
        }

        return $insights;
    }

    /**
     * @param  array<int, array{name: string, count: int}>  $categories
     * @param  array<int, array{name: string, count: int}>  $tags
     * @return array<int, string>
     */
    private function buildRecommendations(int $totalTickets, int $resolvedCount, ?float $avgResolutionMinutes, ?int $resolutionRatePercent, array $categories, array $tags): array
    {
        $recommendations = [];

        if ($totalTickets > 0 && $resolutionRatePercent !== null && $resolutionRatePercent < 70) {
            $recommendations[] = 'Prioritaskan penyelesaian tiket yang belum resolved untuk meningkatkan KPI penyelesaian.';
        }

        $topCategory = collect($categories)->sortByDesc('count')->first();
        if ($topCategory !== null) {
            $recommendations[] = "Kategori terbanyak: \"{$topCategory['name']}\" ({$topCategory['count']} tiket) — area keahlian utama; pertimbangkan dokumentasi atau pelatihan untuk efisiensi.";
        }

        $topTag = collect($tags)->sortByDesc('count')->first();
        if ($topTag !== null) {
            $recommendations[] = "Tag terbanyak: \"{$topTag['name']}\" ({$topTag['count']}) — bisa dijadikan fokus perbaikan atau pengadaan.";
        }

        if ($avgResolutionMinutes !== null && $avgResolutionMinutes > 48 * 60) {
            $recommendations[] = 'Rata-rata waktu selesai di atas 2 hari — pantau beban atau kompleksitas tiket; pertimbangkan delegasi atau eskalisasi.';
        }

        return $recommendations;
    }
}
