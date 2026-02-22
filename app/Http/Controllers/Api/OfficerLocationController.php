<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UpdateOfficerLocationRequest;
use App\Models\EmergencyReport;
use App\Models\OfficerLocation;
use App\Services\HaversineService;
use Illuminate\Http\JsonResponse;

class OfficerLocationController extends Controller
{
    /**
     * Update lokasi GPS petugas (dipanggil tiap ~5 detik saat menuju lokasi).
     */
    public function store(UpdateOfficerLocationRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $officer = $request->user();

        $report = EmergencyReport::where('report_id', $validated['report_id'])->first();
        if (! $report) {
            return response()->json([
                'success' => false,
                'message' => 'Laporan tidak ditemukan.',
            ], 404);
        }

        if ($report->assigned_operator_id !== $officer->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda bukan petugas yang ditugaskan untuk laporan ini.',
            ], 403);
        }

        $distanceMeters = HaversineService::distanceMeters(
            (float) $validated['latitude'],
            (float) $validated['longitude'],
            (float) $report->latitude,
            (float) $report->longitude
        );
        $speedKmh = isset($validated['speed_kmh']) && $validated['speed_kmh'] > 0
            ? (float) $validated['speed_kmh']
            : null;
        $etaMinutes = HaversineService::etaMinutes($distanceMeters, $speedKmh);

        $location = OfficerLocation::create([
            'officer_id' => $officer->id,
            'emergency_report_id' => $report->id,
            'latitude' => $validated['latitude'],
            'longitude' => $validated['longitude'],
            'speed_kmh' => $validated['speed_kmh'] ?? null,
            'heading' => $validated['heading'] ?? null,
            'eta_minutes' => $etaMinutes,
            'distance_meters' => $distanceMeters,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'officer_id' => $officer->id,
                'distance_to_target_meters' => $distanceMeters,
                'eta_minutes' => $etaMinutes,
            ],
        ]);
    }
}
