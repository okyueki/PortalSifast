<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Project>
 */
class ProjectFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->sentence(3),
            'description' => fake()->optional()->paragraph(),
            'status' => self::STATUS_PLANNING,
            'start_date' => fake()->optional(0.5)->dateTimeBetween('-1 month', 'now')->format('Y-m-d'),
            'end_date' => fake()->optional(0.5)->dateTimeBetween('now', '+3 months')->format('Y-m-d'),
            'dep_id' => 'IT',
            'created_by' => null,
        ];
    }

    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => \App\Models\Project::STATUS_IN_PROGRESS,
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => \App\Models\Project::STATUS_COMPLETED,
        ]);
    }
}
