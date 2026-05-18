<?php

namespace App\Events;

use App\Models\EmergencyReport;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class EmergencyReportCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public EmergencyReport $report
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('emergency.command-center'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'EmergencyReportCreated';
    }

    public function broadcastWith(): array
    {
        return [
            'report_id' => $this->report->report_id,
            'category' => $this->report->category,
            'latitude' => (float) $this->report->latitude,
            'longitude' => (float) $this->report->longitude,
            'address' => $this->report->address,
            'sender_name' => $this->report->sender_name,
            'sender_phone' => $this->report->sender_phone,
            'status' => $this->report->status,
            'created_at' => $this->report->created_at->toIso8601String(),
        ];
    }
}