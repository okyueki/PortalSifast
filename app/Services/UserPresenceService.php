<?php

namespace App\Services;

use App\Models\User;
use App\Broadcasting\UserOnlineEvent;
use App\Broadcasting\UserOfflineEvent;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class UserPresenceService
{
    private const CACHE_KEY = 'online_users';
    private const USER_CACHE_PREFIX = 'user_online_';
    private const CACHE_TTL = 300; // 5 minutes

    /**
     * Set user as online
     */
    public function setUserOnline(User $user): void
    {
        Cache::put(self::USER_CACHE_PREFIX . $user->id, true, self::CACHE_TTL);
        
        // Update online users list
        $this->updateOnlineUsersList();
        
        // Broadcast user online event
        try {
            broadcast(new UserOnlineEvent($user));
        } catch (\Exception $e) {
            Log::error('Failed to broadcast user online event', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Set user as offline
     */
    public function setUserOffline(User $user): void
    {
        Cache::forget(self::USER_CACHE_PREFIX . $user->id);
        
        // Update online users list
        $this->updateOnlineUsersList();
        
        // Broadcast user offline event
        try {
            broadcast(new UserOfflineEvent($user));
        } catch (\Exception $e) {
            Log::error('Failed to broadcast user offline event', [
                'user_id' => $user->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Check if user is online
     */
    public function isUserOnline(User $user): bool
    {
        return Cache::has(self::USER_CACHE_PREFIX . $user->id);
    }

    /**
     * Get all online users
     */
    public function getOnlineUsers(): array
    {
        return Cache::get(self::CACHE_KEY, []);
    }

    /**
     * Update online users list
     */
    private function updateOnlineUsersList(): void
    {
        // Get all user IDs that are marked as online
        $onlineUserIds = [];
        for ($i = 1; $i <= 1000; $i++) { // Assuming max 1000 users
            if (Cache::has(self::USER_CACHE_PREFIX . $i)) {
                $onlineUserIds[] = $i;
            }
        }

        if (empty($onlineUserIds)) {
            Cache::put(self::CACHE_KEY, [], self::CACHE_TTL);
            return;
        }

        // Get user details for online users
        $onlineUsers = User::whereIn('id', $onlineUserIds)
            ->get(['id', 'name', 'email'])
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => null, // No avatar field in database
                    'last_seen' => now()->toISOString(),
                ];
            })
            ->toArray();

        Cache::put(self::CACHE_KEY, $onlineUsers, self::CACHE_TTL);
    }

    /**
     * Get online users count
     */
    public function getOnlineUsersCount(): int
    {
        return count($this->getOnlineUsers());
    }

    /**
     * Cleanup offline users (run via scheduler)
     */
    public function cleanupOfflineUsers(): void
    {
        // This will be handled automatically by cache expiration
        // But we can also cleanup any stale entries
        $onlineUsers = $this->getOnlineUsers();
        
        foreach ($onlineUsers as $user) {
            $userId = $user['id'];
            if (!Cache::has(self::USER_CACHE_PREFIX . $userId)) {
                $this->setUserOffline(User::find($userId));
            }
        }
    }
}
