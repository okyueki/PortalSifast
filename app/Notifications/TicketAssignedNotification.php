<?php

namespace App\Notifications;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketAssignedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Ticket $ticket,
        public User $assignedBy
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $url = route('tickets.show', $this->ticket);

        return (new MailMessage)
            ->subject("Tiket Ditugaskan: {$this->ticket->ticket_number}")
            ->greeting('Tiket Ditugaskan ke Anda')
            ->line("Tiket {$this->ticket->ticket_number} telah ditugaskan kepada Anda.")
            ->line("Judul: {$this->ticket->title}")
            ->line("Prioritas: {$this->ticket->priority->name}")
            ->action('Lihat Tiket', $url)
            ->line("Ditugaskan oleh: {$this->assignedBy->name}");
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'ticket_assigned',
            'ticket_id' => $this->ticket->id,
            'ticket_number' => $this->ticket->ticket_number,
            'title' => $this->ticket->title,
            'assigned_by' => $this->assignedBy->name,
            'url' => route('tickets.show', $this->ticket),
        ];
    }
}
