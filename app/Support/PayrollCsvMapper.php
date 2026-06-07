<?php

namespace App\Support;

/**
 * Pemetaan kolom CSV payroll ke field database employee_salaries.
 * Header CSV dinormalisasi (spasi → underscore, lowercase) di EmployeeSalaryImportService.
 */
final class PayrollCsvMapper
{
    /**
     * @param  array<string, mixed>  $raw
     * @return array<string, mixed>
     */
    public static function mapRawRow(array $raw): array
    {
        $jkk = self::moneyOrNull($raw['jkk'] ?? null);
        $jkm = self::moneyOrNull($raw['jkm'] ?? null);
        $jht = self::moneyOrNull($raw['jht'] ?? null);
        $jp = self::moneyOrNull($raw['jp'] ?? null);

        $jkkK = self::moneyOrNull($raw['jkk_k'] ?? null);
        $jkmK = self::moneyOrNull($raw['jkm_k'] ?? null);
        $jhtK = self::moneyOrNull($raw['jht_k'] ?? null);
        $jpK = self::moneyOrNull($raw['jp_k'] ?? null);

        $tunjBpjsTk = self::moneyOrNull($raw['tunj_bpjs_tk'] ?? null);
        if ($tunjBpjsTk === null && ($jkk || $jkm || $jht || $jp)) {
            $tunjBpjsTk = (string) (($jkk ?? 0) + ($jkm ?? 0) + ($jht ?? 0) + ($jp ?? 0));
        }

        $potBpjsTk = self::moneyOrNull($raw['pot_bpjs_tk'] ?? null);
        if ($potBpjsTk === null && ($jkkK || $jkmK || $jhtK || $jpK)) {
            $potBpjsTk = (string) (($jkkK ?? 0) + ($jkmK ?? 0) + ($jhtK ?? 0) + ($jpK ?? 0));
        }

        [$jkn, $jknLabel] = self::parseJkn($raw);
        [$umum, $umumLabel] = self::parseUmum($raw);

        return [
            'gaji_pokok' => self::moneyOrNull($raw['gaji_pokok'] ?? null),
            'keluarga' => self::moneyOrNull($raw['tunjangan_keluarga'] ?? $raw['keluarga'] ?? null),
            'tunj_masa_kerja' => self::moneyOrNull($raw['tunjangan_masa_kerja'] ?? null),
            'tunj_kehadiran' => self::moneyOrNull($raw['tunjangan_kehadiran'] ?? null),
            'tunj_makan' => self::moneyOrNull($raw['tunjangan_makan_minum'] ?? $raw['tunjangan_makan'] ?? null),
            'fungsional' => self::moneyOrNull($raw['fungsional_profesi'] ?? $raw['fungsional'] ?? null),
            'struktural' => self::moneyOrNull($raw['struktural'] ?? null),
            'operasional' => self::moneyOrNull($raw['operasional'] ?? null),
            'transport_spj' => self::moneyOrNull($raw['transt_spj_komunikasi'] ?? $raw['transport_spj'] ?? null),
            'jm_dokter' => self::moneyOrNull($raw['jm_dokter'] ?? null),
            'lembur' => self::moneyOrNull($raw['lembur'] ?? null),
            'on_call' => self::moneyOrNull($raw['on_call'] ?? null),
            'lain_lain' => self::moneyOrNull($raw['lain2_bonus'] ?? $raw['lain_lain'] ?? null),
            'jkn' => $jkn,
            'jkn_label' => $jknLabel,
            'umum' => $umum,
            'umum_label' => $umumLabel,
            'jkn_susulan' => self::moneyOrNull($raw['jkn_susulan'] ?? null),
            'jkn_susulan_l' => self::moneyOrNull($raw['jkn_susulan_l'] ?? null),
            'jkk' => $jkk,
            'jkm' => $jkm,
            'jht' => $jht,
            'jp' => $jp,
            'tunj_bpjs_tk' => $tunjBpjsTk,
            'bpjs_kes' => self::moneyOrNull($raw['bpjs_kes'] ?? null),
            'jkk_k' => $jkkK,
            'jkm_k' => $jkmK,
            'jht_k' => $jhtK,
            'jp_k' => $jpK,
            'pot_bpjs_tk' => $potBpjsTk,
            'bpjs_kes_k' => self::moneyOrNull($raw['bpjs_kes_k'] ?? null),
            'jht_i' => self::moneyOrNull($raw['jht_i'] ?? null),
            'jp_i' => self::moneyOrNull($raw['jp_i'] ?? null),
            'bpjs_kes_i' => self::moneyOrNull($raw['bpjs_kes_i'] ?? null),
            'bpjs_kes_tidak_ditanggung' => self::moneyOrNull($raw['bpjs_kes_tdk_di_tgg'] ?? $raw['bpjs_kes_tidak_ditanggung'] ?? null),
            'matan' => self::moneyOrNull($raw['matan'] ?? null),
            'lazismu' => self::moneyOrNull($raw['lazismu'] ?? null),
            'obat2an' => self::moneyOrNull($raw['obat2an_r'] ?? $raw['obat2an'] ?? null),
            'hutang_bpjs' => self::moneyOrNull($raw['hutang_bpjs'] ?? null),
            'hutang_seragam' => self::moneyOrNull($raw['hutang_seragam'] ?? null),
            'ikkm' => self::moneyOrNull($raw['ikkm'] ?? null),
            'lain_pot' => self::moneyOrNull($raw['lain____lain'] ?? $raw['lain_-_lain'] ?? $raw['lain_pot'] ?? null),
            'jumlah' => self::moneyOrNull($raw['jumlah'] ?? null),
            'jumlah_tunjangan' => self::moneyOrNull($raw['jumlah_tunjangan'] ?? null),
            'jumlah_pot' => self::moneyOrNull($raw['jumlah_pot'] ?? null),
            'penerimaan' => self::moneyOrNull($raw['penerimaan'] ?? null),
            'pembulatan' => self::moneyOrNull($raw['pembulatan'] ?? null),
            'pajak' => self::moneyOrNull($raw['pajak'] ?? null),
            'zakat' => self::moneyOrNull($raw['zakat'] ?? null),
            'ref_no' => self::intOrNull($raw['no_gaji'] ?? $raw['ref_no'] ?? null),
            'salary_no' => self::intOrNull($raw['no_ref'] ?? $raw['salary_no'] ?? null),
        ];
    }

