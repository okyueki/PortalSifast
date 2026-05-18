<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ImportEmployeeSalariesRequest;
use App\Services\EmployeeSalaryImportService;
use App\Services\FcmNotificationService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;

class EmployeeSalaryImportController extends Controller
{
    public function __invoke(ImportEmployeeSalariesRequest $request, EmployeeSalaryImportService $importer, FcmNotificationService $fcm): JsonResponse
    {
        $periodStart = CarbonImmutable::createFromFormat('Y-m', $request->string('period')->toString())
            ->startOfMonth()
            ->toDateString();

        $file = $request->file('file');
        $path = $file->getRealPath();

        if (! is_string($path)) {
            return response()->json(['message' => 'File tidak bisa dibaca.'], 422);
        }

        $result = $importer->importFromCsv($path, $periodStart, $request->user()?->id);

        // Notify payroll staff about new import pending approval
        $fcm->sendToPayrollStaff(
            'Import Gaji Baru',
            "Import payroll {$result['imported']} data ({$result['imported']} imported) periode {$periodStart} menunggu persetujuan.",
            [
                'type' => 'payroll_import_pending',
                'import_id' => $result['import_id'],
                'period' => $periodStart,
                'imported_count' => $result['imported'],
            ]
        );

        return response()->json([
            'message' => 'Import gaji berhasil.',
            'period_start' => $periodStart,
            ...$result,
        ]);
    }
}
