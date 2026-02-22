<?php

namespace App\Broadcasting;

use App\Models\User;
use Illuminate\Broadcasting\Channel;

class UserPresenceChannel
{
    /**
     * Authenticate the user's access to the channel.
     */
    public function join(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar_url ?? null,
            'last_seen' => now()->toISOString(),
        ];
    }
}