    /**
     * @param  array<string, mixed>  $raw
     * @return array{0: ?string, 1: ?string}
     */
    public static function parseJkn(array $raw): array
    {
        $susulanKeys = ['jkn_susulan', 'jkn_susulan_l', 'jkn_susulan_1', 'jkn_susulan_2'];

        foreach ($raw as $key => $value) {
            $keyStr = (string) $key;
            if (in_array($keyStr, $susulanKeys, true)) {
                continue;
            }

            if (preg_match('/^jkn(?:_|$)/i', $keyStr) !== 1) {
                continue;
            }

            $money = self::moneyOrNull($value);
            if ($money !== null) {
                return [$money, self::formatRemunLabel($keyStr, 'JKN')];
            }
        }

        return [null, null];
    }

    /**
     * @param  array<string, mixed>  $raw
     * @return array{0: ?string, 1: ?string}
     */
    public static function parseUmum(array $raw): array
    {
        foreach ($raw as $key => $value) {
            $keyStr = (string) $key;
            if (preg_match('/^umum/i', $keyStr) !== 1) {
                continue;
            }

            $money = self::moneyOrNull($value);
            if ($money !== null) {
                return [$money, self::formatRemunLabel($keyStr, 'Umum')];
            }
        }

        return [null, null];
    }

