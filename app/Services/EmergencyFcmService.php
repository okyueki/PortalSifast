<?php

namespace App\Services;

use App\Models\EmergencyReport;
use App\Models\FcmDeviceToken;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;

class EmergencyFcmService
{
    private $messaging;

    public function __construct()
    {
        try {
            $factory = (new Factory)->withServiceAccount(config('services.firebase.credentials'));
            $this->messaging = $factory->createMessaging();
        } catch (\Throwable $e) {
            Log::warning('Firebase not configured: ' . $e->getMessage());
            $this->messaging = null;
        }
    }

    /**
     * Broadcast panic ke SEMUA staff online (bukan hanya admin).
     * Semua user yang punya FCM token akan dapat notifikasi.
     */
    public function broadcastPanicToAllStaff(EmergencyReport $report): void
    {
        if (! $this->messaging) {
            Log::warning('EmergencyFcmService: Firebase not configured, skipping broadcast');
            return;
        }

        // Ambil SEMUA FCM tokens (semua user yang aktif)
        $tokens = FcmDeviceToken::query()
            ->whereNotNull('token')
            ->pluck('token')
            ->all();

        if (empty($tokens)) {
            Log::info('EmergencyFcmService: No device tokens found for broadcast');

            return;
        }

        $categoryLabel = $this->categoryLabel($report->category);
        $address = $report->address ? substr($report->address, 0, 50) : 'Lokasi tidak diketahui';

        $payload = [
            'title' => '🚨 PANIC BUTTON!',
            'body' => "{$categoryLabel}\n{$address}",
            'data' => [
                'type' => 'new_panic',
                'report_id' => $report->report_id,
                'latitude' => (string) $report->latitude,
                'longitude' => (string) $report->longitude,
                'category' => $report->category,
                'sender_name' => $report->sender_name ?? 'Anonim',
                'sender_phone' => $report->sender_phone ?? '',
                'action' => 'accept', // Tells app to show "Accept" button
            ],
        ];

        $this->sendToTokens($tokens, $payload, 'high');

        Log::info('EmergencyFcmService: Broadcast panic to all staff', [
            'report_id' => $report->report_id,
            'tokens_count' => count($tokens),
        ]);
    }

    /**
     * Broadcast panic ke ADMIN only (backup / escalation).
     */
    public function notifyAdminsNewReport(EmergencyReport $report): void
    {
        if (! $this->messaging) {
            return;
        }

        $tokens = FcmDeviceToken::query()
            ->whereHas('user', fn ($q) => $q->whereIn('role', ['admin', 'staff']))
            ->pluck('token')
            ->all();

        if (empty($tokens)) {
            return;
        }

        $payload = [
            'title' => '🚨 PANIC BUTTON! [Admin Alert]',
            'body' => $this->categoryLabel($report->category).' - '.substr($report->address ?? '', 0, 60),
            'data' => [
                'type' => 'new_panic_admin',
                'report_id' => $report->report_id,
                'latitude' => (string) $report->latitude,
                'longitude' => (string) $report->longitude,
                'category' => $report->category,
                'action' => 'view',
            ],
        ];

        $this->sendToTokens($tokens, $payload, 'high');
    }

    /**
     * Kirim notifikasi ke PETUGAS yang sedang DIKembalikan tugas.
     * Ini untuk przypominian kalau belum ada yang accept.
     */
    public function remindPendingReport(EmergencyReport $report): void
    {
        if (! $this->messaging) {
            return;
        }

        // Cek apakah sudah ada yang assign
        if ($report->assigned_operator_id) {
            // Sudah ada petugas - notify petugas tersebut
            $tokens = FcmDeviceToken::query()
                ->where('user_id', $report->assigned_operator_id)
                ->pluck('token')
                ->all();
        } else {
            // Broadcast lagi ke semua
            $tokens = FcmDeviceToken::query()
                ->pluck('token')
                ->all();
        }

        if (empty($tokens)) {
            return;
        }

        $payload = [
            'title' => '⏰ Panic Pending',
            'body' => $this->categoryLabel($report->category).' - belum ada yang accept',
            'data' => [
                'type' => 'reminder_panic',
                'report_id' => $report->report_id,
            ],
        ];

        $this->sendToTokens($tokens, $payload, 'normal');
    }

