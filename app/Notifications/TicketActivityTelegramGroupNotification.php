<?php

namespace App\Notifications;

use App\Models\Ticket;
use App\Support\TelegramBotConfig;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\Telegram\TelegramMessage;

/**
 * Pemberitahuan aktivitas tiket ke grup Telegram (teks polos).
 *
 * @param  list<string>  $detailLines
 */
class TicketActivityTelegramGroupNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * @param  list<string>  $detailLines
     */
    public function __construct(
        public Ticket $ticket,
        public string $headline,
        public array $detailLines = [],
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

        $message = TelegramMessage::create()
            ->normal()
            ->content("✨ {$brand}\n".$this->headline."\n\n")
            ->line("📝 No: {$t->ticket_number}")
            ->line("📌 Judul: {$t->title}");

        foreach ($this->detailLines as $line) {
            if ($line !== '') {
                $message->line($line);
            }
        }

        $message->line('')->line('🔗 Buka tiket:')->line($url);

        $token = TelegramBotConfig::token();
        if ($token !== null) {
            $message->token($token);
        }

        return $message;
    }
}