    public static function formatRemunLabel(string $normalizedKey, string $type): string
    {
        $months = [
            'januari' => 'Januari', 'jan' => 'Januari',
            'februari' => 'Februari', 'feb' => 'Februari',
            'maret' => 'Maret', 'mar' => 'Maret',
            'april' => 'April', 'apr' => 'April',
            'mei' => 'Mei',
            'juni' => 'Juni', 'jun' => 'Juni',
            'juli' => 'Juli', 'jul' => 'Juli',
            'agustus' => 'Agustus', 'agu' => 'Agustus',
            'september' => 'September', 'sep' => 'September',
            'oktober' => 'Oktober', 'okt' => 'Oktober',
            'november' => 'November', 'nov' => 'November',
            'desember' => 'Desember', 'des' => 'Desember',
        ];

        $key = mb_strtolower($normalizedKey);
        $year = null;
        $monthLabel = null;

        if (preg_match('/(20\d{2})/', $key, $yearMatch) === 1) {
            $year = $yearMatch[1];
        }

        foreach ($months as $token => $label) {
            if (str_contains($key, $token)) {
                $monthLabel = $label;
                break;
            }
        }

        if ($monthLabel && $year) {
            return "Remunerasi {$type} {$monthLabel} {$year}";
        }

        return "Remunerasi {$type}";
    }

    /**
     * @param  array<string, mixed>  $raw
     * @param  array<string, mixed>  $dbAttributes
     * @return list<array{csv_key: string, csv_label: string, csv_value: ?string, db_key: string, db_value: ?string, match: bool}>
     */
    public static function buildVerificationRows(array $raw, array $dbAttributes): array
    {
        $checks = [
            ['csv' => 'gaji_pokok', 'db' => 'gaji_pokok'],
            ['csv' => 'tunjangan_keluarga', 'db' => 'keluarga', 'fallback_csv' => 'keluarga'],
            ['csv' => 'tunjangan_masa_kerja', 'db' => 'tunj_masa_kerja'],
            ['csv' => 'tunjangan_kehadiran', 'db' => 'tunj_kehadiran'],
            ['csv' => 'tunjangan_makan_minum', 'db' => 'tunj_makan'],
            ['csv' => 'fungsional_profesi', 'db' => 'fungsional', 'fallback_csv' => 'fungsional'],
            ['csv' => 'struktural', 'db' => 'struktural'],
            ['csv' => 'operasional', 'db' => 'operasional'],
            ['csv' => 'bpjs_kes', 'db' => 'bpjs_kes'],
            ['csv' => 'transt_spj_komunikasi', 'db' => 'transport_spj', 'fallback_csv' => 'transport_spj'],
            ['csv' => 'jm_dokter', 'db' => 'jm_dokter'],
            ['csv' => 'lain2_bonus', 'db' => 'lain_lain', 'fallback_csv' => 'lain_lain'],
            ['csv' => 'lembur', 'db' => 'lembur'],
            ['csv' => 'on_call', 'db' => 'on_call'],
            ['csv' => 'jkn_susulan', 'db' => 'jkn_susulan'],
            ['csv' => 'jkn_susulan_l', 'db' => 'jkn_susulan_l'],
            ['csv' => 'zakat', 'db' => 'zakat'],
            ['csv' => 'pajak', 'db' => 'pajak'],
            ['csv' => 'jumlah', 'db' => 'jumlah'],
            ['csv' => 'jumlah_pot', 'db' => 'jumlah_pot'],
            ['csv' => 'penerimaan', 'db' => 'penerimaan'],
        ];

        $rows = [];

        foreach ($checks as $check) {
            $csvKey = $check['csv'];
            $csvValue = self::moneyOrNull($raw[$csvKey] ?? null);
            if ($csvValue === null && isset($check['fallback_csv'])) {
                $csvValue = self::moneyOrNull($raw[$check['fallback_csv']] ?? null);
            }

            $dbKey = $check['db'];
            $dbValue = self::moneyOrNull($dbAttributes[$dbKey] ?? null);

            if ($csvValue === null && $dbValue === null) {
                continue;
            }

            $rows[] = [
                'csv_key' => $csvKey,
                'csv_label' => self::humanizeKey($csvKey),
                'csv_value' => $csvValue,
                'db_key' => $dbKey,
                'db_value' => $dbValue,
                'match' => self::moneyEquals($csvValue, $dbValue),
            ];
        }

        [$jknCsv] = self::parseJkn($raw);
        $dbJkn = self::moneyOrNull($dbAttributes['jkn'] ?? null);
        if ($jknCsv !== null || $dbJkn !== null) {
            $rows[] = [
                'csv_key' => 'jkn_*',
                'csv_label' => 'Remunerasi JKN (dinamis)',
                'csv_value' => $jknCsv,
                'db_key' => 'jkn',
                'db_value' => $dbJkn,
                'match' => self::moneyEquals($jknCsv, $dbJkn),
            ];
        }

        [$umumCsv] = self::parseUmum($raw);
        $dbUmum = self::moneyOrNull($dbAttributes['umum'] ?? null);
        if ($umumCsv !== null || $dbUmum !== null) {
            $rows[] = [
                'csv_key' => 'umum_*',
                'csv_label' => 'Remunerasi Umum (dinamis)',
                'csv_value' => $umumCsv,
                'db_key' => 'umum',
                'db_value' => $dbUmum,
                'match' => self::moneyEquals($umumCsv, $dbUmum),
            ];
        }

        $tunjBpjsCsv = self::moneyOrNull($raw['tunj_bpjs_tk'] ?? null);
        if ($tunjBpjsCsv === null) {
            $sum = (float) ($raw['jkk'] ?? 0) + (float) ($raw['jkm'] ?? 0) + (float) ($raw['jht'] ?? 0) + (float) ($raw['jp'] ?? 0);
            $tunjBpjsCsv = $sum > 0 ? (string) $sum : null;
        }

        $dbTunjBpjs = self::moneyOrNull($dbAttributes['tunj_bpjs_tk'] ?? null);
        if ($tunjBpjsCsv !== null || $dbTunjBpjs !== null) {
            $rows[] = [
                'csv_key' => 'jkk+jkm+jht+jp',
                'csv_label' => 'BPJS Ketenagakerjaan (tunjangan)',
                'csv_value' => $tunjBpjsCsv,
                'db_key' => 'tunj_bpjs_tk',
                'db_value' => $dbTunjBpjs,
                'match' => self::moneyEquals($tunjBpjsCsv, $dbTunjBpjs),
            ];
        }

        return $rows;
    }

