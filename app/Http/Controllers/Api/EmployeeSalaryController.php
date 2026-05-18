<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmployeeSalary;
use App\Services\SyncUserSimrsNikFromEmailService;
use App\Support\PayrollSlipMath;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeSalaryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user && blank($user->simrs_nik) && ! $user->isPayrollServiceIntegrationAccount()) {
            app(SyncUserSimrsNikFromEmailService::class)($user);
            $user->refresh();
        }

        $nikParam = $this->resolveNikFromRequest($request);
        $nik = $nikParam !== '' ? $nikParam : $user?->simrs_nik;

        // Jika NIK dari query/header beda dengan simrs_nik user, hanya admin/staff/service
        if ($nikParam !== '' && $user?->simrs_nik !== $nikParam) {
            if (! $user?->canAccessPayroll() && ! ($user?->isPayrollServiceIntegrationAccount() ?? false)) {
                return response()->json([
                    'message' => 'Anda tidak memiliki akses untuk melihat gaji pegawai lain.',
                ], 403);
            }
        }

        if (! is_string($nik) || trim($nik) === '') {
            return response()->json([
                'message' => 'Parameter nik wajib diisi atau akun Anda belum terhubung dengan NIK kepegawaian.',
                'hint' => 'Token dari VITE (service) tidak punya NIK. Wajib kirim NIK pegawai: query ?nik= atau ?simrs_nik=, atau header X-Sifast-Nik / X-Nik. Alternatif: pakai Bearer token hasil POST /api/login (user yang punya simrs_nik).',
                'example_query' => '/api/sifast/payroll?nik=03.09.07.1998&page=1&per_page=12',
            ], 422);
        }

        $period = $request->string('period')->toString();

        $query = EmployeeSalary::query()
            ->where('simrs_nik', $nik)
            ->where('status', 'published')  // Hanya data yang sudah di-publish
            ->orderBy('period_start', 'desc');

        if ($period !== '') {
            try {
                $periodStart = CarbonImmutable::createFromFormat('Y-m', $period)->startOfMonth();
                $query->whereDate('period_start', $periodStart->toDateString());
            } catch (\Throwable) {
                return response()->json([
                    'message' => 'Format period harus YYYY-MM.',
                ], 422);
            }
        }

        $perPage = $request->integer('per_page', 12);
        $perPage = max(1, min($perPage, 100));

        $salaries = $query->paginate($perPage)->withQueryString();

        $salaries->getCollection()->transform(fn (EmployeeSalary $salary) => $this->formatSalary($salary));

        return response()->json($salaries);
    }

    /**
     * NIK eksplisit: query `nik` / `simrs_nik`, lalu header `X-Sifast-Nik` / `X-Nik`.
     */
    private function resolveNikFromRequest(Request $request): string
    {
        foreach (['nik', 'simrs_nik'] as $key) {
            $v = trim($request->string($key)->toString());
            if ($v !== '') {
                return $v;
            }
        }

        foreach (['X-Sifast-Nik', 'X-Nik'] as $headerName) {
            $fromHeader = $request->header($headerName);
            if (is_string($fromHeader) && trim($fromHeader) !== '') {
                return trim($fromHeader);
            }
        }

        return '';
    }

    public function show(Request $request, EmployeeSalary $employeeSalary): JsonResponse
    {
        $user = $request->user();

        if ($user && blank($user->simrs_nik) && ! $user->isPayrollServiceIntegrationAccount()) {
            app(SyncUserSimrsNikFromEmailService::class)($user);
            $user->refresh();
        }

        $nik = $user?->simrs_nik;

        // Admin, staff, atau service account bisa akses semua data
        $canAccessAll = $user?->canAccessPayroll() || ($user?->isPayrollServiceIntegrationAccount() ?? false);

        // Cek apakah data sudah publish (status = 'published')
        if ($employeeSalary->status !== 'published') {
            return response()->json([
                'message' => 'Data payroll ini belum dipublish dan belum bisa diakses.',
            ], 403);
        }

        if (! $canAccessAll) {
            if (! is_string($nik) || trim($nik) === '') {
                return response()->json([
                    'message' => 'Akun Anda belum terhubung dengan NIK kepegawaian.',
                ], 422);
            }

            if ($employeeSalary->simrs_nik !== $nik) {
                return response()->json(['message' => 'Data ini bukan milik Anda.'], 403);
            }
        }

        return response()->json([
            'data' => $this->formatSalaryDetail($employeeSalary),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function formatSalary(EmployeeSalary $salary): array
    {
        $gajiBersih = PayrollSlipMath::resolveGajiBersih($salary);

        return [
            'id' => $salary->id,
            'period_start' => $salary->period_start?->toDateString(),
            'period_label' => $salary->period_start?->translatedFormat('F Y'),
            'simrs_nik' => $salary->simrs_nik,
            'employee_name' => $salary->employee_name,
            'unit' => $salary->unit,
            'npwp' => $salary->npwp,
            'phone' => $salary->phone,
            'ref_no' => $salary->ref_no,
            'salary_no' => $salary->salary_no,
            'penerimaan' => $salary->penerimaan,
            'pembulatan' => $salary->pembulatan,
            'pajak' => $salary->pajak,
            'zakat' => $salary->zakat,
            'gaji_bersih' => $gajiBersih,
            'status' => $salary->status,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formatSalaryDetail(EmployeeSalary $salary): array
    {
        $gajiBersih = PayrollSlipMath::resolveGajiBersih($salary);

        $masaKerja = $this->calculateMasaKerja($salary);

        return [
            'id' => $salary->id,
            'period_start' => $salary->period_start?->toDateString(),
            'period_label' => $salary->period_start?->translatedFormat('F Y'),
            'simrs_nik' => $salary->simrs_nik,
            'employee_name' => $salary->employee_name,
            'unit' => $salary->unit,
            'npwp' => $salary->npwp,
            'phone' => $salary->phone,
            'ref_no' => $salary->ref_no,
            'salary_no' => $salary->salary_no,
            'penerimaan' => $salary->penerimaan,
            'pembulatan' => $salary->pembulatan,
            'pajak' => $salary->pajak,
            'zakat' => $salary->zakat,
            'gaji_bersih' => $gajiBersih,
            'terbilang' => $this->terbilang($gajiBersih),
            'masa_kerja' => $masaKerja,
            'status' => $salary->status,
            'published_at' => $salary->published_at?->toIso8601String(),
            'published_by' => $salary->published_by,
            // Komponen Pendapatan
            'gaji_pokok' => $salary->gaji_pokok,
            'keluarga' => $salary->keluarga,
            'fungsional' => $salary->fungsional,
            'struktural' => $salary->struktural,
            'operasional' => $salary->operasional,
            'tunj_bpjs_tk' => $salary->tunj_bpjs_tk,
            'bpjs_kes' => $salary->bpjs_kes,
            'transport_spj' => $salary->transport_spj,
            'jm_dokter' => $salary->jm_dokter,
            'lain_lain' => $salary->lain_lain,
            'lembur' => $salary->lembur,
            'on_call' => $salary->on_call,
            'jkn' => $salary->jkn,
            'umum' => $salary->umum,
            'jkn_susulan' => $salary->jkn_susulan,
            'jkn_susulan_l' => $salary->jkn_susulan_l,
            // Komponen Potongan
            'pot_bpjs_tk' => $salary->pot_bpjs_tk,
            'bpjs_kes_k' => $salary->bpjs_kes_k,
            'jht_i' => $salary->jht_i,
            'jp_i' => $salary->jp_i,
            'bpjs_kes_i' => $salary->bpjs_kes_i,
            'bpjs_kes_tidak_ditanggung' => $salary->bpjs_kes_tidak_ditanggung,
            'matan' => $salary->matan,
            'lazismu' => $salary->lazismu,
            'obat2an' => $salary->obat2an,
            'hutang_bpjs' => $salary->hutang_bpjs,
            'hutang_seragam' => $salary->hutang_seragam,
            'ikkm' => $salary->ikkm,
            'lain_pot' => $salary->lain_pot,
            // Total dari CSV
            'jumlah_tunjangan' => $salary->jumlah_tunjangan,
            'jumlah' => $salary->jumlah,
            'jumlah_pot' => $salary->jumlah_pot,
            // Raw data (semua kolom CSV asli)
            'raw_row' => $salary->raw_row,
        ];
    }

    /**
     * @return array{years:int, months:int, days:int}|null
     */
    private function calculateMasaKerja(EmployeeSalary $salary): ?array
    {
        $pegawai = $salary->pegawai()->first();
        $mulaiKerja = $pegawai?->mulai_kerja;

        if (! $mulaiKerja) {
            return null;
        }

        $start = CarbonImmutable::parse($mulaiKerja);
        $end = $salary->period_start ?? now();
        $diff = $start->diff($end);

        return [
            'years' => $diff->y,
            'months' => $diff->m,
            'days' => $diff->d,
        ];
    }

    private function terbilang(float $angka): string
    {
        $angka = abs((int) round($angka));
        if ($angka === 0) {
            return 'Nol Rupiah';
        }

        $satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
        $hasil = '';

        if ($angka < 12) {
            $hasil = $satuan[$angka];
        } elseif ($angka < 20) {
            $hasil = $satuan[$angka - 10].' Belas';
        } elseif ($angka < 100) {
            $hasil = $satuan[(int) ($angka / 10)].' Puluh '.$this->terbilang($angka % 10);
        } elseif ($angka < 200) {
            $hasil = 'Seratus '.$this->terbilang($angka - 100);
        } elseif ($angka < 1000) {
            $hasil = $satuan[(int) ($angka / 100)].' Ratus '.$this->terbilang($angka % 100);
        } elseif ($angka < 2000) {
            $hasil = 'Seribu '.$this->terbilang($angka - 1000);
        } elseif ($angka < 1000000) {
            $hasil = $this->terbilang((int) ($angka / 1000)).' Ribu '.$this->terbilang($angka % 1000);
        } elseif ($angka < 1000000000) {
            $hasil = $this->terbilang((int) ($angka / 1000000)).' Juta '.$this->terbilang($angka % 1000000);
        } elseif ($angka < 1000000000000) {
            $hasil = $this->terbilang((int) ($angka / 1000000000)).' Miliar '.$this->terbilang($angka % 1000000000);
        } else {
            $hasil = $this->terbilang((int) ($angka / 1000000000000)).' Triliun '.$this->terbilang($angka % 1000000000000);
        }

        return trim(preg_replace('/\s+/', ' ', $hasil).' Rupiah');
    }
}
