<?php

namespace App\Events;

use App\Models\EmergencyReport;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class EmergencyReportStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public EmergencyReport $report,
        public string $previousStatus,
        public ?string $operatorName = null
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('emergency.command-center'),
            new PrivateChannel('emergency.report.'.$this->report->report_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'EmergencyReportStatusChanged';
    }

    public function broadcastWith(): array
    {
        return [
            'report_id' => $this->report->report_id,
            'previous_status' => $this->previousStatus,
            'status' => $this->report->status,
            'operator_name' => $this->operatorName,
            'responded_at' => $this->report->responded_at?->toIso8601String(),
            'arrived_at' => $this->report->arrived_at?->toIso8601String(),
            'resolved_at' => $this->report->resolved_at?->toIso8601String(),
            'destination_type' => $this->report->destination_type,
            'destination_name' => $this->report->destination_name,
            'updated_at' => now()->toIso8601String(),
        ];
    }
}