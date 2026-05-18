<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmergencyReport;
use App\Models\OfficerLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmergencyDashboardController extends Controller
{
    /**
     * Get dashboard data for Command Center:
     * - All active reports (pending, responded, in_progress, arrived)
     * - Real-time statistics
     * - Active officers with locations
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorizeOperator($request);

        // Get active reports (not resolved, not cancelled)
        $activeStatuses = [
            EmergencyReport::STATUS_PENDING,
            EmergencyReport::STATUS_RESPONDED,
            EmergencyReport::STATUS_IN_PROGRESS,
            EmergencyReport::STATUS_ARRIVED,
        ];

        $reports = EmergencyReport::query()
            ->with(['user', 'assignedOperator', 'officerLocations' => function ($query) {
                $query->latest()->limit(1);
            }])
            ->whereIn('status', $activeStatuses)
            ->orderByRaw("CASE status WHEN 'pending' THEN 0 WHEN 'responded' THEN 1 WHEN 'in_progress' THEN 2 WHEN 'arrived' THEN 3 ELSE 4 END")
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn (EmergencyReport $r) => $this->formatReportForDashboard($r));

        // Get active officers (those with recent location updates in last 5 minutes)
        $activeOfficers = $this->getActiveOfficers();

        // Get statistics
        $stats = $this->getStats($activeStatuses);

        return response()->json([
            'success' => true,
            'data' => [
                'reports' => $reports,
                'active_officers' => $activeOfficers,
                'stats' => $stats,
            ],
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get real-time statistics only.
     */
    public function stats(Request $request): JsonResponse
    {
        $this->authorizeOperator($request);

        $activeStatuses = [
            EmergencyReport::STATUS_PENDING,
            EmergencyReport::STATUS_RESPONDED,
            EmergencyReport::STATUS_IN_PROGRESS,
            EmergencyReport::STATUS_ARRIVED,
        ];

        return response()->json([
            'success' => true,
            'data' => $this->getStats($activeStatuses),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get all active officers with their current locations.
     */
    public function activeOfficers(Request $request): JsonResponse
    {
        $this->authorizeOperator($request);

        $activeOfficers = $this->getActiveOfficers();

        return response()->json([
            'success' => true,
            'data' => $activeOfficers,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get active officers with location.
     *
     * @return array<int, array<string, mixed>>
     */
    private function getActiveOfficers(): array
    {
        // Get officers who have reported location in the last 5 minutes
        $fiveMinutesAgo = now()->subMinutes(5);

        $officerIds = OfficerLocation::query()
            ->where('updated_at', '>=', $fiveMinutesAgo)
            ->distinct()
            ->pluck('officer_id')
            ->toArray();

        $activeOfficers = [];
        foreach ($officerIds as $officerId) {
            $latestLocation = OfficerLocation::query()
                ->where('officer_id', $officerId)
                ->latest()
                ->first();

            if ($latestLocation) {
                $activeOfficers[] = [
                    'officer_id' => $latestLocation->officer_id,
                    'officer_name' => $latestLocation->officer?->name,
                    'officer_phone' => $latestLocation->officer?->phone,
                    'report_id' => $latestLocation->emergencyReport?->report_id,
                    'latitude' => (float) $latestLocation->latitude,
                    'longitude' => (float) $latestLocation->longitude,
                    'speed_kmh' => $latestLocation->speed_kmh,
                    'eta_minutes' => $latestLocation->eta_minutes,
                    'distance_meters' => $latestLocation->distance_meters,
                    'updated_at' => $latestLocation->updated_at->toIso8601String(),
                ];
            }
        }

        return $activeOfficers;
    }

    /**
     * Get statistics for dashboard.
     *
     * @param array<string> $activeStatuses
     * @return array<string, mixed>
     */
    private function getStats(array $activeStatuses): array
    {
        // Total active reports by status
        $statusCounts = EmergencyReport::query()
            ->select('status', DB::raw('count(*) as count'))
            ->whereIn('status', $activeStatuses)
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // Reports waiting more than 5 minutes
        $longWaiting = EmergencyReport::query()
            ->where('status', EmergencyReport::STATUS_PENDING)
            ->where('created_at', '<=', now()->subMinutes(5))
            ->count();

        // Average response time (in minutes)
        $avgResponseTime = EmergencyReport::query()
            ->whereNotNull('responded_at')
            ->whereNotNull('created_at')
            ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, created_at, responded_at)) as avg_minutes')
            ->value('avg_minutes');

        // Today's reports count
        $todayCount = EmergencyReport::query()
            ->whereDate('created_at', today())
            ->count();

        // Today resolved count
        $todayResolved = EmergencyReport::query()
            ->whereDate('resolved_at', today())
            ->count();

        // Active officers count
        $fiveMinutesAgo = now()->subMinutes(5);
        $activeOfficersCount = OfficerLocation::query()
            ->where('updated_at', '>=', $fiveMinutesAgo)
            ->distinct()
            ->count('officer_id');

        return [
            'by_status' => [
                'pending' => $statusCounts[EmergencyReport::STATUS_PENDING] ?? 0,
                'responded' => $statusCounts[EmergencyReport::STATUS_RESPONDED] ?? 0,
                'in_progress' => $statusCounts[EmergencyReport::STATUS_IN_PROGRESS] ?? 0,
                'arrived' => $statusCounts[EmergencyReport::STATUS_ARRIVED] ?? 0,
            ],
            'total_active' => array_sum($statusCounts),
            'long_waiting' => $longWaiting,
            'avg_response_time_minutes' => round($avgResponseTime ?? 0, 1),
            'today' => [
                'total' => $todayCount,
                'resolved' => $todayResolved,
            ],
            'active_officers' => $activeOfficersCount,
        ];
    }

    /**
     * Format report for dashboard display.
     *
     * @return array<string, mixed>
     */
    private function formatReportForDashboard(EmergencyReport $r): array
    {
        $latestLocation = $r->officerLocations->first();
        $operator = $r->assignedOperator;

        return [
            'report_id' => $r->report_id,
            'status' => $r->status,
            'category' => $r->category,
            'latitude' => (float) $r->latitude,
            'longitude' => (float) $r->longitude,
            'address' => $r->address,
            'sender_name' => $r->sender_name,
            'sender_phone' => $r->sender_phone,
            'notes' => $r->notes,
            'created_at' => $r->created_at->toIso8601String(),
            'waiting_minutes' => $r->created_at->diffInMinutes(now()),
            'operator' => $operator ? [
                'id' => $operator->id,
                'name' => $operator->name,
                'phone' => $operator->phone,
            ] : null,
            'officer_location' => $latestLocation ? [
                'latitude' => (float) $latestLocation->latitude,
                'longitude' => (float) $latestLocation->longitude,
                'eta_minutes' => $latestLocation->eta_minutes,
                'distance_meters' => $latestLocation->distance_meters,
                'speed_kmh' => $latestLocation->speed_kmh,
                'updated_at' => $latestLocation->updated_at->toIso8601String(),
            ] : null,
        ];
    }

    private function authorizeOperator(Request $request): void
    {
        $user = $request->user();
        if (! $user->isAdmin() && ! $user->isStaff()) {
            abort(403, 'Hanya operator/admin yang dapat mengakses.');
        }
    }
}