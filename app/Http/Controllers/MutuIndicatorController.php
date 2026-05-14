<?php

namespace App\Http\Controllers;

use App\Enums\MutuAnalysisPeriod;
use App\Enums\MutuCollectionFrequency;
use App\Enums\MutuIndicatorKind;
use App\Http\Requests\StoreMutuIndicatorRequest;
use App\Http\Requests\UpdateMutuIndicatorRequest;
use App\Models\Departemen;
use App\Models\MutuCategory;
use App\Models\MutuIndicator;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MutuIndicatorController extends Controller
{
    public function index(Request $request): Response
    {
        $query = MutuIndicator::query()
            ->with(['mutuCategory'])
            ->withCount('indicatorDepartemen')
            ->orderBy('title');

        if ($request->filled('mutu_category_id')) {
            $query->where('mutu_category_id', $request->integer('mutu_category_id'));
        }

        $indicators = $query->paginate(20)->withQueryString();

        return Inertia::render('simmutu/indicators/index', [
            'indicators' => $indicators,
            'categories' => MutuCategory::query()->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'mutu_category_id' => $request->input('mutu_category_id', ''),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('simmutu/indicators/create', $this->formShared());
    }

    public function store(StoreMutuIndicatorRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $depIds = $validated['dep_ids'];
        unset($validated['dep_ids']);

        $indicator = MutuIndicator::query()->create([
            'mutu_category_id' => $validated['mutu_category_id'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'is_active' => (bool) $request->boolean('is_active', true),
            'valid_from' => $validated['valid_from'] ?? null,
            'valid_until' => $validated['valid_until'] ?? null,
            'accountable_user_id' => $validated['accountable_user_id'] ?? null,
            'indicator_kind' => $validated['indicator_kind'],
            'collection_frequency' => $validated['collection_frequency'],
            'numerator_definition' => $validated['numerator_definition'],
            'denominator_definition' => $validated['denominator_definition'],
            'analysis_period' => $validated['analysis_period'],
            'has_mutu_benchmarking' => (bool) $request->boolean('has_mutu_benchmarking'),
            'data_source' => $validated['data_source'] ?? null,
            'target_value' => $validated['target_value'] ?? null,
            'weight_in_category' => $validated['weight_in_category'] ?? 1,
        ]);

        foreach ($depIds as $depId) {
            $indicator->indicatorDepartemen()->create(['dep_id' => $depId]);
        }

        return redirect()->route('simmutu.indicators.index')->with('success', 'Indikator mutu berhasil ditambahkan.');
    }

    public function edit(MutuIndicator $indicator): Response
    {
        $indicator->load(['indicatorDepartemen']);

        return Inertia::render('simmutu/indicators/edit', [
            ...$this->formShared(),
            'indicator' => [
                'id' => $indicator->id,
                'mutu_category_id' => $indicator->mutu_category_id,
                'title' => $indicator->title,
                'description' => $indicator->description,
                'is_active' => $indicator->is_active,
                'valid_from' => $indicator->valid_from?->format('Y-m-d'),
                'valid_until' => $indicator->valid_until?->format('Y-m-d'),
                'accountable_user_id' => $indicator->accountable_user_id,
                'indicator_kind' => $indicator->indicator_kind->value,
                'collection_frequency' => $indicator->collection_frequency->value,
                'numerator_definition' => $indicator->numerator_definition,
                'denominator_definition' => $indicator->denominator_definition,
                'analysis_period' => $indicator->analysis_period->value,
                'has_mutu_benchmarking' => $indicator->has_mutu_benchmarking,
                'data_source' => $indicator->data_source,
                'target_value' => $indicator->target_value !== null ? (string) $indicator->target_value : '',
                'weight_in_category' => (string) $indicator->weight_in_category,
                'dep_ids' => $indicator->indicatorDepartemen->pluck('dep_id')->all(),
            ],
        ]);
    }

    public function update(UpdateMutuIndicatorRequest $request, MutuIndicator $indicator): RedirectResponse
    {
        $validated = $request->validated();
        $depIds = $validated['dep_ids'];
        unset($validated['dep_ids']);

        $indicator->update([
            'mutu_category_id' => $validated['mutu_category_id'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'is_active' => (bool) $request->boolean('is_active', true),
            'valid_from' => $validated['valid_from'] ?? null,
            'valid_until' => $validated['valid_until'] ?? null,
            'accountable_user_id' => $validated['accountable_user_id'] ?? null,
            'indicator_kind' => $validated['indicator_kind'],
            'collection_frequency' => $validated['collection_frequency'],
            'numerator_definition' => $validated['numerator_definition'],
            'denominator_definition' => $validated['denominator_definition'],
            'analysis_period' => $validated['analysis_period'],
            'has_mutu_benchmarking' => (bool) $request->boolean('has_mutu_benchmarking'),
            'data_source' => $validated['data_source'] ?? null,
            'target_value' => $validated['target_value'] ?? null,
            'weight_in_category' => $validated['weight_in_category'] ?? 1,
        ]);

        $indicator->indicatorDepartemen()->delete();
        foreach ($depIds as $depId) {
            $indicator->indicatorDepartemen()->create(['dep_id' => $depId]);
        }

        return redirect()->route('simmutu.indicators.index')->with('success', 'Indikator mutu berhasil diperbarui.');
    }

    public function destroy(MutuIndicator $indicator): RedirectResponse
    {
        $indicator->delete();

        return redirect()->route('simmutu.indicators.index')->with('success', 'Indikator mutu berhasil dihapus.');
    }

    /**
     * @return array<string, mixed>
     */
    private function formShared(): array
    {
        try {
            $departments = Departemen::query()->orderBy('nama')->get(['dep_id', 'nama']);
        } catch (\Throwable) {
            $departments = collect([
                ['dep_id' => 'IT', 'nama' => 'IT'],
                ['dep_id' => 'IPS', 'nama' => 'IPS'],
            ]);
        }

        $indicatorKindLabels = [
            MutuIndicatorKind::Input->value => 'Input (struktur)',
            MutuIndicatorKind::Process->value => 'Proses',
            MutuIndicatorKind::Outcome->value => 'Outcome',
            MutuIndicatorKind::OutcomeAndProcess->value => 'Outcome & proses',
        ];
        $frequencyLabels = [
            MutuCollectionFrequency::Harian->value => 'Harian',
            MutuCollectionFrequency::Mingguan->value => 'Mingguan',
            MutuCollectionFrequency::Bulanan->value => 'Bulanan',
            MutuCollectionFrequency::Tahunan->value => 'Tahunan',
        ];
        $analysisLabels = [
            MutuAnalysisPeriod::Monthly->value => 'Bulanan',
            MutuAnalysisPeriod::Quarterly->value => 'Triwulan',
            MutuAnalysisPeriod::Yearly->value => 'Tahunan',
        ];

        return [
            'categories' => MutuCategory::query()->orderBy('name')->get(['id', 'name']),
            'departments' => $departments,
            'accountableUsers' => User::query()
                ->orderBy('name')
                ->limit(400)
                ->get(['id', 'name', 'email']),
            'indicatorKindOptions' => collect(MutuIndicatorKind::cases())
                ->map(fn (MutuIndicatorKind $k): array => [
                    'value' => $k->value,
                    'label' => $indicatorKindLabels[$k->value] ?? $k->name,
                ])
                ->values()
                ->all(),
            'collectionFrequencyOptions' => collect(MutuCollectionFrequency::cases())
                ->map(fn (MutuCollectionFrequency $f): array => [
                    'value' => $f->value,
                    'label' => $frequencyLabels[$f->value] ?? $f->name,
                ])
                ->values()
                ->all(),
            'analysisPeriodOptions' => collect(MutuAnalysisPeriod::cases())
                ->map(fn (MutuAnalysisPeriod $a): array => [
                    'value' => $a->value,
                    'label' => $analysisLabels[$a->value] ?? $a->name,
                ])
                ->values()
                ->all(),
        ];
    }
}
