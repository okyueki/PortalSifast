<?php

namespace App\Services;

use App\Models\FcmDeviceToken;
use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * Service FCM generic untuk semua modul.
 * Bisa dipanggil dari mana saja: Emergency, Payroll, Ticketing, dll.
 */
class FcmNotificationService
{
    /**
     * Kirim notification ke user berdasarkan role.
     */
    public function sendToRoles(array $roles, string $title, string $body, array $data = []): void
    {
        $tokens = $this->getTokensByRoles($roles);
        if (empty($tokens)) {
            return;
        }

        $this->sendToTokens($tokens, $title, $body, $data);
    }

    /**
     * Kirim notification ke user berdasarkan user IDs.
     */
    public function sendToUsers(array $userIds, string $title, string $body, array $data = []): void
    {
        $tokens = $this->getTokensByUserIds($userIds);
        if (empty($tokens)) {
            return;
        }

        $this->sendToTokens($tokens, $title, $body, $data);
    }

    /**
     * Kirim notification ke satu user.
     */
    public function sendToUser(int $userId, string $title, string $body, array $data = []): void
    {
        $this->sendToUsers([$userId], $title, $body, $data);
    }

    /**
     * Kirim notification ke semua user (broadcast).
     */
    public function broadcast(string $title, string $body, array $data = []): void
    {
        $tokens = FcmDeviceToken::pluck('token')->all();
        if (empty($tokens)) {
            return;
        }

        $this->sendToTokens($tokens, $title, $body, $data);
    }

    /**
     * Kirim notification ke staff payroll (role admin atau staff dengan can_access_payroll).
     */
    public function sendToPayrollStaff(string $title, string $body, array $data = []): void
    {
        $users = User::query()
            ->where(function ($q) {
                $q->where('role', 'admin')
                    ->orWhere('can_access_payroll', true);
            })
            ->pluck('id')
            ->all();

        $this->sendToUsers($users, $title, $body, $data);
    }

    /**
     * Kirim notification ke assignee tiket (user spesifik).
     */
    public function sendToTicketAssignee(int $assigneeId, string $title, string $body, array $data = []): void
    {
        $this->sendToUser($assigneeId, $title, $body, $data);
    }

    /**
     * Kirim notification ke staff department terkait (untuk tiket baru).
     */
    public function sendToDepartmentStaff(string $depId, string $title, string $body, array $data = []): void
    {
        $users = User::query()
            ->where('dep_id', $depId)
            ->where('role', '!=', 'pemohon')
            ->pluck('id')
            ->all();

        $this->sendToUsers($users, $title, $body, $data);
    }

    /**
     * Kirim notification ke pegawai berdasarkan NIK.
     */
    public function sendToNik(string $nik, string $title, string $body, array $data = []): void
    {
        $user = User::where('simrs_nik', $nik)->first();
        if (! $user) {
            return;
        }

        $this->sendToUser($user->id, $title, $body, $data);
    }

    /**
     * Ambil semua tokens berdasarkan roles.
     *
     * @return array<string>
     */
    private function getTokensByRoles(array $roles): array
    {
        return FcmDeviceToken::query()
            ->whereHas('user', fn ($q) => $q->whereIn('role', $roles))
            ->pluck('token')
            ->all();
    }

    /**
     * Ambil semua tokens berdasarkan user IDs.
     *
     * @return array<string>
     */
    private function getTokensByUserIds(array $userIds): array
    {
        return FcmDeviceToken::whereIn('user_id', $userIds)
            ->pluck('token')
            ->all();
    }

    /**
     * Kirim notification ke tokens.
     *
     * @param array<string> $tokens
     */
    private function sendToTokens(array $tokens, string $title, string $body, array $data): void
    {
        if (empty($tokens)) {
            return;
        }

        try {
            $factory = (new \Kreait\Firebase\Factory)->withServiceAccount(config('services.firebase.credentials'));
            $messaging = $factory->createMessaging();

            $message = \Kreait\Firebase\Messaging\CloudMessage::withTarget('tokens', $tokens)
                ->withNotification([
                    'title' => $title,
                    'body' => $body,
                ])
                ->withData(array_merge($data, [
                    'app' => 'portalsifast',
                ]))
                ->withAndroidConfig([
                    'priority' => 'high',
                    'notification' => [
                        'channel_id' => 'general',
                        'notification_priority' => 'PRIORITY_DEFAULT',
                        'default_sound' => true,
                    ],
                ]);

            $sendReport = $messaging->sendMulticast($message);

            Log::info('FcmNotificationService: Send result', [
                'tokens_count' => count($tokens),
                'title' => $title,
                'success_count' => $sendReport->successes()->count(),
                'failure_count' => $sendReport->failures()->count(),
            ]);

            // Remove invalid tokens
            foreach ($sendReport->failures()->getItems() as $failure) {
                Log::warning('FCM send failed', [
                    'token' => substr($failure->target->value(), 0, 50),
                    'error' => $failure->error()->getMessage(),
                ]);
                FcmDeviceToken::where('token', $failure->target->value())->delete();
            }
        } catch (\Throwable $e) {
            Log::error('FcmNotificationService: Failed to send', [
                'error' => $e->getMessage(),
                'title' => $title,
            ]);
        }
    }
}