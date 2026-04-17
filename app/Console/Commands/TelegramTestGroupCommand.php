<?php

namespace App\Console\Commands;

use App\Support\TelegramBotConfig;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;

class TelegramTestGroupCommand extends Command
{
    protected $signature = 'telegram:test-group
                            {--message= : Teks yang dikirim (default: pesan bawaan)}';

    protected $description = 'Kirim satu pesan uji ke grup Telegram tiket (TELEGRAM_TICKETS_GROUP_CHAT_ID). Untuk smoke test server, bukan PHPUnit.';

    public function handle(): int
    {
        $token = TelegramBotConfig::token();
        $chatId = config('services.telegram-bot-api.tickets_group_chat_id');

        if ($token === null) {
            $this->error('Token bot kosong. Set TELEGRAM_BOT_TOKEN di .env, lalu config:clear / config:cache jika perlu.');

            return Command::FAILURE;
        }

        if (! is_string($chatId) || $chatId === '') {
            $this->error('TELEGRAM_TICKETS_GROUP_CHAT_ID kosong di .env / config.');

            return Command::FAILURE;
        }

        $text = $this->option('message')
            ?: '✅ Tes manual dari PortalSifast (`php artisan telegram:test-group`). Jika Anda melihat ini, bot + chat_id grup benar.';

        $url = rtrim((string) config('services.telegram-bot-api.base_uri', 'https://api.telegram.org'), '/')."/bot{$token}/sendMessage";

        $response = Http::asForm()->timeout(15)->post($url, [
            'chat_id' => $chatId,
            'text' => $text,
        ]);

        if (! $response->successful()) {
            $this->error('Telegram API gagal: HTTP '.$response->status());
            $this->line($response->body());

            return Command::FAILURE;
        }

        $json = $response->json();
        if (! ($json['ok'] ?? false)) {
            $this->error('Telegram mengembalikan ok=false.');
            $this->line($response->body());

            return Command::FAILURE;
        }

        $this->info('Pesan terkirim ke grup (chat_id: '.$chatId.').');

        return Command::SUCCESS;
    }
}
