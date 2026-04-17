<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\TicketComment;
use App\Models\User;
use App\Notifications\TicketActivityTelegramGroupNotification;
use App\Notifications\TicketCreatedTelegramGroupNotification;
use App\Support\TelegramBotConfig;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification as NotificationFacade;
use Illuminate\Support\Str;

final class TicketTelegramGroupNotifier
{
    /**
     * Tiket baru, draf baru, atau draf yang baru dipublikasikan (kind menentukan teks).
     *
     * @param  'new'|'draft'|'published'  $kind
     */
    public static function notifyNewTicket(Ticket $ticket, string $kind = 'new'): void
    {
        $ticket->loadMissing(['priority', 'category', 'type', 'requester']);

        self::dispatchToConfiguredGroup(new TicketCreatedTelegramGroupNotification($ticket, $kind));
    }

    public static function notifyTicketAssigned(Ticket $ticket, User $assignee, User $assignedBy): void
    {
        self::dispatchToConfiguredGroup(new TicketActivityTelegramGroupNotification(
            $ticket,
            '👤 Petugas ditugaskan',
            [
                '👷 Kepada: '.($assignee->name ?? '—'),
                '✏️ Oleh: '.($assignedBy->name ?? '—'),
            ]
        ));
    }

    /**
     * @param  string  $previousAssigneeName  Nama petugas sebelumnya (untuk ditampilkan)
     */
    public static function notifyTicketUnassigned(Ticket $ticket, string $previousAssigneeName, User $actor): void
    {
        self::dispatchToConfiguredGroup(new TicketActivityTelegramGroupNotification(
            $ticket,
            '📭 Tiket dilepas dari petugas',
            [
                '🕐 Sebelumnya: '.$previousAssigneeName,
                '✏️ Oleh: '.($actor->name ?? '—'),
            ]
        ));
    }

    public static function notifyTicketTakenBySelf(Ticket $ticket, User $staff): void
    {
        self::dispatchToConfiguredGroup(new TicketActivityTelegramGroupNotification(
            $ticket,
            '✋ Tiket diambil',
            [
                '🏃 '.($staff->name ?? '—').' mengambil dan menangani tiket ini.',
            ]
        ));
    }

    public static function notifyTicketComment(Ticket $ticket, TicketComment $comment): void
    {
        $comment->loadMissing('user');
        $author = $comment->user?->name ?? '—';
        $body = Str::limit((string) $comment->body, 600);
        $internalTag = $comment->is_internal ? '🔒 ' : '💬 ';

        self::dispatchToConfiguredGroup(new TicketActivityTelegramGroupNotification(
            $ticket,
            $internalTag.'Komentar baru',
            [
                '👤 Oleh: '.$author,
                '📄 '.($comment->is_internal ? '(internal) ' : '').$body,
            ]
        ));
    }

    private static function dispatchToConfiguredGroup(Notification $notification): void
    {
        $chatId = config('services.telegram-bot-api.tickets_group_chat_id');
        $token = TelegramBotConfig::token();

        if (is_string($chatId) && $chatId !== '' && $token === null) {
            Log::warning('Telegram grup tiket dilewati: token bot kosong di config. Pastikan TELEGRAM_BOT_TOKEN di .env, lalu jalankan `php artisan config:clear` dan `php artisan config:cache`, lalu restart queue worker.');
        }

        if (! is_string($chatId) || $chatId === '' || $token === null) {
            return;
        }

        NotificationFacade::route('telegram', $chatId)->notify($notification);
    }
}
