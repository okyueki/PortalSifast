<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TextAnalyzerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardTextAnalyticsController extends Controller
{
    public function __construct(
        private TextAnalyzerService $textAnalyzer
    ) {}

    public function index(Request $request): JsonResponse
    {
        $days = (int) $request->get('days', 30);
        $days = max(7, min(365, $days)); // clamp between 7-365 days

        $results = $this->textAnalyzer->analyze($days);

        return response()->json($results);
    }
}
