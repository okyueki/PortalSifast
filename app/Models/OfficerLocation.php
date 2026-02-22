<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OfficerLocation extends Model
{
    protected $fillable = [
        'officer_id',
        'emergency_report_id',
        'latitude',
        'longitude',
        'speed_kmh',
        'heading',
        'eta_minutes',
        'distance_meters',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'speed_kmh' => 'decimal:2',
            'heading' => 'integer',
            'eta_minutes' => 'integer',
            'distance_meters' => 'integer',
        ];
    }

    public function officer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'officer_id');
    }

    public function emergencyReport(): BelongsTo
    {
        return $this->belongsTo(EmergencyReport::class);
    }
}
