<?php

namespace App\Broadcasting\Channels;

use App\Models\User;

class UserPresenceChannel
{
    /**
     * Authenticate the user's access to the channel.
     *
     * @return array<string, mixed>|false
     */
    public function join(?User $user): array|false
    {
        if ($user === null) {
            return false;
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar_url ?? null,
            'last_seen' => now()->toISOString(),
        ];
    }
}
