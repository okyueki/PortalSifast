<?php

use Illuminate\Support\Facades\Http;

it('sends test message when token and chat id are configured', function () {
    config([
        'services.telegram-bot-api.token' => 'test-token',
        'services.telegram-bot-api.tickets_group_chat_id' => '-100555',
        'services.telegram-bot-api.base_uri' => 'https://api.telegram.org',
    ]);

    Http::fake([
        'api.telegram.org/bottest-token/sendMessage' => Http::response(['ok' => true, 'result' => ['message_id' => 1]], 200),
    ]);

    $this->artisan('telegram:test-group', ['--message' => 'Hello pest'])
        ->assertSuccessful();

    Http::assertSent(function ($request) {
        return str_contains($request->url(), 'bottest-token/sendMessage')
            && $request['chat_id'] === '-100555'
            && $request['text'] === 'Hello pest';
    });
});

it('fails when group chat id is missing', function () {
    config([
        'services.telegram-bot-api.token' => 'x',
        'services.telegram-bot-api.tickets_group_chat_id' => '',
    ]);

    $this->artisan('telegram:test-group')
        ->assertFailed();
});
