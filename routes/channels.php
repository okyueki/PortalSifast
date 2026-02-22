<?php

use App\Broadcasting\Channels\UserPresenceChannel;
use App\Models\Conversation;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Presence channel untuk tracking user online
Broadcast::channel('presence.users', UserPresenceChannel::class);

// Private channel chat: hanya participant yang boleh listen
Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    return Conversation::find($conversationId)?->participants()->where('user_id', $user->id)->exists() ?? false;
});
