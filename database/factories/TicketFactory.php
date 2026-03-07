<?php

namespace Database\Factories;

use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Models\TicketPriority;
use App\Models\TicketStatus;
use App\Models\TicketType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ticket>
 */
class TicketFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'ticket_type_id' => TicketType::factory(),
            'ticket_category_id' => TicketCategory::factory(),
            'ticket_priority_id' => TicketPriority::factory(),
            'ticket_status_id' => TicketStatus::factory(),
            'dep_id' => 'IT',
            'requester_id' => User::factory(),
            'title' => fake()->sentence(6),
            'description' => fake()->paragraph(),
        ];
    }

    /**
     * Ticket with assignee.
     */
    public function assigned(?User $user = null): static
    {
        return $this->state(fn (array $attributes) => [
            'assignee_id' => $user?->id ?? User::factory()->staff(),
        ]);
    }

    /**
     * IPS department ticket.
     */
    public function ips(): static
    {
        return $this->state(fn (array $attributes) => [
            'dep_id' => 'IPS',
        ]);
    }

    /**
     * IT department ticket.
     */
    public function it(): static
    {
        return $this->state(fn (array $attributes) => [
            'dep_id' => 'IT',
        ]);
    }

    /**
     * Ticket with specific status.
     */
    public function withStatus(string $slug): static
    {
        return $this->state(function (array $attributes) use ($slug) {
            $status = TicketStatus::where('slug', $slug)->first()
                ?? TicketStatus::factory()->create(['slug' => $slug, 'name' => ucfirst(str_replace('_', ' ', $slug))]);

            return ['ticket_status_id' => $status->id];
        });
    }
}
