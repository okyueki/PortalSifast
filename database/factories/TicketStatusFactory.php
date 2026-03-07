<?php

namespace Database\Factories;

use App\Models\TicketStatus;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TicketStatus>
 */
class TicketStatusFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => 'Baru',
            'slug' => TicketStatus::SLUG_NEW,
            'color' => 'blue',
            'order' => 1,
            'is_closed' => false,
            'is_active' => true,
        ];
    }

    /**
     * New status.
     */
    public function asNew(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Baru',
            'slug' => TicketStatus::SLUG_NEW,
            'order' => 1,
            'is_closed' => false,
        ]);
    }

    /**
     * Assigned status.
     */
    public function assigned(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Ditugaskan',
            'slug' => TicketStatus::SLUG_ASSIGNED,
            'order' => 2,
            'is_closed' => false,
        ]);
    }

    /**
     * Pending status (e.g. blocked by issue).
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Tertunda',
            'slug' => TicketStatus::SLUG_PENDING,
            'order' => 4,
            'is_closed' => false,
        ]);
    }

    /**
     * In progress status.
     */
    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Dikerjakan',
            'slug' => TicketStatus::SLUG_IN_PROGRESS,
            'order' => 3,
            'is_closed' => false,
        ]);
    }

    /**
     * Closed status.
     */
    public function closed(): static
    {
        return $this->state(fn (array $attributes) => [
            'name' => 'Ditutup',
            'slug' => TicketStatus::SLUG_CLOSED,
            'order' => 7,
            'is_closed' => true,
        ]);
    }
}
