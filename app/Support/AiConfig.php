<?php

namespace App\Support;

/**
 * Reads AI provider config from .env (bypasses Laravel config cache).
 * Pola sama dengan TelegramBotConfig.
 */
final class AiConfig
{
    public const PROVIDER = 'openrouter';

    public const MODEL = 'deepseek/deepseek-v4-flash:free';

    public const BASE_URL = 'https://openrouter.ai/api/v1';

    public static function apiKey(): ?string
    {
        return self::readFromDotEnv('OPENROUTER_API_KEY');
    }

    public static function hasApiKey(): bool
    {
        $key = self::apiKey();

        return is_string($key) && $key !== '' && str_starts_with($key, 'sk-');
    }

    public static function siteUrl(): ?string
    {
        return config('app.url');
    }

    public static function siteName(): string
    {
        return config('app.name', 'Portal Sifast');
    }

    private static function readFromDotEnv(string $key): ?string
    {
        $path = base_path('.env');
        if (! is_file($path) || ! is_readable($path)) {
            return null;
        }

        $content = @file_get_contents($path);
        if ($content === false) {
            return null;
        }

        foreach (explode("\n", $content) as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }
            if (! preg_match('/^'.preg_quote($key, '/').'\s*=\s*(.*)$/', $line, $m)) {
                continue;
            }
            $raw = trim($m[1]);
            // Strip quotes
            if (str_starts_with($raw, '"') && str_ends_with($raw, '"')) {
                $raw = stripcslashes(substr($raw, 1, -1));
            } elseif (str_starts_with($raw, "'") && str_ends_with($raw, "'")) {
                $raw = substr($raw, 1, -1);
            }

            return $raw !== '' ? $raw : null;
        }

        return null;
    }
}
