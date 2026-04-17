<?php

namespace App\Services;

use App\Models\EmergencyReport;
use App\Models\FcmDeviceToken;
use Illuminate\Support\Facades\Log;

/**
 * Service untuk mengirim push notification (FCM) terkait laporan darurat.
 * Saat ini hanya log; untuk production tambahkan SDK FCM (mis. kreait/firebase-php)
 * dan implementasi kirim ke FCM API di method sendToTokens().
 */
class EmergencyFcmService
{
    /**
     * Notifikasi ke operator/petugas: laporan darurat baru.
     */
    public function notifyOperatorsNewReport(EmergencyReport $report): void
    {
        $tokens = FcmDeviceToken::query()
            ->whereHas('user', fn ($q) => $q->whereIn('role', ['admin', 'staff']))
            ->pluck('token')
            ->all();

        if (empty($tokens)) {
            return;
        }

        $payload = [
            'title' => 'Laporan darurat baru',
            'body' => $this->categoryLabel($report->category).' - '.($report->address ? substr($report->address, 0, 50) : ''),
            'data' => [
                'type' => 'new_report',
                'report_id' => $report->report_id,
            ],
        ];
        $this->sendToTokens($tokens, $payload);
    }

    /**
     * Notifikasi ke pelapor (korban): status laporan berubah.
     */
    public function notifyReportOwnerStatusUpdated(EmergencyReport $report, string $status): void
    {
        if (! $report->user_id) {
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
            'title' => 'Update laporan darurat',
            'body' => $this->statusUpdateMessage($status),
            'data' => [
                'type' => 'status_updated',
                'report_id' => $report->report_id,
                'status' => $status,
            ],
        ];
        $this->sendToTokens($tokens, $payload);
    }

    /**
     * Kirim payload ke FCM device tokens.
     * TODO: Implementasi dengan FCM API (Firebase Admin SDK atau HTTP v1).
     */
    protected function sendToTokens(array $tokens, array $payload): void
    {
        if (empty($tokens)) {
            return;
        }
        Log::info('EmergencyFcmService: would send push', [
            'tokens_count' => count($tokens),
            'payload' => $payload,
        ]);
        // Implementasi kirim ke FCM API di sini ketika credential FCM sudah ada.
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
            'in_progress' => 'Petugas dalam perjalanan ke lokasi Anda',
            'arrived' => 'Petugas sudah sampai di lokasi Anda',
            'resolved' => 'Laporan darurat telah selesai',
            default => 'Status laporan diperbarui',
        };
    }
}
