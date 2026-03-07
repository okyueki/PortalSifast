<?php

use App\Models\Ticket;
use App\Models\TicketActivity;
use App\Models\TicketCategory;
use App\Models\TicketIssue;
use App\Models\TicketPriority;
use App\Models\TicketStatus;
use App\Models\TicketType;
use App\Models\User;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;

beforeEach(function () {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $this->type = TicketType::factory()->incident()->create();
    $this->category = TicketCategory::factory()->it()->create(['ticket_type_id' => $this->type->id]);
    $this->priority = TicketPriority::factory()->low()->create();
    $this->statusNew = TicketStatus::factory()->asNew()->create();
    $this->statusInProgress = TicketStatus::factory()->inProgress()->create();
    $this->statusPending = TicketStatus::factory()->pending()->create();
    $this->statusClosed = TicketStatus::factory()->closed()->create();
});

it('allows pemohon to create an issue on a ticket they can view', function () {
    $pemohon = User::factory()->pemohon()->create();
    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusInProgress->id,
        'requester_id' => $pemohon->id,
    ]);

    $response = $this->actingAs($pemohon)->post("/tickets/{$ticket->id}/issues", [
        'title' => 'Kendala akses server',
        'description' => 'VPN putus',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');
    $this->assertDatabaseHas('ticket_issues', [
        'ticket_id' => $ticket->id,
        'title' => 'Kendala akses server',
        'description' => 'VPN putus',
        'status' => 'open',
        'created_by' => $pemohon->id,
    ]);
});

it('allows staff to create an issue on a ticket they can view', function () {
    $staff = User::factory()->staff('IT')->create();
    $pemohon = User::factory()->pemohon()->create();
    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusInProgress->id,
        'dep_id' => 'IT',
        'requester_id' => $pemohon->id,
    ]);

    $response = $this->actingAs($staff)->post("/tickets/{$ticket->id}/issues", [
        'title' => 'Menunggu spare part',
        'description' => null,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('ticket_issues', [
        'ticket_id' => $ticket->id,
        'title' => 'Menunggu spare part',
        'status' => 'open',
    ]);
});

it('moves ticket to pending when an issue is opened and ticket is not closed', function () {
    $pemohon = User::factory()->pemohon()->create();
    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusInProgress->id,
        'requester_id' => $pemohon->id,
    ]);

    $this->actingAs($pemohon)->post("/tickets/{$ticket->id}/issues", [
        'title' => 'Blocker issue',
        'description' => null,
    ]);

    $ticket->refresh();
    expect($ticket->ticket_status_id)->toBe($this->statusPending->id);
    $this->assertDatabaseHas('ticket_activities', [
        'ticket_id' => $ticket->id,
        'action' => TicketActivity::ACTION_ISSUE_OPENED,
    ]);
    $this->assertDatabaseHas('ticket_activities', [
        'ticket_id' => $ticket->id,
        'action' => TicketActivity::ACTION_STATUS_CHANGED,
    ]);
});

it('allows staff to resolve an issue', function () {
    $staff = User::factory()->staff('IT')->create();
    $pemohon = User::factory()->pemohon()->create();
    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusPending->id,
        'dep_id' => 'IT',
        'requester_id' => $pemohon->id,
    ]);
    $issue = TicketIssue::factory()->create([
        'ticket_id' => $ticket->id,
        'title' => 'Open issue',
        'status' => TicketIssue::STATUS_OPEN,
    ]);

    $response = $this->actingAs($staff)->patch("/tickets/{$ticket->id}/issues/{$issue->id}/resolve");

    $response->assertRedirect();
    $response->assertSessionHas('success');
    $issue->refresh();
    expect($issue->status)->toBe(TicketIssue::STATUS_RESOLVED);
    expect($issue->resolved_at)->not->toBeNull();
    $this->assertDatabaseHas('ticket_activities', [
        'ticket_id' => $ticket->id,
        'action' => TicketActivity::ACTION_ISSUE_RESOLVED,
    ]);
});

it('denies pemohon from resolving an issue', function () {
    $pemohon = User::factory()->pemohon()->create();
    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusPending->id,
        'requester_id' => $pemohon->id,
    ]);
    $issue = TicketIssue::factory()->create([
        'ticket_id' => $ticket->id,
        'title' => 'Open issue',
        'status' => TicketIssue::STATUS_OPEN,
    ]);

    $response = $this->actingAs($pemohon)->patch("/tickets/{$ticket->id}/issues/{$issue->id}/resolve");

    $response->assertForbidden();
    $issue->refresh();
    expect($issue->status)->toBe(TicketIssue::STATUS_OPEN);
});

it('moves ticket to in_progress when last issue is resolved', function () {
    $staff = User::factory()->staff('IT')->create();
    $pemohon = User::factory()->pemohon()->create();
    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusPending->id,
        'dep_id' => 'IT',
        'requester_id' => $pemohon->id,
    ]);
    $issue = TicketIssue::factory()->create([
        'ticket_id' => $ticket->id,
        'title' => 'Only issue',
        'status' => TicketIssue::STATUS_OPEN,
    ]);

    $this->actingAs($staff)->patch("/tickets/{$ticket->id}/issues/{$issue->id}/resolve");

    $ticket->refresh();
    expect($ticket->ticket_status_id)->toBe($this->statusInProgress->id);
    $this->assertDatabaseHas('ticket_activities', [
        'ticket_id' => $ticket->id,
        'action' => TicketActivity::ACTION_STATUS_CHANGED,
        'new_value' => $this->statusInProgress->name,
    ]);
});

it('validates title when creating issue', function () {
    $pemohon = User::factory()->pemohon()->create();
    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'requester_id' => $pemohon->id,
    ]);

    $response = $this->actingAs($pemohon)->post("/tickets/{$ticket->id}/issues", [
        'title' => '',
        'description' => 'Optional',
    ]);

    $response->assertSessionHasErrors(['title']);
    $this->assertDatabaseMissing('ticket_issues', [
        'ticket_id' => $ticket->id,
    ]);
});

it('shows ticket with issues and canResolveIssue for staff', function () {
    $staff = User::factory()->staff('IT')->create();
    $pemohon = User::factory()->pemohon()->create();
    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'dep_id' => 'IT',
        'requester_id' => $pemohon->id,
    ]);
    TicketIssue::factory()->create([
        'ticket_id' => $ticket->id,
        'created_by' => $pemohon->id,
        'title' => 'Test issue',
        'status' => TicketIssue::STATUS_OPEN,
    ]);

    $response = $this->actingAs($staff)->get("/tickets/{$ticket->id}");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tickets/show')
        ->has('ticket.issues', 1)
        ->where('ticket.issues.0.title', 'Test issue')
        ->where('canResolveIssue', true)
    );
});

it('shows canResolveIssue false for pemohon', function () {
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
        ->where('canResolveIssue', false)
    );
});
