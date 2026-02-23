<?php

use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Models\TicketPriority;
use App\Models\TicketStatus;
use App\Models\TicketType;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;

beforeEach(function () {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    // Create master data needed for tickets
    $this->type = TicketType::factory()->incident()->create();
    $this->category = TicketCategory::factory()->it()->create(['ticket_type_id' => $this->type->id]);
    $this->priority = TicketPriority::factory()->low()->create();
    $this->statusNew = TicketStatus::factory()->asNew()->create();
    $this->statusAssigned = TicketStatus::factory()->assigned()->create();
    $this->statusClosed = TicketStatus::factory()->closed()->create();
});

// ==================== INDEX ====================

it('shows tickets list for authenticated admin', function () {
    $admin = User::factory()->admin()->create();
    Ticket::factory()->count(3)->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
    ]);

    $response = $this->actingAs($admin)->get('/tickets');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tickets/index')
        ->has('tickets.data', 3)
    );
});

it('shows only department tickets for staff', function () {
    $staffIT = User::factory()->staff('IT')->create();
    $staffIPS = User::factory()->staff('IPS')->create();

    // IT ticket
    Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'dep_id' => 'IT',
    ]);

    // IPS ticket
    $categoryIPS = TicketCategory::factory()->ips()->create(['ticket_type_id' => $this->type->id]);
    Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $categoryIPS->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'dep_id' => 'IPS',
    ]);

    // Staff IT should see IT tickets
    $response = $this->actingAs($staffIT)->get('/tickets');
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('tickets.data', 1)
        ->where('tickets.data.0.dep_id', 'IT')
    );
});

it('shows only own tickets for pemohon', function () {
    $pemohon1 = User::factory()->pemohon()->create();
    $pemohon2 = User::factory()->pemohon()->create();

    // Ticket by pemohon1
    Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'requester_id' => $pemohon1->id,
    ]);

    // Ticket by pemohon2
    Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'requester_id' => $pemohon2->id,
    ]);

    $response = $this->actingAs($pemohon1)->get('/tickets');
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('tickets.data', 1)
        ->where('tickets.data.0.requester_id', $pemohon1->id)
    );
});

it('redirects guests to login', function () {
    $response = $this->get('/tickets');
    $response->assertRedirect('/login');
});

// ==================== CREATE ====================

it('shows create ticket form', function () {
    $user = User::factory()->pemohon()->create();

    $response = $this->actingAs($user)->get('/tickets/create');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tickets/create')
        ->has('types')
        ->has('categories')
        ->has('priorities')
    );
});

it('can create a new ticket', function () {
    $user = User::factory()->pemohon()->create();

    $response = $this->actingAs($user)->post('/tickets', [
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'title' => 'Test Ticket Title',
        'description' => 'Test ticket description',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('tickets', [
        'title' => 'Test Ticket Title',
        'requester_id' => $user->id,
        'dep_id' => 'IT',
    ]);
});

it('validates required fields when creating ticket', function () {
    $user = User::factory()->pemohon()->create();

    $response = $this->actingAs($user)->post('/tickets', []);

    // ticket_category_id is optional, so not included in required validation
    $response->assertSessionHasErrors(['ticket_type_id', 'ticket_priority_id', 'title']);
});

it('admin can create ticket on behalf of another user', function () {
    $admin = User::factory()->admin()->create();
    $pemohon = User::factory()->pemohon()->create();

    $response = $this->actingAs($admin)->post('/tickets', [
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'title' => 'Ticket for other user',
        'description' => 'Created by admin on behalf of pemohon',
        'requester_id' => $pemohon->id,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('tickets', [
        'title' => 'Ticket for other user',
        'requester_id' => $pemohon->id,
    ]);
});

it('non-admin cannot set requester_id', function () {
    $pemohon = User::factory()->pemohon()->create();
    $otherUser = User::factory()->pemohon()->create();

    $response = $this->actingAs($pemohon)->post('/tickets', [
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'title' => 'Trying to set requester',
        'requester_id' => $otherUser->id,
    ]);

    $response->assertRedirect();
    // Ticket should be created with own requester_id, not the one passed
    $this->assertDatabaseHas('tickets', [
        'title' => 'Trying to set requester',
        'requester_id' => $pemohon->id,
    ]);
});

it('returns canSelectRequester flag for admin', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->get('/tickets/create');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tickets/create')
        ->where('canSelectRequester', true)
    );
});

it('returns canSelectRequester false for non-admin', function () {
    $pemohon = User::factory()->pemohon()->create();

    $response = $this->actingAs($pemohon)->get('/tickets/create');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tickets/create')
        ->where('canSelectRequester', false)
    );
});

// ==================== SHOW ====================

it('shows ticket detail for requester', function () {
    $pemohon = User::factory()->pemohon()->create();
    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'requester_id' => $pemohon->id,
    ]);

    $response = $this->actingAs($pemohon)->get("/tickets/{$ticket->id}");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tickets/show')
        ->has('ticket')
        ->where('ticket.id', $ticket->id)
    );
});

it('shows ticket detail for admin', function () {
    $admin = User::factory()->admin()->create();
    $pemohon = User::factory()->pemohon()->create();
    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'requester_id' => $pemohon->id,
    ]);

    $response = $this->actingAs($admin)->get("/tickets/{$ticket->id}");

    $response->assertOk();
});

it('denies pemohon access to other users tickets', function () {
    $pemohon1 = User::factory()->pemohon()->create();
    $pemohon2 = User::factory()->pemohon()->create();
    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'requester_id' => $pemohon1->id,
    ]);

    $response = $this->actingAs($pemohon2)->get("/tickets/{$ticket->id}");

    $response->assertForbidden();
});

// ==================== UPDATE ====================

