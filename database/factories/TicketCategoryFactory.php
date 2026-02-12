<?php

namespace Database\Factories;

use App\Models\TicketType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TicketCategory>
 */
class TicketCategoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['Software', 'Hardware', 'Jaringan', 'Alat Medis', 'Sarana Prasarana']),
            'dep_id' => 'IT',
            'ticket_type_id' => TicketType::factory(),
            'is_development' => false,
            'is_active' => true,
        ];
    }

    /**
     * IT department category.
     */
    public function it(): static
    {
        return $this->state(fn (array $attributes) => [
            'dep_id' => 'IT',
        ]);
    }

    /**
     * IPS department category.
     */
    public function ips(): static
    {
        return $this->state(fn (array $attributes) => [
            'dep_id' => 'IPS',
        ]);
    }

    /**
     * Development category.
     */
    public function development(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Pengembangan Aplikasi',
            'is_development' => true,
        ]);
    }
}
