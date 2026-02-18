<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\UserPresenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserPresenceController extends Controller
{
    public function __construct(
        private UserPresenceService $userPresenceService
    ) {}

    /**
     * Get all online users
     */
    public function index(Request $request): JsonResponse
    {
        $onlineUsers = $this->userPresenceService->getOnlineUsers();
        $onlineCount = $this->userPresenceService->getOnlineUsersCount();

        return response()->json([
            'users' => $onlineUsers,
            'count' => $onlineCount,
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Get online users count
     */
    public function count(Request $request): JsonResponse
    {
        $count = $this->userPresenceService->getOnlineUsersCount();

        return response()->json([
            'count' => $count,
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * Check if specific user is online
     */
    public function check(Request $request, int $userId): JsonResponse
    {
        $user = \App\Models\User::findOrFail($userId);
        $isOnline = $this->userPresenceService->isUserOnline($user);

        return response()->json([
            'user_id' => $userId,
            'online' => $isOnline,
            'timestamp' => now()->toISOString(),
        ]);
    }
}
