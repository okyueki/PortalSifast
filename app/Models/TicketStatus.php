<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TicketStatus extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'color',
        'order',
        'is_closed',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'order' => 'integer',
            'is_closed' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    // ==================== RELATIONSHIPS ====================

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }

    // ==================== SCOPES ====================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('order', 'asc');
    }

    public function scopeOpen($query)
    {
        return $query->where('is_closed', false);
    }

    public function scopeClosed($query)
    {
        return $query->where('is_closed', true);
    }

    // ==================== HELPERS ====================

    /**
     * Status slug constants
     */
    public const SLUG_NEW = 'new';

    public const SLUG_ASSIGNED = 'assigned';

    public const SLUG_IN_PROGRESS = 'in_progress';

    public const SLUG_PENDING = 'pending';

    public const SLUG_RESOLVED = 'resolved';

    public const SLUG_WAITING_CONFIRMATION = 'waiting_confirmation';

    public const SLUG_CLOSED = 'closed';
}
