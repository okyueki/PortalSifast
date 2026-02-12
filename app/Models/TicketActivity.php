<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketActivity extends Model
{
    public $timestamps = false; // Hanya pakai created_at

    protected $fillable = [
        'ticket_id',
        'user_id',
        'action',
        'old_value',
        'new_value',
        'description',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    // ==================== CONSTANTS ====================

    public const ACTION_CREATED = 'created';

    public const ACTION_STATUS_CHANGED = 'status_changed';

    public const ACTION_ASSIGNED = 'assigned';

    public const ACTION_UNASSIGNED = 'unassigned';

    public const ACTION_PRIORITY_CHANGED = 'priority_changed';

    public const ACTION_COMMENTED = 'commented';

    public const ACTION_ATTACHMENT_ADDED = 'attachment_added';

    public const ACTION_CLOSED = 'closed';

    public const ACTION_AUTO_CLOSED = 'auto_closed';

    public const ACTION_COLLABORATOR_ADDED = 'collaborator_added';

    public const ACTION_COLLABORATOR_REMOVED = 'collaborator_removed';

    // ==================== RELATIONSHIPS ====================

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ==================== HELPERS ====================

    /**
     * Get human-readable action description
     */
    public function getActionLabelAttribute(): string
    {
        return match ($this->action) {
            self::ACTION_CREATED => 'Tiket dibuat',
            self::ACTION_STATUS_CHANGED => 'Status diubah',
            self::ACTION_ASSIGNED => 'Ditugaskan',
            self::ACTION_UNASSIGNED => 'Penugasan dihapus',
            self::ACTION_PRIORITY_CHANGED => 'Prioritas diubah',
            self::ACTION_COMMENTED => 'Komentar ditambahkan',
            self::ACTION_ATTACHMENT_ADDED => 'Lampiran ditambahkan',
            self::ACTION_CLOSED => 'Tiket ditutup',
            self::ACTION_AUTO_CLOSED => 'Tiket ditutup otomatis',
            self::ACTION_COLLABORATOR_ADDED => 'Rekan ditambahkan',
            self::ACTION_COLLABORATOR_REMOVED => 'Rekan dihapus',
            default => $this->action,
        };
    }
}
