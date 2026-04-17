<?php

use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Models\TicketIssue;
use App\Models\TicketPriority;
use App\Models\TicketStatus;
use App\Models\TicketType;
use App\Models\User;
use App\Notifications\TicketCreatedTelegramGroupNotification;
use Carbon\Carbon;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    // firstOrCreate: aman pada DB shared (hindari duplikat slug unik).
    $this->type = TicketType::firstOrCreate(
        ['slug' => 'pest-ticketing-incident'],
        ['name' => 'Insiden (Pest)', 'description' => 'Master data untuk pengujian tiket', 'is_active' => true]
    );
    $this->category = TicketCategory::firstOrCreate(
        ['ticket_type_id' => $this->type->id, 'name' => 'IT (Pest)'],
        ['dep_id' => 'IT', 'is_development' => false, 'is_active' => true]
    );
    $this->priority = TicketPriority::firstOrCreate(
        ['name' => 'Rendah (Pest)'],
        ['level' => 4, 'color' => 'green', 'response_hours' => 24, 'resolution_hours' => 72, 'is_active' => true]
    );
    $this->statusNew = TicketStatus::firstOrCreate(
        ['slug' => TicketStatus::SLUG_NEW],
        ['name' => 'Baru', 'color' => 'blue', 'order' => 1, 'is_closed' => false, 'is_active' => true]
    );
    $this->statusAssigned = TicketStatus::firstOrCreate(
        ['slug' => TicketStatus::SLUG_ASSIGNED],
        ['name' => 'Ditugaskan', 'color' => 'yellow', 'order' => 2, 'is_closed' => false, 'is_active' => true]
    );
    $this->statusClosed = TicketStatus::firstOrCreate(
        ['slug' => TicketStatus::SLUG_CLOSED],
        ['name' => 'Ditutup', 'color' => 'gray', 'order' => 7, 'is_closed' => true, 'is_active' => true]
    );
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

it('includes open issues in tickets index payload', function () {
    $admin = User::factory()->admin()->create();
    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
    ]);
    TicketIssue::factory()->create([
        'ticket_id' => $ticket->id,
        'title' => 'Masalah printer di ruang X',
        'status' => TicketIssue::STATUS_OPEN,
    ]);

    $response = $this->actingAs($admin)->get('/tickets?search='.urlencode($ticket->ticket_number));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tickets/index')
        ->where('tickets.data.0.id', $ticket->id)
        ->has('tickets.data.0.open_issues', 1)
        ->where('tickets.data.0.open_issues.0.title', 'Masalah printer di ruang X')
    );
});

it('includes resolution duration label on tickets index when ticket is closed', function () {
    $admin = User::factory()->admin()->create();
    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusClosed->id,
    ]);
    $ticket->forceFill([
        'created_at' => Carbon::parse('2024-04-08 13:19:00'),
        'closed_at' => Carbon::parse('2024-04-10 18:19:00'),
    ])->saveQuietly();

    $response = $this->actingAs($admin)->get('/tickets?search='.urlencode($ticket->ticket_number).'&include_closed=1');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tickets/index')
        ->where('tickets.data.0.id', $ticket->id)
        ->where('tickets.data.0.resolution_duration_label', '2 hari 5 jam')
    );
});

it('exports tickets csv with extended columns for admin', function () {
    $admin = User::factory()->admin()->create();
    Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
    ]);

    $response = $this->actingAs($admin)->get('/tickets/export');

    $response->assertOk();
    $csv = $response->streamedContent();
    expect($csv)->toContain('Masalah (terbuka)');
    expect($csv)->toContain('Lama penyelesaian');
    expect($csv)->toContain('Subkategori');
    expect($csv)->toContain('Rencana');
    expect($csv)->toContain('Tag');
});

it('forbids ticket csv export for pemohon', function () {
    $pemohon = User::factory()->pemohon()->create();

    $this->actingAs($pemohon)->get('/tickets/export')->assertForbidden();
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

it('can create a new ticket with attachments', function () {
    $user = User::factory()->pemohon()->create();
    $image = UploadedFile::fake()->image('screen.jpg', 400, 300);

    $response = $this->actingAs($user)->post('/tickets', [
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'title' => 'Ticket With Attachment',
        'description' => 'Lihat lampiran',
        'attachments' => [$image],
    ]);

    $response->assertRedirect();
    $ticket = Ticket::query()->where('title', 'Ticket With Attachment')->firstOrFail();
    expect($ticket->attachments)->toHaveCount(1);
    expect($ticket->attachments->first()->filename)->toBe('screen.jpg');
    $this->assertDatabaseHas('ticket_activities', [
        'ticket_id' => $ticket->id,
        'action' => 'attachment_added',
    ]);
});

it('can upload attachment on existing ticket via attachments store', function () {
    $staff = User::factory()->staff('IT')->create();
    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'dep_id' => 'IT',
    ]);

    $file = UploadedFile::fake()->image('upload.png', 100, 100);

    $this->actingAs($staff)
        ->post(route('tickets.attachments.store', $ticket), ['file' => $file])
        ->assertRedirect(route('tickets.show', $ticket, absolute: false));

    expect($ticket->fresh()->attachments)->toHaveCount(1);
    expect($ticket->fresh()->attachments->first()->filename)->toBe('upload.png');
});

