<?php

namespace Database\Factories;

use App\Models\Ticket;
use App\Models\TicketIssue;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TicketIssue>
 */
class TicketIssueFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'ticket_id' => Ticket::factory(),
            'created_by' => User::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->optional(0.7)->paragraph(),
            'status' => TicketIssue::STATUS_OPEN,
            'resolved_at' => null,
        ];
    }

    /**
     * Resolved state.
     */
    public function resolved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => TicketIssue::STATUS_RESOLVED,
            'resolved_at' => now(),
        ]);
    }
}
