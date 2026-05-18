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
    if ($user === null) {
        return false;
    }
    try {
        return Conversation::find($conversationId)?->participants()->where('user_id', $user->id)->exists() ?? false;
    } catch (\Throwable) {
        return false;
    }
});

// ============================================================================
// Emergency Command Center Channels
// ============================================================================

// Command Center: semua admin/staff bisa subscribe
Broadcast::channel('emergency.command-center', function ($user) {
    if ($user === null) {
        return false;
    }
    return $user->isAdmin() || $user->isStaff();
});

// Report-specific channel: pelapor, operator yang ditugaskan, atau admin/staff
Broadcast::channel('emergency.report.{reportId}', function ($user, $reportId) {
    if ($user === null) {
        return false;
    }
    try {
        $report = \App\Models\EmergencyReport::where('report_id', $reportId)->first();
        if (!$report) {
            return false;
        }
        // Owner (pelapor) atau assigned operator atau admin/staff
        return $report->user_id === $user->id
            || $report->assigned_operator_id === $user->id
            || $user->isAdmin()
            || $user->isStaff();
    } catch (\Throwable) {
        return false;
    }
});

// Officer tracking channel: petugas yang ditugaskan atau admin/staff
Broadcast::channel('emergency.officer.{reportId}', function ($user, $reportId) {
    if ($user === null) {
        return false;
    }
    try {
        $report = \App\Models\EmergencyReport::where('report_id', $reportId)->first();
        if (!$report) {
            return false;
        }
        return $report->assigned_operator_id === $user->id
            || $user->isAdmin()
            || $user->isStaff();
    } catch (\Throwable) {
        return false;
    }
});
