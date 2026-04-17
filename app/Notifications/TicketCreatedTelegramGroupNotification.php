<?php

namespace App\Notifications;

use App\Models\Ticket;
use App\Support\TelegramBotConfig;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\Telegram\TelegramMessage;

/**
 * Notifikasi ke satu grup Telegram (semua teknisi memantau dari grup yang sama).
 */
class TicketCreatedTelegramGroupNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  'new'|'draft'|'published'  $kind
     */
    public function __construct(
        public Ticket $ticket,
        public string $kind = 'new',
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['telegram'];
    }

    public function toTelegram(object $notifiable): TelegramMessage
    {
        $t = $this->ticket;
        $url = route('tickets.show', $t);
        $brand = config('app.name', 'Portal');
        $pemohon = $t->requester?->name ?? '—';
        $tipe = $t->type?->name ?? '—';
        $kategori = $t->category?->name ?? '—';
        $prioritas = $t->priority?->name ?? '—';

        $headline = match ($this->kind) {
            'draft' => "\u{1F3AB} {$brand} · Draf tiket (belum dipublikasi; SLA belum jalan)",
            'published' => "\u{1F3AB} {$brand} · Draf dipublikasikan (SLA aktif)",
            default => "\u{1F3AB} {$brand} · Tiket baru",
        };

        // Tanpa Markdown: judul/nama pemohon bisa mengandung _ * [ ] sehingga API Telegram error 400.
        $message = TelegramMessage::create()
            ->normal()
            ->content($headline."\n\n")
            ->line("\u{1F4DD} No: {$t->ticket_number}")
            ->line("\u{1F4CC} Judul: {$t->title}")
            ->line("\u{1F4C2} Tipe: {$tipe}")
            ->line("\u{1F3F7}\u{FE0F} Kategori: {$kategori}")
            ->line("\u{26A1} Prioritas: {$prioritas}")
            ->line("\u{1F3E2} Dept: {$t->dep_id}")
            ->line("\u{1F464} Pemohon: {$pemohon}")
            ->line('')
            ->line("\u{1F517} Buka tiket:")
            ->line($url);

        $token = TelegramBotConfig::token();
        if ($token !== null) {
            $message->token($token);
        }

        return $message;
    }
}