    public static function humanizeKey(string $key): string
    {
        return ucwords(str_replace('_', ' ', $key));
    }

    public static function moneyOrNull(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);
        if ($value === '' || $value === '-' || $value === '–') {
            return null;
        }

        $value = str_replace(['Rp', 'rp', ' ', "\u{00A0}"], '', $value);
        $value = str_replace([','], '.', $value);
        $value = preg_replace('/[^0-9.\-]/', '', $value) ?? '';

        if ($value === '' || $value === '-') {
            return null;
        }

        if (preg_match('/^\-?\d{1,3}(\.\d{3})+$/', $value) === 1) {
            $value = str_replace('.', '', $value);
        }

        if (! is_numeric($value)) {
            return null;
        }

        $float = (float) $value;

        return $float == 0.0 ? null : (string) $float;
    }

    private static function intOrNull(mixed $value): ?int
    {
        $value = trim((string) $value);
        if ($value === '' || $value === '-') {
            return null;
        }

        $value = preg_replace('/\D+/', '', $value) ?? '';

        return $value === '' ? null : (int) $value;
    }

    private static function moneyEquals(?string $a, ?string $b): bool
    {
        $fa = $a !== null ? (float) $a : null;
        $fb = $b !== null ? (float) $b : null;

        if ($fa === null && $fb === null) {
            return true;
        }

        if ($fa === null || $fb === null) {
            return false;
        }

        return abs($fa - $fb) < 0.01;
    }
}
