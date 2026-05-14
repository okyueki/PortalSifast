<?php

namespace App\Http\Controllers\Api;

use App\Enums\MutuCollectionFrequency;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreMutuRealisationApiRequest;
use App\Models\MutuIndicator;
use App\Models\MutuRealisation;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SimmutuApiController extends Controller
{
    public function indicators(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user?->canAccessSimmutuModule()) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke modul SIMMUTU.',
            ], 403);
        }

        $query = MutuIndicator::query()
            ->with(['mutuCategory', 'indicatorDepartemen'])
            ->where('is_active', true)
            ->orderBy('title');

        if ($request->filled('mutu_category_id')) {
            $query->where('mutu_category_id', $request->integer('mutu_category_id'));
        }

        if (! $user->canManageMutu()) {
            $query->whereHas('indicatorDepartemen', function ($q) use ($user): void {
                $q->where('dep_id', $user->dep_id);
            });
        } elseif ($request->filled('dep_id')) {
            $query->whereHas('indicatorDepartemen', function ($q) use ($request): void {
                $q->where('dep_id', $request->string('dep_id')->toString());
            });
        }

        $data = $query->get()->map(function (MutuIndicator $indicator): array {
            return [
                'id' => $indicator->id,
                'title' => $indicator->title,
                'description' => $indicator->description,
                'category' => [
                    'id' => $indicator->mutuCategory?->id,
                    'name' => $indicator->mutuCategory?->name,
                ],
                'collection_frequency' => $indicator->collection_frequency->value,
                'analysis_period' => $indicator->analysis_period->value,
                'has_mutu_benchmarking' => $indicator->has_mutu_benchmarking,
                'numerator_definition' => $indicator->numerator_definition,
                'denominator_definition' => $indicator->denominator_definition,
                'target_value' => $indicator->target_value !== null ? (float) $indicator->target_value : null,
                'unit_terkait' => $indicator->indicatorDepartemen->pluck('dep_id')->values()->all(),
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user?->canAccessSimmutuModule()) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses ke modul SIMMUTU.',
            ], 403);
        }

        $query = MutuRealisation::query()
            ->with(['indicator.mutuCategory', 'inputUser'])
            ->latest();

        if ($request->filled('month')) {
            $month = $request->string('month')->toString();
            if (! preg_match('/^\d{4}-\d{2}$/', $month)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Format month harus YYYY-MM.',
                ], 422);
            }
            $query->where('period_anchor', 'like', '%'.$month.'%');
        }

        if ($request->filled('dep_id')) {
            $query->where('dep_id', $request->string('dep_id')->toString());
        }

        if ($request->filled('mutu_indicator_id')) {
            $query->where('mutu_indicator_id', $request->integer('mutu_indicator_id'));
        }

        if (! $user->canManageMutu()) {
            $query->where('dep_id', $user->dep_id);
        }

        $perPage = max(1, min($request->integer('per_page', 20), 100));
        $rows = $query->paginate($perPage)->withQueryString();
        $rows->getCollection()->transform(function (MutuRealisation $row): array {
            return [
                'id' => $row->id,
                'dep_id' => $row->dep_id,
                'period_anchor' => $row->period_anchor,
                'collection_frequency' => $row->collection_frequency->value,
                'numerator_value' => (float) $row->numerator_value,
                'denominator_value' => (float) $row->denominator_value,
                'achievement_percent' => $row->achievement_percent !== null ? (float) $row->achievement_percent : null,
                'notes' => $row->notes,
                'created_at' => $row->created_at?->toIso8601String(),
                'indicator' => [
                    'id' => $row->indicator?->id,
                    'title' => $row->indicator?->title,
                    'category' => $row->indicator?->mutuCategory?->name,
                ],
                'input_user' => [
                    'id' => $row->inputUser?->id,
                    'name' => $row->inputUser?->name,
                    'email' => $row->inputUser?->email,
                ],
            ];
        });

        return response()->json($rows);
    }

    public function store(StoreMutuRealisationApiRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = $request->user();

        $indicator = MutuIndicator::query()
            ->with('indicatorDepartemen')
            ->where('is_active', true)
            ->findOrFail($validated['mutu_indicator_id']);

        $allowedDeps = $indicator->indicatorDepartemen->pluck('dep_id')->values()->all();
        $depId = $user->canManageMutu()
            ? (string) ($validated['dep_id'] ?? '')
            : (string) ($user->dep_id ?? '');

        if ($depId === '') {
            return response()->json([
                'success' => false,
                'message' => 'dep_id wajib diisi untuk user pengelola mutu.',
            ], 422);
        }

        if (! in_array($depId, $allowedDeps, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Departemen tidak termasuk unit terkait indikator ini.',
            ], 422);
        }

        $periodDate = CarbonImmutable::parse($validated['period_date']);
        $periodAnchor = match ($indicator->collection_frequency) {
            MutuCollectionFrequency::Harian => 'D:'.$periodDate->format('Y-m-d'),
            MutuCollectionFrequency::Mingguan => 'W:'.$periodDate->format('o-\\WW'),
            MutuCollectionFrequency::Bulanan => 'M:'.$periodDate->format('Y-m'),
            MutuCollectionFrequency::Tahunan => 'Y:'.$periodDate->format('Y'),
        };

        $realisation = MutuRealisation::query()->create([
            'mutu_indicator_id' => $indicator->id,
            'dep_id' => $depId,
            'collection_frequency' => $indicator->collection_frequency,
            'period_anchor' => $periodAnchor,
            'numerator_value' => $validated['numerator_value'],
            'denominator_value' => $validated['denominator_value'],
            'input_by' => $user?->id,
            'source' => 'api',
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Realisasi mutu berhasil disimpan.',
            'data' => [
                'id' => $realisation->id,
                'mutu_indicator_id' => $realisation->mutu_indicator_id,
                'dep_id' => $realisation->dep_id,
                'period_anchor' => $realisation->period_anchor,
                'achievement_percent' => $realisation->achievement_percent !== null ? (float) $realisation->achievement_percent : null,
            ],
        ], 201);
    }
}
