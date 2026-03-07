<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketSlaRule extends Model
{
    protected $fillable = [
        'ticket_type_id',
        'ticket_priority_id',
        'ticket_category_id',
        'response_minutes',
        'resolution_minutes',
        'business_hours_only',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'response_minutes' => 'integer',
            'resolution_minutes' => 'integer',
            'business_hours_only' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    // ==================== RELATIONSHIPS ====================

    public function ticketType(): BelongsTo
    {
        return $this->belongsTo(TicketType::class);
    }

    public function ticketPriority(): BelongsTo
    {
        return $this->belongsTo(TicketPriority::class);
    }

    public function ticketCategory(): BelongsTo
    {
        return $this->belongsTo(TicketCategory::class);
    }

    // ==================== SCOPES ====================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // ==================== HELPERS ====================

    /**
     * Get response time in human-readable format
     */
    public function getResponseTimeAttribute(): ?string
    {
        if (! $this->response_minutes) {
            return null;
        }

        $hours = floor($this->response_minutes / 60);
        $minutes = $this->response_minutes % 60;

        if ($hours > 0 && $minutes > 0) {
            return "{$hours} jam {$minutes} menit";
        } elseif ($hours > 0) {
            return "{$hours} jam";
        } else {
            return "{$minutes} menit";
        }
    }

    /**
     * Get resolution time in human-readable format
     */
    public function getResolutionTimeAttribute(): ?string
    {
        if (! $this->resolution_minutes) {
            return null;
        }

        $hours = floor($this->resolution_minutes / 60);
        $minutes = $this->resolution_minutes % 60;

        if ($hours > 0 && $minutes > 0) {
            return "{$hours} jam {$minutes} menit";
        } elseif ($hours > 0) {
            return "{$hours} jam";
        } else {
            return "{$minutes} menit";
        }
    }

    /**
     * Find the applicable SLA rule for a ticket
     */
    public static function findForTicket(Ticket $ticket): ?self
    {
        // Cari yang paling spesifik (semua kriteria cocok)
        return self::active()
            ->where(function ($query) use ($ticket) {
                $query->where('ticket_type_id', $ticket->ticket_type_id)
                    ->where('ticket_priority_id', $ticket->ticket_priority_id)
                    ->where('ticket_category_id', $ticket->ticket_category_id);
            })
            ->orWhere(function ($query) use ($ticket) {
                $query->where('ticket_type_id', $ticket->ticket_type_id)
                    ->where('ticket_priority_id', $ticket->ticket_priority_id)
                    ->whereNull('ticket_category_id');
            })
            ->orWhere(function ($query) use ($ticket) {
                $query->where('ticket_priority_id', $ticket->ticket_priority_id)
                    ->whereNull('ticket_type_id')
                    ->whereNull('ticket_category_id');
            })
            ->orderByRaw('CASE 
                WHEN ticket_type_id IS NOT NULL AND ticket_priority_id IS NOT NULL AND ticket_category_id IS NOT NULL THEN 1
                WHEN ticket_type_id IS NOT NULL AND ticket_priority_id IS NOT NULL THEN 2
                WHEN ticket_priority_id IS NOT NULL THEN 3
                ELSE 4
            END')
            ->first();
    }
}
