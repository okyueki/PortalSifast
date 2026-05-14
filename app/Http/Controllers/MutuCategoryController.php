<?php

namespace App\Http\Controllers;

use App\Enums\MutuCategoryScope;
use App\Enums\MutuObligationProfile;
use App\Http\Requests\StoreMutuCategoryRequest;
use App\Http\Requests\UpdateMutuCategoryRequest;
use App\Models\MutuCategory;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class MutuCategoryController extends Controller
{
    public function index(): Response
    {
        $categories = MutuCategory::query()
            ->withCount('indicators')
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('simmutu/categories/index', [
            'categories' => $categories,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('simmutu/categories/create', $this->categoryFormOptions());
    }

    public function store(StoreMutuCategoryRequest $request): RedirectResponse
    {
        MutuCategory::query()->create([
            'name' => $request->validated('name'),
            'short_name' => $request->validated('short_name'),
            'scope' => $request->validated('scope'),
            'description' => $request->validated('description'),
            'is_general_use' => (bool) $request->boolean('is_general_use'),
            'obligation_profile' => $request->validated('obligation_profile'),
            'is_active' => (bool) $request->boolean('is_active', true),
        ]);

        return redirect()->route('simmutu.categories.index')->with('success', 'Kategori mutu berhasil ditambahkan.');
    }

    public function edit(MutuCategory $category): Response
    {
        return Inertia::render('simmutu/categories/edit', [
            ...$this->categoryFormOptions(),
            'category' => [
                'id' => $category->id,
                'name' => $category->name,
                'short_name' => $category->short_name,
                'scope' => $category->scope->value,
                'description' => $category->description,
                'is_general_use' => $category->is_general_use,
                'obligation_profile' => $category->obligation_profile?->value,
                'is_active' => $category->is_active,
            ],
        ]);
    }

    public function update(UpdateMutuCategoryRequest $request, MutuCategory $category): RedirectResponse
    {
        $category->update([
            'name' => $request->validated('name'),
            'short_name' => $request->validated('short_name'),
            'scope' => $request->validated('scope'),
            'description' => $request->validated('description'),
            'is_general_use' => (bool) $request->boolean('is_general_use'),
            'obligation_profile' => $request->validated('obligation_profile'),
            'is_active' => (bool) $request->boolean('is_active', true),
        ]);

        return redirect()->route('simmutu.categories.index')->with('success', 'Kategori mutu berhasil diperbarui.');
    }

    public function destroy(MutuCategory $category): RedirectResponse
    {
        $category->delete();

        return redirect()->route('simmutu.categories.index')->with('success', 'Kategori mutu berhasil dihapus.');
    }

    /**
     * @return array{scopeOptions: list<array{value: string, label: string}>, obligationOptions: list<array{value: string, label: string}>}
     */
    private function categoryFormOptions(): array
    {
        $scopeLabels = [
            MutuCategoryScope::Internal->value => 'Internal',
            MutuCategoryScope::Nasional->value => 'Nasional',
            MutuCategoryScope::Unit->value => 'Unit',
            MutuCategoryScope::Global->value => 'Global',
        ];
        $obligationLabels = [
            MutuObligationProfile::Inm->value => 'INM',
            MutuObligationProfile::ImpRs->value => 'IMP RS',
            MutuObligationProfile::ImpUnit->value => 'IMP Unit',
            MutuObligationProfile::Ikp->value => 'IKP',
            MutuObligationProfile::Skp->value => 'SKP',
            MutuObligationProfile::Other->value => 'Lainnya',
        ];

        return [
            'scopeOptions' => collect(MutuCategoryScope::cases())
                ->map(fn (MutuCategoryScope $s): array => [
                    'value' => $s->value,
                    'label' => $scopeLabels[$s->value] ?? $s->name,
                ])
                ->values()
                ->all(),
            'obligationOptions' => collect(MutuObligationProfile::cases())
                ->map(fn (MutuObligationProfile $o): array => [
                    'value' => $o->value,
                    'label' => $obligationLabels[$o->value] ?? $o->name,
                ])
                ->values()
                ->all(),
        ];
    }
}
