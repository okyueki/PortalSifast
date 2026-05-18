<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PanicAuditLog extends Model
{
    /**
     * Indicates if the model should be timestamped.
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'report_id',
        'user_id',
        'action',
        'data',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'data' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * Valid action types.
     */
    public const ACTION_ACCEPT = 'accept';
    public const ACTION_RESPOND = 'respond';
    public const ACTION_IN_PROGRESS = 'in_progress';
    public const ACTION_ARRIVED = 'arrived';
    public const ACTION_RESOLVED = 'resolved';
    public const ACTION_CANCELLED = 'cancelled';

    /**
     * Get the emergency report.
     */
    public function report(): BelongsTo
    {
        return $this->belongsTo(EmergencyReport::class, 'report_id');
    }

    /**
     * Get the user who performed the action.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Create an audit log entry.
     */
    public static function log(int $reportId, int $userId, string $action, array $data = []): self
    {
        return self::create([
            'report_id' => $reportId,
            'user_id' => $userId,
            'action' => $action,
            'data' => $data,
            'created_at' => now(),
        ]);
    }
}