it('truncates very long original filename on attachment upload', function () {
    $staff = User::factory()->staff('IT')->create();
    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'dep_id' => 'IT',
    ]);

    $longName = str_repeat('n', 280).'.png';
    $file = UploadedFile::fake()->create($longName, 50, 'image/png');

    $this->actingAs($staff)
        ->post(route('tickets.attachments.store', $ticket), ['file' => $file])
        ->assertRedirect(route('tickets.show', $ticket, absolute: false));

    $saved = $ticket->fresh()->attachments->first();
    expect(strlen((string) $saved->filename))->toBeLessThanOrEqual(255);
});

it('sends on-demand telegram group notification when tickets group chat id is configured', function () {
    Notification::fake();
    config([
        'services.telegram-bot-api.token' => 'test-token',
        'services.telegram-bot-api.tickets_group_chat_id' => '-100999',
    ]);

    $user = User::factory()->pemohon()->create();

    $this->actingAs($user)->post('/tickets', [
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'title' => 'Telegram Group Test',
        'description' => 'desc',
    ]);

    Notification::assertSentOnDemand(
        TicketCreatedTelegramGroupNotification::class,
        function ($notification, $channels, $notifiable) {
            return $channels === ['telegram']
                && $notifiable->routeNotificationFor('telegram') === '-100999'
                && $notification->ticket->title === 'Telegram Group Test';
        }
    );
});

it('does not send telegram group notification when tickets group chat id is empty', function () {
    Notification::fake();
    config([
        'services.telegram-bot-api.token' => 'test-token',
        'services.telegram-bot-api.tickets_group_chat_id' => null,
    ]);

    $user = User::factory()->pemohon()->create();

    $this->actingAs($user)->post('/tickets', [
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'title' => 'No Group Chat',
        'description' => 'desc',
    ]);

    Notification::assertSentOnDemandTimes(TicketCreatedTelegramGroupNotification::class, 0);
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

it('returns canSelectRequester flag for staff', function () {
    $staff = User::factory()->staff()->create();

    $response = $this->actingAs($staff)->get('/tickets/create');

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

it('allows admin to update ticket requester', function () {
    $admin = User::factory()->admin()->create();
    $oldRequester = User::factory()->pemohon()->create();
    $newRequester = User::factory()->pemohon()->create();

    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'requester_id' => $oldRequester->id,
    ]);

    $response = $this->actingAs($admin)->patch("/tickets/{$ticket->id}", [
        'requester_id' => $newRequester->id,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('tickets', [
        'id' => $ticket->id,
        'requester_id' => $newRequester->id,
    ]);
});

it('logs activity when requester changes', function () {
    $admin = User::factory()->admin()->create();
    $oldRequester = User::factory()->pemohon()->create();
    $newRequester = User::factory()->pemohon()->create();

    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'requester_id' => $oldRequester->id,
    ]);

    $this->actingAs($admin)->patch("/tickets/{$ticket->id}", [
        'requester_id' => $newRequester->id,
    ]);

    $this->assertDatabaseHas('ticket_activities', [
        'ticket_id' => $ticket->id,
        'action' => 'requester_changed',
        'old_value' => $oldRequester->name,
        'new_value' => $newRequester->name,
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

it('returns canSelectRequester flag on ticket edit for staff', function () {
    $staff = User::factory()->staff('IT')->create();
    $requester = User::factory()->pemohon()->create();

    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'requester_id' => $requester->id,
        'dep_id' => 'IT',
    ]);

    $this->actingAs($staff)->get("/tickets/{$ticket->id}/edit")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('tickets/edit')
            ->where('canSelectRequester', true)
        );
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

// ==================== IMPORT CSV ====================

it('shows import form for admin', function () {
    $admin = User::factory()->admin()->create();

    $response = $this->actingAs($admin)->get('/tickets/import');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tickets/import')
        ->has('templateUrl')
    );
});

it('allows admin to import tickets from CSV', function () {
    $admin = User::factory()->admin()->create();
    $type = $this->type;
    $category = $this->category;
    $priority = $this->priority;

    $csv = "Judul,Tipe,Kategori,Prioritas,Pemohon (email),Departemen,Deskripsi\n";
    $csv .= "\"Tiket dari CSV\",\"{$type->name}\",\"{$category->name}\",\"{$priority->name}\",\"{$admin->email}\",IT,\"Deskripsi impor\"";

    $response = $this->actingAs($admin)->post('/tickets/import', [
        'file' => \Illuminate\Http\UploadedFile::fake()->createWithContent('tickets.csv', $csv),
    ]);

    $response->assertRedirect('/tickets');
    $response->assertSessionHas('success');
    $this->assertDatabaseHas('tickets', [
        'title' => 'Tiket dari CSV',
        'requester_id' => $admin->id,
    ]);
});

it('denies pemohon access to import page', function () {
    $pemohon = User::factory()->pemohon()->create();

    $response = $this->actingAs($pemohon)->get('/tickets/import');

    $response->assertForbidden();
});
