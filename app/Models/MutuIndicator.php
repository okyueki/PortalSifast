<?php

namespace App\Models;

use App\Enums\MutuAnalysisPeriod;
use App\Enums\MutuCollectionFrequency;
use App\Enums\MutuIndicatorKind;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MutuIndicator extends Model
{
    /** @use HasFactory<\Database\Factories\MutuIndicatorFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'mutu_category_id',
        'title',
        'description',
        'is_active',
        'valid_from',
        'valid_until',
        'accountable_user_id',
        'indicator_kind',
        'collection_frequency',
        'numerator_definition',
        'denominator_definition',
        'analysis_period',
        'has_mutu_benchmarking',
        'data_source',
        'target_value',
        'weight_in_category',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'valid_from' => 'date',
            'valid_until' => 'date',
            'indicator_kind' => MutuIndicatorKind::class,
            'collection_frequency' => MutuCollectionFrequency::class,
            'analysis_period' => MutuAnalysisPeriod::class,
            'has_mutu_benchmarking' => 'boolean',
            'target_value' => 'decimal:4',
            'weight_in_category' => 'decimal:4',
        ];
    }

    /**
     * @return BelongsTo<MutuCategory, $this>
     */
    public function mutuCategory(): BelongsTo
    {
        return $this->belongsTo(MutuCategory::class, 'mutu_category_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function accountableUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'accountable_user_id');
    }

    /**
     * @return HasMany<MutuIndicatorDepartemen, $this>
     */
    public function indicatorDepartemen(): HasMany
    {
        return $this->hasMany(MutuIndicatorDepartemen::class, 'mutu_indicator_id');
    }

    /**
     * @return HasMany<MutuRealisation, $this>
     */
    public function realisations(): HasMany
    {
        return $this->hasMany(MutuRealisation::class, 'mutu_indicator_id');
    }

    /**
     * @return list<string>
     */
    public function departemenIds(): array
    {
        return $this->indicatorDepartemen()->pluck('dep_id')->all();
    }
}
