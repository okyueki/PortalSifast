<?php

namespace App\Support;

use Carbon\CarbonInterface;

final class TicketResolutionDuration
{
    /**
     * Durasi dari pembuatan tiket sampai penutupan (closed_at), dalam teks bahasa Indonesia.
     */
    public static function format(?CarbonInterface $createdAt, ?CarbonInterface $closedAt): ?string
    {
        if ($createdAt === null || $closedAt === null) {
            return null;
        }

        $totalMinutes = $createdAt->diffInMinutes($closedAt, false);
        if ($totalMinutes < 0) {
            return null;
        }

        if ($totalMinutes < 1) {
            return '< 1 menit';
        }

        $days = intdiv($totalMinutes, 24 * 60);
        $remainder = $totalMinutes - ($days * 24 * 60);
        $hours = intdiv($remainder, 60);
        $minutes = $remainder % 60;

        $parts = [];
        if ($days > 0) {
            $parts[] = $days.' hari';
        }
        if ($hours > 0) {
            $parts[] = $hours.' jam';
        }
        if ($minutes > 0 && $days === 0) {
            $parts[] = $minutes.' menit';
        }
        if ($parts === []) {
            $parts[] = $minutes.' menit';
        }

        return implode(' ', $parts);
    }
}
