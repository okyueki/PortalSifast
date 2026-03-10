<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentReportPrintController extends DepartmentReportController
{
    public function __invoke(Request $request): Response
    {
        return Inertia::render('reports/department-print', array_merge(
            $this->reportProps($request),
            [
                'generatedAt' => now()->toIso8601String(),
            ]
        ));
    }
}
