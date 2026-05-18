<?php

namespace App\Console\Commands;

use App\Models\EmergencyReport;
use App\Services\EmergencyFcmService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckPendingPanicCommand extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'panic:check-pending';

    /**
     * The console command description.
     */
    protected $description = 'Check pending panic reports and send reminders/escalations';

    /**
     * Reminder intervals in minutes.
     */
    protected array $reminderIntervals = [2, 5, 10];

    /**
     * Execute the console command.
     */
    public function handle(EmergencyFcmService $fcmService): int
    {
        $this->info('Checking pending panic reports...');

        $pendingReports = EmergencyReport::query()
            ->where('status', EmergencyReport::STATUS_PENDING)
            ->whereNull('assigned_operator_id')
            ->with('user')
            ->get();

        if ($pendingReports->isEmpty()) {
            $this->info('No pending reports found.');
            return Command::SUCCESS;
        }

        $this->info("Found {$pendingReports->count()} pending reports.");

        foreach ($pendingReports as $report) {
            $waitingMinutes = $report->created_at->diffInMinutes(now());

            // Tentukan action berdasarkan waiting time
            $action = $this->determineAction($waitingMinutes);

            if ($action) {
                $this->processReport($report, $waitingMinutes, $action, $fcmService);
            }
        }

        return Command::SUCCESS;
    }

    /**
     * Determine action based on waiting time.
     */
    protected function determineAction(int $waitingMinutes): ?string
    {
        if ($waitingMinutes >= 10) {
            return 'escalate'; // Alert admin + broadcast ulang
        }

        if ($waitingMinutes >= 5) {
            return 'urgent_reminder'; // Reminder urgent
        }

        if ($waitingMinutes >= 2) {
            return 'reminder'; // Reminder normal
        }

        return null;
    }

    /**
     * Process a pending report based on action.
     */
    protected function processReport(
        EmergencyReport $report,
        int $waitingMinutes,
        string $action,
        EmergencyFcmService $fcmService
    ): void {
        $this->info("Report {$report->report_id}: waiting {$waitingMinutes} min - action: {$action}");

        Log::info('Panic check: processing report', [
            'report_id' => $report->report_id,
            'waiting_minutes' => $waitingMinutes,
            'action' => $action,
        ]);

        try {
            switch ($action) {
                case 'reminder':
                    $this->sendReminder($report, $fcmService, 'normal');
                    break;

                case 'urgent_reminder':
                    $this->sendReminder($report, $fcmService, 'high');
                    $this->alertAdmin($report, $waitingMinutes);
                    break;

                case 'escalate':
                    $this->escalateReport($report, $fcmService, $waitingMinutes);
                    break;
            }
        } catch (\Throwable $e) {
            $this->error("Failed to process {$report->report_id}: {$e->getMessage()}");
            Log::error('Panic check: failed to process report', [
                'report_id' => $report->report_id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Send reminder FCM to all staff.
     */
    protected function sendReminder(
        EmergencyReport $report,
        EmergencyFcmService $fcmService,
        string $priority
    ): void {
        // Check if reminder was already sent for this interval
        if ($report->last_reminder_sent_at) {
            $minutesSinceReminder = $report->last_reminder_sent_at->diffInMinutes(now());

            // Jangan kirim reminder lagi jika sudah dikirim < 2 menit
            if ($minutesSinceReminder < 2) {
                return;
            }
        }

        $fcmService->remindPendingReport($report);

        // Update last reminder timestamp
        $report->update(['last_reminder_sent_at' => now()]);

        $this->info("  → Sent {$priority} reminder for {$report->report_id}");
    }

    /**
     * Alert admin about urgent/long-waiting report.
     */
    protected function alertAdmin(EmergencyReport $report, int $waitingMinutes): void
    {
        // Log untuk alert monitoring
        Log::warning('Panic check: URGENT - long waiting report', [
            'report_id' => $report->report_id,
            'waiting_minutes' => $waitingMinutes,
            'category' => $report->category,
            'address' => $report->address,
            'sender_name' => $report->sender_name,
        ]);

        $this->warn("  ⚠️  URGENT: {$report->report_id} waiting {$waitingMinutes} minutes!");
    }

    /**
     * Escalate report - broadcast ulang + alert khusus.
     */
    protected function escalateReport(
        EmergencyReport $report,
        EmergencyFcmService $fcmService,
        int $waitingMinutes
    ): void {
        // Kirim broadcast lagi ke semua staff
        $fcmService->broadcastPanicToAllStaff($report);

        // Alert admin
        $this->alertAdmin($report, $waitingMinutes);

        // Todo: kirim Telegram alert ke group admin
        // $this->sendTelegramAlert($report, $waitingMinutes);

        $this->info("  → Escalated {$report->report_id} - broadcast ulang + alert admin");
    }
}