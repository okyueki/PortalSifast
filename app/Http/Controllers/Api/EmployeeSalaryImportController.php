<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\ImportEmployeeSalariesRequest;
use App\Services\EmployeeSalaryImportService;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;

class EmployeeSalaryImportController extends Controller
{
    public function __invoke(ImportEmployeeSalariesRequest $request, EmployeeSalaryImportService $importer): JsonResponse
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

        return response()->json([
            'message' => 'Import gaji berhasil.',
            'period_start' => $periodStart,
            ...$result,
        ]);
    }
}
