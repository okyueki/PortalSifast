<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TechnicianReportPrintController extends TechnicianReportController
{
    public function __invoke(Request $request): Response
    {
        $data = $this->reportData($request);

        return Inertia::render('reports/technician-print', array_merge($data, [
            'generatedAt' => now()->toIso8601String(),
        ]));
    }
}
