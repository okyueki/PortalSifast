<?php

namespace App\Models;

use App\Enums\MutuCollectionFrequency;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MutuRealisation extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'mutu_indicator_id',
        'dep_id',
        'collection_frequency',
        'period_anchor',
        'numerator_value',
        'denominator_value',
        'achievement_percent',
        'input_by',
        'source',
        'is_override',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'collection_frequency' => MutuCollectionFrequency::class,
            'numerator_value' => 'decimal:4',
            'denominator_value' => 'decimal:4',
            'achievement_percent' => 'decimal:4',
            'is_override' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (MutuRealisation $row): void {
            $d = (float) $row->denominator_value;
            $n = (float) $row->numerator_value;
            $row->achievement_percent = $d > 0 ? round(($n / $d) * 100, 4) : null;
        });
    }

    /**
     * @return BelongsTo<MutuIndicator, $this>
     */
    public function indicator(): BelongsTo
    {
        return $this->belongsTo(MutuIndicator::class, 'mutu_indicator_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function inputUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'input_by');
    }
}
