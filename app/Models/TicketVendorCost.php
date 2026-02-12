<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketVendorCost extends Model
{
    protected $fillable = [
        'ticket_id',
        'vendor_name',
        'estimated_cost',
        'actual_cost',
        'sparepart_notes',
        'vendor_notes',
        'work_date',
    ];

    protected function casts(): array
    {
        return [
            'estimated_cost' => 'decimal:2',
            'actual_cost' => 'decimal:2',
            'work_date' => 'date',
        ];
    }

    // ==================== RELATIONSHIPS ====================

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    // ==================== HELPERS ====================

    /**
     * Get the cost variance (actual - estimated)
     */
    public function getCostVarianceAttribute(): ?float
    {
        if (is_null($this->estimated_cost) || is_null($this->actual_cost)) {
            return null;
        }

        return $this->actual_cost - $this->estimated_cost;
    }

    /**
     * Get formatted estimated cost
     */
    public function getFormattedEstimatedCostAttribute(): string
    {
        return 'Rp '.number_format($this->estimated_cost ?? 0, 0, ',', '.');
    }

    /**
     * Get formatted actual cost
     */
    public function getFormattedActualCostAttribute(): string
    {
        return 'Rp '.number_format($this->actual_cost ?? 0, 0, ',', '.');
    }
}
