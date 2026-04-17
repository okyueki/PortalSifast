<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketActivity;
use App\Models\TicketCategory;
use App\Models\TicketPriority;
use App\Models\TicketStatus;
use App\Models\TicketType;
use App\Models\User;
use App\Models\WorkNote;
use App\Notifications\TicketCreatedNotification;
use App\Services\TicketTelegramGroupNotifier;
use App\Support\TelegramBotConfig;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class TelegramWebhookController extends Controller
{
    private const LINK_PREFIX = 'link_';

    /**
     * Handle incoming Telegram bot webhook (POST from Telegram servers).
     * - /start link_XXX: hubungkan akun user dengan chat_id
     * - /start: tampilkan bantuan
     * - /tiket [judul]\n[deskripsi]: buat tiket baru (pemohon sementara = akun terhubung)
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

        $token = TelegramBotConfig::token();
        if ($token === null || $token === '') {
            Log::warning('Telegram webhook dilewati: token bot kosong (config/.env).');

            return response('', 204);
        }

        if (str_starts_with($text, '/start')) {
            $this->handleStart($chatId, $text, $token);

            return response('', 204);
        }

        if (preg_match('/^\/(tiket|ticket)\b/i', $text) === 1) {
            $this->handleTicketCommand($chatId, $text, $token);

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

        $this->sendTelegram($token, $chatId, "Halo! 👋\n\n• *Hubungkan akun:* Buka *Pengaturan → Telegram* di portal, lalu klik *Hubungkan*.\n• *Simpan catatan:* Setelah terhubung, kirim pesan apa saja ke bot ini — akan tersimpan sebagai Catatan Kerja dan bisa dilihat di portal.\n• *Buat tiket cepat:* kirim `/tiket Judul masalah`, lalu wajib tambah baris `Diminta oleh: Nama - Unit`.");
    }

    private function handleTicketCommand(string $chatId, string $text, string $token): void
    {
        $user = $this->findUserByTelegramChatId($chatId);
        if (! $user) {
            $this->sendTelegram($token, $chatId, 'Belum terhubung. Kirim /start dan ikuti petunjuk, atau hubungkan akun lewat Pengaturan → Telegram di portal.', false);

            return;
        }

        ['title' => $title, 'description' => $description, 'requestedBy' => $requestedBy] = $this->parseTicketCommand($text);
        if ($title === '') {
            $this->sendTelegram(
                $token,
                $chatId,
                "Format pembuatan tiket:\n/tiket Judul masalah\nDeskripsi (opsional)\n\nContoh:\n/tiket Printer IGD error\nDiminta oleh: Budi - IGD\nKertas macet terus.",
                false
            );

            return;
        }

        if ($requestedBy === '') {
            $this->sendTelegram(
                $token,
                $chatId,
                "Mohon lengkapi baris wajib:\nDiminta oleh: Nama - Unit\n\nContoh:\n/tiket Printer IGD error\nDiminta oleh: Budi - IGD\nKertas macet terus.",
                false
            );

            return;
        }

        $type = TicketType::query()->active()->orderByRaw("slug = 'incident' desc")->orderBy('id')->first();
        $priority = TicketPriority::query()->active()->ordered()->first();
        $statusNew = TicketStatus::query()->where('slug', TicketStatus::SLUG_NEW)->first();

        if (! $type || ! $priority || ! $statusNew) {
            $this->sendTelegram($token, $chatId, 'Konfigurasi tiket belum lengkap (tipe/prioritas/status). Hubungi admin portal.', false);

            return;
        }

        $category = TicketCategory::query()
            ->active()
            ->where(function ($q) use ($type) {
                $q->whereNull('ticket_type_id')
                    ->orWhere('ticket_type_id', $type->id);
            })
            ->orderByRaw('dep_id = ? desc', [$user->dep_id ?? 'IT'])
            ->orderBy('id')
            ->first();

        $depId = $category?->dep_id ?? ($user->dep_id ?: 'IT');
        $ticketDescriptionPrefix = "Permintaan dibuat via Telegram oleh {$user->name} ({$user->email}).\nPemohon aktual (manual): {$requestedBy}\nMohon finalisasi pemohon aktual di web setelah tiket dibuat.";
        $ticketDescription = trim($ticketDescriptionPrefix."\n\n".($description !== '' ? $description : '(Tanpa deskripsi tambahan)'));

        try {
            $ticket = Ticket::query()->create([
                'ticket_type_id' => $type->id,
                'ticket_category_id' => $category?->id,
                'ticket_priority_id' => $priority->id,
                'ticket_status_id' => $statusNew->id,
                'dep_id' => $depId,
                'requester_id' => $user->id,
                'title' => $title,
                'description' => Str::limit($ticketDescription, 10000, '...'),
            ]);
        } catch (\Throwable $e) {
            Log::error('Telegram /tiket: gagal menyimpan tiket', ['exception' => $e->getMessage()]);
            $this->sendTelegram(
                $token,
                $chatId,
                'Gagal menyimpan tiket ke portal. Coba lagi atau buat tiket lewat web. Jika terus berulang, hubungi admin.',
                false
            );

            return;
        }

        $ticket->logActivity(
            TicketActivity::ACTION_CREATED,
            null,
            null,
            'Tiket dibuat via Telegram (pemohon sementara, perlu finalisasi pemohon).',
            $user->id
        );

        try {
            User::query()
                ->where('role', 'staff')
                ->where('dep_id', $depId)
                ->get()
                ->each(fn (User $staff) => $staff->notify(new TicketCreatedNotification($ticket)));

            TicketTelegramGroupNotifier::notifyNewTicket($ticket);
        } catch (\Throwable $e) {
            Log::warning('Telegram /tiket: tiket tersimpan, notifikasi pasca-create gagal', ['exception' => $e->getMessage()]);
        }

        $ticketUrl = route('tickets.show', $ticket);
        $this->sendTelegram(
            $token,
            $chatId,
            "✅ Berhasil. Nomor tiket: {$ticket->ticket_number}\n\nBuka di portal (menu Tiket):\n{$ticketUrl}\n\nPemohon di sistem sementara = akun Anda. Ubah pemohon di Edit tiket bila perlu.",
            false
        );
    }

    private function handleMessage(string $chatId, string $text, string $token): void
    {
        $user = $this->findUserByTelegramChatId($chatId);
        if (! $user) {
            $this->sendTelegram($token, $chatId, 'Belum terhubung. Kirim /start dan ikuti petunjuk, atau hubungkan akun lewat Pengaturan → Telegram di portal.', false);

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

    /**
     * @return array{title:string,description:string,requestedBy:string}
     */
    private function parseTicketCommand(string $text): array
    {
        $raw = (string) preg_replace('/^\/(tiket|ticket)\b/i', '', $text);
        $raw = trim($raw);
        if ($raw === '') {
            return ['title' => '', 'description' => '', 'requestedBy' => ''];
        }

        $lines = preg_split('/\r\n|\r|\n/', $raw) ?: [];
        $title = trim((string) array_shift($lines));
        $descriptionLines = [];
        $requestedBy = '';
        foreach ($lines as $line) {
            $trimmedLine = trim($line);
            if ($requestedBy === '' && preg_match('/^diminta\s+oleh\s*[:：]\s*(.+)$/iu', $trimmedLine, $matches) === 1) {
                $requestedBy = trim((string) $matches[1]);

                continue;
            }

            $descriptionLines[] = $line;
        }
        $description = trim(implode("\n", $descriptionLines));

        return [
            'title' => Str::limit($title, 255, '...'),
            'description' => $description,
            'requestedBy' => Str::limit($requestedBy, 255, '...'),
        ];
    }

    private function findUserByTelegramChatId(string $chatId): ?User
    {
        $chatId = trim($chatId);
        if ($chatId === '') {
            return null;
        }

        return User::query()
            ->where('telegram_chat_id', $chatId)
            ->orWhere('telegram_chat_id', ltrim($chatId, '+'))
            ->first();
    }

    /**
     * @param  bool  $useMarkdown  false = teks biasa (paling aman untuk link/nomor tiket)
     */
    private function sendTelegram(string $token, string $chatId, string $text, bool $useMarkdown = true): void
    {
        $baseUri = config('services.telegram-bot-api.base_uri', 'https://api.telegram.org');
        $url = rtrim($baseUri, '/').'/bot'.$token.'/sendMessage';

        $payload = [
            'chat_id' => $chatId,
            'text' => $text,
            'disable_web_page_preview' => true,
        ];
        if ($useMarkdown) {
            $payload['parse_mode'] = 'Markdown';
        }

        Http::post($url, $payload);
    }
}
