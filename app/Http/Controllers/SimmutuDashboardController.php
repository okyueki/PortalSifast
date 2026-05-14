<?php

namespace App\Http\Controllers;

use App\Models\MutuCategory;
use App\Models\MutuIndicator;
use App\Models\MutuRealisation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SimmutuDashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        abort_unless($user?->canAccessSimmutuModule(), 403);

        $realisationQuery = MutuRealisation::query()
            ->with(['indicator.mutuCategory', 'inputUser'])
            ->latest();

        if (! $user->canManageMutu()) {
            $realisationQuery->where('dep_id', $user->dep_id);
        }

        $recent = $realisationQuery->limit(25)->get()->map(function (MutuRealisation $r): array {
            return [
                'id' => $r->id,
                'period_anchor' => $r->period_anchor,
                'achievement_percent' => $r->achievement_percent !== null ? (float) $r->achievement_percent : null,
                'dep_id' => $r->dep_id,
                'indicator_title' => $r->indicator?->title,
                'category_name' => $r->indicator?->mutuCategory?->name,
                'input_by_name' => $r->inputUser?->name,
                'created_at' => $r->created_at?->toIso8601String(),
            ];
        });

        return Inertia::render('simmutu/dashboard', [
            'counts' => [
                'categories' => MutuCategory::query()->where('is_active', true)->count(),
                'indicators' => MutuIndicator::query()->where('is_active', true)->count(),
            ],
            'recentRealisations' => $recent,
        ]);
    }
}
