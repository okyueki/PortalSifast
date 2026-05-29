<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DashboardNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardNotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $notifications = DashboardNotification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        $unreadCount = DashboardNotification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'data' => $notifications,
            'unread_count' => $unreadCount
        ]);
    }

    public function markAsRead(Request $request): JsonResponse
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer'
        ]);

        DashboardNotification::whereIn('id', $request->ids)
            ->where('user_id', $request->user()->id)
            ->update(['is_read' => true]);

        return response()->json(['success' => true]);
    }
}