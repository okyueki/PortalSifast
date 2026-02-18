<?php

namespace App\Http\Middleware;

use App\Services\UserPresenceService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TrackUserActivity
{
    public function __construct(
        private UserPresenceService $userPresenceService
    ) {}

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Only track authenticated users
        if (Auth::check() && $request->isMethod('GET')) {
            $user = Auth::user();
            
            // Update last activity and set as online
            $user->update(['last_activity_at' => now()]);
            $this->userPresenceService->setUserOnline($user);
        }

        return $response;
    }
}
