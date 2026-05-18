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
            $phone = $pegawai?->no_hp ?? null;

            // Parse komponen pendapatan
            $gajiPokok = $this->moneyOrNull($raw['gaji_pokok'] ?? null);
            $keluarga = $this->moneyOrNull($raw['keluarga'] ?? null);
            $fungsional = $this->moneyOrNull($raw['fungsional'] ?? null);
            $struktural = $this->moneyOrNull($raw['struktural'] ?? null);
            $operasional = $this->moneyOrNull($raw['operasional'] ?? null);
            $transportSpj = $this->moneyOrNull($raw['transt_spj_komunikasi'] ?? $raw['transport_spj'] ?? null);
            $jmDokter = $this->moneyOrNull($raw['jm_dokter'] ?? null);
            $lembur = $this->moneyOrNull($raw['lembur'] ?? null);
            $onCall = $this->moneyOrNull($raw['on_call'] ?? null);
            $lainLain = $this->moneyOrNull($raw['lain2_bonus'] ?? $raw['lain_lain'] ?? null);

            // Parse JKN components
            $jkn = $this->parseJknFromRaw($raw);
            $umum = $this->moneyOrNull($raw['umum_maret_2026'] ?? $raw['umum'] ?? null);
            $jknSusulan = $this->moneyOrNull($raw['jkn_susulan'] ?? null);
            $jknSusulanL = $this->moneyOrNull($raw['jkn_susulan_l'] ?? null);

            // Parse BPJS TK Company (tunjangan)
            $jkk = $this->moneyOrNull($raw['jkk'] ?? null);
            $jkm = $this->moneyOrNull($raw['jkm'] ?? null);
            $jht = $this->moneyOrNull($raw['jht'] ?? null);
            $jp = $this->moneyOrNull($raw['jp'] ?? null);
            $bpjsKes = $this->moneyOrNull($raw['bpjs_kes'] ?? null);

            // Auto-calculate tunj_bpjs_tk if not provided
            $tunjBpjsTk = $this->moneyOrNull($raw['tunj_bpjs_tk'] ?? null);
            if ($tunjBpjsTk === null && ($jkk || $jkm || $jht || $jp)) {
                $tunjBpjsTk = (string) (($jkk ?? 0) + ($jkm ?? 0) + ($jht ?? 0) + ($jp ?? 0));
            }

            // Parse BPJS TK Karyawan (potongan)
            $jkkK = $this->moneyOrNull($raw['jkk_k'] ?? null);
            $jkmK = $this->moneyOrNull($raw['jkm_k'] ?? null);
            $jhtK = $this->moneyOrNull($raw['jht_k'] ?? null);
            $jpK = $this->moneyOrNull($raw['jp_k'] ?? null);
            $bpjsKesK = $this->moneyOrNull($raw['bpjs_kes_k'] ?? null);

            // Auto-calculate pot_bpjs_tk if not provided
            $potBpjsTk = $this->moneyOrNull($raw['pot_bpjs_tk'] ?? null);
            if ($potBpjsTk === null && ($jkkK || $jkmK || $jhtK || $jpK)) {
                $potBpjsTk = (string) (($jkkK ?? 0) + ($jkmK ?? 0) + ($jhtK ?? 0) + ($jpK ?? 0));
            }

            // Parse potongan lain
            $jhtI = $this->moneyOrNull($raw['jht_i'] ?? null);
            $jpI = $this->moneyOrNull($raw['jp_i'] ?? null);
            $bpjsKesI = $this->moneyOrNull($raw['bpjs_kes_i'] ?? null);
            $bpjsKesTdakDitanggung = $this->moneyOrNull($raw['bpjs_kes_tdk_di_tgg'] ?? $raw['bpjs_kes_tidak_ditanggung'] ?? null);
            $matan = $this->moneyOrNull($raw['matan'] ?? null);
            $lazismu = $this->moneyOrNull($raw['lazismu'] ?? null);
            $obat2an = $this->moneyOrNull($raw['obat2an_r'] ?? $raw['obat2an'] ?? null);
            $hutangBpjs = $this->moneyOrNull($raw['hutang_bpjs'] ?? null);
            $hutangSeragam = $this->moneyOrNull($raw['hutang_seragam'] ?? null);
            $ikkm = $this->moneyOrNull($raw['ikkm'] ?? null);
            $lainPot = $this->moneyOrNull($raw['lain____lain'] ?? $raw['lain_pot'] ?? null);

            // Parse totals from CSV
            $jumlah = $this->moneyOrNull($raw['jumlah'] ?? null);
            $jumlahTunjangan = $this->moneyOrNull($raw['jumlah_tunjangan'] ?? null);
            $jumlahPot = $this->moneyOrNull($raw['jumlah_pot'] ?? null);

            // Parse values
            $penerimaan = $this->moneyOrNull($raw['penerimaan'] ?? null);
            $pembulatan = $this->moneyOrNull($raw['pembulatan'] ?? null);
            $pajak = $this->moneyOrNull($raw['pajak'] ?? null);
            $zakat = $this->moneyOrNull($raw['zakat'] ?? null);

            // Parse ref_no and salary_no
            $refNo = $this->intOrNull($raw['no_gaji'] ?? $raw['ref_no'] ?? null);
            $salaryNo = $this->intOrNull($raw['no_ref'] ?? $raw['salary_no'] ?? null);

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
                    'salary_no' => $salaryNo,
                    'ref_no' => $refNo,
                    'penerimaan' => $penerimaan,
                    'pembulatan' => $pembulatan,
                    'pajak' => $pajak,
                    'zakat' => $zakat,
                    // Komponen pendapatan
                    'gaji_pokok' => $gajiPokok,
                    'keluarga' => $keluarga,
                    'fungsional' => $fungsional,
                    'struktural' => $struktural,
                    'operasional' => $operasional,
                    'transport_spj' => $transportSpj,
                    'jm_dokter' => $jmDokter,
                    'lembur' => $lembur,
                    'on_call' => $onCall,
                    'lain_lain' => $lainLain,
                    // JKN
                    'jkn' => $jkn,
                    'umum' => $umum,
                    'jkn_susulan' => $jknSusulan,
                    'jkn_susulan_l' => $jknSusulanL,
                    // BPJS TK Company
                    'jkk' => $jkk,
                    'jkm' => $jkm,
                    'jht' => $jht,
                    'jp' => $jp,
                    'tunj_bpjs_tk' => $tunjBpjsTk,
                    'bpjs_kes' => $bpjsKes,
                    // BPJS TK Karyawan
                    'jkk_k' => $jkkK,
                    'jkm_k' => $jkmK,
                    'jht_k' => $jhtK,
                    'jp_k' => $jpK,
                    'pot_bpjs_tk' => $potBpjsTk,
                    'bpjs_kes_k' => $bpjsKesK,
                    // Potongan lain
                    'jht_i' => $jhtI,
                    'jp_i' => $jpI,
                    'bpjs_kes_i' => $bpjsKesI,
                    'bpjs_kes_tidak_ditanggung' => $bpjsKesTdakDitanggung,
                    'matan' => $matan,
                    'lazismu' => $lazismu,
                    'obat2an' => $obat2an,
                    'hutang_bpjs' => $hutangBpjs,
                    'hutang_seragam' => $hutangSeragam,
                    'ikkm' => $ikkm,
                    'lain_pot' => $lainPot,
                    // Totals
                    'jumlah' => $jumlah,
                    'jumlah_tunjangan' => $jumlahTunjangan,
                    'jumlah_pot' => $jumlahPot,
                    // Default status = draft (belum bisa diakses via API)
                    'status' => 'draft',
                    // Raw data
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
     * Parse JKN from raw row - tries multiple column names
     */
    private function parseJknFromRaw(array $raw): ?string
    {
        // Try common patterns for JKN column
        $patterns = [
            'jkn_februari_2026',
            'jkn_feb_2026',
            'jkn',
        ];

        foreach ($patterns as $pattern) {
            $value = $raw[$pattern] ?? null;
            if ($value !== null && $value !== '' && $value !== '-') {
                return $this->moneyOrNull($value);
            }
        }

        // Try regex for "jkn ..." pattern
        foreach ($raw as $key => $value) {
            if (preg_match('/^jkn\s/i', $key) && str_contains(mb_strtolower($key), '2026')) {
                return $this->moneyOrNull($value);
            }
        }

        return null;
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