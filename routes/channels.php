<?php

use Illuminate\Support\Facades\Broadcast;
use App\Broadcasting\Channels\UserPresenceChannel;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Presence channel untuk tracking user online
Broadcast::channel('presence.users', UserPresenceChannel::class);
