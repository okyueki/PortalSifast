<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TelegramController extends Controller
{
    private const LINK_CACHE_TTL_SECONDS = 900;

    public function edit(Request $request): Response
    {
        $user = $request->user();
        $botUsername = config('services.telegram-bot-api.username');

        return Inertia::render('settings/telegram', [
            'telegramConnected' => $user->hasTelegramConnected(),
            'telegramBotUsername' => $botUsername,
            'connectLink' => $request->session()->get('telegram_connect_link'),
        ]);
    }

    /**
     * Generate one-time link token and return redirect with link in session (frontend opens it).
     */
    public function connect(Request $request): RedirectResponse
    {
        $user = $request->user();
        $botUsername = config('services.telegram-bot-api.username');
        if (empty($botUsername)) {
            return redirect()->route('settings.telegram.edit')
                ->with('error', 'Bot Telegram belum dikonfigurasi (TELEGRAM_BOT_USERNAME).');
        }

        $token = Str::random(32);
        Cache::put('telegram_link:'.$token, $user->id, self::LINK_CACHE_TTL_SECONDS);
        $link = 'https://t.me/'.ltrim($botUsername, '@').'?start=link_'.$token;

        return redirect()->route('settings.telegram.edit')
            ->with('telegram_connect_link', $link)
            ->with('success', 'Buka link yang muncul di Telegram, lalu kirim /start ke bot.');
    }

    public function disconnect(Request $request): RedirectResponse
    {
        $request->user()->update(['telegram_chat_id' => null]);

        return redirect()->route('settings.telegram.edit')
            ->with('success', 'Akun Telegram telah dilepaskan.');
    }
}
