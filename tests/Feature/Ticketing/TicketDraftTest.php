<?php

use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Models\TicketPriority;
use App\Models\TicketStatus;
use App\Models\TicketType;
use App\Models\User;
use App\Notifications\TicketCreatedNotification;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    $this->type = TicketType::firstOrCreate(
        ['slug' => 'pest-ticketing-draft'],
        ['name' => 'Draft Ticketing', 'description' => 'Master data test draft', 'is_active' => true]
    );

    $this->category = TicketCategory::firstOrCreate(
        ['ticket_type_id' => $this->type->id, 'name' => 'Draft Category IT'],
        ['dep_id' => 'IT', 'is_development' => false, 'is_active' => true]
    );

    $this->priority = TicketPriority::firstOrCreate(
        ['name' => 'Sedang Draft Test'],
        ['level' => 3, 'color' => 'yellow', 'response_hours' => 4, 'resolution_hours' => 12, 'is_active' => true]
    );

    $this->statusNew = TicketStatus::firstOrCreate(
        ['slug' => TicketStatus::SLUG_NEW],
        ['name' => 'Baru', 'color' => 'blue', 'order' => 1, 'is_closed' => false, 'is_active' => true]
    );
});

it('stores ticket as draft without SLA dates', function () {
    $requester = User::factory()->pemohon()->create();

    $response = $this->actingAs($requester)->post('/tickets', [
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'title' => 'Draft untuk ide fitur',
        'description' => 'Belum siap dipublish',
        'is_draft' => true,
        'plan_ideas' => 'Tambah integrasi vendor',
        'plan_tools' => 'Butuh server staging',
        'budget_estimate' => 15000000,
        'budget_notes' => 'Masih estimasi',
    ]);

    $response->assertRedirect();
    $ticket = Ticket::query()->where('title', 'Draft untuk ide fitur')->firstOrFail();

    expect($ticket->is_draft)->toBeTrue();
    expect($ticket->response_due_at)->toBeNull();
    expect($ticket->resolution_due_at)->toBeNull();
    expect($ticket->published_at)->toBeNull();
    expect($ticket->plan_ideas)->toBe('Tambah integrasi vendor');
    expect($ticket->plan_tools)->toBe('Butuh server staging');
    expect($ticket->budget_estimate)->toBe(15000000);
});

it('sends draft notifications to staff in ticket department', function () {
    Notification::fake();

    $staffIt = User::factory()->staff('IT')->create();
    $requester = User::factory()->pemohon()->create();

    $this->actingAs($requester)->post('/tickets', [
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'title' => 'Draf dengan notifikasi',
        'is_draft' => true,
    ])->assertRedirect();

    Notification::assertSentTo(
        $staffIt,
        TicketCreatedNotification::class,
        fn (TicketCreatedNotification $notification) => $notification->kind === 'draft'
    );
});

it('sends published-kind notifications when draft is published', function () {
    Notification::fake();

    $owner = User::factory()->pemohon()->create();
    $staffIt = User::factory()->staff('IT')->create();

    $draft = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'requester_id' => $owner->id,
        'dep_id' => 'IT',
        'is_draft' => true,
        'published_at' => null,
        'response_due_at' => null,
        'resolution_due_at' => null,
    ]);

    $this->actingAs($owner)->post("/tickets/{$draft->id}/publish")->assertRedirect();

    Notification::assertSentTo(
        $staffIt,
        TicketCreatedNotification::class,
        fn (TicketCreatedNotification $notification) => $notification->kind === 'published'
    );
});

it('pemohon sees only own drafts in draft list not other pemohon drafts', function () {
    $owner = User::factory()->pemohon()->create();
    $other = User::factory()->pemohon()->create();

    $draft = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'requester_id' => $owner->id,
        'is_draft' => true,
        'published_at' => null,
        'response_due_at' => null,
        'resolution_due_at' => null,
    ]);

    $this->actingAs($owner)->get('/tickets')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('tickets.data', []));

    $this->actingAs($owner)->get('/tickets?draft=1')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('tickets.data', 1)
            ->where('tickets.data.0.id', $draft->id)
            ->where('tickets.data.0.is_draft', true)
        );

    $this->actingAs($other)->get('/tickets?draft=1')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('tickets.data', []));
});

it('publishes draft and calculates SLA dates', function () {
    $owner = User::factory()->pemohon()->create();

    $draft = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'requester_id' => $owner->id,
        'dep_id' => 'IT',
        'is_draft' => true,
        'published_at' => null,
        'response_due_at' => null,
        'resolution_due_at' => null,
    ]);

    $this->actingAs($owner)->post("/tickets/{$draft->id}/publish")
        ->assertRedirect("/tickets/{$draft->id}");

    $draft->refresh();

    expect($draft->is_draft)->toBeFalse();
    expect($draft->published_at)->not->toBeNull();
    expect($draft->response_due_at)->not->toBeNull();
    expect($draft->resolution_due_at)->not->toBeNull();
});

it('forbids other requester from publishing someone else draft', function () {
    $owner = User::factory()->pemohon()->create();
    $other = User::factory()->pemohon()->create();

    $draft = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'requester_id' => $owner->id,
        'is_draft' => true,
        'published_at' => null,
    ]);

    $this->actingAs($other)->post("/tickets/{$draft->id}/publish")
        ->assertForbidden();
});

it('does not count draft ticket as overdue on dashboard', function () {
    $staff = User::factory()->staff('IT')->create();

    $draft = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'dep_id' => 'IT',
        'requester_id' => $staff->id,
        'is_draft' => true,
        'published_at' => null,
        'resolution_due_at' => now()->subDay(),
    ]);

    expect(Ticket::query()->overdue()->pluck('id')->all())->not->toContain($draft->id);

    $this->actingAs($staff)->get('/dashboard')->assertOk();
});

it('allows staff who saved a draft for another requester to open the ticket page', function (): void {
    $staff = User::factory()->staff('IT')->create();
    $pemohon = User::factory()->pemohon()->create();

    $response = $this->actingAs($staff)->post('/tickets', [
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'title' => 'Draf atas nama pemohon',
        'requester_id' => $pemohon->id,
        'is_draft' => true,
    ]);

    $response->assertRedirect();
    $ticket = Ticket::query()->where('title', 'Draf atas nama pemohon')->firstOrFail();

    expect($ticket->requester_id)->toBe($pemohon->id);

    $this->actingAs($staff)->get("/tickets/{$ticket->id}")->assertOk();
});

it('forbids staff from another department from viewing a draft in a different dep_id', function (): void {
    $staffIps = User::factory()->staff('IPS')->create();
    $pemohon = User::factory()->pemohon()->create();

    $draft = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'dep_id' => 'IT',
        'requester_id' => $pemohon->id,
        'is_draft' => true,
        'published_at' => null,
        'response_due_at' => null,
        'resolution_due_at' => null,
    ]);

    $this->actingAs($staffIps)->get("/tickets/{$draft->id}")->assertForbidden();
});

it('staff in the same department sees drafts owned by another requester in the draft list', function (): void {
    $staff = User::factory()->staff('IT')->create();
    $pemohon = User::factory()->pemohon()->create();

    $draft = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'dep_id' => 'IT',
        'requester_id' => $pemohon->id,
        'is_draft' => true,
        'published_at' => null,
        'response_due_at' => null,
        'resolution_due_at' => null,
    ]);

    $this->actingAs($staff)->get('/tickets?draft=1')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where(
            'tickets.data',
            fn (Collection $rows) => $rows->contains(fn (array $row) => $row['id'] === $draft->id && $row['is_draft'] === true)
        ));
});
