<?php

namespace Database\Factories;

use App\Enums\MutuAnalysisPeriod;
use App\Enums\MutuCollectionFrequency;
use App\Enums\MutuIndicatorKind;
use App\Models\MutuCategory;
use App\Models\MutuIndicator;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MutuIndicator>
 */
class MutuIndicatorFactory extends Factory
{
    protected $model = MutuIndicator::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'mutu_category_id' => MutuCategory::factory(),
            'title' => fake()->sentence(6),
            'description' => fake()->optional()->sentence(),
            'is_active' => true,
            'valid_from' => null,
            'valid_until' => null,
            'accountable_user_id' => null,
            'indicator_kind' => MutuIndicatorKind::Outcome,
            'collection_frequency' => MutuCollectionFrequency::Bulanan,
            'numerator_definition' => 'Jumlah kejadian numerator',
            'denominator_definition' => 'Jumlah denominator periode',
            'analysis_period' => MutuAnalysisPeriod::Monthly,
            'data_source' => null,
            'target_value' => null,
            'weight_in_category' => 1,
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (MutuIndicator $indicator): void {
            if ($indicator->indicatorDepartemen()->doesntExist()) {
                $indicator->indicatorDepartemen()->create(['dep_id' => 'IT']);
            }
        });
    }
}
