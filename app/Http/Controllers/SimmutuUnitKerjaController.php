<?php

namespace App\Http\Controllers;

use App\Enums\MutuCollectionFrequency;
use App\Models\Departemen;
use App\Models\MutuCategory;
use App\Models\MutuIndicator;
use App\Models\MutuIndicatorDepartemen;
use App\Models\MutuRealisation;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SimmutuUnitKerjaController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user?->canAccessSimmutuModule(), 403);

        $depQuery = Departemen::query()->orderBy('nama');
        if (! $user->canManageMutu()) {
            if (! $user->dep_id) {
                return Inertia::render('simmutu/unit-kerja/index', [
                    'units' => [],
                    'summary' => [
                        'units_shown' => 0,
                        'entries_total' => 0,
                        'indicators_mapped_distinct' => 0,
                    ],
                    'restricted' => true,
                ]);
            }
            $depQuery->where('dep_id', $user->dep_id);
        }

        $departments = $depQuery->get(['dep_id', 'nama']);

        $agg = MutuIndicatorDepartemen::query()
            ->join('mutu_indicators', 'mutu_indicators.id', '=', 'mutu_indicator_departemen.mutu_indicator_id')
            ->selectRaw('mutu_indicator_departemen.dep_id as dep_id')
            ->selectRaw('COUNT(DISTINCT mutu_indicators.id) as indicators_total')
            ->selectRaw('COUNT(DISTINCT CASE WHEN mutu_indicators.is_active = 1 THEN mutu_indicators.id END) as indicators_active')
            ->selectRaw('COUNT(DISTINCT mutu_indicators.mutu_category_id) as categories_total')
            ->groupBy('mutu_indicator_departemen.dep_id')
            ->get()
            ->keyBy('dep_id');

        $realisationAgg = MutuRealisation::query()
            ->selectRaw('dep_id, COUNT(*) as entries_total')
            ->groupBy('dep_id')
            ->get()
            ->keyBy('dep_id');

        $units = $departments->map(function (Departemen $d) use ($agg, $realisationAgg): array {
            $row = $agg->get($d->dep_id);
            $r = $realisationAgg->get($d->dep_id);

            return [
                'dep_id' => $d->dep_id,
                'nama' => $d->nama,
                'indicators_total' => (int) ($row->indicators_total ?? 0),
                'indicators_active' => (int) ($row->indicators_active ?? 0),
                'categories_total' => (int) ($row->categories_total ?? 0),
                'entries_total' => (int) ($r->entries_total ?? 0),
            ];
        })->values()->all();

        $depIds = collect($units)->pluck('dep_id')->all();
        $entriesTotal = $depIds === []
            ? 0
            : (int) MutuRealisation::query()->whereIn('dep_id', $depIds)->count();

        $indicatorsMappedDistinct = $depIds === []
            ? 0
            : (int) MutuIndicatorDepartemen::query()
                ->whereIn('dep_id', $depIds)
                ->distinct()
                ->count('mutu_indicator_id');

        return Inertia::render('simmutu/unit-kerja/index', [
            'units' => $units,
            'summary' => [
                'units_shown' => count($units),
                'entries_total' => $entriesTotal,
                'indicators_mapped_distinct' => $indicatorsMappedDistinct,
            ],
            'restricted' => ! $user->canManageMutu(),
        ]);
    }

    public function show(Request $request, string $dep): Response
    {
        $user = $request->user();
        abort_unless($user?->canAccessSimmutuModule(), 403);
        $this->ensureDepAccess($user, $dep);

        $dept = Departemen::query()->where('dep_id', $dep)->first();

        $categories = MutuCategory::query()
            ->whereHas('indicators', function ($q) use ($dep): void {
                $q->whereHas('indicatorDepartemen', function ($q2) use ($dep): void {
                    $q2->where('dep_id', $dep);
                });
            })
            ->withCount([
                'indicators as indicators_mapped' => function ($q) use ($dep): void {
                    $q->whereHas('indicatorDepartemen', function ($q2) use ($dep): void {
                        $q2->where('dep_id', $dep);
                    });
                },
                'indicators as indicators_active_mapped' => function ($q) use ($dep): void {
                    $q->where('is_active', true)
                        ->whereHas('indicatorDepartemen', function ($q2) use ($dep): void {
                            $q2->where('dep_id', $dep);
                        });
                },
            ])
            ->orderBy('name')
            ->get()
            ->map(fn (MutuCategory $c): array => [
                'id' => $c->id,
                'name' => $c->name,
                'short_name' => $c->short_name,
                'is_active' => $c->is_active,
                'indicators_mapped' => (int) $c->indicators_mapped,
                'indicators_active_mapped' => (int) $c->indicators_active_mapped,
            ])
            ->values()
            ->all();

        $entriesTotal = (int) MutuRealisation::query()->where('dep_id', $dep)->count();

        return Inertia::render('simmutu/unit-kerja/show', [
            'dep' => [
                'dep_id' => $dep,
                'nama' => $dept?->nama ?? $dep,
            ],
            'categories' => $categories,
            'summary' => [
                'categories_count' => count($categories),
                'entries_total' => $entriesTotal,
            ],
        ]);
    }

    public function category(Request $request, string $dep, MutuCategory $category): Response
    {
        $user = $request->user();
        abort_unless($user?->canAccessSimmutuModule(), 403);
        $this->ensureDepAccess($user, $dep);

        $hasForUnit = MutuIndicator::query()
            ->where('mutu_category_id', $category->id)
            ->whereHas('indicatorDepartemen', fn ($q) => $q->where('dep_id', $dep))
            ->exists();

        abort_unless($hasForUnit, 404);

        $indicators = MutuIndicator::query()
            ->where('mutu_category_id', $category->id)
            ->whereHas('indicatorDepartemen', fn ($q) => $q->where('dep_id', $dep))
            ->orderBy('title')
            ->get();

        $ids = $indicators->pluck('id')->all();

        $statsRows = $ids === []
            ? collect()
            : MutuRealisation::query()
                ->where('dep_id', $dep)
                ->whereIn('mutu_indicator_id', $ids)
                ->selectRaw('mutu_indicator_id, COUNT(*) as entries_count, MAX(created_at) as last_entry_at')
                ->groupBy('mutu_indicator_id')
                ->get()
                ->keyBy('mutu_indicator_id');

        $rows = $indicators->map(function (MutuIndicator $i) use ($statsRows): array {
            $s = $statsRows->get($i->id);

            return [
                'id' => $i->id,
                'title' => $i->title,
                'is_active' => $i->is_active,
                'collection_frequency' => $i->collection_frequency->value,
                'collection_frequency_label' => match ($i->collection_frequency) {
                    MutuCollectionFrequency::Harian => 'Harian',
                    MutuCollectionFrequency::Mingguan => 'Mingguan',
                    MutuCollectionFrequency::Bulanan => 'Bulanan',
                    MutuCollectionFrequency::Tahunan => 'Tahunan',
                },
                'target_value' => $i->target_value !== null ? (float) $i->target_value : null,
                'has_mutu_benchmarking' => $i->has_mutu_benchmarking,
                'entries_count' => $s ? (int) $s->entries_count : 0,
                'last_entry_at' => $s?->last_entry_at,
            ];
        })->values()->all();

        $dept = Departemen::query()->where('dep_id', $dep)->first();

        return Inertia::render('simmutu/unit-kerja/category', [
            'dep' => [
                'dep_id' => $dep,
                'nama' => $dept?->nama ?? $dep,
            ],
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'short_name' => $category->short_name,
                'is_active' => $category->is_active,
            ],
            'indicators' => $rows,
            'summary' => [
                'indicators_count' => count($rows),
                'active_count' => collect($rows)->where('is_active', true)->count(),
                'inactive_count' => collect($rows)->where('is_active', false)->count(),
                'entries_total' => (int) collect($rows)->sum('entries_count'),
            ],
        ]);
    }

    private function ensureDepAccess(?User $user, string $dep): void
    {
        if ($user?->canManageMutu()) {
            return;
        }

        if ((string) $user?->dep_id !== $dep) {
            abort(403, 'Anda hanya dapat memantau unit kerja Anda sendiri.');
        }
    }
}
