<?php

namespace App\Http\Controllers;

use App\Jobs\SendPayslipEmail;
use App\Models\EmployeeSalary;
use App\Models\PayrollAuditLog;
use App\Models\PayrollImport;
use App\Models\User;
use App\Services\EmployeeSalaryImportService;
use App\Support\PayrollSlipMath;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EmployeeSalaryWebImportController extends Controller
{
    public function dashboard(Request $request): Response
    {
        $user = $request->user();
        if (! $user?->isAdmin() && ! $user?->isStaff()) {
            abort(403, 'Hanya admin dan staff yang dapat melihat dashboard.');
        }

        $periods = EmployeeSalary::query()
            ->selectRaw('DATE_FORMAT(period_start, "%Y-%m") as period')
            ->groupBy('period')
            ->orderBy('period', 'desc')
            ->limit(12)
            ->pluck('period')
            ->reverse()
            ->values();

        $trendData = [];
        foreach ($periods as $period) {
            $periodStart = CarbonImmutable::createFromFormat('Y-m', $period)->startOfMonth();
            $stats = EmployeeSalary::query()
                ->whereDate('period_start', $periodStart->toDateString())
                ->selectRaw('
                    COUNT(*) as total_employees,
                    COALESCE(SUM(CAST(penerimaan AS DECIMAL(20,2))), 0) as total_penerimaan,
                    COALESCE(AVG(CAST(penerimaan AS DECIMAL(20,2))), 0) as avg_penerimaan,
                    COALESCE(SUM(CAST(pajak AS DECIMAL(20,2))), 0) as total_pajak,
                    COALESCE(SUM(CAST(zakat AS DECIMAL(20,2))), 0) as total_zakat
                ')
                ->first();

            $trendData[] = [
                'period' => $periodStart->translatedFormat('M Y'),
                'period_raw' => $period,
                'total_employees' => (int) ($stats->total_employees ?? 0),
                'total_penerimaan' => (float) ($stats->total_penerimaan ?? 0),
                'avg_penerimaan' => (float) ($stats->avg_penerimaan ?? 0),
                'total_pajak' => (float) ($stats->total_pajak ?? 0),
                'total_zakat' => (float) ($stats->total_zakat ?? 0),
            ];
        }

        $latestPeriod = $periods->last();
        $unitDistribution = [];
        if ($latestPeriod) {
            $latestPeriodStart = CarbonImmutable::createFromFormat('Y-m', $latestPeriod)->startOfMonth();
            $unitDistribution = EmployeeSalary::query()
                ->whereDate('period_start', $latestPeriodStart->toDateString())
                ->selectRaw('
                    COALESCE(unit, "Tidak Ada Unit") as unit,
                    COUNT(*) as count,
                    COALESCE(SUM(CAST(penerimaan AS DECIMAL(20,2))), 0) as total
                ')
                ->groupBy('unit')
                ->orderByDesc('total')
                ->limit(10)
                ->get()
                ->map(fn ($row) => [
                    'unit' => $row->unit,
                    'count' => (int) $row->count,
                    'total' => (float) $row->total,
                ])
                ->toArray();
        }

        $yoyGrowth = null;
        if (count($trendData) >= 2) {
            $currentYear = (int) date('Y');
            $currentMonth = (int) date('m');

            $thisYearData = array_filter($trendData, fn ($d) => str_starts_with($d['period_raw'], (string) $currentYear));
            $lastYearData = array_filter($trendData, fn ($d) => str_starts_with($d['period_raw'], (string) ($currentYear - 1)));

            $thisYearTotal = array_sum(array_column($thisYearData, 'total_penerimaan'));
            $lastYearTotal = array_sum(array_column($lastYearData, 'total_penerimaan'));

            if ($lastYearTotal > 0) {
                $yoyGrowth = [
                    'this_year' => $thisYearTotal,
                    'last_year' => $lastYearTotal,
                    'growth_percent' => round((($thisYearTotal - $lastYearTotal) / $lastYearTotal) * 100, 2),
                ];
            }
        }

        $topEarners = [];
        if ($latestPeriod) {
            $latestPeriodStart = CarbonImmutable::createFromFormat('Y-m', $latestPeriod)->startOfMonth();
            $topEarners = EmployeeSalary::query()
                ->whereDate('period_start', $latestPeriodStart->toDateString())
                ->orderByRaw('CAST(penerimaan AS DECIMAL(20,2)) DESC')
                ->limit(5)
                ->get()
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'name' => $s->employee_name,
                    'unit' => $s->unit,
                    'penerimaan' => (float) ($s->penerimaan ?? 0),
                ])
                ->toArray();
        }

        $summary = EmployeeSalary::query()
            ->selectRaw('
                COUNT(DISTINCT simrs_nik) as unique_employees,
                COUNT(DISTINCT DATE_FORMAT(period_start, "%Y-%m")) as total_periods,
                COALESCE(SUM(CAST(penerimaan AS DECIMAL(20,2))), 0) as lifetime_penerimaan
            ')
            ->first();

        return Inertia::render('payroll/dashboard', [
            'trendData' => $trendData,
            'unitDistribution' => $unitDistribution,
            'yoyGrowth' => $yoyGrowth,
            'topEarners' => $topEarners,
            'summary' => [
                'unique_employees' => (int) ($summary->unique_employees ?? 0),
                'total_periods' => (int) ($summary->total_periods ?? 0),
                'lifetime_penerimaan' => (float) ($summary->lifetime_penerimaan ?? 0),
            ],
            'latestPeriod' => $latestPeriod,
        ]);
    }

    public function index(Request $request): Response|StreamedResponse
    {
        $user = $request->user();
        if (! $user?->isAdmin() && ! $user?->isStaff()) {
            abort(403, 'Hanya admin dan staff yang dapat melihat gaji.');
        }

        $period = $request->string('period')->toString();
        $q = trim($request->string('q')->toString());
        $unit = trim($request->string('unit')->toString());
        $sortBy = $request->string('sort')->toString();
        $sortDir = $request->string('dir')->toString() === 'asc' ? 'asc' : 'desc';
        $perPage = in_array($request->integer('per_page'), [25, 50, 100], true) ? $request->integer('per_page') : 25;

        $allowedSorts = ['period_start', 'simrs_nik', 'employee_name', 'unit', 'penerimaan', 'pajak', 'zakat'];

        $applyFilters = function ($query) use ($period, $q, $unit) {
            if ($period !== '') {
                try {
                    $periodStart = CarbonImmutable::createFromFormat('Y-m', $period)->startOfMonth();
                    $query->whereDate('period_start', $periodStart->toDateString());
                } catch (\Throwable) {
                    // Abaikan jika format tidak valid
                }
            }

            if ($q !== '') {
                $query->where(function ($sub) use ($q) {
                    $sub->where('employee_name', 'like', "%{$q}%")
                        ->orWhere('simrs_nik', 'like', "%{$q}%")
                        ->orWhere('npwp', 'like', "%{$q}%");
                });
            }

            if ($unit !== '') {
                $query->where('unit', 'like', "%{$unit}%");
            }

            return $query;
        };

        $query = $applyFilters(EmployeeSalary::query()->with('user'));

        if ($sortBy !== '' && in_array($sortBy, $allowedSorts, true)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('period_start', 'desc')->orderBy('employee_name', 'asc');
        }

        if ($request->string('export')->toString() === 'csv') {
            return $this->exportCsv($query);
        }

        $summary = $applyFilters(EmployeeSalary::query())
            ->selectRaw('
                COALESCE(SUM(CAST(penerimaan AS DECIMAL(20,2))), 0) as total_penerimaan,
                COALESCE(SUM(CAST(pajak AS DECIMAL(20,2))), 0) as total_pajak,
                COALESCE(SUM(CAST(zakat AS DECIMAL(20,2))), 0) as total_zakat,
                COUNT(*) as total_employees
            ')
            ->first();

        $comparison = null;
        if ($period !== '') {
            try {
                $currentPeriod = CarbonImmutable::createFromFormat('Y-m', $period)->startOfMonth();
                $prevPeriod = $currentPeriod->subMonth();

                $prevSummary = EmployeeSalary::query()
                    ->whereDate('period_start', $prevPeriod->toDateString())
                    ->when($q !== '', fn ($qb) => $qb->where(function ($sub) use ($q) {
                        $sub->where('employee_name', 'like', "%{$q}%")
                            ->orWhere('simrs_nik', 'like', "%{$q}%")
                            ->orWhere('npwp', 'like', "%{$q}%");
                    }))
                    ->when($unit !== '', fn ($qb) => $qb->where('unit', 'like', "%{$unit}%"))
                    ->selectRaw('
                        COALESCE(SUM(CAST(penerimaan AS DECIMAL(20,2))), 0) as total_penerimaan,
                        COALESCE(SUM(CAST(pajak AS DECIMAL(20,2))), 0) as total_pajak,
                        COALESCE(SUM(CAST(zakat AS DECIMAL(20,2))), 0) as total_zakat,
                        COUNT(*) as total_employees
                    ')
                    ->first();

                $prevPenerimaan = (float) ($prevSummary->total_penerimaan ?? 0);
                $currPenerimaan = (float) ($summary->total_penerimaan ?? 0);

                $comparison = [
                    'prev_period' => $prevPeriod->translatedFormat('F Y'),
                    'prev_penerimaan' => $prevPenerimaan,
                    'prev_pajak' => (float) ($prevSummary->total_pajak ?? 0),
                    'prev_zakat' => (float) ($prevSummary->total_zakat ?? 0),
                    'prev_employees' => (int) ($prevSummary->total_employees ?? 0),
                    'diff_penerimaan' => $currPenerimaan - $prevPenerimaan,
                    'diff_percent' => $prevPenerimaan > 0 ? round((($currPenerimaan - $prevPenerimaan) / $prevPenerimaan) * 100, 2) : 0,
                ];
            } catch (\Throwable) {
                // Abaikan jika parsing gagal
            }
        }

        $salaries = $query->paginate($perPage)->withQueryString();

        return Inertia::render('payroll/index', [
            'salaries' => $salaries,
            'filters' => [
                'period' => $period,
                'q' => $q,
                'unit' => $unit,
                'sort' => $sortBy,
                'dir' => $sortDir,
                'per_page' => $perPage,
            ],
            'summary' => [
                'total_penerimaan' => (float) ($summary->total_penerimaan ?? 0),
                'total_pajak' => (float) ($summary->total_pajak ?? 0),
                'total_zakat' => (float) ($summary->total_zakat ?? 0),
                'total_employees' => (int) ($summary->total_employees ?? 0),
            ],
            'comparison' => $comparison,
        ]);
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<EmployeeSalary>  $query
     */
    private function exportCsv(\Illuminate\Database\Eloquent\Builder $query): StreamedResponse
    {
        $filename = 'payroll-export-'.now()->format('Y-m-d-His').'.csv';

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');
            if ($handle === false) {
                return;
            }

            fputcsv($handle, [
                'Periode',
                'NIK',
                'Nama',
                'Unit',
                'NPWP',
                'Penerimaan',
                'Pajak',
                'Zakat',
            ]);

            $query->chunk(500, function ($salaries) use ($handle) {
                foreach ($salaries as $salary) {
                    fputcsv($handle, [
                        $salary->period_start?->toDateString(),
                        $salary->simrs_nik,
                        $salary->employee_name,
                        $salary->unit,
                        $salary->npwp,
                        $salary->penerimaan,
                        $salary->pajak,
                        $salary->zakat,
                    ]);
                }
            });

            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function show(Request $request, EmployeeSalary $employeeSalary): Response
    {
        $user = $request->user();
        if (! $user?->isAdmin() && ! $user?->isStaff()) {
            abort(403, 'Hanya admin dan staff yang dapat melihat gaji.');
        }

        $employeeSalary->load(['user', 'importer', 'pegawai']);

        $masaKerja = $this->calculateMasaKerja($employeeSalary);
        $gajiBersih = PayrollSlipMath::resolveGajiBersih($employeeSalary);

        return Inertia::render('payroll/show', [
            'salary' => [
                'id' => $employeeSalary->id,
                'period_start' => $employeeSalary->period_start?->toDateString(),
                'simrs_nik' => $employeeSalary->simrs_nik,
                'employee_name' => $employeeSalary->employee_name,
                'unit' => $employeeSalary->unit,
                'npwp' => $employeeSalary->npwp ?? $employeeSalary->pegawai?->npwp,
                'penerimaan' => $employeeSalary->penerimaan,
                'pembulatan' => $employeeSalary->pembulatan,
                'pajak' => $employeeSalary->pajak,
                'zakat' => $employeeSalary->zakat,
                'terbilang' => $this->spellCurrency((string) $gajiBersih),
                'masa_kerja' => $masaKerja,
                'raw_row' => $employeeSalary->raw_row,
            ],
        ]);
    }

    public function print(Request $request, EmployeeSalary $employeeSalary): Response
    {
        $user = $request->user();
        if (! $user?->isAdmin() && ! $user?->isStaff()) {
            abort(403, 'Hanya admin dan staff yang dapat melihat gaji.');
        }

        $employeeSalary->load(['user', 'importer']);

        $masaKerja = $this->calculateMasaKerja($employeeSalary);
        $gajiBersih = PayrollSlipMath::resolveGajiBersih($employeeSalary);

        return Inertia::render('payroll/print', [
            'salary' => [
                'id' => $employeeSalary->id,
                'period_start' => $employeeSalary->period_start?->toDateString(),
                'simrs_nik' => $employeeSalary->simrs_nik,
                'employee_name' => $employeeSalary->employee_name,
                'unit' => $employeeSalary->unit,
                'npwp' => $employeeSalary->npwp ?? $employeeSalary->pegawai?->npwp,
                'penerimaan' => $employeeSalary->penerimaan,
                'pembulatan' => $employeeSalary->pembulatan,
                'pajak' => $employeeSalary->pajak,
                'zakat' => $employeeSalary->zakat,
                'terbilang' => $this->spellCurrency((string) $gajiBersih),
                'masa_kerja' => $masaKerja,
                'raw_row' => $employeeSalary->raw_row,
            ],
        ]);
    }

    public function create(): Response
    {
        $user = request()->user();
        if (! $user?->isAdmin() && ! $user?->isStaff()) {
            abort(403, 'Hanya admin dan staff yang dapat mengimpor gaji.');
        }

        return Inertia::render('payroll/import');
    }

    public function importHistory(Request $request): Response
    {
        $user = $request->user();
        if (! $user?->isAdmin() && ! $user?->isStaff()) {
            abort(403, 'Hanya admin dan staff yang dapat melihat riwayat import.');
        }

        $imports = PayrollImport::query()
            ->with(['importer', 'approver'])
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->through(fn (PayrollImport $import) => [
                'id' => $import->id,
                'period_start' => $import->period_start?->toDateString(),
                'period_label' => $import->period_start?->translatedFormat('F Y'),
                'filename' => $import->filename,
                'total_rows' => $import->total_rows,
                'imported_count' => $import->imported_count,
                'skipped_count' => $import->skipped_count,
                'warning_count' => $import->warning_count,
                'status' => $import->status,
                'approval_status' => $import->approval_status,
                'approver_name' => $import->approver?->name,
                'approved_at' => $import->approved_at?->diffForHumans(),
                'approval_notes' => $import->approval_notes,
                'importer_name' => $import->importer?->name,
                'created_at' => $import->created_at?->diffForHumans(),
                'rolled_back_at' => $import->rolled_back_at?->diffForHumans(),
            ]);

        $pendingCount = PayrollImport::query()
            ->where('approval_status', 'pending')
            ->where('status', 'completed')
            ->count();

        return Inertia::render('payroll/import-history', [
            'imports' => $imports,
            'pendingCount' => $pendingCount,
        ]);
    }

    public function auditLogs(Request $request): Response
    {
        $user = $request->user();
        if (! $user?->isAdmin()) {
            abort(403, 'Hanya admin yang dapat melihat audit log.');
        }

        $query = PayrollAuditLog::query()->with('user');

        if ($action = $request->string('action')->toString()) {
            $query->where('action', $action);
        }

        if ($userId = $request->integer('user_id')) {
            $query->where('user_id', $userId);
        }

        if ($dateFrom = $request->string('date_from')->toString()) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo = $request->string('date_to')->toString()) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $logs = $query
            ->orderBy('created_at', 'desc')
            ->paginate(50)
            ->through(fn (PayrollAuditLog $log) => [
                'id' => $log->id,
                'user_name' => $log->user?->name ?? 'System',
                'action' => $log->action,
                'action_label' => $log->action_label,
                'action_color' => $log->action_color,
                'model_type' => class_basename($log->model_type ?? ''),
                'model_id' => $log->model_id,
                'old_values' => $log->old_values,
                'new_values' => $log->new_values,
                'description' => $log->description,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at?->format('d M Y H:i:s'),
                'created_at_diff' => $log->created_at?->diffForHumans(),
            ]);

        $actions = PayrollAuditLog::query()
            ->selectRaw('action, COUNT(*) as count')
            ->groupBy('action')
            ->orderBy('count', 'desc')
            ->pluck('count', 'action')
            ->toArray();

        $users = User::query()
            ->whereIn('id', PayrollAuditLog::query()->distinct()->pluck('user_id'))
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('payroll/audit-logs', [
            'logs' => $logs,
            'actions' => $actions,
            'users' => $users,
            'filters' => [
                'action' => $request->string('action')->toString(),
                'user_id' => $request->integer('user_id'),
                'date_from' => $request->string('date_from')->toString(),
                'date_to' => $request->string('date_to')->toString(),
            ],
        ]);
    }

    public function rollbackImport(Request $request, PayrollImport $payrollImport): RedirectResponse
    {
        $user = $request->user();
        if (! $user?->isAdmin()) {
            abort(403, 'Hanya admin yang dapat melakukan rollback.');
        }

        if ($payrollImport->isRolledBack()) {
            return redirect()
                ->route('payroll.import-history')
                ->with('error', 'Import ini sudah di-rollback sebelumnya.');
        }

        $deleted = EmployeeSalary::query()
            ->where('import_id', $payrollImport->id)
            ->delete();

        $payrollImport->update([
            'status' => 'rolled_back',
            'rolled_back_at' => now(),
            'rolled_back_by' => $user->id,
        ]);

        PayrollAuditLog::log(
            'rolled_back',
            $payrollImport,
            ['status' => 'completed'],
            ['status' => 'rolled_back'],
            "Rollback import payroll periode {$payrollImport->period_start?->translatedFormat('F Y')} - {$deleted} data dihapus"
        );

        return redirect()
            ->route('payroll.import-history')
            ->with('success', "{$deleted} data gaji berhasil di-rollback.");
    }

    public function approveImport(Request $request, PayrollImport $payrollImport): RedirectResponse
    {
        $user = $request->user();
        if (! $user?->isAdmin()) {
            abort(403, 'Hanya admin yang dapat menyetujui payroll.');
        }

        if (! $payrollImport->isPendingApproval()) {
            return redirect()
                ->route('payroll.import-history')
                ->with('error', 'Import ini sudah diproses sebelumnya.');
        }

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $payrollImport->update([
            'approval_status' => 'approved',
            'approved_by' => $user->id,
            'approved_at' => now(),
            'approval_notes' => $validated['notes'] ?? null,
        ]);

        PayrollAuditLog::log(
            'approved',
            $payrollImport,
            ['approval_status' => 'pending'],
            ['approval_status' => 'approved'],
            "Menyetujui import payroll periode {$payrollImport->period_start?->translatedFormat('F Y')}"
        );

        return redirect()
            ->route('payroll.import-history')
            ->with('success', "Import {$payrollImport->period_start?->translatedFormat('F Y')} berhasil disetujui.");
    }

    public function rejectImport(Request $request, PayrollImport $payrollImport): RedirectResponse
    {
        $user = $request->user();
        if (! $user?->isAdmin()) {
            abort(403, 'Hanya admin yang dapat menolak payroll.');
        }

        if (! $payrollImport->isPendingApproval()) {
            return redirect()
                ->route('payroll.import-history')
                ->with('error', 'Import ini sudah diproses sebelumnya.');
        }

        $validated = $request->validate([
            'notes' => ['required', 'string', 'max:500'],
        ], [
            'notes.required' => 'Alasan penolakan wajib diisi.',
        ]);

        $payrollImport->update([
            'approval_status' => 'rejected',
            'approved_by' => $user->id,
            'approved_at' => now(),
            'approval_notes' => $validated['notes'],
        ]);

        PayrollAuditLog::log(
            'rejected',
            $payrollImport,
            ['approval_status' => 'pending'],
            ['approval_status' => 'rejected', 'notes' => $validated['notes']],
            "Menolak import payroll periode {$payrollImport->period_start?->translatedFormat('F Y')}: {$validated['notes']}"
        );

        return redirect()
            ->route('payroll.import-history')
            ->with('success', "Import {$payrollImport->period_start?->translatedFormat('F Y')} ditolak.");
    }

    public function sendEmail(Request $request, EmployeeSalary $employeeSalary): JsonResponse
    {
        $user = $request->user();
        if (! $user?->isAdmin() && ! $user?->isStaff()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        SendPayslipEmail::dispatch($employeeSalary, $validated['email']);

        PayrollAuditLog::log(
            'email_sent',
            $employeeSalary,
            null,
            ['email' => $validated['email']],
            "Mengirim slip gaji ke {$validated['email']} untuk {$employeeSalary->employee_name}"
        );

        return response()->json([
            'success' => true,
            'message' => "Email slip gaji akan dikirim ke {$validated['email']}",
        ]);
    }

    public function sendBulkEmail(Request $request): JsonResponse
    {
        $user = $request->user();
        if (! $user?->isAdmin() && ! $user?->isStaff()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'salary_ids' => ['required', 'array', 'min:1'],
            'salary_ids.*' => ['required', 'integer', 'exists:employee_salaries,id'],
        ]);

        $salaries = EmployeeSalary::query()
            ->whereIn('id', $validated['salary_ids'])
            ->with('user')
            ->get();

        $queued = 0;
        $skipped = 0;
        $errors = [];

        foreach ($salaries as $salary) {
            $email = $salary->user?->email;

            if (! $email || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $skipped++;
                $errors[] = "{$salary->employee_name} ({$salary->simrs_nik}): tidak ada email valid";

                continue;
            }

            SendPayslipEmail::dispatch($salary, $email);
            $queued++;
        }

        if ($queued > 0) {
            PayrollAuditLog::log(
                'email_sent',
                null,
                null,
                ['queued' => $queued, 'skipped' => $skipped],
                "Mengirim slip gaji massal ke {$queued} pegawai"
            );
        }

        return response()->json([
            'success' => true,
            'queued' => $queued,
            'skipped' => $skipped,
            'errors' => $errors,
            'message' => "{$queued} email dijadwalkan untuk dikirim. {$skipped} dilewati.",
        ]);
    }

    public function store(Request $request, EmployeeSalaryImportService $importer): RedirectResponse
    {
        $user = $request->user();
        if (! $user?->isAdmin() && ! $user?->isStaff()) {
            abort(403, 'Hanya admin dan staff yang dapat mengimpor gaji.');
        }

        $validated = $request->validate([
            'period' => ['required', 'date_format:Y-m'],
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ], [
            'period.required' => 'Periode wajib diisi (format: YYYY-MM).',
            'period.date_format' => 'Format periode harus YYYY-MM (contoh: 2025-12).',
            'file.required' => 'File CSV wajib diupload.',
            'file.file' => 'File upload tidak valid.',
            'file.mimes' => 'File harus CSV.',
            'file.max' => 'Ukuran file maksimal 10MB.',
        ]);

        $periodStart = CarbonImmutable::createFromFormat('Y-m', (string) $validated['period'])
            ->startOfMonth()
            ->toDateString();

        $uploadedFile = $request->file('file');
        $path = $uploadedFile?->getRealPath();
        if (! is_string($path)) {
            return redirect()
                ->route('payroll.import')
                ->with('error', 'File tidak bisa dibaca.');
        }

        $filename = $uploadedFile?->getClientOriginalName();
        $result = $importer->importFromCsv($path, $periodStart, $user?->id, $filename);

        $payrollImport = PayrollImport::query()->find($result['import_id']);

        PayrollAuditLog::log(
            'imported',
            $payrollImport,
            null,
            [
                'period' => $periodStart,
                'filename' => $filename,
                'imported' => $result['imported'],
                'skipped' => $result['skipped'],
                'warnings' => count($result['warnings']),
            ],
            "Import payroll periode {$periodStart} - {$result['imported']} data berhasil, {$result['skipped']} dilewati"
        );

        $message = "Import gaji berhasil. Imported: {$result['imported']}, Skipped: {$result['skipped']}.";

        $redirect = redirect()
            ->route('payroll.import')
            ->with('success', $message);

        if (count($result['warnings']) > 0) {
            $redirect->with('warnings', $result['warnings']);
        }

        return $redirect;
    }

    public function update(Request $request, EmployeeSalary $employeeSalary): RedirectResponse
    {
        $user = $request->user();
        if (! $user?->isAdmin() && ! $user?->isStaff()) {
            abort(403, 'Hanya admin dan staff yang dapat mengubah gaji.');
        }

        $validated = $request->validate([
            'simrs_nik' => ['required', 'string', 'max:50'],
            'employee_name' => ['nullable', 'string', 'max:255'],
            'unit' => ['nullable', 'string', 'max:255'],
            'npwp' => ['nullable', 'string', 'max:100'],
            'penerimaan' => ['nullable', 'numeric', 'min:0'],
            'pajak' => ['nullable', 'numeric', 'min:0'],
            'zakat' => ['nullable', 'numeric', 'min:0'],
        ]);

        $employeeSalary->fill($validated);
        $employeeSalary->save();

        return redirect()
            ->route('payroll.show', $employeeSalary)
            ->with('success', 'Data gaji berhasil diperbarui.');
    }

    public function destroy(Request $request, EmployeeSalary $employeeSalary): RedirectResponse
    {
        $user = $request->user();
        if (! $user?->isAdmin() && ! $user?->isStaff()) {
            abort(403, 'Hanya admin dan staff yang dapat menghapus gaji.');
        }

        PayrollAuditLog::log(
            'deleted',
            $employeeSalary,
            $employeeSalary->toArray(),
            null,
            "Menghapus data gaji {$employeeSalary->employee_name} ({$employeeSalary->simrs_nik}) periode {$employeeSalary->period_start?->format('Y-m')}"
        );

        $employeeSalary->delete();

        return redirect()
            ->route('payroll.index')
            ->with('success', 'Data gaji berhasil dihapus.');
    }

    public function employeeHistory(Request $request, string $nik): Response
    {
        $user = $request->user();
        if (! $user?->isAdmin() && ! $user?->isStaff()) {
            abort(403, 'Hanya admin dan staff yang dapat melihat gaji.');
        }

        $salaries = EmployeeSalary::query()
            ->where('simrs_nik', $nik)
            ->orderBy('period_start', 'desc')
            ->get();

        if ($salaries->isEmpty()) {
            abort(404, 'Data gaji tidak ditemukan untuk NIK ini.');
        }

        $firstSalary = $salaries->first();
        $pegawai = $firstSalary?->pegawai;

        $stats = [
            'total_periods' => $salaries->count(),
            'avg_penerimaan' => $salaries->avg(fn ($s) => (float) ($s->penerimaan ?? 0)),
            'max_penerimaan' => $salaries->max(fn ($s) => (float) ($s->penerimaan ?? 0)),
            'min_penerimaan' => $salaries->min(fn ($s) => (float) ($s->penerimaan ?? 0)),
            'total_penerimaan' => $salaries->sum(fn ($s) => (float) ($s->penerimaan ?? 0)),
            'total_pajak' => $salaries->sum(fn ($s) => (float) ($s->pajak ?? 0)),
            'total_zakat' => $salaries->sum(fn ($s) => (float) ($s->zakat ?? 0)),
        ];

        $chartData = $salaries->reverse()->map(fn ($s) => [
            'period' => $s->period_start?->format('M Y'),
            'penerimaan' => (float) ($s->penerimaan ?? 0),
            'pajak' => (float) ($s->pajak ?? 0),
            'zakat' => (float) ($s->zakat ?? 0),
        ])->values();

        return Inertia::render('payroll/employee-history', [
            'nik' => $nik,
            'employee' => [
                'name' => $firstSalary?->employee_name,
                'unit' => $firstSalary?->unit ?? $pegawai?->departemen,
                'npwp' => $firstSalary?->npwp ?? $pegawai?->npwp,
                'mulai_kerja' => $pegawai?->mulai_kerja,
            ],
            'salaries' => $salaries->map(fn ($s) => [
                'id' => $s->id,
                'period_start' => $s->period_start?->toDateString(),
                'period_label' => $s->period_start?->translatedFormat('F Y'),
                'penerimaan' => $s->penerimaan,
                'pajak' => $s->pajak,
                'zakat' => $s->zakat,
            ]),
            'stats' => $stats,
            'chartData' => $chartData,
        ]);
    }

    public function bulkDestroy(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user?->isAdmin() && ! $user?->isStaff()) {
            abort(403, 'Hanya admin dan staff yang dapat menghapus gaji.');
        }

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer', 'exists:employee_salaries,id'],
        ]);

        $count = EmployeeSalary::query()
            ->whereIn('id', $validated['ids'])
            ->delete();

        PayrollAuditLog::log(
            'bulk_deleted',
            null,
            ['ids' => $validated['ids']],
            null,
            "Menghapus {$count} data gaji sekaligus"
        );

        return redirect()
            ->route('payroll.index')
            ->with('success', "{$count} data gaji berhasil dihapus.");
    }

    /**
     * @return array{years:int, months:int, days:int}|null
     */
    private function calculateMasaKerja(EmployeeSalary $salary): ?array
    {
        $pegawai = $salary->pegawai ?? $salary->pegawai()->first();
        $mulaiKerja = $pegawai?->mulai_kerja;

        if (! $mulaiKerja) {
            return null;
        }

        try {
            $start = CarbonImmutable::parse($mulaiKerja)->startOfDay();
        } catch (\Throwable) {
            return null;
        }

        // Sama dengan API (`EmployeeSalaryController`): tanggal referensi = `period_start` slip, bukan hari ini.
        $end = $salary->period_start !== null
            ? CarbonImmutable::parse($salary->period_start)->startOfDay()
            : CarbonImmutable::now()->startOfDay();

        if ($start > $end) {
            return null;
        }

        $diff = $start->diff($end);

        return [
            'years' => $diff->y,
            'months' => $diff->m,
            'days' => $diff->d,
        ];
    }

    private function spellCurrency(?string $amount): ?string
    {
        if ($amount === null || $amount === '') {
            return null;
        }

        $number = (int) round((float) $amount);
        if ($number === 0) {
            return 'nol rupiah';
        }

        $units = ['', 'ribu', 'juta', 'miliar', 'triliun'];

        $words = '';
        $unitIndex = 0;

        while ($number > 0 && $unitIndex < count($units)) {
            $group = $number % 1000;
            if ($group > 0) {
                $groupWords = $this->spellThreeDigits($group);
                if ($unitIndex === 1 && $group === 1) {
                    $words = 'seribu'.($words !== '' ? ' '.$words : '');
                } else {
                    $wordsPart = trim($groupWords.' '.$units[$unitIndex]);
                    $words = $wordsPart.($words !== '' ? ' '.$words : '');
                }
            }

            $number = (int) floor($number / 1000);
            $unitIndex++;
        }

        return trim($words).' rupiah';
    }

    private function spellThreeDigits(int $number): string
    {
        $ones = [
            '', 'satu', 'dua', 'tiga', 'empat',
            'lima', 'enam', 'tujuh', 'delapan', 'sembilan',
        ];

        $result = '';

        $hundreds = (int) floor($number / 100);
        $remainder = $number % 100;

        if ($hundreds > 0) {
            if ($hundreds === 1) {
                $result .= 'seratus';
            } else {
                $result .= $ones[$hundreds].' ratus';
            }
        }

        if ($remainder > 0) {
            if ($result !== '') {
                $result .= ' ';
            }

            if ($remainder < 10) {
                $result .= $ones[$remainder];
            } elseif ($remainder < 20) {
                if ($remainder === 10) {
                    $result .= 'sepuluh';
                } elseif ($remainder === 11) {
                    $result .= 'sebelas';
                } else {
                    $result .= $ones[$remainder - 10].' belas';
                }
            } else {
                $tens = (int) floor($remainder / 10);
                $onesDigit = $remainder % 10;
                $result .= $ones[$tens].' puluh';
                if ($onesDigit > 0) {
                    $result .= ' '.$ones[$onesDigit];
                }
            }
        }

        return trim($result);
    }
}
