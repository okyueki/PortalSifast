<?php

namespace App\Jobs;

use App\Mail\PayslipMail;
use App\Models\EmployeeSalary;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendPayslipEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public int $backoff = 60;

    public function __construct(
        public EmployeeSalary $salary,
        public string $email
    ) {}

    public function handle(): void
    {
        try {
            Mail::to($this->email)->send(new PayslipMail($this->salary));

            Log::info('Payslip email sent', [
                'salary_id' => $this->salary->id,
                'email' => $this->email,
                'period' => $this->salary->period_start?->toDateString(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to send payslip email', [
                'salary_id' => $this->salary->id,
                'email' => $this->email,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
