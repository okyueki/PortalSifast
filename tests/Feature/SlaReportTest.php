<?php

use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Models\TicketPriority;
use App\Models\TicketStatus;
use App\Models\TicketType;
use App\Models\User;

beforeEach(function () {
    $this->type = TicketType::factory()->incident()->create();
    $this->category = TicketCategory::factory()->it()->create([
        'ticket_type_id' => $this->type->id,
        'is_development' => false,
    ]);
    $this->priority = TicketPriority::factory()->low()->create();
    $this->statusNew = TicketStatus::factory()->asNew()->create();
    $this->statusClosed = TicketStatus::factory()->closed()->create();
});

it('shows SLA report for admin', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->get('/reports/sla');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('reports/sla')
        ->has('responseSla')
        ->has('resolutionSla')
        ->has('monthlyTrend')
        ->has('byDepartment')
        ->has('byPriority')
    );
});

it('shows SLA report for staff', function () {
    $staff = User::factory()->staff('IT')->create();

    $response = $this->actingAs($staff)->get('/reports/sla');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('reports/sla')
    );
});

it('denies pemohon access to SLA report', function () {
    $pemohon = User::factory()->pemohon()->create();

    $response = $this->actingAs($pemohon)->get('/reports/sla');

    $response->assertForbidden();
});

it('redirects guests to login when accessing SLA report', function () {
    $response = $this->get('/reports/sla');

    $response->assertRedirect();
});

it('calculates response SLA met and breached correctly', function () {
    $admin = User::factory()->admin()->create();
    $now = now();

    // Met: first_response before response_due
    Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'dep_id' => 'IT',
        'requester_id' => $admin->id,
        'response_due_at' => $now->copy()->addHours(2),
        'first_response_at' => $now->copy()->addHour(),
        'resolution_due_at' => $now->copy()->addHours(8),
        'created_at' => $now->copy()->subHour(),
    ]);

    // Breached: first_response after response_due
    Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'dep_id' => 'IT',
        'requester_id' => $admin->id,
        'response_due_at' => $now->copy()->addHours(1),
        'first_response_at' => $now->copy()->addHours(2),
        'resolution_due_at' => $now->copy()->addHours(8),
        'created_at' => $now->copy()->subHour(),
    ]);

    $response = $this->actingAs($admin)->get('/reports/sla?from='.$now->format('Y-m').'&to='.$now->format('Y-m'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('responseSla.met', 1)
        ->where('responseSla.breached', 1)
        ->where('responseSla.percentage', 50)
    );
});

it('calculates resolution SLA met and breached correctly', function () {
    $admin = User::factory()->admin()->create();
    $now = now();

    // Met: resolved before resolution_due
    Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusClosed->id,
        'dep_id' => 'IT',
        'requester_id' => $admin->id,
        'response_due_at' => $now->copy()->addHours(2),
        'first_response_at' => $now->copy()->addHour(),
        'resolution_due_at' => $now->copy()->addHours(8),
        'resolved_at' => $now->copy()->addHours(4),
        'created_at' => $now->copy()->subHour(),
    ]);

    // Breached: resolved after resolution_due
    Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusClosed->id,
        'dep_id' => 'IT',
        'requester_id' => $admin->id,
        'response_due_at' => $now->copy()->addHours(2),
        'first_response_at' => $now->copy()->addHour(),
        'resolution_due_at' => $now->copy()->addHours(4),
        'resolved_at' => $now->copy()->addHours(6),
        'created_at' => $now->copy()->subHour(),
    ]);

    $response = $this->actingAs($admin)->get('/reports/sla?from='.$now->format('Y-m').'&to='.$now->format('Y-m'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->where('resolutionSla.met', 1)
        ->where('resolutionSla.breached', 1)
        ->where('resolutionSla.percentage', 50)
    );
});
