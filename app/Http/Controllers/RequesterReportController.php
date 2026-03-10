<?php

namespace App\Http\Controllers;

use App\Models\Pegawai;
use App\Models\Ticket;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RequesterReportController extends Controller
{
    /**
     * Laporan pemohon: siapa yang paling sering membuat tiket,
     * dikelompokkan per unit/departemen (diambil dari tabel pegawai.departemen).
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        if ($user->isPemohon()) {
            abort(403, 'Laporan pemohon hanya untuk admin dan staff.');
        }

        $monthFrom = $request->string('from', now()->subMonths(2)->startOfMonth()->format('Y-m'));
        $monthTo = $request->string('to', now()->format('Y-m'));
        $depFilter = $request->string('dep_id')->toString() ?: null;

        $from = Carbon::parse($monthFrom.'-01')->startOfDay();
        $to = Carbon::parse($monthTo.'-01')->endOfMonth()->endOfDay();

        // Aggregasi hanya dari DB default (tickets + users). Tabel pegawai ada di connection dbsimrs, jadi tidak bisa di-join di sini.
        $requesterRows = Ticket::query()
            ->join('users as requester', 'requester.id', '=', 'tickets.requester_id')
            ->whereBetween('tickets.created_at', [$from, $to])
            ->select(
                'requester.id as requester_id',
                'requester.name as requester_name',
                'requester.simrs_nik',
                DB::raw('COUNT(tickets.id) as total_tickets')
            )
            ->groupBy('requester.id', 'requester.name', 'requester.simrs_nik')
            ->orderByDesc('total_tickets')
            ->limit(200)
            ->get();

        // Ambil departemen dari tabel pegawai (connection dbsimrs) per NIK
        $niks = $requesterRows->pluck('simrs_nik')->filter()->unique()->values()->all();
        $departemenByNik = [];
        if (! empty($niks)) {
            try {
                $departemenByNik = Pegawai::query()
                    ->whereIn('nik', $niks)
                    ->get(['nik', 'departemen'])
                    ->keyBy('nik')
                    ->map(fn ($p) => $p->departemen ?? null)
                    ->all();
            } catch (\Throwable $e) {
                $departemenByNik = [];
            }
        }

        // Gabungkan departemen ke tiap baris; terapkan filter dep_id jika ada
        $rowsWithDep = $requesterRows->map(function ($row) use ($departemenByNik) {
            $dep = $departemenByNik[$row->simrs_nik] ?? null;

            return (object) [
                'requester_id' => $row->requester_id,
                'requester_name' => $row->requester_name,
                'departemen' => $dep,
                'total_tickets' => (int) $row->total_tickets,
            ];
        });

        if ($depFilter) {
            $rowsWithDep = $rowsWithDep->filter(fn ($r) => $r->departemen === $depFilter)->values();
        }

        $topRequesters = $rowsWithDep->take(100)->map(function ($row) {
            return [
                'requester_id' => $row->requester_id,
                'requester_name' => $row->requester_name,
                'departemen' => $row->departemen,
                'total_tickets' => $row->total_tickets,
            ];
        })->values()->all();

        // Agregasi per departemen (dari data yang sudah punya departemen)
        $depGrouped = $rowsWithDep->groupBy(fn ($r) => $r->departemen ?? '(Tanpa departemen)');
        $departements = $depGrouped->map(function ($group, $dep) {
            return [
                'departemen' => $dep,
                'total_tickets' => $group->sum('total_tickets'),
                'total_requesters' => $group->count(),
            ];
        })->values()->sortByDesc('total_tickets')->values()->all();

        // Daftar departemen untuk filter (dari pegawai dbsimrs)
        $departementsForFilter = [];
        try {
            $niksFromUsers = User::query()->whereNotNull('simrs_nik')->pluck('simrs_nik')->all();
            if (! empty($niksFromUsers)) {
                $departementsForFilter = Pegawai::query()
                    ->whereIn('nik', $niksFromUsers)
                    ->whereNotNull('departemen')
                    ->distinct()
                    ->orderBy('departemen')
                    ->pluck('departemen')
                    ->values()
                    ->all();
            }
        } catch (\Throwable $e) {
            $departementsForFilter = [];
        }

        // Top 10 pemohon global
        $globalTop = $rowsWithDep->take(10)->map(function ($row) {
            return [
                'name' => $row->requester_name,
                'departemen' => $row->departemen ?? '(Tanpa departemen)',
                'total_tickets' => $row->total_tickets,
            ];
        })->values()->all();

        return Inertia::render('reports/requesters', [
            'departments' => $departements,
            'topRequesters' => $topRequesters,
            'globalTop' => $globalTop,
            'filters' => [
                'from' => $monthFrom,
                'to' => $monthTo,
                'dep_id' => $depFilter,
            ],
            'departmentsForFilter' => $departementsForFilter,
        ]);
    }
}
