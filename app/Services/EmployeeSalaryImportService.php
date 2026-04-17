<?php

namespace App\Services;

use App\Models\EmployeeSalary;
use App\Models\PayrollImport;
use App\Models\Pegawai;
use App\Models\User;

class EmployeeSalaryImportService
{
    /**
     * @return array{imported:int, skipped:int, total_rows:int, warnings:list<array{nik:string, nama:?string, issues:list<string>}>, import_id:int|null}
     */
    public function importFromCsv(string $path, string $periodStart, ?int $importedByUserId = null, ?string $filename = null): array
    {
        [$headers, $rows] = $this->readCsv($path);

        $payrollImport = PayrollImport::query()->create([
            'imported_by' => $importedByUserId,
            'period_start' => $periodStart,
            'filename' => $filename,
            'total_rows' => count($rows),
            'imported_count' => 0,
            'skipped_count' => 0,
            'warning_count' => 0,
            'status' => 'completed',
        ]);

        $imported = 0;
        $skipped = 0;
        $allSalaries = [];

        foreach ($rows as $row) {
            $raw = $this->rowToAssoc($headers, $row);

            $nik = trim((string) ($raw['nik'] ?? ''));
            if ($nik === '') {
                $skipped++;

                continue;
            }

            $user = User::query()->where('simrs_nik', $nik)->first();
            $pegawai = Pegawai::query()->where('nik', $nik)->first();

            $npwp = $pegawai?->npwp ?? $this->stringOrNull($raw['npwp'] ?? null);
            $unit = $pegawai?->departemen ?? $this->stringOrNull($raw['instalasi_unit'] ?? null);
            $nama = $this->stringOrNull($raw['nama'] ?? null);
            $penerimaan = $this->moneyOrNull($raw['penerimaan'] ?? null);
            $pajak = $this->moneyOrNull($raw['pajak'] ?? null);
            $zakat = $this->moneyOrNull($raw['zakat'] ?? null);

            EmployeeSalary::query()->updateOrCreate(
                [
                    'period_start' => $periodStart,
                    'simrs_nik' => $nik,
                ],
                [
                    'user_id' => $user?->id,
                    'imported_by' => $importedByUserId,
                    'import_id' => $payrollImport->id,
                    'employee_name' => $nama,
                    'unit' => $unit,
                    'npwp' => $npwp,
                    'penerimaan' => $penerimaan,
                    'pembulatan' => $this->moneyOrNull($raw['pembulatan'] ?? null),
                    'pajak' => $pajak,
                    'zakat' => $zakat,
                    'raw_row' => $raw,
                ]
            );

            $allSalaries[] = [
                'nik' => $nik,
                'nama' => $nama,
                'penerimaan' => (float) ($penerimaan ?? 0),
                'pajak' => (float) ($pajak ?? 0),
            ];

            $imported++;
        }

        $warnings = $this->detectAnomalies($allSalaries);

        $payrollImport->update([
            'imported_count' => $imported,
            'skipped_count' => $skipped,
            'warning_count' => count($warnings),
        ]);

        return [
            'imported' => $imported,
            'skipped' => $skipped,
            'total_rows' => $imported + $skipped,
            'warnings' => $warnings,
            'import_id' => $payrollImport->id,
        ];
    }

