<?php

use App\Support\TelegramBotConfig;
use Tests\TestCase;

uses(TestCase::class);

it('prefers config token over getenv', function () {
    putenv('TELEGRAM_BOT_TOKEN=from_env');
    try {
        config(['services.telegram-bot-api.token' => 'from_config']);

        expect(TelegramBotConfig::token())->toBe('from_config');
    } finally {
        putenv('TELEGRAM_BOT_TOKEN');
    }
});

it('returns token when telegram token config is set', function () {
    config(['services.telegram-bot-api.token' => 'abc:123']);

    expect(TelegramBotConfig::token())->toBe('abc:123')
        ->and(TelegramBotConfig::hasToken())->toBeTrue();
});

it('uses getenv when config token is empty', function () {
    config(['services.telegram-bot-api.token' => '']);
    putenv('TELEGRAM_BOT_TOKEN=from_getenv:token');

    try {
        expect(TelegramBotConfig::token())->toBe('from_getenv:token');
    } finally {
        putenv('TELEGRAM_BOT_TOKEN');
    }
});
