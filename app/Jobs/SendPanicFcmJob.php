<?php

namespace App\Jobs;

use App\Models\EmergencyReport;
use App\Services\EmergencyFcmService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendPanicFcmJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     */
    public array $backoff = [10, 30, 60]; // 10s, 30s, 60s

    /**
     * Create a new job instance.
     */
    public function __construct(
        public EmergencyReport $report
    ) {}

    /**
     * Execute the job.
     */
    public function handle(EmergencyFcmService $fcmService): void
    {
        Log::info('SendPanicFcmJob: Processing panic report', [
            'report_id' => $this->report->report_id,
            'attempt' => $this->attempts(),
        ]);

        try {
            $fcmService->broadcastPanicToAllStaff($this->report);

            Log::info('SendPanicFcmJob: Successfully sent FCM', [
                'report_id' => $this->report->report_id,
            ]);
        } catch (\Throwable $e) {
            Log::error('SendPanicFcmJob: Failed to send FCM', [
                'report_id' => $this->report->report_id,
                'error' => $e->getMessage(),
                'attempt' => $this->attempts(),
            ]);

            throw $e; // Re-throw untuk retry
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('SendPanicFcmJob: All attempts failed', [
            'report_id' => $this->report->report_id,
            'error' => $exception->getMessage(),
        ]);

        // Todo: kirim alert ke admin jika FCM gagal semua
    }

    /**
     * Determine the time at which the job should timeout.
     */
    public function timeout(): int
    {
        return 60; // 60 detik timeout
    }
}