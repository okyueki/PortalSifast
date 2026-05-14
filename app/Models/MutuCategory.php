<?php

namespace App\Models;

use App\Enums\MutuCategoryScope;
use App\Enums\MutuObligationProfile;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MutuCategory extends Model
{
    /** @use HasFactory<\Database\Factories\MutuCategoryFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'short_name',
        'scope',
        'description',
        'is_general_use',
        'has_mutu_benchmarking',
        'obligation_profile',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'scope' => MutuCategoryScope::class,
            'obligation_profile' => MutuObligationProfile::class,
            'is_general_use' => 'boolean',
            'has_mutu_benchmarking' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return HasMany<MutuIndicator, $this>
     */
    public function indicators(): HasMany
    {
        return $this->hasMany(MutuIndicator::class);
    }

    /**
     * @return HasMany<MutuPeriodScore, $this>
     */
    public function periodScores(): HasMany
    {
        return $this->hasMany(MutuPeriodScore::class);
    }

    /**
     * @return HasMany<MutuPeriodAnalysis, $this>
     */
    public function periodAnalyses(): HasMany
    {
        return $this->hasMany(MutuPeriodAnalysis::class);
    }
}
