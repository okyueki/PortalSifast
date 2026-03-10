<?php

namespace App\Notifications;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\Telegram\TelegramMessage;

class TicketCreatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Ticket $ticket
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        $channels = ['mail', 'database'];
        if ($notifiable instanceof User && $notifiable->hasTelegramConnected()) {
            $channels[] = 'telegram';
        }

        return $channels;
    }

    public function toTelegram(object $notifiable): TelegramMessage
    {
        $url = route('tickets.show', $this->ticket);

        return TelegramMessage::create()
            ->content("*Tiket Baru*\n\n")
            ->line("Tiket: *{$this->ticket->ticket_number}*")
            ->line("Judul: {$this->ticket->title}")
            ->line("Prioritas: {$this->ticket->priority->name}")
            ->line("Departemen: {$this->ticket->dep_id}")
            ->line('')
            ->line("[Buka di Portal]({$url})");
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = route('tickets.show', $this->ticket);

        return (new MailMessage)
            ->subject("Tiket Baru: {$this->ticket->ticket_number} - {$this->ticket->title}")
            ->greeting('Tiket Baru')
            ->line("Tiket baru telah dibuat: {$this->ticket->ticket_number}")
            ->line("Judul: {$this->ticket->title}")
            ->line("Prioritas: {$this->ticket->priority->name}")
            ->line("Departemen: {$this->ticket->dep_id}")
            ->action('Lihat Tiket', $url)
            ->line('Tim support akan segera menindaklanjuti.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'ticket_created',
            'ticket_id' => $this->ticket->id,
            'ticket_number' => $this->ticket->ticket_number,
            'title' => $this->ticket->title,
            'url' => route('tickets.show', $this->ticket),
        ];
    }
}
