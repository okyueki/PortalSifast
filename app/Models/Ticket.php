<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'ticket_number',
        'ticket_type_id',
        'ticket_category_id',
        'ticket_subcategory_id',
        'ticket_priority_id',
        'ticket_status_id',
        'dep_id',
        'requester_id',
        'assignee_id',
        'ticket_group_id',
        'title',
        'description',
        'due_date',
        'response_due_at',
        'resolution_due_at',
        'first_response_at',
        'resolved_at',
        'closed_at',
        'related_ticket_id',
        'asset_id',
        'asset_no_inventaris',
    ];

    protected $appends = ['response_time_minutes', 'resolution_time_minutes'];

    protected function casts(): array
    {
        return [
            'due_date' => 'datetime',
            'response_due_at' => 'datetime',
            'resolution_due_at' => 'datetime',
            'first_response_at' => 'datetime',
            'resolved_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    // ==================== BOOT ====================

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($ticket) {
            if (empty($ticket->ticket_number)) {
                $ticket->ticket_number = self::generateTicketNumber();
            }
        });
    }

    /**
     * Generate nomor tiket unik: TKT-YYYYMMDD-XXXX
     */
    public static function generateTicketNumber(): string
    {
        $prefix = 'TKT';
        $date = now()->format('Ymd');

        // Cari nomor terakhir hari ini
        $lastTicket = self::where('ticket_number', 'like', "{$prefix}-{$date}-%")
            ->orderBy('ticket_number', 'desc')
            ->first();

        if ($lastTicket) {
            $lastNumber = (int) Str::afterLast($lastTicket->ticket_number, '-');
            $nextNumber = $lastNumber + 1;
        } else {
            $nextNumber = 1;
        }

        return sprintf('%s-%s-%04d', $prefix, $date, $nextNumber);
    }

    // ==================== RELATIONSHIPS ====================

    public function type(): BelongsTo
    {
        return $this->belongsTo(TicketType::class, 'ticket_type_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(TicketCategory::class, 'ticket_category_id');
    }

    public function subcategory(): BelongsTo
    {
        return $this->belongsTo(TicketSubcategory::class, 'ticket_subcategory_id');
    }

    public function priority(): BelongsTo
    {
        return $this->belongsTo(TicketPriority::class, 'ticket_priority_id');
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(TicketStatus::class, 'ticket_status_id');
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function relatedTicket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class, 'related_ticket_id');
    }

    public function childTickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'related_ticket_id');
    }

    /**
     * Inventaris/aset yang terkait tiket (untuk IPS: alat medis, peralatan)
     */
    public function inventaris(): BelongsTo
    {
        return $this->belongsTo(Inventaris::class, 'asset_no_inventaris', 'no_inventaris');
    }

    /**
     * Tag untuk pengelompokan kasus (Knowledge Base).
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(TicketTag::class, 'ticket_ticket_tag')->withTimestamps();
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TicketComment::class)->orderBy('created_at', 'asc');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(TicketAttachment::class);
    }

    public function activities(): HasMany
    {
        return $this->hasMany(TicketActivity::class)->orderBy('created_at', 'desc');
    }

    public function vendorCosts(): HasMany
    {
        return $this->hasMany(TicketVendorCost::class);
    }

    /**
     * Biaya spare part untuk perbaikan internal (in-house).
     */
    public function sparepartItems(): HasMany
    {
        return $this->hasMany(TicketSparepartItem::class);
    }

    public function collaborators(): HasMany
    {
        return $this->hasMany(TicketCollaborator::class)->with('user');
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(TicketGroup::class, 'ticket_group_id');
    }

    // ==================== SCOPES ====================

    public function scopeForDepartment($query, string $depId)
    {
        return $query->where('dep_id', $depId);
    }

    public function scopeAssignedTo($query, int $userId)
    {
        return $query->where('assignee_id', $userId);
    }

    public function scopeRequestedBy($query, int $userId)
    {
        return $query->where('requester_id', $userId);
    }

    public function scopeUnassigned($query)
    {
        return $query->whereNull('assignee_id');
    }

    public function scopeOpen($query)
    {
        return $query->whereHas('status', fn ($q) => $q->where('is_closed', false));
    }

    public function scopeClosed($query)
    {
        return $query->whereHas('status', fn ($q) => $q->where('is_closed', true));
    }

    public function scopeOverdue($query)
    {
        return $query->where(function ($q) {
            $q->where('due_date', '<', now())
                ->orWhere('response_due_at', '<', now())
                ->orWhere('resolution_due_at', '<', now());
        })->whereHas('status', fn ($q) => $q->where('is_closed', false));
    }

    // ==================== HELPERS ====================

    public function isOverdue(): bool
    {
        if ($this->status?->is_closed) {
            return false;
        }

        return ($this->due_date && $this->due_date->isPast())
            || ($this->response_due_at && $this->response_due_at->isPast() && ! $this->first_response_at)
            || ($this->resolution_due_at && $this->resolution_due_at->isPast() && ! $this->resolved_at);
    }

    public function isUnassigned(): bool
    {
        return is_null($this->assignee_id);
    }

    public function isDevelopment(): bool
    {
        return $this->category?->is_development ?? false;
    }

    /**
     * Response time dalam menit (created_at -> first_response_at).
     */
    public function getResponseTimeMinutesAttribute(): ?int
    {
        if (! $this->first_response_at) {
            return null;
        }

        return (int) $this->created_at->diffInMinutes($this->first_response_at);
    }

    /**
     * Resolution time dalam menit (created_at -> resolved_at).
     */
    public function getResolutionTimeMinutesAttribute(): ?int
    {
        if (! $this->resolved_at) {
            return null;
        }

        return (int) $this->created_at->diffInMinutes($this->resolved_at);
    }

    /**
     * Apakah response time memenuhi SLA (target response_due_at).
     */
    public function isResponseSlaMet(): bool
    {
        if (! $this->response_due_at || ! $this->first_response_at) {
            return true;
        }

        return $this->first_response_at->lte($this->response_due_at);
    }

    /**
     * Apakah resolution time memenuhi SLA (target resolution_due_at).
     */
    public function isResolutionSlaMet(): bool
    {
        if (! $this->resolution_due_at || ! $this->resolved_at) {
            return true;
        }

        return $this->resolved_at->lte($this->resolution_due_at);
    }

    /**
     * Log activity untuk tiket ini
     */
    public function logActivity(string $action, ?string $oldValue = null, ?string $newValue = null, ?string $description = null, ?int $userId = null): TicketActivity
    {
        return $this->activities()->create([
            'user_id' => $userId ?? auth()->id(),
            'action' => $action,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'description' => $description,
            'created_at' => now(),
        ]);
    }
}
