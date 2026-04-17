<?php

namespace App\Support;

use App\Models\EmployeeSalary;

/**
 * Perhitungan angka pada slip gaji — **selaraskan** dengan
 * `resources/js/pages/payroll/print.tsx` (variabel `bersih`).
 *
 * Jika menambah/mengubah key komponen, update juga `payroll-components.ts`.
 */
final class PayrollSlipMath
{
    /**
     * @var list<string>
     */
    public const PENDAPATAN_KEYS = [
        'gaji_pokok',
        'keluarga',
        'fungsional',
        'struktural',
        'operasional',
        'transport_spj',
        'jm_dokter',
        'lain_lain',
        'lembur',
        'on_call',
        'jkn_desember_2025',
        'umum_januari_2025',
        'jkn_susulan_1',
        'jkn_susulan_2',
    ];

    /**
     * @var list<string>
     */
    public const POTONGAN_KEYS = [
        'zakat',
        'pajak',
        'jkk_pot',
        'jkm_pot',
        'jht_pot',
        'jp_pot',
        'bpjs_kes_pot_1',
        'bpjs_kes_pot_2',
        'bpjs_kes_tdk_dtg',
        'matan',
        'lazismu',
        'obat2an_pot',
        'hutang_bpjs',
        'hutang_seragam',
        'ikkm',
        'lain_lain',
    ];

    /**
     * Gaji bersih yang sama dengan tampilan slip (print): prioritas pembulatan → penerimaan → selisih total komponen.
     */
    public static function resolveGajiBersih(EmployeeSalary $salary): float
    {
        $fromPembulatan = self::parseMoneyValue($salary->pembulatan);
        if ($fromPembulatan !== null) {
            return $fromPembulatan;
        }

        $fromPenerimaan = self::parseMoneyValue($salary->penerimaan);
        if ($fromPenerimaan !== null) {
            return $fromPenerimaan;
        }

        $raw = $salary->raw_row ?? [];
        if (! is_array($raw)) {
            return 0.0;
        }

        $pendapatan = self::sumKeys($raw, self::PENDAPATAN_KEYS);
        $potongan = self::sumKeys($raw, self::POTONGAN_KEYS);

        return $pendapatan - $potongan;
    }

    public static function parseMoneyValue(mixed $value): ?float
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim((string) $value);
        if ($trimmed === '' || $trimmed === '-' || $trimmed === '–') {
            return null;
        }

        $noRp = str_ireplace('rp', '', $trimmed);
        $noRp = preg_replace('/\s+/', '', $noRp) ?? $trimmed;

        if (preg_match('/^-?\d{1,3}(\.\d{3})+$/', $noRp) === 1) {
            $digits = str_replace('.', '', $noRp);
            $n = (float) $digits;

            return self::finiteOrNull($n);
        }

        $cleaned = preg_replace('/[^0-9,.\-]/', '', $noRp) ?? '';
        $normalized = str_replace(',', '.', $cleaned);
        $n = (float) $normalized;

        return self::finiteOrNull($n);
    }

    /**
     * @param  array<string, mixed>  $raw
     * @param  list<string>  $keys
     */
    private static function sumKeys(array $raw, array $keys): float
    {
        $sum = 0.0;
        foreach ($keys as $key) {
            $parsed = self::parseMoneyValue($raw[$key] ?? null);
            $sum += $parsed ?? 0.0;
        }

        return $sum;
    }

    private static function finiteOrNull(float $n): ?float
    {
        return is_finite($n) ? $n : null;
    }
}
