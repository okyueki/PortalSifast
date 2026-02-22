<?php

namespace App\Services;

class HaversineService
{
    /**
     * Earth radius in meters.
     */
    private const EARTH_RADIUS_METERS = 6_371_000;

    /**
     * Hitung jarak antara dua koordinat (meter) menggunakan formula Haversine.
     */
    public static function distanceMeters(float $lat1, float $lon1, float $lat2, float $lon2): int
    {
        $lat1Rad = deg2rad($lat1);
        $lat2Rad = deg2rad($lat2);
        $deltaLat = deg2rad($lat2 - $lat1);
        $deltaLon = deg2rad($lon2 - $lon1);

        $a = sin($deltaLat / 2) ** 2
            + cos($lat1Rad) * cos($lat2Rad) * sin($deltaLon / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return (int) round(self::EARTH_RADIUS_METERS * $c);
    }

    /**
     * Perkiraan ETA (menit) dari jarak dan kecepatan (km/jam). Default speed 40 km/jam jika tidak diberikan.
     */
    public static function etaMinutes(int $distanceMeters, ?float $speedKmh = null): int
    {
        $speedKmh = $speedKmh > 0 ? $speedKmh : 40;
        $distanceKm = $distanceMeters / 1000;
        $hours = $distanceKm / $speedKmh;

        return (int) max(1, round($hours * 60));
    }
}
