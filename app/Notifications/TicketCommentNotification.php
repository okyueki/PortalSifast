<?php

namespace App\Notifications;

use App\Models\Ticket;
use App\Models\TicketComment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TicketCommentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Ticket $ticket,
        public TicketComment $comment
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
        $body = \Illuminate\Support\Str::limit($this->comment->body, 100);

        return (new MailMessage)
            ->subject("Komentar Baru: {$this->ticket->ticket_number}")
            ->greeting('Komentar Baru pada Tiket')
            ->line("Ada komentar baru pada tiket {$this->ticket->ticket_number}:")
            ->line("\"{$body}\"")
            ->line("Oleh: {$this->comment->user->name}")
            ->action('Lihat Tiket', $url);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'ticket_comment',
            'ticket_id' => $this->ticket->id,
            'ticket_number' => $this->ticket->ticket_number,
            'comment_id' => $this->comment->id,
            'comment_author' => $this->comment->user->name,
            'url' => route('tickets.show', $this->ticket),
        ];
    }
}
