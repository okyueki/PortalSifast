<?php

namespace App\Mail;

use App\Models\EmployeeSalary;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PayslipMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public EmployeeSalary $salary
    ) {}

    public function envelope(): Envelope
    {
        $periodLabel = $this->salary->period_start?->translatedFormat('F Y') ?? 'Unknown';

        return new Envelope(
            subject: "Slip Gaji - {$periodLabel}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payslip',
            with: [
                'salary' => $this->salary,
                'periodLabel' => $this->salary->period_start?->translatedFormat('F Y'),
            ],
        );
    }

    /**
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
