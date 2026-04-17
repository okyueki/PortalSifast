<?php

use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Models\TicketPriority;
use App\Models\TicketStatus;
use App\Models\TicketType;
use App\Models\User;
use App\Services\TicketTelegramGroupNotifier;
use GuzzleHttp\Psr7\Response;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use NotificationChannels\Telegram\Telegram;

/**
 * Memastikan alur Laravel → notifikasi grup → TelegramChannel memanggil sendMessage
 * dengan chat_id dan teks yang benar (kelas Telegram di-mock; tidak memanggil api.telegram.org).
 *
 * Jalankan: php artisan test tests/Feature/Telegram/TicketTelegramGroupNotificationTest.php
 */
beforeEach(function () {
    $this->withoutMiddleware(ValidateCsrfToken::class);

    // Tanpa ini, jika .env pakai queue database, notifikasi ShouldQueue tidak dieksekusi di proses tes.
    config(['queue.default' => 'sync']);

    // firstOrCreate: aman di DB shared / tanpa migrate:fresh penuh (hindari duplikat slug dari factory).
    $this->type = TicketType::firstOrCreate(
        ['slug' => 'pest-telegram-integration-type'],
        ['name' => 'Pest Telegram Type', 'description' => 'Baris master untuk uji otomatis', 'is_active' => true]
    );

    $this->category = TicketCategory::firstOrCreate(
        [
            'ticket_type_id' => $this->type->id,
            'name' => 'Pest Telegram Category',
        ],
        ['dep_id' => 'IT', 'is_development' => false, 'is_active' => true]
    );

    $this->priority = TicketPriority::firstOrCreate(
        ['name' => 'Pest Telegram Priority'],
        ['level' => 3, 'color' => 'gray', 'response_hours' => 1, 'resolution_hours' => 4, 'is_active' => true]
    );

    $this->statusNew = TicketStatus::firstOrCreate(
        ['slug' => TicketStatus::SLUG_NEW],
        ['name' => 'Baru', 'color' => 'blue', 'order' => 1, 'is_closed' => false, 'is_active' => true]
    );
});

it('calls Telegram sendMessage for group when TicketTelegramGroupNotifier runs', function () {
    config([
        'services.telegram-bot-api.token' => 'test-token-for-pest',
        'services.telegram-bot-api.tickets_group_chat_id' => '-100999888',
        'app.url' => 'https://portal.test',
    ]);

    $this->mock(Telegram::class, function ($mock) {
        $mock->shouldReceive('setToken')->andReturnSelf();

        $mock->shouldReceive('sendMessage')
            ->once()
            ->withArgs(function (array $params) {
                return $params['chat_id'] === '-100999888'
                    && str_contains($params['text'], 'Tiket baru')
                    && str_contains($params['text'], 'No:')
                    && str_contains($params['text'], 'Judul: Integration Telegram Test');
            })
            ->andReturn(new Response(200, [], '{"ok":true}'));
    });

    $requester = User::factory()->pemohon()->create();

    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'requester_id' => $requester->id,
        'title' => 'Integration Telegram Test',
        'dep_id' => 'IT',
    ]);

    $ticket->loadMissing(['priority', 'category', 'type', 'requester']);

    TicketTelegramGroupNotifier::notifyNewTicket($ticket);
});

it('calls Telegram sendMessage when a ticket is created via POST /tickets', function () {
    config([
        'services.telegram-bot-api.token' => 'test-token-for-pest',
        'services.telegram-bot-api.tickets_group_chat_id' => '-100999888',
        'app.url' => 'https://portal.test',
    ]);

    $this->mock(Telegram::class, function ($mock) {
        $mock->shouldReceive('setToken')->andReturnSelf();

        $mock->shouldReceive('sendMessage')
            ->once()
            ->withArgs(function (array $params) {
                return $params['chat_id'] === '-100999888'
                    && str_contains($params['text'], 'Tiket baru')
                    && str_contains($params['text'], 'Judul: POST Tiket Telegram');
            })
            ->andReturn(new Response(200, [], '{"ok":true}'));
    });

    $user = User::factory()->pemohon()->create();

    $response = $this->actingAs($user)->post('/tickets', [
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'title' => 'POST Tiket Telegram',
        'description' => 'Deskripsi uji',
    ]);

    $response->assertRedirect();
});

it('calls Telegram sendMessage when assignee is set via ticket update', function () {
    config([
        'services.telegram-bot-api.token' => 'test-token-for-pest',
        'services.telegram-bot-api.tickets_group_chat_id' => '-100999888',
        'app.url' => 'https://portal.test',
    ]);

    $this->mock(Telegram::class, function ($mock) {
        $mock->shouldReceive('setToken')->andReturnSelf();
        $mock->shouldReceive('sendMessage')
            ->once()
            ->withArgs(fn (array $params) => $params['chat_id'] === '-100999888'
                && str_contains($params['text'], 'Petugas ditugaskan'));
    });

    $admin = User::factory()->admin()->create();
    $staffTarget = User::factory()->staff('IT')->create();
    $pemohon = User::factory()->pemohon()->create();

    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'requester_id' => $pemohon->id,
        'dep_id' => 'IT',
        'assignee_id' => null,
    ]);

    $this->actingAs($admin)->patch("/tickets/{$ticket->id}", [
        'assignee_id' => $staffTarget->id,
    ])->assertRedirect();
});

it('calls Telegram sendMessage when staff takes ticket via assign-self', function () {
    config([
        'services.telegram-bot-api.token' => 'test-token-for-pest',
        'services.telegram-bot-api.tickets_group_chat_id' => '-100999888',
        'app.url' => 'https://portal.test',
    ]);

    $this->mock(Telegram::class, function ($mock) {
        $mock->shouldReceive('setToken')->andReturnSelf();
        $mock->shouldReceive('sendMessage')
            ->once()
            ->withArgs(fn (array $params) => $params['chat_id'] === '-100999888'
                && str_contains($params['text'], 'Tiket diambil'));
    });

    $staff = User::factory()->staff('IT')->create();
    $pemohon = User::factory()->pemohon()->create();

    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'requester_id' => $pemohon->id,
        'dep_id' => 'IT',
        'assignee_id' => null,
    ]);

    $this->actingAs($staff)->post("/tickets/{$ticket->id}/assign-self")->assertRedirect();
});

it('calls Telegram sendMessage when a comment is posted', function () {
    config([
        'services.telegram-bot-api.token' => 'test-token-for-pest',
        'services.telegram-bot-api.tickets_group_chat_id' => '-100999888',
        'app.url' => 'https://portal.test',
    ]);

    $this->mock(Telegram::class, function ($mock) {
        $mock->shouldReceive('setToken')->andReturnSelf();
        $mock->shouldReceive('sendMessage')
            ->once()
            ->withArgs(fn (array $params) => $params['chat_id'] === '-100999888'
                && str_contains($params['text'], 'Komentar baru')
                && str_contains($params['text'], 'Halo grup telegram'));
    });

    $staff = User::factory()->staff('IT')->create();
    $pemohon = User::factory()->pemohon()->create();

    $ticket = Ticket::factory()->create([
        'ticket_type_id' => $this->type->id,
        'ticket_category_id' => $this->category->id,
        'ticket_priority_id' => $this->priority->id,
        'ticket_status_id' => $this->statusNew->id,
        'requester_id' => $pemohon->id,
        'dep_id' => 'IT',
        'assignee_id' => $staff->id,
    ]);

    $this->actingAs($staff)->post("/tickets/{$ticket->id}/comments", [
        'body' => 'Halo grup telegram',
        'is_internal' => false,
    ])->assertRedirect();
});
