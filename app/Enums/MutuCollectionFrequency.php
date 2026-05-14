<?php

namespace App\Enums;

enum MutuCollectionFrequency: string
{
    case Harian = 'harian';
    case Mingguan = 'mingguan';
    case Bulanan = 'bulanan';
    case Tahunan = 'tahunan';

    public function isValidPeriodAnchor(string $anchor): bool
    {
        return match ($this) {
            self::Harian => (bool) preg_match('/^D:\d{4}-\d{2}-\d{2}$/', $anchor),
            self::Mingguan => (bool) preg_match('/^W:\d{4}-W\d{1,2}$/', $anchor),
            self::Bulanan => (bool) preg_match('/^M:\d{4}-\d{2}$/', $anchor),
            self::Tahunan => (bool) preg_match('/^Y:\d{4}$/', $anchor),
        };
    }
}
