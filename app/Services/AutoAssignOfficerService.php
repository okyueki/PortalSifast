<?php

namespace App\Services;

use App\Models\EmergencyReport;
use App\Models\OfficerLocation;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class AutoAssignOfficerService
{
    /**
     * Auto-assign laporan darurat ke petugas terdekat yang online.
     */
    public function assignNearestOfficer(EmergencyReport $report): ?User
    {
        // Cari petugas yang online (update lokasi < 5 menit)
        $fiveMinutesAgo = now()->subMinutes(5);

        // Get officer IDs yang sedang online
        $onlineOfficerIds = OfficerLocation::query()
            ->where('updated_at', '>=', $fiveMinutesAgo)
            ->distinct()
            ->pluck('officer_id')
            ->toArray();

        if (empty($onlineOfficerIds)) {
            Log::info('AutoAssign: No online officers found');
            return null;
        }

        // Get latest location untuk setiap officer
        $officerLocations = [];
        foreach ($onlineOfficerIds as $officerId) {
            $latest = OfficerLocation::query()
                ->where('officer_id', $officerId)
                ->latest()
                ->first();

            if ($latest) {
                $distance = HaversineService::distanceMeters(
                    (float) $latest->latitude,
                    (float) $latest->longitude,
                    (float) $report->latitude,
                    (float) $report->longitude
                );
                $officerLocations[$officerId] = [
                    'location' => $latest,
                    'distance' => $distance,
                ];
            }
        }

        if (empty($officerLocations)) {
            return null;
        }

        // Sort by distance (terdekat)
        uasort($officerLocations, fn ($a, $b) => $a['distance'] <=> $b['distance']);

        // Ambil officer terdekat
        $nearestOfficerId = array_key_first($officerLocations);
        $nearestOfficer = User::find($nearestOfficerId);

        if (! $nearestOfficer) {
            return null;
        }

        // Assign ke laporan
        $report->update([
            'assigned_operator_id' => $nearestOfficer->id,
            'responded_at' => now(),
        ]);

        Log::info('AutoAssign: Assigned report to officer', [
            'report_id' => $report->report_id,
            'officer_id' => $nearestOfficer->id,
            'officer_name' => $nearestOfficer->name,
            'distance_meters' => $officerLocations[$nearestOfficerId]['distance'],
        ]);

        return $nearestOfficer;
    }

    /**
     * Get list petugas terdekat untuk ditampilkan.
     */
    public function getNearestOfficers(float $latitude, float $longitude, int $limit = 5): array
    {
        $fiveMinutesAgo = now()->subMinutes(5);

        $officerIds = OfficerLocation::query()
            ->where('updated_at', '>=', $fiveMinutesAgo)
            ->distinct()
            ->pluck('officer_id')
            ->toArray();

        $officers = [];
        foreach ($officerIds as $officerId) {
            $latest = OfficerLocation::query()
                ->where('officer_id', $officerId)
                ->latest()
                ->first();

            if ($latest) {
                $distance = HaversineService::distanceMeters(
                    (float) $latest->latitude,
                    (float) $latest->longitude,
                    $latitude,
                    $longitude
                );
                $officer = User::find($officerId);
                if ($officer) {
                    $officers[] = [
                        'officer' => $officer,
                        'latitude' => (float) $latest->latitude,
                        'longitude' => (float) $latest->longitude,
                        'distance_meters' => $distance,
                        'eta_minutes' => HaversineService::etaMinutes($distance),
                    ];
                }
            }
        }

        // Sort by distance
        usort($officers, fn ($a, $b) => $a['distance_meters'] <=> $b['distance_meters']);

        return array_slice($officers, 0, $limit);
    }
}