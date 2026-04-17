<?php

use App\Models\Ticket;
use App\Models\TicketCategory;
use App\Models\TicketPriority;
use App\Models\TicketStatus;
use App\Models\TicketType;
use App\Models\User;
use App\Models\WorkNote;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;
use function Pest\Laravel\post;

beforeEach(function () {
    $this->withoutMiddleware(ValidateCsrfToken::class);
    Http::fake();
});

test('telegram webhook returns 204 when payload has no message', function () {
    config(['services.telegram-bot-api.token' => 'test-token']);

    $response = post(route('api.telegram.webhook'), ['update_id' => 1]);

    $response->assertNoContent(204);
});

test('telegram webhook returns 204 when bot token is empty', function () {
    config(['services.telegram-bot-api.token' => null]);

    $response = post(route('api.telegram.webhook'), [
        'message' => [
            'chat' => ['id' => 12345],
            'text' => 'hello',
        ],
    ]);

    $response->assertNoContent(204);
});

test('telegram webhook start with link token connects user', function () {
    config(['services.telegram-bot-api.token' => 'test-token']);
    $user = User::factory()->create(['telegram_chat_id' => null]);
    $linkToken = 'abc123xyz';
    Cache::put('telegram_link:'.$linkToken, $user->id, 900);

    $response = post(route('api.telegram.webhook'), [
        'message' => [
            'chat' => ['id' => 98765],
            'text' => '/start link_'.$linkToken,
        ],
    ]);

    $response->assertNoContent(204);
    $user->refresh();
    expect($user->telegram_chat_id)->toBe('98765');
    expect(Cache::get('telegram_link:'.$linkToken))->toBeNull();
});

test('telegram webhook message from connected user creates work note', function () {
    config(['services.telegram-bot-api.token' => 'test-token']);
    $user = User::factory()->create(['telegram_chat_id' => '111222']);
    $chatId = '111222';
    $text = 'Reminder: rapat besok jam 10';

    $response = post(route('api.telegram.webhook'), [
        'message' => [
            'chat' => ['id' => (int) $chatId],
            'text' => $text,
        ],
    ]);

    $response->assertNoContent(204);
    $note = WorkNote::where('user_id', $user->id)->where('title', 'like', '%rapat%')->first();
    expect($note)->not->toBeNull();
    expect($note->title)->toBe($text);
    expect($note->icon)->toBe('📱');
    expect($note->content)->toBeArray();
    expect($note->content[0]['type'] ?? null)->toBe('text');
    expect($note->content[0]['content'] ?? null)->toBe($text);
});

test('telegram webhook /tiket creates ticket with temporary requester', function () {
    config([
        'services.telegram-bot-api.token' => 'test-token',
        'app.url' => 'https://portal.test',
    ]);

    $type = TicketType::firstOrCreate(
        ['slug' => 'pest-telegram-ticket-type'],
        ['name' => 'Pest Telegram Type', 'description' => 'Master uji webhook', 'is_active' => true]
    );
    $category = TicketCategory::firstOrCreate(
        ['ticket_type_id' => $type->id, 'name' => 'Pest Telegram Category'],
        ['dep_id' => 'IT', 'is_development' => false, 'is_active' => true]
    );
    $priority = TicketPriority::firstOrCreate(
        ['name' => 'Pest Telegram Priority'],
        ['level' => 3, 'color' => 'gray', 'response_hours' => 1, 'resolution_hours' => 4, 'is_active' => true]
    );
    TicketStatus::firstOrCreate(
        ['slug' => TicketStatus::SLUG_NEW],
        ['name' => 'Baru', 'color' => 'blue', 'order' => 1, 'is_closed' => false, 'is_active' => true]
    );

    $user = User::factory()->staff('IT')->create(['telegram_chat_id' => '111222']);

    $title = 'Printer IGD error '.uniqid();

    $response = post(route('api.telegram.webhook'), [
        'message' => [
            'chat' => ['id' => 111222],
            'text' => "/tiket {$title}\nDiminta oleh: Budi - IGD",
        ],
    ]);

    $response->assertNoContent(204);

    $ticket = Ticket::query()
        ->where('title', $title)
        ->where('requester_id', $user->id)
        ->latest('id')
        ->first();
    expect($ticket)->not->toBeNull();
    expect($ticket?->ticket_type_id)->toBeInt();
    expect($ticket?->ticket_category_id)->toBeInt();
    expect($ticket?->ticket_priority_id)->toBeInt();
    expect($ticket?->requester_id)->toBe($user->id);
    expect($ticket?->description)->toContain('Permintaan dibuat via Telegram');
    expect($ticket?->description)->toContain('Pemohon aktual (manual): Budi - IGD');

    expect($ticket?->activities()->where('action', 'created')->exists())->toBeTrue();

    Http::assertSent(function ($request) {
        $payload = $request->data();

        return str_contains($request->url(), '/sendMessage')
            && ($payload['chat_id'] ?? null) === '111222'
            && str_contains((string) ($payload['text'] ?? ''), 'Nomor tiket:');
    });
});

test('telegram webhook /tiket without title sends usage help', function () {
    config([
        'services.telegram-bot-api.token' => 'test-token',
    ]);

    $user = User::factory()->staff('IT')->create(['telegram_chat_id' => '333444']);

    $response = post(route('api.telegram.webhook'), [
        'message' => [
            'chat' => ['id' => 333444],
            'text' => '/tiket',
        ],
    ]);

    $response->assertNoContent(204);
    expect(Ticket::query()->where('requester_id', $user->id)->exists())->toBeFalse();

    Http::assertSent(function ($request) {
        $payload = $request->data();

        return str_contains($request->url(), '/sendMessage')
            && str_contains((string) ($payload['text'] ?? ''), 'Format pembuatan tiket');
    });
});

test('telegram webhook /tiket without "diminta oleh" sends guidance and does not create ticket', function () {
    config([
        'services.telegram-bot-api.token' => 'test-token',
    ]);

    $user = User::factory()->staff('IT')->create(['telegram_chat_id' => '555666']);
    $title = 'PC kasir tidak bisa login '.uniqid();

    $response = post(route('api.telegram.webhook'), [
        'message' => [
            'chat' => ['id' => 555666],
            'text' => "/tiket {$title}\nMuncul error akun terkunci",
        ],
    ]);

    $response->assertNoContent(204);
    expect(Ticket::query()->where('title', $title)->where('requester_id', $user->id)->exists())->toBeFalse();

    Http::assertSent(function ($request) {
        $payload = $request->data();

        return str_contains($request->url(), '/sendMessage')
            && str_contains((string) ($payload['text'] ?? ''), 'Mohon lengkapi baris wajib');
    });
});

test('settings telegram page requires auth', function () {
    $response = get(route('settings.telegram.edit'));

    $response->assertRedirect();
});

test('authenticated user can view and use telegram settings', function () {
    $user = User::factory()->create(['telegram_chat_id' => null]);

    $response = actingAs($user)->get(route('settings.telegram.edit'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('settings/telegram')
        ->where('telegramConnected', false)
    );

    $user->update(['telegram_chat_id' => '12345']);
    $response = actingAs($user->fresh())->get(route('settings.telegram.edit'));
    $response->assertInertia(fn ($page) => $page->where('telegramConnected', true));

    $response = actingAs($user)->post(route('settings.telegram.disconnect'));
    $response->assertRedirect(route('settings.telegram.edit'));
    $user->refresh();
    expect($user->telegram_chat_id)->toBeNull();
});
