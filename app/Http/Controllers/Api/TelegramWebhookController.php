<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\WorkNote;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class TelegramWebhookController extends Controller
{
    private const LINK_PREFIX = 'link_';

    /**
     * Handle incoming Telegram bot webhook (POST from Telegram servers).
     * - /start link_XXX: hubungkan akun user dengan chat_id
     * - /start: tampilkan bantuan
     * - Pesan teks lain: simpan sebagai WorkNote (jika chat_id sudah terhubung)
     */
    public function __invoke(Request $request): Response
    {
        $payload = $request->all();
        $message = $payload['message'] ?? null;
        if (! $message) {
            return response('', 204);
        }

        $chatId = (string) ($message['chat']['id'] ?? '');
        $text = trim((string) ($message['text'] ?? ''));
        if ($chatId === '' || $text === '') {
            return response('', 204);
        }

        $token = config('services.telegram-bot-api.token');
        if (empty($token)) {
            return response('', 204);
        }

        if (str_starts_with($text, '/start')) {
            $this->handleStart($chatId, $text, $token);

            return response('', 204);
        }

        $this->handleMessage($chatId, $text, $token);

        return response('', 204);
    }

    private function handleStart(string $chatId, string $text, string $token): void
    {
        $parts = preg_split('/\s+/', $text, 2);
        $param = $parts[1] ?? '';

        if (str_starts_with($param, self::LINK_PREFIX)) {
            $linkToken = substr($param, strlen(self::LINK_PREFIX));
            $userId = Cache::get('telegram_link:'.$linkToken);
            if ($userId) {
                $user = User::find($userId);
                if ($user) {
                    $user->update(['telegram_chat_id' => $chatId]);
                    Cache::forget('telegram_link:'.$linkToken);
                    $this->sendTelegram($token, $chatId, "✅ *Akun terhubung!*\n\nAnda akan menerima notifikasi tiket baru di sini.\n\nKirim pesan apa saja ke bot ini untuk menyimpan sebagai *Catatan Kerja* di portal.");

                    return;
                }
            }
            $this->sendTelegram($token, $chatId, '❌ Link tidak valid atau kedaluwarsa. Silakan buka Pengaturan → Telegram di portal dan klik Hubungkan lagi.');

            return;
        }

        $this->sendTelegram($token, $chatId, "Halo! 👋\n\n• *Hubungkan akun:* Buka *Pengaturan → Telegram* di portal, lalu klik *Hubungkan*.\n• *Simpan catatan:* Setelah terhubung, kirim pesan apa saja ke bot ini — akan tersimpan sebagai Catatan Kerja dan bisa dilihat di portal.");
    }

    private function handleMessage(string $chatId, string $text, string $token): void
    {
        $user = User::where('telegram_chat_id', $chatId)->first();
        if (! $user) {
            $this->sendTelegram($token, $chatId, 'Belum terhubung. Kirim /start dan ikuti petunjuk, atau hubungkan akun lewat Pengaturan → Telegram di portal.');

            return;
        }

        $title = str_replace(["\r", "\n"], ' ', $text);
        if (mb_strlen($title) > 255) {
            $title = mb_substr($title, 0, 252).'...';
        }
        if ($title === '') {
            $title = 'Catatan dari Telegram';
        }

        $blocks = [
            ['id' => uniqid('tg', true), 'type' => 'text', 'content' => $text],
        ];

        $note = $user->workNotes()->create([
            'title' => $title,
            'icon' => '📱',
            'content' => $blocks,
        ]);

        $url = route('catatan.index').'?note='.$note->id;
        $this->sendTelegram($token, $chatId, "✅ Catatan tersimpan.\n\n[Buka di Portal]({$url})");
    }

    private function sendTelegram(string $token, string $chatId, string $text): void
    {
        $baseUri = config('services.telegram-bot-api.base_uri', 'https://api.telegram.org');
        $url = rtrim($baseUri, '/').'/bot'.$token.'/sendMessage';

        Http::post($url, [
            'chat_id' => $chatId,
            'text' => $text,
            'parse_mode' => 'Markdown',
            'disable_web_page_preview' => true,
        ]);
    }
}
