<?php

namespace App\Http\Controllers;

use App\Enums\MutuCollectionFrequency;
use App\Http\Requests\StoreMutuRealisationRequest;
use App\Models\MutuIndicator;
use App\Models\MutuRealisation;
use App\Models\User;
use Carbon\CarbonImmutable;
use Carbon\CarbonPeriod;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class MutuRealisationController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user?->canAccessSimmutuModule(), 403);

        $base = MutuRealisation::query();
        $this->applyRealisationIndexFilters($base, $request, $user);

        $avg = (clone $base)->whereNotNull('achievement_percent')->avg('achievement_percent');
        $uniqueIndicators = (clone $base)->distinct()->count('mutu_indicator_id');

        $realisations = (clone $base)
            ->with(['indicator.mutuCategory', 'inputUser'])
            ->latest()
            ->paginate(25)
            ->withQueryString();

        $indicatorQuery = MutuIndicator::query()->where('is_active', true)->orderBy('title');
        if (! $user->canManageMutu()) {
            $indicatorQuery->whereHas('indicatorDepartemen', function ($q) use ($user): void {
                $q->where('dep_id', $user->dep_id);
            });
        }
        $indicatorOptions = $indicatorQuery->get(['id', 'title']);
        $depOptions = MutuRealisation::query()
            ->when(! $user->canManageMutu(), fn ($q) => $q->where('dep_id', $user->dep_id))
            ->distinct()
            ->orderBy('dep_id')
            ->pluck('dep_id')
            ->values();

        return Inertia::render('simmutu/realisations/index', [
            'realisations' => $realisations,
            'indicatorOptions' => $indicatorOptions,
            'depOptions' => $depOptions,
            'recapStats' => [
                'total_entries' => $realisations->total(),
                'avg_achievement_percent' => $avg !== null ? round((float) $avg, 2) : null,
                'unique_indicator_count' => $uniqueIndicators,
            ],
            'filters' => [
                'mutu_indicator_id' => $request->input('mutu_indicator_id', ''),
                'dep_id' => $request->input('dep_id', ''),
                'month' => $request->input('month', ''),
                'period_anchor' => $request->input('period_anchor', ''),
            ],
        ]);
    }

    /**
     * @param  Builder<MutuRealisation>  $query
     */
    private function applyRealisationIndexFilters(Builder $query, Request $request, User $user): void
    {
        if ($request->filled('mutu_indicator_id')) {
            $query->where('mutu_indicator_id', $request->integer('mutu_indicator_id'));
        }
        if ($request->filled('dep_id')) {
            $query->where('dep_id', $request->string('dep_id')->toString());
        }
        if ($request->filled('month')) {
            $month = $request->string('month')->toString();
            if (preg_match('/^\d{4}-\d{2}$/', $month)) {
                $query->where('period_anchor', 'like', '%'.$month.'%');
            }
        }
        if ($request->filled('period_anchor')) {
            $query->where('period_anchor', 'like', '%'.$request->string('period_anchor')->toString().'%');
        }

        if (! $user->canManageMutu()) {
            $query->where('dep_id', $user->dep_id);
        }
    }

    public function create(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user?->canRecordMutuRealisation(), 403);
        $selectedMonth = $request->string('month')->toString();
        if (! preg_match('/^\d{4}-\d{2}$/', $selectedMonth)) {
            $selectedMonth = now()->format('Y-m');
        }
        $monthStart = CarbonImmutable::createFromFormat('Y-m', $selectedMonth)->startOfMonth();
        $monthEnd = $monthStart->endOfMonth();

        $indicatorQuery = MutuIndicator::query()
            ->with(['mutuCategory', 'indicatorDepartemen'])
            ->where('is_active', true)
            ->orderBy('title');

        if (! $user->canManageMutu()) {
            $indicatorQuery->whereHas('indicatorDepartemen', function ($q) use ($user): void {
                $q->where('dep_id', $user->dep_id);
            });
        }

        $indicators = $indicatorQuery->get()->map(function (MutuIndicator $i): array {
            return [
                'id' => $i->id,
                'title' => $i->title,
                'category_name' => $i->mutuCategory?->name,
                'description' => $i->description,
                'collection_frequency' => $i->collection_frequency->value,
                'collection_frequency_label' => match ($i->collection_frequency) {
                    MutuCollectionFrequency::Harian => 'Harian',
                    MutuCollectionFrequency::Mingguan => 'Mingguan',
                    MutuCollectionFrequency::Bulanan => 'Bulanan',
                    MutuCollectionFrequency::Tahunan => 'Tahunan',
                },
                'numerator_definition' => $i->numerator_definition,
                'denominator_definition' => $i->denominator_definition,
                'dep_ids' => $i->indicatorDepartemen->pluck('dep_id')->all(),
            ];
        });

        $dailyRowsQuery = MutuRealisation::query()
            ->select(['mutu_indicator_id', 'dep_id', 'period_anchor', 'achievement_percent'])
            ->where('collection_frequency', MutuCollectionFrequency::Harian->value)
            ->where('period_anchor', 'like', 'D:'.$selectedMonth.'-%');
        if ($user->dep_id) {
            $dailyRowsQuery->where('dep_id', $user->dep_id);
        }
        $dailyRows = $dailyRowsQuery->get()->map(function (MutuRealisation $r): array {
            $date = str_replace('D:', '', $r->period_anchor);

            return [
                'mutu_indicator_id' => $r->mutu_indicator_id,
                'dep_id' => $r->dep_id,
                'date' => $date,
                'day' => (int) CarbonImmutable::parse($date)->format('d'),
                'achievement_percent' => $r->achievement_percent !== null ? (float) $r->achievement_percent : null,
            ];
        })->values();

        $calendarDays = collect(CarbonPeriod::create($monthStart, $monthEnd))
            ->map(fn ($day): array => [
                'date' => $day->format('Y-m-d'),
                'day' => (int) $day->format('d'),
            ])
            ->values();

        return Inertia::render('simmutu/realisations/create', [
            'indicators' => $indicators,
            'userDepId' => $user->dep_id,
            'selectedMonth' => $selectedMonth,
            'calendarDays' => $calendarDays,
            'dailyRows' => $dailyRows,
        ]);
    }

    public function store(StoreMutuRealisationRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $indicator = MutuIndicator::query()
            ->with('indicatorDepartemen')
            ->where('is_active', true)
            ->findOrFail($validated['mutu_indicator_id']);

        $allowedDeps = $indicator->indicatorDepartemen->pluck('dep_id')->all();

        if (! in_array($validated['dep_id'], $allowedDeps, true)) {
            throw ValidationException::withMessages([
                'dep_id' => 'Departemen tidak termasuk pemetaan indikator ini.',
            ]);
        }

        if (! $request->user()->canManageMutu() && (string) $request->user()->dep_id !== $validated['dep_id']) {
            throw ValidationException::withMessages([
                'dep_id' => 'Anda hanya dapat menginput untuk departemen Anda.',
            ]);
        }

        $periodDate = CarbonImmutable::parse($validated['period_date']);
        $periodAnchor = match ($indicator->collection_frequency) {
            MutuCollectionFrequency::Harian => 'D:'.$periodDate->format('Y-m-d'),
            MutuCollectionFrequency::Mingguan => 'W:'.$periodDate->format('o-\\WW'),
            MutuCollectionFrequency::Bulanan => 'M:'.$periodDate->format('Y-m'),
            MutuCollectionFrequency::Tahunan => 'Y:'.$periodDate->format('Y'),
        };

        MutuRealisation::query()->create([
            'mutu_indicator_id' => $indicator->id,
            'dep_id' => $validated['dep_id'],
            'collection_frequency' => $indicator->collection_frequency,
            'period_anchor' => $periodAnchor,
            'numerator_value' => $validated['numerator_value'],
            'denominator_value' => $validated['denominator_value'],
            'input_by' => $request->user()->id,
            'source' => 'manual',
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->route('simmutu.realisations.index')->with('success', 'Data realisasi berhasil disimpan dan tercatat di rekap mutu.');
    }
}
