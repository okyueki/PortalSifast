<?php

namespace App\Notifications;

use App\Models\Ticket;
use App\Models\User;
use App\Support\TelegramBotConfig;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Telegram\TelegramMessage;

class TicketCreatedNotification extends Notification implements ShouldQueue
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
        $channels = ['mail', 'database'];
        if ($notifiable instanceof User && $notifiable->hasTelegramConnected() && TelegramBotConfig::hasToken()) {
            $channels[] = 'telegram';
        }

        return $channels;
    }

    public function toTelegram(object $notifiable): TelegramMessage
    {
        $url = route('tickets.show', $this->ticket);
        $token = TelegramBotConfig::token();

        $title = match ($this->kind) {
            'draft' => '*Draf tiket*',
            'published' => '*Draf dipublikasikan*',
            default => '*Tiket Baru*',
        };

        $message = TelegramMessage::create()
            ->content("{$title}\n\n")
            ->line("Tiket: *{$this->ticket->ticket_number}*")
            ->line("Judul: {$this->ticket->title}")
            ->line("Prioritas: {$this->ticket->priority->name}")
            ->line("Departemen: {$this->ticket->dep_id}")
            ->line('')
            ->line("[Buka di Portal]({$url})");

        if ($token !== null) {
            $message->token($token);
        }

        return $message;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = route('tickets.show', $this->ticket);

        [$subjectPrefix, $greeting, $lead, $footer] = match ($this->kind) {
            'draft' => [
                'Draf tiket',
                'Draf tiket disimpan',
                "Draf {$this->ticket->ticket_number} disimpan (belum dipublikasi; SLA dimulai setelah dipublikasi).",
                'Anggota tim dapat melihat draf di portal.',
            ],
            'published' => [
                'Draf dipublikasikan',
                'Draf dipublikasikan',
                "Draf {$this->ticket->ticket_number} sekarang aktif dan SLA berjalan.",
                'Tim support dapat menindaklanjuti sesuai prioritas.',
            ],
            default => [
                'Tiket Baru',
                'Tiket Baru',
                "Tiket baru telah dibuat: {$this->ticket->ticket_number}",
                'Tim support akan segera menindaklanjuti.',
            ],
        };

        return (new MailMessage)
            ->subject("{$subjectPrefix}: {$this->ticket->ticket_number} - {$this->ticket->title}")
            ->greeting($greeting)
            ->line($lead)
            ->line("Judul: {$this->ticket->title}")
            ->line("Prioritas: {$this->ticket->priority->name}")
            ->line("Departemen: {$this->ticket->dep_id}")
            ->action('Lihat Tiket', $url)
            ->line($footer);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $type = match ($this->kind) {
            'draft' => 'ticket_draft_created',
            'published' => 'ticket_draft_published',
            default => 'ticket_created',
        };

        return [
            'type' => $type,
            'kind' => $this->kind,
            'ticket_id' => $this->ticket->id,
            'ticket_number' => $this->ticket->ticket_number,
            'title' => $this->ticket->title,
            'url' => route('tickets.show', $this->ticket),
        ];
    }
}
