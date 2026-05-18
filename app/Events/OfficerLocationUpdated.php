<?php

namespace App\Events;

use App\Models\OfficerLocation;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OfficerLocationUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public OfficerLocation $location
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('emergency.command-center'),
            new PrivateChannel('emergency.officer.'.$this->location->emergency_report_id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'OfficerLocationUpdated';
    }

    public function broadcastWith(): array
    {
        return [
            'officer_id' => $this->location->officer_id,
            'officer_name' => $this->location->officer?->name,
            'report_id' => $this->location->emergencyReport?->report_id,
            'latitude' => (float) $this->location->latitude,
            'longitude' => (float) $this->location->longitude,
            'speed_kmh' => $this->location->speed_kmh,
            'heading' => $this->location->heading,
            'eta_minutes' => $this->location->eta_minutes,
            'distance_meters' => $this->location->distance_meters,
            'updated_at' => $this->location->updated_at->toIso8601String(),
        ];
    }
}