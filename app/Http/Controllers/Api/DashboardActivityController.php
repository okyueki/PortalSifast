<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardActivityController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 20);
        $filter = $request->input('filter', 'all');

        $query = ActivityLog::with('user:id,name')
            ->orderBy('created_at', 'desc');

        if ($filter !== 'all') {
            $query->where('type', $filter);
        }

        $activities = $query->paginate($perPage);

        return response()->json([
            'data' => $activities->items(),
            'next_cursor' => $activities->hasMorePages() ? $activities->currentPage() + 1 : null
        ]);
    }
}