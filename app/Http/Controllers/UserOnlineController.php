<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\UserPresenceService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserOnlineController extends Controller
{
    public function __construct(
        private UserPresenceService $userPresenceService
    ) {}

    /**
     * Display user online page
     */
    public function index(Request $request): Response
    {
        $onlineUsers = $this->userPresenceService->getOnlineUsers();
        $onlineCount = $this->userPresenceService->getOnlineUsersCount();

        return Inertia::render('users/online', [
            'onlineUsers' => $onlineUsers,
            'onlineCount' => $onlineCount,
            'timestamp' => now()->toISOString(),
        ]);
    }

    /**
     * API endpoint for online users
     */
    public function api(Request $request): \Illuminate\Http\JsonResponse
    {
        $onlineUsers = $this->userPresenceService->getOnlineUsers();
        $onlineCount = $this->userPresenceService->getOnlineUsersCount();

        return response()->json([
            'users' => $onlineUsers,
            'count' => $onlineCount,
            'timestamp' => now()->toISOString(),
        ]);
    }
}
