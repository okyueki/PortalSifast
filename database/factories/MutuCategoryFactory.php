<?php

namespace Database\Factories;

use App\Enums\MutuCategoryScope;
use App\Models\MutuCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<MutuCategory>
 */
class MutuCategoryFactory extends Factory
{
    protected $model = MutuCategory::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(4, true),
            'short_name' => fake()->optional()->lexify('???'),
            'scope' => MutuCategoryScope::Internal,
            'description' => fake()->optional()->sentence(),
            'is_general_use' => false,
            'has_mutu_benchmarking' => false,
            'obligation_profile' => null,
            'is_active' => true,
        ];
    }
}