it('allows staff to update ticket status', function () {
    $staff = User::factory()->staff('IT')->create();
    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'dep_id' => 'IT',
        'assignee_id' => $staff->id,
    ]);

    $response = $this->actingAs($staff)->patch("/tickets/{$ticket->id}", [
        'ticket_status_id' => $this->statusAssigned->id,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('tickets', [
        'id' => $ticket->id,
        'ticket_status_id' => $this->statusAssigned->id,
    ]);
});

it('logs activity when status changes', function () {
    $staff = User::factory()->staff('IT')->create();
    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'dep_id' => 'IT',
        'assignee_id' => $staff->id,
    ]);

    $this->actingAs($staff)->patch("/tickets/{$ticket->id}", [
        'ticket_status_id' => $this->statusAssigned->id,
    ]);

    $this->assertDatabaseHas('ticket_activities', [
        'ticket_id' => $ticket->id,
        'action' => 'status_changed',
    ]);
});

// ==================== ASSIGNMENT ====================

it('allows staff to assign ticket to self', function () {
    $staff = User::factory()->staff('IT')->create();
    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'dep_id' => 'IT',
        'assignee_id' => null,
    ]);

    $response = $this->actingAs($staff)->post("/tickets/{$ticket->id}/assign-self");

    $response->assertRedirect();
    $this->assertDatabaseHas('tickets', [
        'id' => $ticket->id,
        'assignee_id' => $staff->id,
    ]);
});

it('denies staff from other department to assign ticket', function () {
    $staffIPS = User::factory()->staff('IPS')->create();
    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'dep_id' => 'IT',
        'assignee_id' => null,
    ]);

    $response = $this->actingAs($staffIPS)->post("/tickets/{$ticket->id}/assign-self");

    $response->assertForbidden();
});

it('allows admin to assign ticket regardless of department', function () {
    $admin = User::factory()->admin()->create();
    $staffIT = User::factory()->staff('IT')->create();
    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'dep_id' => 'IT',
        'assignee_id' => null,
    ]);

    $response = $this->actingAs($admin)->patch("/tickets/{$ticket->id}", [
        'assignee_id' => $staffIT->id,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('tickets', [
        'id' => $ticket->id,
        'assignee_id' => $staffIT->id,
    ]);
});

// ==================== CLOSE ====================

it('allows staff to close ticket', function () {
    $staff = User::factory()->staff('IT')->create();
    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusAssigned->id,
        'dep_id' => 'IT',
        'assignee_id' => $staff->id,
    ]);

    $response = $this->actingAs($staff)->post("/tickets/{$ticket->id}/close");

    $response->assertRedirect();
    $ticket->refresh();
    expect($ticket->ticket_status_id)->toBe($this->statusClosed->id);
    expect($ticket->closed_at)->not->toBeNull();
});

// ==================== COMMENTS ====================

it('allows user to add comment to their ticket', function () {
    $pemohon = User::factory()->pemohon()->create();
    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'requester_id' => $pemohon->id,
    ]);

    $response = $this->actingAs($pemohon)->post("/tickets/{$ticket->id}/comments", [
        'body' => 'This is a comment',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('ticket_comments', [
        'ticket_id' => $ticket->id,
        'user_id' => $pemohon->id,
        'body' => 'This is a comment',
        'is_internal' => false,
    ]);
});

it('allows staff to add internal comment', function () {
    $staff = User::factory()->staff('IT')->create();
    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'dep_id' => 'IT',
        'assignee_id' => $staff->id,
    ]);

    $response = $this->actingAs($staff)->post("/tickets/{$ticket->id}/comments", [
        'body' => 'Internal note',
        'is_internal' => true,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('ticket_comments', [
        'ticket_id' => $ticket->id,
        'is_internal' => true,
    ]);
});

it('forces pemohon comments to be non-internal', function () {
    $pemohon = User::factory()->pemohon()->create();
    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'requester_id' => $pemohon->id,
    ]);

    // Even if pemohon tries to set is_internal = true, it should be forced to false
    $response = $this->actingAs($pemohon)->post("/tickets/{$ticket->id}/comments", [
        'body' => 'Public comment',
        'is_internal' => true,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('ticket_comments', [
        'ticket_id' => $ticket->id,
        'is_internal' => false,
    ]);
});

// ==================== FILTERS ====================

it('filters tickets by status', function () {
    $admin = User::factory()->admin()->create();

    Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
    ]);
    Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusAssigned->id,
    ]);

    $response = $this->actingAs($admin)->get('/tickets?status='.$this->statusNew->id);

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('tickets.data', 1)
        ->where('tickets.data.0.ticket_status_id', $this->statusNew->id)
    );
});

it('searches tickets by ticket number', function () {
    $admin = User::factory()->admin()->create();

    $ticket1 = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'title' => 'Printer Error',
    ]);
    $ticket2 = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'title' => 'Network Issue',
    ]);

    $response = $this->actingAs($admin)->get('/tickets?search='.$ticket1->ticket_number);

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->has('tickets.data', 1)
        ->where('tickets.data.0.ticket_number', $ticket1->ticket_number)
    );
});

// ==================== DELETE ====================

it('allows admin to delete ticket', function () {
    $admin = User::factory()->admin()->create();
    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
    ]);

    $response = $this->actingAs($admin)->delete("/tickets/{$ticket->id}");

    $response->assertRedirect('/tickets');
    $this->assertDatabaseMissing('tickets', ['id' => $ticket->id]);
});

it('denies staff from deleting ticket', function () {
    $staff = User::factory()->staff('IT')->create();
    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'dep_id' => 'IT',
    ]);

    $response = $this->actingAs($staff)->delete("/tickets/{$ticket->id}");

    $response->assertForbidden();
    $this->assertDatabaseHas('tickets', ['id' => $ticket->id]);
});
