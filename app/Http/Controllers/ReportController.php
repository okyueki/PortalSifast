<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    /**
     * Daftar menu laporan (index).
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('reports/index', [
            'canAccessSlaReport' => ! $user->isPemohon(),
            'canAccessEmergencyReport' => $user->isAdmin() || $user->isStaff(),
            'canAccessDepartmentReport' => ! $user->isPemohon(),
        ]);
    }
}
