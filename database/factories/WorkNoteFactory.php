<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\WorkNote>
 */
class WorkNoteFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->words(3, true),
            'icon' => '📄',
            'content' => [
                ['id' => 'b1', 'type' => 'h1', 'content' => fake()->sentence()],
                ['id' => 'b2', 'type' => 'text', 'content' => fake()->paragraph()],
            ],
        ];
    }
}
