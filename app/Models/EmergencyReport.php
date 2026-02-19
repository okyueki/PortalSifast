<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmergencyReport extends Model
{
    use SoftDeletes;

    public const STATUS_PENDING = 'pending';

    public const STATUS_RESPONDED = 'responded';

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_RESOLVED = 'resolved';

    public const STATUS_CANCELLED = 'cancelled';

    public const CATEGORIES = [
        'kecelakaan_lalu_lintas',
        'ibu_hamil',
        'serangan_jantung',
        'serangan_stroke',
        'home_care',
        'ambulance',
    ];

    protected $fillable = [
        'report_id',
        'user_id',
        'latitude',
        'longitude',
        'address',
        'category',
        'status',
        'sender_name',
        'sender_phone',
        'device_id',
        'notes',
        'photo_path',
        'assigned_operator_id',
        'response_notes',
        'assigned_team',
        'responded_at',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'decimal:8',
            'longitude' => 'decimal:8',
            'responded_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (EmergencyReport $report): void {
            if (empty($report->report_id)) {
                $report->report_id = self::generateReportId();
            }
        });
    }

    public static function generateReportId(): string
    {
        $year = now()->format('Y');
        $last = self::query()
            ->where('report_id', 'like', "RPT-{$year}-%")
            ->orderByDesc('id')
            ->value('report_id');

        if (! $last) {
            $seq = 1;
        } else {
            $seq = (int) substr($last, -5) + 1;
        }

        return sprintf('RPT-%s-%05d', $year, $seq);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignedOperator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_operator_id');
    }

    public function getRouteKeyName(): string
    {
        return 'report_id';
    }
}