    /**
     * Notifikasi ke pelapor (korban): status laporan berubah.
     */
    public function notifyReportOwnerStatusUpdated(EmergencyReport $report, string $status): void
    {
        if (! $this->messaging || ! $report->user_id) {
            return;
        }

        $tokens = FcmDeviceToken::query()
            ->where('user_id', $report->user_id)
            ->pluck('token')
            ->all();

        if (empty($tokens)) {
            return;
        }

        $payload = [
            'title' => 'Update Laporan Darurat',
            'body' => $this->statusUpdateMessage($status),
            'data' => [
                'type' => 'status_updated',
                'report_id' => $report->report_id,
                'status' => $status,
            ],
        ];

        $this->sendToTokens($tokens, $payload, 'normal');
    }

    /**
     * Notifikasi ke petugas yang DIASSIGN (bukan broadcast).
     */
    public function notifyAssignedOfficer(EmergencyReport $report, string $officerName): void
    {
        if (! $this->messaging || ! $report->assigned_operator_id) {
            return;
        }

        $tokens = FcmDeviceToken::query()
            ->where('user_id', $report->assigned_operator_id)
            ->pluck('token')
            ->all();

        if (empty($tokens)) {
            return;
        }

        $payload = [
            'title' => '✅ Tugas Panic Assigned',
            'body' => "{$this->categoryLabel($report->category)} - {$report->address}",
            'data' => [
                'type' => 'assigned_officer',
                'report_id' => $report->report_id,
                'latitude' => (string) $report->latitude,
                'longitude' => (string) $report->longitude,
                'action' => 'tracking',
            ],
        ];

        $this->sendToTokens($tokens, $payload, 'high');
    }

    /**
     * Kirim payload ke FCM device tokens.
     */
    protected function sendToTokens(array $tokens, array $payload, string $priority = 'high'): void
    {
        if (empty($tokens) || ! $this->messaging) {
            return;
        }

        try {
            $message = CloudMessage::withTarget('tokens', $tokens)
                ->withNotification([
                    'title' => $payload['title'],
                    'body' => $payload['body'],
                ])
                ->withData($payload['data'] ?? [])
                ->withAndroidConfig([
                    'priority' => $priority,
                    'notification' => [
                        'channel_id' => 'panic',
                        'notification_priority' => $priority === 'high' ? 'PRIORITY_MAX' : 'PRIORITY_DEFAULT',
                        'default_vibrate_timings' => true,
                        'default_sound' => true,
                    ],
                ]);

            $sendReport = $this->messaging->sendMulticast($message);

            Log::info('EmergencyFcmService: Send result', [
                'tokens_count' => count($tokens),
                'success_count' => $sendReport->successes()->count(),
                'failure_count' => $sendReport->failures()->count(),
            ]);

            // Remove invalid tokens
            foreach ($sendReport->failures()->getItems() as $failure) {
                FcmDeviceToken::where('token', $failure->target->value())->delete();
            }
        } catch (\Throwable $e) {
            Log::error('EmergencyFcmService: Failed to send', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function categoryLabel(string $category): string
    {
        return match ($category) {
            'kecelakaan_lalu_lintas' => 'Kecelakaan lalu lintas',
            'ibu_hamil' => 'Ibu hamil',
            'serangan_jantung' => 'Serangan jantung',
            'serangan_stroke' => 'Serangan stroke',
            'home_care' => 'Home care',
            'ambulance' => 'Ambulance',
            default => $category,
        };
    }

    private function statusUpdateMessage(string $status): string
    {
        return match ($status) {
            'responded' => 'Laporan Anda telah direspons',
            'in_progress' => 'Petugas sedang dalam perjalanan',
            'arrived' => 'Petugas sudah sampai',
            'resolved' => 'Laporan telah selesai',
            default => 'Status laporan diperbarui',
        };
    }
}