<?php

namespace App\Http\Controllers;

use App\Enums\MutuCollectionFrequency;
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

        $currentMonth = now()->format('Y-m');
        $currentYear = now()->format('Y');

        $realisationQuery = MutuRealisation::query()
            ->with(['indicator.mutuCategory', 'inputUser']);

        if (! $user->canManageMutu()) {
            $realisationQuery->where('dep_id', $user->dep_id);
        }

        // Recent entries (limited)
        $recent = (clone $realisationQuery)
            ->latest()
            ->limit(25)
            ->get()
            ->map(function (MutuRealisation $r): array {
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

        // Period summary (current month)
        $monthQuery = (clone $realisationQuery)->where('period_anchor', 'like', $currentMonth.'-%');
        $periodStats = [
            'total_entries' => (clone $monthQuery)->count(),
            'avg_achievement' => (clone $monthQuery)->whereNotNull('achievement_percent')->avg('achievement_percent'),
        ];

        // Period summary (current year)
        $yearQuery = (clone $realisationQuery)->where('period_anchor', 'like', $currentYear.'-%');
        $yearStats = [
            'total_entries' => (clone $yearQuery)->count(),
            'avg_achievement' => (clone $yearQuery)->whereNotNull('achievement_percent')->avg('achievement_percent'),
        ];

        // My entries this month
        $myEntriesQuery = (clone $realisationQuery)
            ->where('period_anchor', 'like', $currentMonth.'-%')
            ->where('input_by', $user->id);
        $myStats = [
            'total_entries' => $myEntriesQuery->count(),
            'avg_achievement' => (clone $myEntriesQuery)->whereNotNull('achievement_percent')->avg('achievement_percent'),
        ];

        // Unfilled indicators this month (indicators that should have data but don't)
        $activeIndicatorIds = MutuIndicator::query()
            ->where('is_active', true)
            ->when(! $user->canManageMutu(), fn ($q) => $q->whereHas('indicatorDepartemen', fn ($qq) => $qq->where('dep_id', $user->dep_id)))
            ->pluck('id');

        $filledIndicatorIds = (clone $realisationQuery)
            ->where('period_anchor', 'like', $currentMonth.'-%')
            ->distinct()
            ->pluck('mutu_indicator_id');

        $unfilledCount = $activeIndicatorIds->diff($filledIndicatorIds)->count();

        // Low achievement indicators this month (< 80%)
        $lowAchievementQuery = (clone $realisationQuery)
            ->where('period_anchor', 'like', $currentMonth.'-%')
            ->whereNotNull('achievement_percent')
            ->where('achievement_percent', '<', 80);

        if (! $user->canManageMutu()) {
            $lowAchievementQuery->where('dep_id', $user->dep_id);
        }

        $lowAchievement = $lowAchievementQuery
            ->with('indicator:id,title')
            ->get()
            ->groupBy('mutu_indicator_id')
            ->map(fn ($group, $indicatorId) => [
                'id' => (int) $indicatorId,
                'title' => $group->first()->indicator?->title ?? 'Unknown',
                'count' => $group->count(),
                'avg_achievement' => round($group->avg('achievement_percent'), 2),
            ])
            ->values()
            ->sortBy('avg_achievement')
            ->take(5)
            ->all();

        return Inertia::render('simmutu/dashboard', [
            'counts' => [
                'categories' => MutuCategory::query()->where('is_active', true)->count(),
                'indicators' => $activeIndicatorIds->count(),
            ],
            'recentRealisations' => $recent,
            'periodSummary' => [
                'month' => [
                    'label' => now()->translatedFormat('F Y'),
                    'total_entries' => $periodStats['total_entries'],
                    'avg_achievement' => $periodStats['avg_achievement'] !== null ? round((float) $periodStats['avg_achievement'], 2) : null,
                ],
                'year' => [
                    'label' => now()->format('Y'),
                    'total_entries' => $yearStats['total_entries'],
                    'avg_achievement' => $yearStats['avg_achievement'] !== null ? round((float) $yearStats['avg_achievement'], 2) : null,
                ],
            ],
            'myStats' => [
                'total_entries' => $myStats['total_entries'],
                'avg_achievement' => $myStats['avg_achievement'] !== null ? round((float) $myStats['avg_achievement'], 2) : null,
            ],
            'insights' => [
                'unfilled_indicators' => $unfilledCount,
                'low_achievement_indicators' => $lowAchievement,
            ],
            'currentMonth' => $currentMonth,
        ]);
    }
}
