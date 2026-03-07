<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TicketPriority>
 */
class TicketPriorityFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['P1 - Kritis', 'P2 - Tinggi', 'P3 - Sedang', 'P4 - Rendah']),
            'level' => fake()->numberBetween(1, 4),
            'color' => fake()->randomElement(['red', 'orange', 'yellow', 'green']),
            'response_hours' => fake()->numberBetween(1, 24),
            'resolution_hours' => fake()->numberBetween(4, 72),
            'is_active' => true,
        ];
    }

    /**
     * Critical priority (P1).
     */
    public function critical(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'P1 - Kritis',
            'level' => 1,
            'color' => 'red',
            'response_hours' => 1,
            'resolution_hours' => 4,
        ]);
    }

    /**
     * Low priority (P4).
     */
    public function low(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'P4 - Rendah',
            'level' => 4,
            'color' => 'green',
            'response_hours' => 24,
            'resolution_hours' => 72,
        ]);
    }
}
