<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MutuPeriodScore extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'mutu_category_id',
        'dep_id',
        'analysis_period_type',
        'period_anchor',
        'weighted_score',
        'benchmark_score',
        'indicator_count',
        'computed_at',
    ];

    protected function casts(): array
    {
        return [
            'weighted_score' => 'decimal:4',
            'benchmark_score' => 'decimal:4',
            'computed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<MutuCategory, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(MutuCategory::class, 'mutu_category_id');
    }
}
