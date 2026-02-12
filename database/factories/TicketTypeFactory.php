<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TicketType>
 */
class TicketTypeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->randomElement(['Insiden', 'Permintaan Layanan', 'Problem', 'Perubahan']);

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'is_active' => true,
        ];
    }

    /**
     * Incident type.
     */
    public function incident(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Insiden',
            'slug' => 'incident',
            'description' => 'Gangguan layanan yang perlu diperbaiki',
        ]);
    }

    /**
     * Service request type.
     */
    public function serviceRequest(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Permintaan Layanan',
            'slug' => 'service_request',
            'description' => 'Permintaan layanan standar',
        ]);
    }
}