    /**
     * @param  list<array{nik:string, nama:?string, penerimaan:float, pajak:float}>  $salaries
     * @return list<array{nik:string, nama:?string, issues:list<string>}>
     */
    private function detectAnomalies(array $salaries): array
    {
        if (count($salaries) === 0) {
            return [];
        }

        $validPenerimaan = array_filter(array_column($salaries, 'penerimaan'), fn ($v) => $v > 0);
        $avgPenerimaan = count($validPenerimaan) > 0 ? array_sum($validPenerimaan) / count($validPenerimaan) : 0;
        $lowThreshold = $avgPenerimaan * 0.3;
        $highThreshold = $avgPenerimaan * 2.5;

        $warnings = [];

        foreach ($salaries as $salary) {
            $issues = [];

            if (empty($salary['nama'])) {
                $issues[] = 'Nama pegawai kosong';
            }

            if ($salary['penerimaan'] === 0.0) {
                $issues[] = 'Penerimaan = 0';
            } elseif ($avgPenerimaan > 0 && $salary['penerimaan'] < $lowThreshold) {
                $issues[] = 'Penerimaan jauh di bawah rata-rata (<30%)';
            } elseif ($avgPenerimaan > 0 && $salary['penerimaan'] > $highThreshold) {
                $issues[] = 'Penerimaan jauh di atas rata-rata (>250%)';
            }

            if ($salary['penerimaan'] > 0 && $salary['pajak'] > $salary['penerimaan'] * 0.5) {
                $issues[] = 'Pajak > 50% dari penerimaan';
            }

            if (count($issues) > 0) {
                $warnings[] = [
                    'nik' => $salary['nik'],
                    'nama' => $salary['nama'],
                    'issues' => $issues,
                ];
            }
        }

        return $warnings;
    }

    /**
     * @return array{0: list<string>, 1: list<list<string|null>>}
     */
    private function readCsv(string $path): array
    {
        $handle = fopen($path, 'r');
        if ($handle === false) {
            return [[], []];
        }

        $firstLine = fgets($handle);
        if ($firstLine === false) {
            fclose($handle);

            return [[], []];
        }

        $delimiter = $this->detectDelimiter($firstLine);
        $headers = $this->normalizeHeaders(str_getcsv($firstLine, $delimiter));

        $rows = [];
        while (($data = fgetcsv($handle, 0, $delimiter)) !== false) {
            if ($data === [null] || $data === []) {
                continue;
            }

            $rows[] = $data;
        }

        fclose($handle);

        return [$headers, $rows];
    }

    private function detectDelimiter(string $line): string
    {
        $candidates = [';', ',', "\t", '|'];

        $best = ';';
        $bestCount = 0;

        foreach ($candidates as $candidate) {
            $count = count(str_getcsv($line, $candidate));
            if ($count > $bestCount) {
                $bestCount = $count;
                $best = $candidate;
            }
        }

        return $best;
    }

    /**
     * @param  list<string|null>  $headers
     * @return list<string>
     */
    private function normalizeHeaders(array $headers): array
    {
        $out = [];

        foreach ($headers as $h) {
            $h = (string) $h;
            $h = preg_replace('/^\xEF\xBB\xBF/', '', $h) ?? $h; // UTF-8 BOM
            $h = trim($h);

            $normalized = mb_strtolower($h);
            // Ganti semua spasi (satu atau lebih) dengan underscore
            $normalized = preg_replace('/\s+/', '_', $normalized) ?? $normalized;
            // Ganti beberapa karakter pemisah umum menjadi underscore
            $normalized = str_replace(['/'], '_', $normalized);
            // Rapikan underscore berlebih
            $normalized = preg_replace('/_+/', '_', $normalized) ?? $normalized;

            $out[] = $normalized;
        }

        return $out;
    }

    /**
     * @param  list<string>  $headers
     * @param  list<string|null>  $row
     * @return array<string, string|null>
     */
    private function rowToAssoc(array $headers, array $row): array
    {
        $assoc = [];

        foreach ($headers as $i => $header) {
            $assoc[$header] = $row[$i] ?? null;
        }

        return $assoc;
    }

    private function stringOrNull(mixed $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' || $value === '-' ? null : $value;
    }

    private function intOrNull(mixed $value): ?int
    {
        $value = trim((string) $value);
        if ($value === '' || $value === '-' || $value === null) {
            return null;
        }

        $value = preg_replace('/\D+/', '', $value) ?? '';

        return $value === '' ? null : (int) $value;
    }

    private function moneyOrNull(mixed $value): ?string
    {
        $value = trim((string) $value);
        if ($value === '' || $value === '-' || $value === null) {
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

        return is_numeric($value) ? (string) ((float) $value) : null;
    }
}
