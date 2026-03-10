<?php

use App\Models\User;
use App\Models\WorkNote;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;
use function Pest\Laravel\post;

beforeEach(function () {
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
