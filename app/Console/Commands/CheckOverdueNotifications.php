<?php

namespace App\Console\Commands;

use App\Models\DashboardNotification;
use App\Models\Ticket;
use Illuminate\Console\Command;

class CheckOverdueNotifications extends Command
{
    protected $signature = 'notifications:check-overdue';
    protected $description = 'Check for overdue tickets and create notifications';

    public function handle(): int
    {
        // SLA Warning - tickets due within 1 hour
        $slaWarning = Ticket::query()
            ->open()
            ->whereNotNull('resolution_due_at')
            ->where('resolution_due_at', '>', now())
            ->where('resolution_due_at', '<=', now()->addHour())
            ->get();

        foreach ($slaWarning as $ticket) {
            if ($ticket->assignee_id) {
                // Check if notification already exists
                $exists = DashboardNotification::where('target_id', $ticket->id)
                    ->where('type', 'sla_warning')
                    ->exists();

                if (!$exists) {
                    DashboardNotification::create([
                        'user_id' => $ticket->assignee_id,
                        'type' => 'sla_warning',
                        'title' => 'SLA Warning: ' . $ticket->ticket_number,
                        'description' => 'Ticket will be overdue within 1 hour',
                        'target_type' => 'App\\Models\\Ticket',
                        'target_id' => $ticket->id
                    ]);
                }
            }
        }

        // Overdue Alert
        $overdue = Ticket::query()
            ->open()
            ->whereNotNull('resolution_due_at')
            ->where('resolution_due_at', '<', now())
            ->get();

        foreach ($overdue as $ticket) {
            if ($ticket->assignee_id) {
                // Check if notification already exists
                $exists = DashboardNotification::where('target_id', $ticket->id)
                    ->where('type', 'overdue')
                    ->exists();

                if (!$exists) {
                    DashboardNotification::create([
                        'user_id' => $ticket->assignee_id,
                        'type' => 'overdue',
                        'title' => 'Overdue: ' . $ticket->ticket_number,
                        'description' => 'Ticket is past its deadline',
                        'target_type' => 'App\\Models\\Ticket',
                        'target_id' => $ticket->id
                    ]);
                }
            }
        }

        // Draft Reminder - drafts not published in 24 hours
        $drafts = Ticket::query()
            ->where('is_draft', true)
            ->where('created_at', '<', now()->subDay())
            ->get();

        foreach ($drafts as $draft) {
            if ($draft->requester_id) {
                $exists = DashboardNotification::where('target_id', $draft->id)
                    ->where('type', 'draft_reminder')
                    ->exists();

                if (!$exists) {
                    DashboardNotification::create([
                        'user_id' => $draft->requester_id,
                        'type' => 'draft_reminder',
                        'title' => 'Draft Reminder: ' . $draft->ticket_number,
                        'description' => 'Your draft ticket has not been published',
                        'target_type' => 'App\\Models\\Ticket',
                        'target_id' => $draft->id
                    ]);
                }
            }
        }

        $this->info('Notifications checked. SLA: ' . $slaWarning->count() . ', Overdue: ' . $overdue->count() . ', Drafts: ' . $drafts->count());

        return 0;
    }
}