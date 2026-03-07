<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TicketPriority extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'level',
        'description',
        'color',
        'response_hours',
        'resolution_hours',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'level' => 'integer',
            'response_hours' => 'integer',
            'resolution_hours' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    // ==================== RELATIONSHIPS ====================

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    public function slaRules(): HasMany
    {
        return $this->hasMany(TicketSlaRule::class);
    }

    // ==================== SCOPES ====================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('level', 'asc');
    }
}
