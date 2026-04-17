<?php

namespace App\Services;

use App\Models\Ticket;
use App\Models\TicketAttachment;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

final class TicketAttachmentStorageService
{
    /**
     * Simpan file ke disk public dan buat baris ticket_attachments.
     *
     * @throws \RuntimeException jika penyimpanan gagal (izin disk, disk penuh, dll.)
     */
    public static function storeOnTicket(UploadedFile $file, Ticket $ticket, User $user): TicketAttachment
    {
        $path = $file->store("tickets/{$ticket->id}", 'public');

        if ($path === false || $path === '') {
            throw new \RuntimeException('Gagal menyimpan file. Periksa folder storage (izin tulis) atau jalankan php artisan storage:link.');
        }

        return $ticket->attachments()->create([
            'user_id' => $user->id,
            'filename' => self::safeOriginalFilename($file),
            'path' => $path,
            'mime_type' => self::resolveMimeType($file),
            'size' => $file->getSize() ?: 0,
        ]);
    }

    private static function safeOriginalFilename(UploadedFile $file): string
    {
        $name = $file->getClientOriginalName();
        $name = str_replace(["\0", "\r", "\n"], '', $name);
        $name = basename($name);

        return Str::limit($name, 255, '');
    }

    private static function resolveMimeType(UploadedFile $file): ?string
    {
        try {
            $guessed = $file->getMimeType();
            if (is_string($guessed) && $guessed !== '') {
                return Str::limit($guessed, 255, '');
            }
        } catch (\Throwable) {
            // Beberapa host: finfo / berkas temp bermasalah saat getMimeType()
        }

        $client = $file->getClientMimeType();

        if (is_string($client) && $client !== '') {
            return Str::limit($client, 255, '');
        }

        return null;
    }
}
