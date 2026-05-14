<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MutuPeriodAnalysis extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'mutu_category_id',
        'dep_id',
        'period_anchor',
        'analysis_text',
        'created_by',
    ];

    /**
     * @return BelongsTo<MutuCategory, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(MutuCategory::class, 'mutu_category_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
