<?php

namespace App\Http\Controllers;

use App\Models\MutuRealisation;
use Carbon\CarbonImmutable;
use Carbon\CarbonPeriod;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SimmutuDepartmentRecapController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user?->canAccessSimmutuModule(), 403);

        $month = $request->string('month')->toString();
        if (! preg_match('/^\d{4}-\d{2}$/', $month)) {
            $month = now()->format('Y-m');
        }

        $baseQuery = MutuRealisation::query()
            ->with('indicator')
            ->where(function (Builder $query) use ($month): void {
                $query->where('period_anchor', 'like', 'D:'.$month.'-%')
                    ->orWhere('period_anchor', 'like', 'M:'.$month);
            });

        if (! $user->canManageMutu()) {
            $baseQuery->where('dep_id', $user->dep_id);
        }

        if ($request->filled('dep_id')) {
            $baseQuery->where('dep_id', $request->string('dep_id')->toString());
        }

        if ($request->filled('mutu_indicator_id')) {
            $baseQuery->where('mutu_indicator_id', $request->integer('mutu_indicator_id'));
        }

        $rows = $baseQuery->get();

        $departmentRecaps = $rows
            ->groupBy('dep_id')
            ->map(function ($depRows, $depId): array {
                $achievements = $depRows
                    ->pluck('achievement_percent')
                    ->filter(fn ($v) => $v !== null)
                    ->map(fn ($v) => (float) $v)
                    ->values();

                $avg = $achievements->isNotEmpty() ? round($achievements->avg(), 2) : null;
                $min = $achievements->isNotEmpty() ? round($achievements->min(), 2) : null;
                $max = $achievements->isNotEmpty() ? round($achievements->max(), 2) : null;

                return [
                    'dep_id' => $depId,
                    'entry_count' => $depRows->count(),
                    'indicator_count' => $depRows->pluck('mutu_indicator_id')->unique()->count(),
                    'avg_achievement' => $avg,
                    'min_achievement' => $min,
                    'max_achievement' => $max,
                ];
            })
            ->sortByDesc('avg_achievement')
            ->values();

        $selectedDep = $request->string('chart_dep_id')->toString();
        if ($selectedDep === '') {
            $selectedDep = (string) ($departmentRecaps->first()['dep_id'] ?? $user->dep_id ?? '');
        }

        $monthStart = CarbonImmutable::createFromFormat('Y-m', $month)->startOfMonth();
        $monthEnd = $monthStart->endOfMonth();
        $dailyMap = $rows
            ->filter(fn (MutuRealisation $r) => $r->dep_id === $selectedDep && str_starts_with($r->period_anchor, 'D:'))
            ->groupBy(fn (MutuRealisation $r) => str_replace('D:', '', $r->period_anchor))
            ->map(function ($dateRows) {
                $values = $dateRows
                    ->pluck('achievement_percent')
                    ->filter(fn ($v) => $v !== null)
                    ->map(fn ($v) => (float) $v);

                return $values->isNotEmpty() ? round($values->avg(), 2) : null;
            });

        $dailyTrend = collect(CarbonPeriod::create($monthStart, $monthEnd))
            ->map(function ($day) use ($dailyMap): array {
                $date = $day->format('Y-m-d');

                return [
                    'date' => $date,
                    'day' => (int) $day->format('d'),
                    'avg_achievement' => $dailyMap->get($date),
                ];
            })
            ->values();

        $indicatorOptions = $rows->map(function (MutuRealisation $row): array {
            return [
                'id' => $row->mutu_indicator_id,
                'title' => $row->indicator?->title ?? 'Indikator #'.$row->mutu_indicator_id,
            ];
        })->unique('id')->sortBy('title')->values();

        $depOptions = $rows->pluck('dep_id')->unique()->sort()->values();

        return Inertia::render('simmutu/recap/department', [
            'month' => $month,
            'departmentRecaps' => $departmentRecaps,
            'dailyTrend' => $dailyTrend,
            'selectedDep' => $selectedDep,
            'depOptions' => $depOptions,
            'indicatorOptions' => $indicatorOptions,
            'filters' => [
                'dep_id' => $request->input('dep_id', ''),
                'mutu_indicator_id' => $request->input('mutu_indicator_id', ''),
                'chart_dep_id' => $selectedDep,
            ],
        ]);
    }
}
