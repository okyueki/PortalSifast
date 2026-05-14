<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MutuIndicatorDepartemen extends Model
{
    protected $table = 'mutu_indicator_departemen';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'mutu_indicator_id',
        'dep_id',
    ];

    /**
     * @return BelongsTo<MutuIndicator, $this>
     */
    public function indicator(): BelongsTo
    {
        return $this->belongsTo(MutuIndicator::class, 'mutu_indicator_id');
    }
}
