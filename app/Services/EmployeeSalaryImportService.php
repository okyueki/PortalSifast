<?php

namespace App\Services;

use App\Models\EmployeeSalary;
use App\Models\PayrollImport;
use App\Models\Pegawai;
use App\Models\User;
use App\Support\PayrollCsvMapper;

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
            $phone = $pegawai?->no_hp ?? null;

            $mapped = PayrollCsvMapper::mapRawRow($raw);

            EmployeeSalary::query()->updateOrCreate(
                [
                    'period_start' => $periodStart,
                    'simrs_nik' => $nik,
                ],
                [
                    'user_id' => $importedByUserId,
                    'imported_by' => $importedByUserId,
                    'import_id' => $payrollImport->id,
                    'employee_name' => $nama,
                    'unit' => $unit,
                    'npwp' => $npwp,
                    'phone' => $phone,
                    'salary_no' => $mapped['salary_no'],
                    'ref_no' => $mapped['ref_no'],
                    'penerimaan' => $mapped['penerimaan'],
                    'pembulatan' => $mapped['pembulatan'],
                    'pajak' => $mapped['pajak'],
                    'zakat' => $mapped['zakat'],
                    'gaji_pokok' => $mapped['gaji_pokok'],
                    'keluarga' => $mapped['keluarga'],
                    'tunj_masa_kerja' => $mapped['tunj_masa_kerja'],
                    'tunj_kehadiran' => $mapped['tunj_kehadiran'],
                    'tunj_makan' => $mapped['tunj_makan'],
                    'fungsional' => $mapped['fungsional'],
                    'struktural' => $mapped['struktural'],
                    'operasional' => $mapped['operasional'],
                    'transport_spj' => $mapped['transport_spj'],
                    'jm_dokter' => $mapped['jm_dokter'],
                    'lembur' => $mapped['lembur'],
                    'on_call' => $mapped['on_call'],
                    'lain_lain' => $mapped['lain_lain'],
                    'jkn' => $mapped['jkn'],
                    'jkn_label' => $mapped['jkn_label'],
                    'umum' => $mapped['umum'],
                    'umum_label' => $mapped['umum_label'],
                    'jkn_susulan' => $mapped['jkn_susulan'],
                    'jkn_susulan_l' => $mapped['jkn_susulan_l'],
                    'jkk' => $mapped['jkk'],
                    'jkm' => $mapped['jkm'],
                    'jht' => $mapped['jht'],
                    'jp' => $mapped['jp'],
                    'tunj_bpjs_tk' => $mapped['tunj_bpjs_tk'],
                    'bpjs_kes' => $mapped['bpjs_kes'],
                    'jkk_k' => $mapped['jkk_k'],
                    'jkm_k' => $mapped['jkm_k'],
                    'jht_k' => $mapped['jht_k'],
                    'jp_k' => $mapped['jp_k'],
                    'pot_bpjs_tk' => $mapped['pot_bpjs_tk'],
                    'bpjs_kes_k' => $mapped['bpjs_kes_k'],
                    'jht_i' => $mapped['jht_i'],
                    'jp_i' => $mapped['jp_i'],
                    'bpjs_kes_i' => $mapped['bpjs_kes_i'],
                    'bpjs_kes_tidak_ditanggung' => $mapped['bpjs_kes_tidak_ditanggung'],
                    'matan' => $mapped['matan'],
                    'lazismu' => $mapped['lazismu'],
                    'obat2an' => $mapped['obat2an'],
                    'hutang_bpjs' => $mapped['hutang_bpjs'],
                    'hutang_seragam' => $mapped['hutang_seragam'],
                    'ikkm' => $mapped['ikkm'],
                    'lain_pot' => $mapped['lain_pot'],
                    'jumlah' => $mapped['jumlah'],
                    'jumlah_tunjangan' => $mapped['jumlah_tunjangan'],
                    'jumlah_pot' => $mapped['jumlah_pot'],
                    'status' => 'draft',
                    'raw_row' => $raw,
                ]
            );

            $allSalaries[] = [
                'nik' => $nik,
                'nama' => $nama,
                'penerimaan' => (float) ($mapped['penerimaan'] ?? 0),
                'pajak' => (float) ($mapped['pajak'] ?? 0),
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
            $normalized = str_replace(['/', '(', ')', '.'], '_', $normalized);
            // Rapikan underscore berlebih
            $normalized = preg_replace('/_+/', '_', $normalized) ?? $normalized;
            // Hapus underscores di awal/akhir
            $normalized = trim($normalized, '_');

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
